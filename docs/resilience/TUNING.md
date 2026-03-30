# Resilience Helper — Tuning Guide

> `src/helpers/resilience.ts` provides timeout, retry with exponential backoff,
> and jitter for any async operation. This document explains every knob and
> how to tune them for different scenarios.

---

## Quick Reference

```ts
import { withResilience, fetchWithResilience } from "../helpers/resilience";

const result = await withResilience(() => fetch("/api/data"), {
  maxRetries: 3,      // total attempts
  baseDelayMs: 200,   // first retry delay
  backoffFactor: 2,   // exponential multiplier
  maxDelayMs: 5000,   // delay cap
  timeoutMs: 8000,    // per-attempt timeout
  jitter: 0.25,       // ± 25% randomness
});
```

---

## Parameters

### `maxRetries` (default: 3)

Total number of attempts including the first. **Not** the number of _retries_.

| Value | Behavior | Use when |
|-------|----------|----------|
| `1` | No retry — fail immediately | Mutations, user-facing writes |
| `2–3` | Standard retry | API reads, background jobs |
| `5+` | Aggressive retry | Critical health checks |

**Rule of thumb:** `maxRetries × averageDelay < userPatienceMs`

### `baseDelayMs` (default: 200)

Milliseconds to wait before the **first** retry. Subsequent retries multiply
this by `backoffFactor`.

| Value | Use when |
|-------|----------|
| `50–100` | Local/fast services, tests |
| `200–500` | Standard APIs |
| `1000+` | Rate-limited or throttled services |

### `backoffFactor` (default: 2)

Multiplier for each subsequent retry delay.

```
Attempt 0 fail → wait baseDelayMs
Attempt 1 fail → wait baseDelayMs × backoffFactor
Attempt 2 fail → wait baseDelayMs × backoffFactor²
...capped at maxDelayMs
```

| Factor | Sequence (base=200) | Behavior |
|--------|---------------------|----------|
| `1` | 200, 200, 200 | Linear (no backoff) |
| `1.5` | 200, 300, 450 | Gentle backoff |
| `2` | 200, 400, 800 | Standard exponential |
| `3` | 200, 600, 1800 | Aggressive backoff |

### `maxDelayMs` (default: 5000)

Upper bound on any single delay. Prevents unbounded waits with high
`backoffFactor` or many retries.

### `timeoutMs` (default: 8000)

Per-attempt timeout. The operation is aborted if a single attempt takes
longer than this. Set to `0` to disable.

| Value | Use when |
|-------|----------|
| `0` | No timeout (caller manages) |
| `3000–5000` | User-facing reads |
| `8000–15000` | Background operations |
| `30000+` | File uploads, long-running jobs |

**Warning:** `timeoutMs` applies to **each attempt**, not the total.
Total worst-case time = `maxRetries × timeoutMs + totalBackoffDelay`.

### `jitter` (default: 0.25)

Random variance applied to each delay to prevent the
[thundering herd](https://en.wikipedia.org/wiki/Thundering_herd_problem)
problem.

| Value | Behavior |
|-------|----------|
| `0` | Deterministic delays (good for tests) |
| `0.1` | ±10% variance |
| `0.25` | ±25% variance (recommended) |
| `0.5` | ±50% variance (high contention) |
| `1.0` | 0–200% of base delay |

### `retryable` (optional predicate)

```ts
retryable: (error: unknown, attempt: number) => boolean
```

Controls **which errors** trigger a retry. Return `false` to fail fast.

**Default behavior:**

| Error type | Retried? | Why |
|-----------|----------|-----|
| `TimeoutError` | ✅ | Transient |
| `TypeError` (network) | ✅ | Transient (fetch network failure) |
| HTTP 5xx | ✅ | Server error — likely transient |
| HTTP 429 | ✅ | Rate limited — back off and try again |
| HTTP 4xx | ❌ | Client error — retrying won't help |
| Other errors | ✅ | Assumed transient |

**Custom example — never retry mutations:**

```ts
await withResilience(fn, {
  retryable: (error) => {
    if (error && typeof error === "object" && "status" in error) {
      const s = (error as any).status;
      return s >= 500 || s === 429;
    }
    return false; // don't retry unknown errors for writes
  },
});
```

---

## Tuning Recipes

### Recipe 1: Fast User-Facing Read

```ts
await fetchWithResilience("/api/users", undefined, {
  maxRetries: 2,
  baseDelayMs: 100,
  backoffFactor: 2,
  timeoutMs: 3000,
  jitter: 0.25,
});
// Worst case: 3s + 100ms + 3s = ~6.1s total
```

### Recipe 2: Background Data Sync

```ts
await withResilience(syncData, {
  maxRetries: 5,
  baseDelayMs: 500,
  backoffFactor: 2,
  maxDelayMs: 10000,
  timeoutMs: 30000,
  jitter: 0.5,
});
// Worst case: 5 × 30s + (500+1000+2000+4000)ms = ~157.5s total
```

### Recipe 3: Mutation (POST/PUT/DELETE)

```ts
await fetchWithResilience("/api/items", { method: "POST", body }, {
  maxRetries: 2,
  baseDelayMs: 300,
  timeoutMs: 8000,
  retryable: (error) => {
    // Only retry server errors, never client errors
    if (error && typeof error === "object" && "status" in error) {
      return ((error as any).status as number) >= 500;
    }
    return error instanceof TypeError; // network error
  },
});
```

### Recipe 4: Health Check / Ping

```ts
await fetchWithResilience("/health", undefined, {
  maxRetries: 3,
  baseDelayMs: 1000,
  backoffFactor: 1,     // linear — fixed 1s between attempts
  timeoutMs: 2000,
  jitter: 0,
});
```

---

## Worst-Case Time Formula

```
Total = Σ(attempt=0..maxRetries-1) [timeoutMs + delay(attempt)]

Where delay(attempt) = min(baseDelayMs × backoffFactor^attempt, maxDelayMs) ± jitter
```

For default settings (3 retries, 200ms base, factor 2, 8s timeout):

```
Attempt 0: 8000ms (timeout) + 200ms (wait)  = 8200ms
Attempt 1: 8000ms (timeout) + 400ms (wait)  = 8400ms
Attempt 2: 8000ms (timeout) + 0ms (no wait) = 8000ms
                                        Total ≈ 24.6s
```

---

## Error Types

| Class | When thrown | Properties |
|-------|-----------|------------|
| `TimeoutError` | Single attempt exceeds `timeoutMs` | `message`, `name` |
| `MaxRetriesError` | All attempts exhausted or `retryable` returned `false` | `attempts`, `lastError` |

Both extend `Error` and work with `instanceof`.

---

## Current Call Sites

| Location | maxRetries | timeoutMs | Notes |
|----------|-----------|-----------|-------|
| `src/services/api.ts` → `getItems()` | 3 | 5000 | Read — standard retry |
| `src/services/api.ts` → `createItem()` | 2 | 8000 | Write — cautious, custom retryable |
| `src/hooks/useObservability.ts` → `trace()` | 1 | 0 | Passthrough — no retry by default |

---

## Testing Tips

- Set `jitter: 0` in tests for deterministic timing
- Set `baseDelayMs: 10` to keep tests fast
- Set `timeoutMs: 50` to test timeout paths without slow tests
- Use `jest.fn()` to verify attempt counts

---

_Last updated: 2026-03-31_