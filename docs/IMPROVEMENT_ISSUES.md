# Improvement Issues — Logging, Metrics & Security Subsystem

> Generated: 2026-03-31
> Subsystem: `src/utils/logger.js`, `src/utils/metrics.js`, `src/utils/security.js`,
> `src/services/apiClient.js`, `src/features/hooks/useLogger.js`, `src/components/ErrorBoundary.js`
>
> Since we have no external issue tracker access, this document serves as
> the authoritative issue list. Each issue has acceptance criteria, linked
> files, and a patch plan assignable to an AI agent.

---

## Issue Index

| # | Title | Priority | Complexity | Assignee |
|---|-------|----------|------------|----------|
| [I-001](#i-001) | Metrics memory leak — unbounded timer arrays | 🔴 High | 🟢 Good first task | Agent |
| [I-002](#i-002) | Logger transport silently swallows send failures | 🟡 Medium | 🟢 Good first task | Agent |
| [I-003](#i-003) | `apiClient.js` leaks Authorization header into logs | 🔴 High | 🟡 Medium | Human + Agent |
| [I-004](#i-004) | `useLogger` creates new logger on every `componentName` change | 🟡 Medium | 🟢 Good first task | Agent |
| [I-005](#i-005) | CI workflow missing coverage gate and artifact | 🟡 Medium | 🟡 Medium | Agent |

---

## I-001

### Metrics memory leak — unbounded timer arrays

**Priority**: 🔴 High
**Complexity**: 🟢 Good first task
**Assignee**: Agent (patch plan below)

#### Problem

In `src/utils/metrics.js`, every `startTimer()` call pushes an elapsed
value into `_timers[name].values` and that array is **never pruned**.
In a long-running browser session, a high-frequency timer (e.g.
`api_response_ms` on every API call) will grow without bound.

#### Linked Files

- `src/utils/metrics.js` — `startTimer()` function, `_timers` store
- `src/__tests__/metrics.test.js` — needs new test for cap behavior

#### Acceptance Criteria

- [ ] `_timers[name].values` is capped at a configurable max (default 1000)
- [ ] When cap is exceeded, oldest values are dropped (ring buffer or shift)
- [ ] `snapshot()` includes a `capped: true` flag on timers that hit the limit
- [ ] Existing tests still pass
- [ ] New test: push 1500 values → assert `.values.length <= 1000` and `.capped === true`
- [ ] No production behavior change for apps under the cap

#### Patch Plan (Agent)

```
File: src/utils/metrics.js

1. Add constant:  const MAX_TIMER_VALUES = 1000;

2. In startTimer() return function, after _timers[name].values.push(elapsed):
   - If _timers[name].values.length > MAX_TIMER_VALUES:
     - _timers[name].values = _timers[name].values.slice(-MAX_TIMER_VALUES)
     - _timers[name].capped = true

3. In snapshot(), include timer.capped in the output object

File: src/__tests__/metrics.test.js

4. Add test:
   test('timer values are capped at MAX_TIMER_VALUES', () => {
     for (let i = 0; i < 1500; i++) {
       const stop = startTimer('flood');
       stop();
     }
     const snap = snapshot();
     expect(snap.timers['flood'].count).toBe(1500);
     expect(snap.timers['flood'].values.length).toBeLessThanOrEqual(1000);
     expect(snap.timers['flood'].capped).toBe(true);
   });
```

---

## I-002

### Logger transport silently swallows send failures

**Priority**: 🟡 Medium
**Complexity**: 🟢 Good first task
**Assignee**: Agent (patch plan below)

#### Problem

In `src/utils/logger.js`, the `emit()` function wraps `_transport(entry)`
in a bare `try/catch` with an empty catch block:

```javascript
if (_transport) {
  try { _transport(entry); } catch { /* never break the app */ }
}
```

If the transport fails repeatedly (e.g. network down), there is:
- No error counter
- No rate-limited warning
- No way to diagnose log pipeline failures

#### Linked Files

- `src/utils/logger.js` — `emit()` function, `setTransport()`
- `src/__tests__/logger.test.js` — needs transport failure test

#### Acceptance Criteria

- [ ] Failed transport calls increment a counter: `logger_transport_error_total`
- [ ] After 5 consecutive failures, a single `console.warn` is emitted (rate-limited)
- [ ] Counter resets to 0 on next successful transport call
- [ ] New test: set a throwing transport → call `info()` 10 times → verify counter = 10, warn called once
- [ ] Existing tests still pass

#### Patch Plan (Agent)

```
File: src/utils/logger.js

1. Add module-level state:
   let _transportFailCount = 0;
   const TRANSPORT_WARN_THRESHOLD = 5;

2. Replace the try/catch in emit():
   if (_transport) {
     try {
       _transport(entry);
       _transportFailCount = 0;       // reset on success
     } catch (err) {
       _transportFailCount++;
       if (_transportFailCount === TRANSPORT_WARN_THRESHOLD) {
         console.warn(
           `[Logger] Transport failed ${TRANSPORT_WARN_THRESHOLD} consecutive times: ${err.message}`
         );
       }
     }
   }

File: src/__tests__/logger.test.js

3. Add test:
   test('transport failures are counted and warned after threshold', () => {
     const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
     setTransport(() => { throw new Error('network down'); });
     const log = createLogger('TransportTest');
     for (let i = 0; i < 10; i++) { log.info(`msg ${i}`); }
     expect(warnSpy).toHaveBeenCalledTimes(1);
     expect(warnSpy.mock.calls[0][0]).toContain('5 consecutive');
     setTransport(null);  // cleanup
     warnSpy.mockRestore();
   });
```

---

## I-003

### `apiClient.js` leaks Authorization header into logs

**Priority**: 🔴 High
**Complexity**: 🟡 Medium
**Assignee**: Human review required + Agent patch

#### Problem

In `src/services/apiClient.js`, the request/response interceptors may log
the full config object which includes `headers.Authorization`. The current
`log.info('→ GET /users')` pattern is safe, but if error logging is added
(e.g. `log.error('Request failed', { config: error.config })`), the auth
token leaks into logs.

There is no header-redaction utility and no test enforcing it.

#### Linked Files

- `src/services/apiClient.js` — interceptors
- `src/utils/security.js` — should export `redactHeaders()`
- `src/utils/security.test.js` — needs redaction tests

#### Acceptance Criteria

- [ ] New function `redactHeaders(headers)` in `src/utils/security.js`
- [ ] Redacts `Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key` → `[REDACTED]`
- [ ] `apiClient.js` error interceptor uses `redactHeaders()` before logging
- [ ] Test: `redactHeaders({ Authorization: 'Bearer xyz', Accept: 'json' })` → `{ Authorization: '[REDACTED]', Accept: 'json' }`
- [ ] Test: verify apiClient error log does NOT contain token strings

#### Patch Plan (Agent + Human Review)

```
File: src/utils/security.js

1. Add constant:
   const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];

2. Add function:
   export function redactHeaders(headers) {
     if (!headers || typeof headers !== 'object') { return {}; }
     const redacted = { ...headers };
     for (const key of Object.keys(redacted)) {
       if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
         redacted[key] = '[REDACTED]';
       }
     }
     return redacted;
   }

File: src/services/apiClient.js

3. In error interceptor, if logging error.config:
   import { redactHeaders } from '../utils/security';
   log.error('Request failed', {
     url: error.config?.url,
     method: error.config?.method,
     headers: redactHeaders(error.config?.headers),
     status: error.response?.status,
   });

File: src/utils/security.test.js (or __tests__/security.test.js)

4. Add tests:
   test('redactHeaders masks sensitive headers', () => { ... });
   test('redactHeaders passes safe headers through', () => { ... });
   test('redactHeaders handles null/undefined input', () => { ... });
```

**⚠️ Human review required**: Verify no other code path logs raw headers.

---

## I-004

### `useLogger` creates new logger on every `componentName` change

**Priority**: 🟡 Medium
**Complexity**: 🟢 Good first task
**Assignee**: Agent (patch plan below)

#### Problem

In `src/features/hooks/useLogger.js`, the logger is created inside a
`useRef` guard:

```javascript
if (!logRef.current) {
  logRef.current = createLogger(componentName);
}
```

If `componentName` changes (unlikely but possible with dynamic names),
the logger keeps the stale context. If `componentName` is stable (the
common case), the `useEffect` dependency `[componentName]` causes the
mount/unmount metrics to fire on every render if a parent passes a
new string reference.

#### Linked Files

- `src/features/hooks/useLogger.js`
- `src/features/users/UserList.jsx` — consumer

#### Acceptance Criteria

- [ ] `componentName` is memoized with `useMemo` or validated with `useRef` to detect actual changes
- [ ] If `componentName` genuinely changes, logger context is updated
- [ ] Mount/unmount metrics don't double-fire on same component
- [ ] Test: render hook with stable name → verify mount metric fires exactly once
- [ ] Test: render hook, change name → verify old unmount + new mount fires

#### Patch Plan (Agent)

```
File: src/features/hooks/useLogger.js

1. Track previous name:
   const prevNameRef = useRef(componentName);

2. Update logger only if name actually changed:
   if (!logRef.current || prevNameRef.current !== componentName) {
     logRef.current = createLogger(componentName);
     prevNameRef.current = componentName;
   }

3. useEffect already handles cleanup via return function — no change needed
   but add a comment explaining why [componentName] dependency is correct.
```

---

## I-005

### CI workflow missing coverage gate and artifact

**Priority**: 🟡 Medium
**Complexity**: 🟡 Medium
**Assignee**: Agent (patch plan below)

#### Problem

The CI workflow in `.github/workflows/ci.yml` runs tests but does NOT:
- Collect coverage data
- Enforce the coverage threshold defined in `package.json` (60% branches/functions/lines/statements)
- Upload a coverage artifact for review

The `package.json` already has `jest.coverageThreshold` configured but
CI never invokes it.

#### Linked Files

- `.github/workflows/ci.yml` — test job
- `package.json` — `jest.coverageThreshold` config

#### Acceptance Criteria

- [ ] CI test job runs with `--coverage` flag
- [ ] Coverage threshold failure causes job failure
- [ ] Coverage report uploaded as artifact (HTML or lcov)
- [ ] Coverage summary printed in job log
- [ ] PR comment with coverage delta (optional, nice-to-have)
- [ ] Local `npm run test:coverage` still works

#### Patch Plan (Agent)

```
File: .github/workflows/ci.yml

1. In the test job, step "Run tests (attempt 1)", change:
   npm test -- --watchAll=false --ci --forceExit \
     --coverage --json --outputFile=test-results.json

2. Same change for retry steps (attempt 2 and 3)

3. Add new step after test retry:
   - name: Upload coverage report
     if: always()
     uses: actions/upload-artifact@v4
     with:
       name: coverage-node${{ matrix.node-version }}
       path: coverage/
       retention-days: 14

4. Verify: package.json coverageThreshold is respected automatically
   when --coverage is passed (react-scripts handles this).
```

---

## Cross-References

```
I-001 (metrics cap)    ← needed by I-005 (CI coverage will catch untested branches)
I-002 (transport warn) ← improves I-003 (header redaction logs through same transport)
I-003 (header redact)  ← blocks any future auth-header logging in apiClient
I-004 (useLogger memo) ← independent, but improves I-001 (fewer spurious mount metrics)
I-005 (CI coverage)    ← validates all other issues have test coverage
```

## Triage Order

```
1. I-003  🔴 Security — header leak risk (agent patch + human review)
2. I-001  🔴 Reliability — memory leak in long sessions (agent patch)
3. I-002  🟡 Observability — silent transport failures (agent patch)
4. I-004  🟡 Correctness — hook re-render edge case (agent patch)
5. I-005  🟡 CI — coverage enforcement (agent patch)
```