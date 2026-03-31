# Feature Flag: `REACT_APP_ENABLE_OBSERVABILITY`

> Controls whether the `useObservability` hook emits signals or becomes a
> silent no-op. The app bundle always includes the hook code — the flag
> only governs runtime behaviour.

---

## 1. Flag Definition

| Property       | Value |
|----------------|-------|
| Name           | `REACT_APP_ENABLE_OBSERVABILITY` |
| Type           | Boolean string (`"true"` / `"false"`) |
| Default        | `"false"` (off) |
| Scope          | Client-side (CRA injects at build time via `process.env`) |
| Source of truth | `.env` files / CI environment variables |

---

## 2. Lifecycle

```
 ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐     ┌────────────┐
 │ PROPOSE  │────▶│  DEVELOP │────▶│  TEST    │────▶│  ROLL OUT  │────▶│  RETIRE    │
 └─────────┘     └──────────┘     └──────────┘     └────────────┘     └────────────┘
  Epic OBS-001    Flag = false     CI matrix         Flag = true        Remove flag,
  created         by default       validates          in .env.prod      hard-code ON
                                   ON + OFF
```

| Phase | Flag state | What happens | Exit criteria |
|-------|-----------|--------------|---------------|
| **Propose** | N/A | Epic OBS-001 created, flag name agreed | Backlog issue exists |
| **Develop** | `false` (default) | Hook is a no-op; zero impact on existing code | Unit tests pass with flag OFF |
| **Test** | `true` + `false` | CI matrix proves both paths; no regressions | All matrix cells green |
| **Roll out** | `true` in production env | Signals emitted, `__observability` populated | Verified in production DevTools |
| **Retire** | Removed | Flag and no-op branch deleted; hook always active | Cleanup PR merged, no env references remain |

### Retirement checklist

- [ ] Remove `REACT_APP_ENABLE_OBSERVABILITY` from all `.env*` files
- [ ] Remove `isEnabled` check in `useObservability.ts`
- [ ] Remove flag-related tests (no-op path)
- [ ] Remove this document or mark as archived
- [ ] Notify team in PR description

---

## 3. Implementation

````typescript
// filepath: [useObservability.ts](http://_vscodecontentref_/0)
import { useCallback, useRef, useEffect } from "react";

// --- Flag check ---
const isEnabled = process.env.REACT_APP_ENABLE_OBSERVABILITY === "true";

// --- Types ---

interface Span {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  status: "OK" | "ERROR";
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: Record<string, string>;
}

interface LogEntry {
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  timestamp: number;
  traceId?: string;
  spanName?: string;
  data?: Record<string, unknown>;
}

// In-memory stores
const _spans: Span[] = [];
const _metrics: Metric[] = [];
const _logs: LogEntry[] = [];

if (isEnabled) {
  (globalThis as any).__observability = { spans: _spans, metrics: _metrics, logs: _logs };
}

function generateTraceId(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- No-op stubs (zero overhead when flag is OFF) ---

const noopTrace = async <T>(_name: string, fn: () => T | Promise<T>): Promise<T> => fn();
const noopMetric = (_name: string, _value: number, _unit?: string, _labels?: Record<string, string>) => {};
const noopLog = (_level: LogEntry["level"], _message: string, _data?: Record<string, unknown>) => {};

const NOOP_HOOK = {
  trace: noopTrace,
  metric: noopMetric,
  log: noopLog,
  traceId: "0000000000000000",
  enabled: false as const,
};

// --- Hook ---

export function useObservability(scope: string) {
  const traceId = useRef(generateTraceId());

  const trace = useCallback(
    async <T>(name: string, fn: () => T | Promise<T>, attrs: Record<string, string | number | boolean> = {}): Promise<T> => {
      const span: Span = {
        name: `${scope}.${name}`,
        startTime: performance.now(),
        attributes: { traceId: traceId.current, ...attrs },
        status: "OK",
      };
      try {
        const result = await fn();
        span.endTime = performance.now();
        _spans.push(span);
        log("DEBUG", `Span completed: ${span.name} (${(span.endTime - span.startTime).toFixed(2)}ms)`);
        return result;
      } catch (err) {
        span.endTime = performance.now();
        span.status = "ERROR";
        _spans.push(span);
        log("ERROR", `Span failed: ${span.name}`, { error: String(err) });
        throw err;
      }
    },
    [scope],
  );

  const metric = useCallback(
    (name: string, value: number, unit = "count", labels: Record<string, string> = {}) => {
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

  const log = useCallback(
    (level: LogEntry["level"], message: string, data?: Record<string, unknown>) => {
      const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        traceId: traceId.current,
        spanName: scope,
        data,
      };
      _logs.push(entry);
      const consoleFn = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.debug;
      consoleFn(`[${level}] [${scope}] [trace:${traceId.current.slice(0, 8)}] ${message}`, data ?? "");
    },
    [scope],
  );

  // Short-circuit: return no-ops when flag is OFF
  if (!isEnabled) {
    return NOOP_HOOK;
  }

  return { trace, metric, log, traceId: traceId.current, enabled: true as const };
}

export function dumpObservability() {
  if (!isEnabled) {
    console.warn("Observability is disabled. Set REACT_APP_ENABLE_OBSERVABILITY=true");
    return { spans: [], metrics: [], logs: [] };
  }
  const data = (globalThis as any).__observability;
  console.group("🔭 Observability dump");
  console.table(data.spans);
  console.table(data.metrics);
  console.table(data.logs);
  console.groupEnd();
  return data;
}