# Extension Guide

> **doc-with-code policy**: Update this guide whenever you add a new subsystem, service, or component pattern.

## Adding a New Resource (end-to-end)

### Step 1 – Create the Service

```js
// src/services/NewResourceService.js
import http from "../http-common";

const getAll   = ()           => http.get("/new-resources");
const get      = (id)         => http.get(`/new-resources/${id}`);
const create   = (data)       => http.post("/new-resources", data);
const update   = (id, data)   => http.put(`/new-resources/${id}`, data);
const remove   = (id)         => http.delete(`/new-resources/${id}`);

const NewResourceService = { getAll, get, create, update, remove };
export default NewResourceService;
```

> **Risk**: Ensure the API endpoint exists and matches the path exactly. A typo here fails silently until runtime.

### Step 2 – Create Components

Follow the existing pattern:

| File to create | Based on |
|---|---|
| `src/components/NewResourcesList.js` | `TutorialsList.js` |
| `src/components/NewResource.js` | `Tutorial.js` |
| `src/components/AddNewResource.js` | `AddTutorial.js` |

> **Risk**: Copy-paste errors — search-and-replace all references to "Tutorial" including state keys, service imports, and route params.

### Step 3 – Register Routes

```jsx
// In src/App.js – inside <Routes>
<Route path="/new-resources"     element={<NewResourcesList />} />
<Route path="/new-resources/:id" element={<NewResource />} />
<Route path="/add-new-resource"  element={<AddNewResource />} />
```

### Step 4 – Add Navbar Link

```jsx
<li className="nav-item">
  <Link to={"/new-resources"} className="nav-link">
    New Resources
  </Link>
</li>
```

---

## Extending the HTTP Layer

### Adding Authentication Headers

```js
// src/http-common.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: { "Content-type": "application/json" }
});

// Add auth token to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
```

> **Risk**: Storing tokens in `localStorage` is vulnerable to XSS. For sensitive apps, use `httpOnly` cookies instead.

### Adding Global Error Handling

```js
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

> **Risk**: A redirect loop can occur if the login page itself triggers a 401. Guard against this.

---

## Adding State Management (Redux / Context)

For apps beyond ~5 components sharing state, consider:

| Option | When to use |
|--------|------------|
| React Context | Moderate shared state, few updates |
| Redux Toolkit | Complex state, many consumers, middleware needs |

> **Risk**: Introducing Redux into an existing `useState`-based app requires migrating all shared state at once, or you get two sources of truth. Plan the migration as a single atomic refactor.

---

## Adding Tests

### Recommended Stack

| Tool | Purpose |
|------|---------|
| `@testing-library/react` | Component rendering & assertions |
| `jest` | Test runner (bundled with CRA) |
| `msw` | API mocking (preferred over axios mocks) |

### Example Service Test

```js
import TutorialService from "../services/TutorialService";
import http from "../http-common";

jest.mock("../http-common");

describe("TutorialService", () => {
  it("getAll calls GET /tutorials", async () => {
    http.get.mockResolvedValue({ data: [] });
    const res = await TutorialService.getAll();
    expect(http.get).toHaveBeenCalledWith("/tutorials");
    expect(res.data).toEqual([]);
  });
});
```

> **Risk**: Mocking axios at the module level can mask real integration issues. Supplement with at least one end-to-end test against a running backend.

---

## Checklist for Any Extension

- [ ] Service created with all needed CRUD methods
- [ ] Components follow existing patterns (list, detail, add)
- [ ] Routes registered in `App.js`
- [ ] Navbar updated
- [ ] Error and loading states handled in every component
- [ ] `doc-with-code` — this guide and `SUBSYSTEM_OVERVIEW.md` updated
- [ ] Unit tests added for service and components
- [ ] No new `eslint` warnings introduced (`npm run lint`)
- [ ] Manual smoke test on all CRUD operations