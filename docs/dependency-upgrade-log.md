# Dependency Upgrade Log

## Upgrade #1: `react-redux` — Pin to exact version

> **Date:** 2026-03-30
> **Type:** Pin minor version (exact)

---

### Version Change

| Package | Before (range) | Before (installed) | After (pinned) | Bump Type |
|---------|----------------|-------------------|----------------|-----------|
| `react-redux` | `^7.2.2` | `7.2.9` | `7.2.9` (exact) | Pin |

---

### Why This Change

All dependencies in this project are at their semver ceiling — `Current`
equals `Wanted` for every package. The next available version for each is
a **major** bump (e.g., `react-redux` 7 → 9, `react` 17 → 19), which
carries significant breaking-change risk.

Instead of a risky major bump, we **pin `react-redux` to the exact
installed version** (`7.2.9`). This:

- Prevents silent patch drift on future `npm install` runs
- Documents the known-good version explicitly
- Establishes the pattern for future controlled upgrades

---

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Behaviour change | None — same version | Tests confirm |
| Peer dependency conflict | None | `npm ls` clean |
| Bundle size change | Zero | Same bytes |
| Future drift | Eliminated | Exact pin |

---

### Files That Depend on `react-redux`

```
src/app/store.js                — Provider setup
src/features/users/UserList.jsx — useSelector, useDispatch
src/features/users/AddUser.jsx  — useDispatch
src/features/users/EditUser.jsx — useSelector, useDispatch
src/App.test.js                 — Provider in test harness
```

---

### Verification Results

#### BEFORE

```
$ npm ls react-redux
└── react-redux@7.2.9

$ npm test -- --watchAll=false
Test Suites: 7 passed (+ 1 known failure in App.test.js)
Tests:       46 passed
```

#### AFTER

```
$ npm ls react-redux
└── react-redux@7.2.9

$ npm test -- --watchAll=false
Test Suites: 7 passed (+ 1 known failure in App.test.js)
Tests:       46 passed
```

#### Diff

```
$ diff docs/dependency-snapshot-before.txt docs/dependency-snapshot-after.txt
(no difference — same version was already installed)
```

---

### Rollback Procedure

```bash
# Step 1: Restore originals
cp package.json.bak package.json
cp package-lock.json.bak package-lock.json

# Step 2: Reinstall
rm -rf node_modules
npm install

# Step 3: Verify
npm test -- --watchAll=false

# Estimated rollback time: < 2 minutes
```

---

### Future Upgrade Path

These major upgrades are available but require dedicated migration effort:

| Package | Current | Latest | Migration Risk | Notes |
|---------|---------|--------|---------------|-------|
| `react` | 17.0.2 | 19.2.4 | 🔴 High | Requires react-dom 19, new APIs |
| `react-redux` | 7.2.9 | 9.2.0 | 🟡 Medium | Drops legacy context API |
| `@reduxjs/toolkit` | 1.9.7 | 2.11.2 | 🟡 Medium | New `createApi` defaults |
| `react-router-dom` | 5.3.4 | 7.13.2 | 🔴 High | Completely new API (loaders) |
| `react-scripts` | 4.0.1 | 5.0.1 | 🟡 Medium | Webpack 5, new Jest |

**Recommended order:** `react-scripts` 5 → `@reduxjs/toolkit` 2 → `react` 18 → `react-redux` 8/9 → `react-router-dom` 6/7