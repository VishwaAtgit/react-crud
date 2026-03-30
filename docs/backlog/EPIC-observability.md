# Epic: Frontend Observability

> **Goal:** Give every React component access to structured traces, metrics, and logs  
> that can be verified locally, in CI, and in production — without adding external  
> dependencies or blocking developer workflows.

| Field        | Value                              |
|--------------|------------------------------------|
| Epic ID      | OBS-EPIC-001                       |
| Status       | 🟡 In Progress                     |
| Priority     | P1                                 |
| Owner        | _unassigned_                       |
| Target       | Q2 2026                            |
| Repo         | `react-crud`                       |
| PR Template  | `.github/PULL_REQUEST_TEMPLATE/observability.md` |

---

## Issues

### OBS-001 · Core hook implementation

| Field       | Value |
|-------------|-------|
| Type        | Feature |
| Priority    | P1 — blocks all other issues |
| Status      | ✅ Done |
| Depends on  | — |
| Blocked by  | — |
| Related PR  | _link when available_ |

**Description**

Implement `useObservability(scope)` returning `trace()`, `metric()`, and `log()`.
All signals share a per-mount `traceId` for correlation. Data is stored in-memory
and exposed on `globalThis.__observability` for debugging.

**Acceptance Criteria**

- [ ] `trace(name, fn)` records a `Span` with `name`, `startTime`, `endTime`, `status`, and `traceId`.
- [ ] Failed traces set `status: "ERROR"` and re-throw the original error.
- [ ] `metric(name, value, unit, labels)` pushes a `Metric` with a millisecond `timestamp`.
- [ ] `log(level, message, data)` pushes a `LogEntry` correlated to the hook's `traceId`.
- [ ] `generateTraceId()` falls back to `Math.random` when `crypto` is unavailable (jsdom / SSR).
- [ ] `dumpObservability()` returns `{ spans, metrics, logs }` and prints a grouped console table.

**Verification**

```bash
npx react-scripts test --watchAll=false --testPathPattern=useObservability
# ✅ 5/5 tests pass
```

**Links**

- Source: [`src/hooks/useObservability.ts`](../../src/hooks/useObservability.ts)
- Tests:  [`src/hooks/__tests__/useObservability.test.ts`](../../src/hooks/__tests__/useObservability.test.ts)
- Example: [`src/hooks/useObservability.example.tsx`](../../src/hooks/useObservability.example.tsx)

---

### OBS-002 · Unit tests & coverage gate

| Field       | Value |
|-------------|-------|
| Type        | Quality |
| Priority    | P1 |
| Status      | ✅ Done |
| Depends on  | OBS-001 |
| Blocked by  | — |
| Related PR  | _link when available_ |

**Description**

Full test suite for all three observability signals with coverage thresholds.

**Acceptance Criteria**

- [ ] Test: successful trace span records `name`, `status: OK`, and `duration ≥ 40ms`.
- [ ] Test: failed trace span records `status: ERROR` and surfaces the thrown error.
- [ ] Test: metric entry matches exact shape `{ name, value, unit, labels }`.
- [ ] Test: log entry `traceId` equals `result.current.traceId` (correlation proof).
- [ ] Test: `dumpObservability()` returns populated signal arrays.
- [ ] Line coverage ≥ 90%, branch coverage ≥ 80%.

**Verification**

```bash
npx react-scripts test --watchAll=false \
  --testPathPattern=useObservability \
  --coverage --coverageReporters=text
# ✅ 5/5 passing, coverage thresholds met
```

**Links**

- Tests: [`src/hooks/__tests__/useObservability.test.ts`](../../src/hooks/__tests__/useObservability.test.ts)

---

### OBS-003 · CI evidence workflow (non-blocking)

| Field       | Value |
|-------------|-------|
| Type        | Infrastructure |
| Priority    | P2 |
| Status      | ✅ Done |
| Depends on  | OBS-002 |
| Blocked by  | — |
| Related PR  | _link when available_ |

**Description**

GitHub Actions workflow that runs observability tests, collects coverage, and posts
an evidence summary — without ever blocking merges.

**Acceptance Criteria**

- [ ] Workflow triggers on `push` to `main` and on all `pull_request` events.
- [ ] Job uses `continue-on-error: true` at job level — merge checks are never gated.
- [ ] Job summary includes signal verification table (trace ✅, metric ✅, log ✅).
- [ ] Sticky PR comment is created/updated with test counts and coverage percentage.
- [ ] Coverage artifact is uploaded and retained for 14 days.
- [ ] `grep -c 'continue-on-error' <workflow>` returns ≥ 3.

**Verification**

```bash
# Local: confirm non-blocking markers
grep -c 'continue-on-error: true' .github/workflows/observability-evidence.yml
# ✅ ≥ 3

# CI: open any PR → Actions tab → job summary shows evidence table
# CI: PR conversation → sticky comment auto-appears
```

**Links**

- Workflow: [`.github/workflows/observability-evidence.yml`](../../.github/workflows/observability-evidence.yml)

---

### OBS-004 · Integrate hook into CRUD components

| Field       | Value |
|-------------|-------|
| Type        | Feature |
| Priority    | P2 |
| Status      | 🔲 To Do |
| Depends on  | OBS-001 |
| Blocked by  | — |
| Related PR  | — |

**Description**

Wire `useObservability` into the main CRUD components (list, create, update, delete)
so that every user-facing operation emits a trace, a count metric, and contextual logs.

**Acceptance Criteria**

- [ ] Each CRUD component calls `useObservability("<ComponentName>")`.
- [ ] Every API call is wrapped in `trace()` — spans appear in `__observability.spans`.
- [ ] After each successful operation, a metric is recorded (e.g. `items_created: 1`).
- [ ] Errors are logged at `ERROR` level with the failing endpoint and status code.
- [ ] No user-visible behaviour changes — observability is transparent.
- [ ] At least one integration test per component verifies signal emission.

**Verification**

```bash
# Run full test suite
npx react-scripts test --watchAll=false

# Browser: interact with CRUD screens, then:
__observability.spans    // populated after any API call
__observability.metrics  // counters incremented
__observability.logs     // contextual entries present
```

**Links**

- Example pattern: [`src/hooks/useObservability.example.tsx`](../../src/hooks/useObservability.example.tsx)

---

### OBS-005 · Production signal export (future)

| Field       | Value |
|-------------|-------|
| Type        | Feature |
| Priority    | P3 |
| Status      | 🔲 To Do |
| Depends on  | OBS-004 |
| Blocked by  | — |
| Related PR  | — |

**Description**

Add an optional exporter that flushes in-memory signals to a backend collector
(e.g. OTLP/HTTP endpoint) on a periodic interval or on `pagehide`. The hook API
stays unchanged — export is configured at app level.

**Acceptance Criteria**

- [ ] New `configureExporter({ endpoint, flushIntervalMs, batchSize })` function.
- [ ] Exporter batches signals and sends via `navigator.sendBeacon` on `pagehide`, `fetch` otherwise.
- [ ] Payload conforms to OTLP JSON format for traces, metrics, and logs.
- [ ] Export is **opt-in** — when unconfigured, behaviour is identical to OBS-001 (in-memory only).
- [ ] Failed exports are retried once, then dropped with a `WARN` log (no infinite loops).
- [ ] Bundle size increase ≤ 3 KB gzipped.

**Verification**

```bash
# Unit test with mocked fetch
npx react-scripts test --watchAll=false -t "exporter"

# Integration: configure endpoint, trigger operations, verify payloads in collector
```

**Links**

- _Will reference new source files once implemented_

---

## Dependency Graph

```
OBS-001  Core hook
  │
  ├──▶ OBS-002  Tests & coverage
  │       │
  │       └──▶ OBS-003  CI evidence workflow
  │
  └──▶ OBS-004  CRUD integration
          │
          └──▶ OBS-005  Production export (future)
```

---

## Definition of Done (Epic level)

- [ ] All issues OBS-001 through OBS-004 are merged to `main`.
- [ ] CI evidence workflow posts coverage on every PR.
- [ ] Every CRUD component emits at least one trace, one metric, and one log.
- [ ] `dumpObservability()` works in production DevTools.
- [ ] OBS-005 is groomed and ready for the next cycle.

---

_Last updated: 2026-03-31_