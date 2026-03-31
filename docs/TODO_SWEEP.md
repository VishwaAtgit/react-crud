# TODO & Edge-Case Sweep — API Layer

> Last swept: 2026-03-31
> Scope: `src/http-common.js`, `src/services/`

## TODOs Found / Added

| # | File | Line/Area | TODO | Rationale | Linked Risk |
|---|------|-----------|------|-----------|-------------|
| T1 | `http-common.js` | `baseURL` | Move to `REACT_APP_API_URL` env var | Hardcoded URL prevents deployment to staging/prod without a code change | R3 |
| T2 | `http-common.js` | instance config | Add `timeout: 10000` | Without a timeout, requests hang indefinitely on network issues | R1 |
| T3 | `http-common.js` | — | Add `axios-retry` or response interceptor for transient 5xx | Flaky networks cause silent failures | R2 |
| T4 | `TutorialService.js` | `getAll()` | Accept `{ page, size }` params | Unbounded fetches degrade as data grows | R6 |
| T5 | `TutorialService.js` | `create()` | Validate payload shape before POST | Missing `title` produces an opaque 400 from the server | R5 |
| T6 | `TutorialService.js` | `findByTitle()` | Consider debounce at call-site or service level | Rapid keystrokes fire excessive requests | — |
| T7 | `TutorialService.js` | `removeAll()` | Add JSDoc `@dangerous` tag | Developers should see a warning in autocomplete | R4 |

## Edge Cases Identified & Addressed

| # | Method | Edge Case | Before | After |
|---|--------|-----------|--------|-------|
| E1 | `get(id)` | `id` is `null` or `undefined` | Sends `GET /tutorials/undefined` → server 404 | Early reject with descriptive error |
| E2 | `update(id, data)` | `id` is `null` | Sends `PUT /tutorials/null` | Early reject with descriptive error |
| E3 | `remove(id)` | `id` is `null` | Sends `DELETE /tutorials/null` | Early reject with descriptive error |
| E4 | `findByTitle(title)` | `title` contains `&`, `+`, spaces | Raw interpolation breaks query string | `encodeURIComponent()` applied |
| E5 | `findByTitle(title)` | `title` is `null`/`undefined` | Sends `?title=null` literal string | Falls back to empty string `""` |
| E6 | `create({})` | Empty payload | Sent as-is; server decides | Documented — no client guard (server owns validation) |

## Edge Cases Deferred (Require Backend Coordination)

| # | Method | Edge Case | Reason Deferred |
|---|--------|-----------|-----------------|
| D1 | `get(id)` | `id` is negative or non-numeric string | Server should return 400; client guard would duplicate server logic |
| D2 | `update(id, data)` | `data` contains fields not in schema | Server should ignore/reject; adding client schema validation is tracked in T5 |
| D3 | `removeAll()` | Concurrent calls | Server must be idempotent; no client-side mitigation beyond UI debounce |

## Process: Running a Sweep

1. **Grep for TODOs**
   ```bash
   grep -rn "TODO\|FIXME\|HACK\|XXX" src/services/ src/http-common.js
   ```

2. **Review each service method** against this checklist:
   - [ ] What happens if every argument is `null`?
   - [ ] What happens if the string argument contains special characters?
   - [ ] Is the HTTP verb correct for the semantics (GET for read, POST for create, etc.)?
   - [ ] Does the return value match what the calling component expects?
   - [ ] Is the operation idempotent? If not, is there a guard?

3. **Update this document** with findings.

4. **File issues or inline TODOs** for anything that cannot be fixed immediately, linking to the risk register.

5. **Update `docs/RISK_REGISTER.md`** if new risks are discovered.