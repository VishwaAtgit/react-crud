# Risk Register

> Track known architectural and operational risks. Update when risks are mitigated or new ones are discovered.
>
> Last updated: 2026-03-31

| ID | Subsystem | Risk | Severity | Mitigation | Status |
|----|-----------|------|----------|------------|--------|
| R1 | HTTP Layer | No request timeout configured | Medium | Set `timeout: 10000` in axios instance config | Open |
| R2 | HTTP Layer | No retry logic for transient failures | Medium | Add `axios-retry` or custom interceptor | Open |
| R3 | HTTP Layer | Base URL hardcoded | High | Move to `REACT_APP_API_URL` env var — **partially mitigated** (fallback added) | In Progress |
| R4 | Service | `removeAll()` has no guard | High | Add confirmation dialog in UI before calling | Open |
| R5 | Service | No input validation before API calls | Medium | Add schema validation (e.g., `zod`, `yup`) | Open |
| R6 | Service | No pagination support | Medium | Add `page` and `size` params to `getAll()` | Open |
| R7 | Components | No error boundaries | High | Wrap route outlets in `<ErrorBoundary>` | Open |
| R8 | Components | No loading/error feedback on API calls | Medium | Add loading spinners and toast notifications | Open |
| R9 | Routing | No 404 catch-all route | Low | Add `<Route path="*">` with a NotFound component | Open |
| R10 | Routing | No route-level auth guards | Medium | Add `PrivateRoute` wrapper when auth is introduced | Open |
| R11 | Styling | Global CSS without scoping | Low | Migrate to CSS Modules or styled-components | Open |
| R12 | Security | No XSS protection on user inputs | High | Sanitize inputs; avoid `dangerouslySetInnerHTML` | Open |
| R13 | DevOps | No CI pipeline for lint/test gating | Medium | Add GitHub Actions workflow for PR checks | Open |
| R14 | Dependencies | No `package-lock.json` pinning strategy | Medium | Commit lock file; use `npm ci` in CI | Open |
| R15 | Service | Null/undefined `id` produces malformed URLs | Medium | **Mitigated** — early rejection guards added in `TutorialService` | Closed |
| R16 | Service | `findByTitle()` query string injection | Medium | **Mitigated** — `encodeURIComponent()` applied | Closed |
| R17 | Testing | Contract test mocks can drift from real interceptor behaviour | Low | Run integration tests periodically to re-validate | Open |
| R18 | Service | `findByTitle()` fires on every keystroke | Low | Add debounce at call-site or service level | Open |

### Severity Definitions

| Level | Meaning |
|-------|---------|
| **High** | Data loss, security vulnerability, or full app crash possible |
| **Medium** | Degraded UX, silent failures, or maintainability concern |
| **Low** | Cosmetic or minor DX inconvenience |

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Open** | Known,// filepath: /Users/vishwac/personal/react-crud/docs/RISK_REGISTER.md
# Risk Register

> Track known architectural and operational risks. Update when risks are mitigated or new ones are discovered.
>
> Last updated: 2026-03-31

| ID | Subsystem | Risk | Severity | Mitigation | Status |
|----|-----------|------|----------|------------|--------|
| R1 | HTTP Layer | No request timeout configured | Medium | Set `timeout: 10000` in axios instance config | Open |
| R2 | HTTP Layer | No retry logic for transient failures | Medium | Add `axios-retry` or custom interceptor | Open |
| R3 | HTTP Layer | Base URL hardcoded | High | Move to `REACT_APP_API_URL` env var — **partially mitigated** (fallback added) | In Progress |
| R4 | Service | `removeAll()` has no guard | High | Add confirmation dialog in UI before calling | Open |
| R5 | Service | No input validation before API calls | Medium | Add schema validation (e.g., `zod`, `yup`) | Open |
| R6 | Service | No pagination support | Medium | Add `page` and `size` params to `getAll()` | Open |
| R7 | Components | No error boundaries | High | Wrap route outlets in `<ErrorBoundary>` | Open |
| R8 | Components | No loading/error feedback on API calls | Medium | Add loading spinners and toast notifications | Open |
| R9 | Routing | No 404 catch-all route | Low | Add `<Route path="*">` with a NotFound component | Open |
| R10 | Routing | No route-level auth guards | Medium | Add `PrivateRoute` wrapper when auth is introduced | Open |
| R11 | Styling | Global CSS without scoping | Low | Migrate to CSS Modules or styled-components | Open |
| R12 | Security | No XSS protection on user inputs | High | Sanitize inputs; avoid `dangerouslySetInnerHTML` | Open |
| R13 | DevOps | No CI pipeline for lint/test gating | Medium | Add GitHub Actions workflow for PR checks | Open |
| R14 | Dependencies | No `package-lock.json` pinning strategy | Medium | Commit lock file; use `npm ci` in CI | Open |
| R15 | Service | Null/undefined `id` produces malformed URLs | Medium | **Mitigated** — early rejection guards added in `TutorialService` | Closed |
| R16 | Service | `findByTitle()` query string injection | Medium | **Mitigated** — `encodeURIComponent()` applied | Closed |
| R17 | Testing | Contract test mocks can drift from real interceptor behaviour | Low | Run integration tests periodically to re-validate | Open |
| R18 | Service | `findByTitle()` fires on every keystroke | Low | Add debounce at call-site or service level | Open |

### Severity Definitions

| Level | Meaning |
|-------|---------|
| **High** | Data loss, security vulnerability, or full app crash possible |
| **Medium** | Degraded UX, silent failures, or maintainability concern |
| **Low** | Cosmetic or minor DX inconvenience |

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Open** | Known,