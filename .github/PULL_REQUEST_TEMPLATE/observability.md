## 🔭 Add Observability Hook (`useObservability`)

### Summary

Adds a lightweight `useObservability` hook that provides **trace**, **metric**, and **log** primitives for any React component. Includes unit tests, CI evidence reporting, and runtime verification helpers.

---

### Changes

| File | What |
|------|------|
| `src/hooks/useObservability.ts` | Hook implementation — `trace()`, `metric()`, `log()`, `dumpObservability()` |
| `src/hooks/useObservability.example.tsx` | Usage example for integrating into CRUD components |
| `src/hooks/__tests__/useObservability.test.ts` | 5 unit tests covering all three signals |
| `.github/workflows/observability-evidence.yml` | CI job that posts coverage evidence without blocking merges |

---

### Review Focus

> Reviewers: prioritise the bullets below. Each links to the verification step that proves it.

- [ ] **Trace correctness** — `trace()` records span `name`, `startTime`, `endTime`, `status`, and `traceId`. Error spans are captured, not swallowed.
  → _See Verification §1, §2_

- [ ] **Metric shape** — `metric()` stores `name`, `value`, `unit`, `timestamp`, and arbitrary `labels`. No unbounded growth in production (consider periodic flush).
  → _See Verification §3_

- [ ] **Log correlation** — Every `log()` entry carries the same `traceId` as the enclosing hook instance, enabling cross-signal correlation.
  → _See Verification §4_

- [ ] **No production side-effects** — All storage is in-memory arrays + `console.*`. No network calls, no external SDK, no bundle size impact beyond ~1 KB.
  → _See Verification §5_

- [ ] **CI is non-blocking** — The evidence workflow uses `continue-on-error: true` at job level. It must never gate a merge.
  → _See Verification §6_

- [ ] **Crypto fallback** — `generateTraceId()` falls back to `Math.random` when `crypto.getRandomValues` is unavailable (jsdom / SSR).
  → _See Verification §7_

---

### Verification Steps

#### §1 — Trace span recorded on success

```bash
npx react-scripts test --watchAll=false --testPathPattern=useObservability \
  -t "records a successful trace span with duration"
```

**Expected:** Span with `name: "Test.myOp"`, `status: "OK"`, and `duration ≥ 40ms`.

---

#### §2 — Trace span recorded on error

```bash
npx react-scripts test --watchAll=false --testPathPattern=useObservability \
  -t "records an error span when the traced fn throws"
```

**Expected:** Span with `status: "ERROR"`. The original error re-throws to the caller.

---

#### §3 — Metric with labels

```bash
npx react-scripts test --watchAll=false --testPathPattern=useObservability \
  -t "pushes a metric with labels"
```

**Expected:** Metric entry `{ name: "Test.items_loaded", value: 42, unit: "count", labels: { source: "api" } }`.

---

#### §4 — Log correlated to traceId

```bash
npx react-scripts test --watchAll=false --testPathPattern=useObservability \
  -t "emits a structured log correlated to a traceId"
```

**Expected:** `obs.logs[0].traceId === result.current.traceId` — same ID, proving correlation.

---

#### §5 — No external network calls

```bash
# Grep for fetch/XMLHttpRequest/beacon in the hook source
grep -Hn 'fetch\|XMLHttpRequest\|sendBeacon\|axios\|http\.' src/hooks/useObservability.ts
```

**Expected:** Zero matches. All data stays in-memory.

---

#### §6 — CI never blocks merges

```bash
grep -c 'continue-on-error: true' .github/workflows/observability-evidence.yml
```

**Expected:** At least 3 occurrences (job-level + test step + comment step).

---

#### §7 — Crypto fallback works in jsdom

```bash
npx react-scripts test --watchAll=false --testPathPattern=useObservability
```

**Expected:** All 5 tests pass without `ReferenceError: crypto is not defined`.

---

#### §8 — Full suite + coverage

```bash
npx react-scripts test --watchAll=false \
  --testPathPattern=useObservability \
  --coverage --coverageReporters=text
```

**Expected:**

| Metric | Threshold |
|--------|-----------|
| Tests passing | 5/5 |
| Line coverage | ≥ 90% |
| Branch coverage | ≥ 80% |

---

#### §9 — Runtime browser verification

Open the app in a browser, interact with a component using the hook, then run in DevTools:

```js
// List all captured signals
__observability.spans
__observability.metrics
__observability.logs

// Pretty-print
dumpObservability()
```

**Expected:** Arrays populated with entries matching the component interactions.

---

### Evidence

The CI workflow automatically posts:
- ✅ A **job summary table** in the Actions tab (every push)
- ✅ A **sticky PR comment** with signal verification matrix and coverage
- ✅ A **coverage artifact** retained for 14 days

> ⚠️ The CI job is **informational only** — it never blocks this PR from merging.

---

### Rollback

Safe to revert in a single commit. The hook is additive — no existing components depend on it until explicitly wired in.