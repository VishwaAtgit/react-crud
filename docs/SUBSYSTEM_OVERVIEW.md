# Subsystem Overview

> **doc-with-code policy**: This document must be updated alongside any code change affecting the described subsystems.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Components  │────▶│   Services   │────▶│  Backend / API │
│  (React UI)  │◀────│ (http-common)│◀────│  (axios)       │
└─────────────┘     └──────────────┘     └────────────────┘
       │                                        │
       ▼                                        ▼
┌─────────────┐                          ┌────────────────┐
│ React Router│                          │  REST endpoint │
│ (navigation)│                          │  (CRUD ops)    │
└─────────────┘                          └────────────────┘
```

## Subsystems

### 1. HTTP Transport Layer

| Item | Detail |
|------|--------|
| **File** | `src/http-common.js` |
| **Role** | Axios instance factory; sets `baseURL` and default headers |
| **Depends on** | `axios` |

#### Risk Notes
- ⚠️ **Base URL coupling** – Changing the `baseURL` silently breaks every service consumer. Always validate with integration tests after any change.
- ⚠️ **No interceptor for auth** – If authentication is added later, a request/response interceptor must be registered here. Forgetting this is a common regression source.
- ⚠️ **No retry / timeout** – Network failures will surface as unhandled promise rejections unless callers add `.catch()`.

---

### 2. Service Layer

| Item | Detail |
|------|--------|
| **File** | `src/services/TutorialService.js` |
| **Role** | CRUD operations abstracted over the HTTP layer |
| **Depends on** | `src/http-common.js` |

**Operations exposed**:
- `getAll()` – list resources
- `get(id)` – single resource
- `create(data)` – POST
- `update(id, data)` – PUT
- `remove(id)` – DELETE
- `removeAll()` – DELETE all
- `findByTitle(title)` – search/filter

#### Risk Notes
- ⚠️ **No input validation** – All parameters are passed directly to axios. Malformed payloads will only fail at the API level.
- ⚠️ **`removeAll()` is destructive** – No confirmation guard exists at the service level. UI must enforce confirmation.
- ⚠️ **No pagination** – `getAll()` fetches unbounded result sets. Performance degrades as data grows.

---

### 3. Component Layer (UI)

| Component | File | Responsibility |
|-----------|------|---------------|
| `App` | `src/App.js` | Root layout, navbar, router outlet |
| `TutorialsList` | `src/components/TutorialsList.js` | List view with search |
| `Tutorial` | `src/components/Tutorial.js` | Edit / detail view |
| `AddTutorial` | `src/components/AddTutorial.js` | Create form |

#### Risk Notes
- ⚠️ **Direct state mutation** – Ensure `useState` setters are used immutably; accidental mutation causes stale renders.
- ⚠️ **No error boundaries** – An uncaught error in any component crashes the full app. Add `<ErrorBoundary>` wrappers for resilience.
- ⚠️ **No loading / error states** – API call failures are silent to the user. Always pair service calls with loading indicators and error feedback.
- ⚠️ **Router version sensitivity** – Ensure `react-router-dom` version matches the route definition style (`<Routes>` vs `<Switch>`).

---

### 4. Routing

| Item | Detail |
|------|--------|
| **Configured in** | `src/App.js` |
| **Library** | `react-router-dom` |

| Route | Component |
|-------|-----------|
| `/tutorials` | `TutorialsList` |
| `/add` | `AddTutorial` |
| `/tutorials/:id` | `Tutorial` |

#### Risk Notes
- ⚠️ **No 404 fallback route** – Unknown paths render blank. Add a catch-all `*` route.
- ⚠️ **No route guards** – If auth is added, protect routes at the router level.

---

### 5. Styling

| Item | Detail |
|------|--------|
| **Framework** | Bootstrap (via CDN or `bootstrap` npm package) |
| **Custom styles** | `src/App.css` |

#### Risk Notes
- ⚠️ **Global CSS leaks** – `App.css` is not scoped. Class name collisions are possible as the project grows. Consider CSS Modules or styled-components.