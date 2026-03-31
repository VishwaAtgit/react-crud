// ──────────────────────────────────────────────────────────────────
// Resilience helper — timeout, retry with exponential backoff, and
// circuit-breaker–style fail-fast for flaky network calls.
// ──────────────────────────────────────────────────────────────────

export interface ResilienceOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  readonly maxRetries: number;

  /** Initial delay in ms before the first retry. Default: 200 */
  readonly baseDelayMs: number;

  /** Multiplier applied to delay after each retry. Default: 2 */
  readonly backoffFactor: number;

  /** Maximum delay cap in ms (prevents unbounded waits). Default: 5000 */
  readonly maxDelayMs: number;

  /** Per-attempt timeout in ms. 0 = no timeout. Default: 8000 */
  readonly timeoutMs: number;

  /** Optional predicate — return `true` to retry, `false` to fail fast. */
  readonly retryable?: (error: unknown, attempt: number) => boolean;

  /** Optional jitter factor (0–1). Adds randomness to delay. Default: 0.25 */
  readonly jitter: number;
}

export interface ResilienceResult<T> {
  readonly data: T;
  readonly attempts: number;
  readonly totalTimeMs: number;
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export class MaxRetriesError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(attempts: number, lastError: unknown) {
    super(
      `All ${attempts} attempt(s) failed. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
    this.name = "MaxRetriesError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// ── Defaults ──

export const DEFAULT_OPTIONS: ResilienceOptions = {
  maxRetries: 3,
  baseDelayMs: 200,
  backoffFactor: 2,
  maxDelayMs: 5000,
  timeoutMs: 8000,
  jitter: 0.25,
};

// ── Internal helpers ──

/** Apply jitter: delay ± (jitter * delay) */
function applyJitter(delayMs: number, jitter: number): number {
  if (jitter <= 0) return delayMs;
  const range = delayMs * jitter;
  return delayMs + (Math.random() * 2 - 1) * range;
}

/** Calculate delay for a given attempt (0-indexed). */
export function calculateDelay(
  attempt: number,
  opts: Pick<ResilienceOptions, "baseDelayMs" | "backoffFactor" | "maxDelayMs" | "jitter">
): number {
  const raw = opts.baseDelayMs * Math.pow(opts.backoffFactor, attempt);
  const capped = Math.min(raw, opts.maxDelayMs);
  return Math.max(0, Math.round(applyJitter(capped, opts.jitter)));
}

/** Promise that rejects after `ms` milliseconds. */
function timeoutRace<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);

    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Default retryable: retry on network errors and 5xx, not on 4xx. */
function defaultRetryable(error: unknown, _attempt: number): boolean {
  // Always retry timeout errors
  if (error instanceof TimeoutError) return true;

  // Retry generic network errors (TypeError from fetch = network failure)
  if (error instanceof TypeError) return true;

  // If the error has an HTTP status, only retry 5xx and 429
  if (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  ) {
    const status = (error as Record<string, unknown>).status as number;
    return status >= 500 || status === 429;
  }

  return true;
}

/** Sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main API ──

/**
 * Execute `fn` with retry, timeout, and exponential backoff.
 *
 * ```ts
 * const result = await withResilience(() => fetch("/api/users"), {
 *   maxRetries: 3,
 *   timeoutMs: 5000,
 * });
 * ```
 */
export async function withResilience<T>(
  fn: (attempt: number) => Promise<T>,
  partial?: Partial<ResilienceOptions>
): Promise<ResilienceResult<T>> {
  const opts: ResilienceOptions = { ...DEFAULT_OPTIONS, ...partial };
  const retryable = opts.retryable ?? defaultRetryable;
  const startTime = Date.now();

  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      const result = opts.timeoutMs > 0
        ? await timeoutRace(fn(attempt), opts.timeoutMs)
        : await fn(attempt);

      return {
        data: result,
        attempts: attempt + 1,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      lastError = err;

      const isLastAttempt = attempt === opts.maxRetries - 1;
      if (isLastAttempt || !retryable(err, attempt)) {
        break;
      }

      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw new MaxRetriesError(opts.maxRetries, lastError);
}

/**
 * Convenience wrapper for `fetch` with resilience.
 *
 * Rejects with an error that has a `.status` property for non-OK responses
 * so the default retryable predicate can distinguish 4xx from 5xx.
 */
export async function fetchWithResilience(
  input: RequestInfo,
  init?: RequestInit,
  resilienceOpts?: Partial<ResilienceOptions>
): Promise<ResilienceResult<Response>> {
  return withResilience(async () => {
    const response = await fetch(input, init);

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status} ${response.statusText}`) as Error & {
        status: number;
      };
      err.status = response.status;
      throw err;
    }

    return response;
  }, resilienceOpts);
}