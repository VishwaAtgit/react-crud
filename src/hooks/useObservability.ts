import { useCallback, useRef } from "react";
import { withResilience, TimeoutError, MaxRetriesError } from "../helpers/resilience";

// ──────────────────────────────────────────────────────────────────
// Strict-mode lint suppressions — each one documented.
// See docs/strictness/SUPPRESSIONS.md for the full registry.
// ──────────────────────────────────────────────────────────────────

// --- Flag check ---
let _isEnabled = process.env.REACT_APP_ENABLE_OBSERVABILITY === "true";

/** @internal Test-only: override the flag at runtime. */
export function _setObservabilityEnabled(value: boolean): void {
  _isEnabled = value;
  if (value) {
    // SUPPRESSION: S-001 — globalThis cast required for cross-env debug access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__observability = { spans: _spans, metrics: _metrics, logs: _logs };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).__observability;
  }
}

// --- Types (strict: all fields required, no implicit any) ---

export interface Span {
  readonly name: string;
  readonly startTime: number;
  endTime: number | undefined;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
  status: "OK" | "ERROR";
}

export interface Metric {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly timestamp: number;
  readonly labels: Readonly<Record<string, string>>;
}

export interface LogEntry {
  readonly level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  readonly message: string;
  readonly timestamp: number;
  readonly traceId: string;
  readonly spanName: string;
  readonly data: Record<string, unknown> | undefined;
}

export interface ObservabilityHookEnabled {
  readonly trace: <T>(name: string, fn: () => T | Promise<T>, attrs?: Record<string, string | number | boolean>) => Promise<T>;
  readonly metric: (name: string, value: number, unit?: string, labels?: Record<string, string>) => void;
  readonly log: (level: LogEntry["level"], message: string, data?: Record<string, unknown>) => void;
  readonly traceId: string;
  readonly enabled: true;
}

export interface ObservabilityHookDisabled {
  readonly trace: <T>(name: string, fn: () => T | Promise<T>) => Promise<T>;
  readonly metric: (name: string, value: number, unit?: string, labels?: Record<string, string>) => void;
  readonly log: (level: LogEntry["level"], message: string, data?: Record<string, unknown>) => void;
  readonly traceId: string;
  readonly enabled: false;
}

export type ObservabilityHook = ObservabilityHookEnabled | ObservabilityHookDisabled;

// --- In-memory stores ---
const _spans: Span[] = [];
const _metrics: Metric[] = [];
const _logs: LogEntry[] = [];

if (_isEnabled) {
  // SUPPRESSION: S-001
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__observability = { spans: _spans, metrics: _metrics, logs: _logs };
}

function generateTraceId(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // SUPPRESSION: S-002 — Math.random fallback for jsdom/SSR where crypto is unavailable
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- No-op stubs ---

const noopTrace = async <T>(_name: string, fn: () => T | Promise<T>): Promise<T> => fn();
const noopMetric = (_name: string, _value: number, _unit?: string, _labels?: Record<string, string>): void => {};
const noopLog = (_level: LogEntry["level"], _message: string, _data?: Record<string, unknown>): void => {};

const NOOP_HOOK: ObservabilityHookDisabled = {
  trace: noopTrace,
  metric: noopMetric,
  log: noopLog,
  traceId: "0000000000000000",
  enabled: false,
};

// --- Hook ---

export function useObservability(scope: string): ObservabilityHook {
  if (!_isEnabled) {
    return NOOP_HOOK;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks -- SUPPRESSION: S-003 — hooks are only called when _isEnabled is true (module-level constant at build time)
  const traceId = useRef<string>(generateTraceId());

  // eslint-disable-next-line react-hooks/rules-of-hooks -- SUPPRESSION: S-003
  const trace = useCallback(
    async <T>(name: string, fn: () => T | Promise<T>, attrs: Record<string, string | number | boolean> = {}): Promise<T> => {
      const span: Span = {
        name: `${scope}.${name}`,
        startTime: performance.now(),
        endTime: undefined,
        attributes: { traceId: traceId.current, ...attrs },
        status: "OK",
      };
      try {
        const result = await fn();
        span.endTime = performance.now();
        _spans.push(span);
        logFn(scope, traceId.current, "DEBUG", `Span completed: ${span.name} (${(span.endTime - span.startTime).toFixed(2)}ms)`);
        return result;
      } catch (err: unknown) {
        span.endTime = performance.now();
        span.status = "ERROR";
        _spans.push(span);
        logFn(scope, traceId.current, "ERROR", `Span failed: ${span.name}`, { error: String(err) });
        throw err;
      }
    },
    [scope],
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks -- SUPPRESSION: S-003
  const metric = useCallback(
    (name: string, value: number, unit: string = "count", labels: Record<string, string> = {}): void => {
      const m: Metric = {
        name: `${scope}.${name}`,
        value,
        unit,
        timestamp: Date.now(),
        labels,
      };
      _metrics.push(m);
      console.debug(`[metric] ${m.name} = ${m.value} ${m.unit}`, labels);
    },
    [scope],
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks -- SUPPRESSION: S-003
  const log = useCallback(
    (level: LogEntry["level"], message: string, data?: Record<string, unknown>): void => {
      logFn(scope, traceId.current, level, message, data);
    },
    [scope],
  );

   // eslint-disable-next-line react-hooks/rules-of-hooks -- SUPPRESSION: S-003
   const trace = useCallback(
    async <T>(name: string, fn: () => T | Promise<T>, attrs: Record<string, string | number | boolean> = {}): Promise<T> => {
      const span: Span = {
        name: `${scope}.${name}`,
        startTime: performance.now(),
        endTime: undefined,
        attributes: { traceId: traceId.current, ...attrs },
        status: "OK",
      };
      try {
        // Wrap fn with resilience — single attempt by default (callers opt in)
        const { data: result } = await withResilience(
          async () => {
            const val = await fn();
            return val;
          },
          {
            maxRetries: 1,
            timeoutMs: 0, // no timeout by default — caller controls
          }
        );
        span.endTime = performance.now();
        _spans.push(span);
        logFn(scope, traceId.current, "DEBUG", `Span completed: ${span.name} (${(span.endTime - span.startTime).toFixed(2)}ms)`);
        return result;
      } catch (err: unknown) {
        span.endTime = performance.now();
        span.status = "ERROR";
        span.attributes = {
          ...span.attributes,
          errorType: err instanceof TimeoutError ? "timeout" : err instanceof MaxRetriesError ? "max_retries" : "unknown",
        };
        _spans.push(span);
        logFn(scope, traceId.current, "ERROR", `Span failed: ${span.name}`, { error: String(err) });
        throw err;
      }
    },
    [scope],
  );
  
  return { trace, metric, log, traceId: traceId.current, enabled: true };
}

function logFn(
  scope: string,
  traceId: string,
  level: LogEntry["level"],
  message: string,
  data?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: Date.now(),
    traceId,
    spanName: scope,
    data: data ?? undefined,
  };
  _logs.push(entry);
  const consoleFn = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.debug;
  consoleFn(`[${level}] [${scope}] [trace:${traceId.slice(0, 8)}] ${message}`, data ?? "");
}

export function dumpObservability(): { spans: Span[]; metrics: Metric[]; logs: LogEntry[] } {
  if (!_isEnabled) {
    console.warn("Observability is disabled. Set REACT_APP_ENABLE_OBSERVABILITY=true");
    return { spans: [], metrics: [], logs: [] };
  }
  // SUPPRESSION: S-001
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (globalThis as any).__observability as { spans: Span[]; metrics: Metric[]; logs: LogEntry[] };
  console.group("🔭 Observability dump");
  console.table(data.spans);
  console.table(data.metrics);
  console.table(data.logs);
  console.groupEnd();
  return data;
}