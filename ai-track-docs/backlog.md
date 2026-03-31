# Backlog — react-crud

> Generated: 2026-03-24 (Crawl phase)
> Source: repo analysis via GitHub Copilot
> Priority: P1 (do next) → P3 (later)

---

## BL-001 · Fix falsy rendering bug in UserList entity map

**Priority:** P1
**Type:** Bug
**Estimated effort:** Small (< 1 hour)

### Problem

`UserList.jsx` line 55 uses `entities.length &&` as a render guard.
When `entities` is an empty array, `entities.length` evaluates to `0`,
which React renders as a literal `0` in the DOM instead of rendering nothing.

### Code Reference

```
src/features/users/UserList.jsx:55
```

```jsx
// Current (buggy)
{entities.length &&
  entities.map(({ id, name, email }, i) => (
```

### Acceptance Criteria

- [ ] Replace `entities.length &&` with `entities.length > 0 &&`
      or a ternary that renders a "No users" empty state
- [ ] Add a unit test that renders `<UserList />` with an empty
      store and asserts `0` does **not** appear in the document
- [ ] Add a unit test that renders `<UserList />` with seeded
      users and asserts rows appear
- [ ] `npm run ci` passes with zero failures
- [ ] PR description includes the Copilot prompt used

---

## BL-002 · Replace array index keys with stable identifiers

**Priority:** P1
**Type:** Bug / Performance
**Estimated effort:** Small (< 1 hour)

### Problem

`UserList.jsx` line 56 uses the array index `i` as the React `key`.
This causes unnecessary re-renders and potential state bugs when
rows are deleted or reordered because React cannot track identity.

### Code Reference

```
src/features/users/UserList.jsx:56
```

```jsx
// Current (fragile)
entities.map(({ id, name, email }, i) => (
  <tr key={i}>
```

### Acceptance Criteria

- [ ] Change `key={i}` to `key={id}` (the user's unique identifier)
- [ ] Verify delete works correctly: delete a middle row, confirm
      remaining rows keep correct name/email
- [ ] Add a test: render 3 users → delete the 2nd → assert the
      1st and 3rd are still present with correct data
- [ ] No console warnings about duplicate keys
- [ ] `npm run ci` passes

---

## BL-003 · Add loading and error feedback to fetchUsers

**Priority:** P2
**Type:** Enhancement
**Estimated effort:** Medium (2–4 hours)

### Problem

`usersSlice.js` handles `fetchUsers.rejected` by setting
`loading: false` but stores no error message. `UserList.jsx`
shows `"Loading..."` during fetch but has no error state UI.
Users see a silent failure — the table stays empty.

### Code References

```
src/features/users/usersSlice.js   — extraReducers [fetchUsers.rejected]
src/features/users/UserList.jsx    — loading ternary (line 42)
```

### Acceptance Criteria

- [ ] Add `error: null` to `usersSlice` initial state
- [ ] Set `state.error = action.payload || action.error.message`
      in the `rejected` reducer
- [ ] Clear `state.error = null` in the `pending` reducer
- [ ] Display an error banner in `UserList.jsx` when
      `useSelector(state => state.users.error)` is truthy
- [ ] Add test: mock a failed fetch → assert error message renders
- [ ] Add test: trigger a new fetch after error → assert error clears
- [ ] Structured log `log.error()` already present in thunk ✓
- [ ] `npm run ci` passes

---

## BL-004 · Migrate to React 18 and react-scripts 5

**Priority:** P2
**Type:** Chore / Upgrade
**Estimated effort:** Large (4–8 hours)

### Problem

React 17 and react-scripts 4 are end-of-life. No security patches
are being released. The current `~` pinning (see `ai-track-docs/dependencies.md`)
keeps things stable but accumulates technical debt.

### Code References

```
package.json                      — all dependency versions
ai-track-docs/dependencies.md     — compatibility matrix
```

### Acceptance Criteria

- [ ] Upgrade `react` and `react-dom` to `~18.2.0`
- [ ] Upgrade `react-scripts` to `5.0.1`
- [ ] Upgrade `react-redux` to `~8.1.0` and `@reduxjs/toolkit` to `~1.9.0`
- [ ] Evaluate `react-router-dom` v6 migration (may be separate PR)
- [ ] Replace `ReactDOM.render()` with `createRoot()` in `src/index.js`
- [ ] All existing tests pass without modification (or document changes)
- [ ] Benchmark shows no regression > 20% vs `ai-track-docs/perf-baseline.md`
- [ ] Update `ai-track-docs/dependencies.md` with new compatibility matrix
- [ ] `npm run ci` passes
- [ ] `npm audit` shows zero high/critical vulnerabilities

---

## BL-005 · Add GitHub Actions CI workflow

**Priority:** P3
**Type:** CI / Infrastructure
**Estimated effort:** Medium (2–4 hours)

### Problem

All CI checks currently run via `scripts/ci-test.sh` on developer
machines only. There is no automated gate on pull requests — broken
code can be merged if a developer skips the local script.

### Code References

```
scripts/ci-test.sh                — existing local CI steps
ai-track-docs/ci-local.md         — migration section with starter YAML
package.json                      — "ci" script
```

### Acceptance Criteria

- [ ] Add `.github/workflows/ci.yml` that runs on `push` and `pull_request`
- [ ] Workflow steps mirror `ci// filepath: /Users/vishwac/personal/react-crud/ai-track-docs/backlog.md
# Backlog — react-crud

> Generated: 2026-03-24 (Crawl phase)
> Source: repo analysis via GitHub Copilot
> Priority: P1 (do next) → P3 (later)

---

## BL-001 · Fix falsy rendering bug in UserList entity map

**Priority:** P1
**Type:** Bug
**Estimated effort:** Small (< 1 hour)

### Problem

`UserList.jsx` line 55 uses `entities.length &&` as a render guard.
When `entities` is an empty array, `entities.length` evaluates to `0`,
which React renders as a literal `0` in the DOM instead of rendering nothing.

### Code Reference

```
src/features/users/UserList.jsx:55
```

```jsx
// Current (buggy)
{entities.length &&
  entities.map(({ id, name, email }, i) => (
```

### Acceptance Criteria

- [ ] Replace `entities.length &&` with `entities.length > 0 &&`
      or a ternary that renders a "No users" empty state
- [ ] Add a unit test that renders `<UserList />` with an empty
      store and asserts `0` does **not** appear in the document
- [ ] Add a unit test that renders `<UserList />` with seeded
      users and asserts rows appear
- [ ] `npm run ci` passes with zero failures
- [ ] PR description includes the Copilot prompt used

---

## BL-002 · Replace array index keys with stable identifiers

**Priority:** P1
**Type:** Bug / Performance
**Estimated effort:** Small (< 1 hour)

### Problem

`UserList.jsx` line 56 uses the array index `i` as the React `key`.
This causes unnecessary re-renders and potential state bugs when
rows are deleted or reordered because React cannot track identity.

### Code Reference

```
src/features/users/UserList.jsx:56
```

```jsx
// Current (fragile)
entities.map(({ id, name, email }, i) => (
  <tr key={i}>
```

### Acceptance Criteria

- [ ] Change `key={i}` to `key={id}` (the user's unique identifier)
- [ ] Verify delete works correctly: delete a middle row, confirm
      remaining rows keep correct name/email
- [ ] Add a test: render 3 users → delete the 2nd → assert the
      1st and 3rd are still present with correct data
- [ ] No console warnings about duplicate keys
- [ ] `npm run ci` passes

---

## BL-003 · Add loading and error feedback to fetchUsers

**Priority:** P2
**Type:** Enhancement
**Estimated effort:** Medium (2–4 hours)

### Problem

`usersSlice.js` handles `fetchUsers.rejected` by setting
`loading: false` but stores no error message. `UserList.jsx`
shows `"Loading..."` during fetch but has no error state UI.
Users see a silent failure — the table stays empty.

### Code References

```
src/features/users/usersSlice.js   — extraReducers [fetchUsers.rejected]
src/features/users/UserList.jsx    — loading ternary (line 42)
```

### Acceptance Criteria

- [ ] Add `error: null` to `usersSlice` initial state
- [ ] Set `state.error = action.payload || action.error.message`
      in the `rejected` reducer
- [ ] Clear `state.error = null` in the `pending` reducer
- [ ] Display an error banner in `UserList.jsx` when
      `useSelector(state => state.users.error)` is truthy
- [ ] Add test: mock a failed fetch → assert error message renders
- [ ] Add test: trigger a new fetch after error → assert error clears
- [ ] Structured log `log.error()` already present in thunk ✓
- [ ] `npm run ci` passes

---

## BL-004 · Migrate to React 18 and react-scripts 5

**Priority:** P2
**Type:** Chore / Upgrade
**Estimated effort:** Large (4–8 hours)

### Problem

React 17 and react-scripts 4 are end-of-life. No security patches
are being released. The current `~` pinning (see `ai-track-docs/dependencies.md`)
keeps things stable but accumulates technical debt.

### Code References

```
package.json                      — all dependency versions
ai-track-docs/dependencies.md     — compatibility matrix
```

### Acceptance Criteria

- [ ] Upgrade `react` and `react-dom` to `~18.2.0`
- [ ] Upgrade `react-scripts` to `5.0.1`
- [ ] Upgrade `react-redux` to `~8.1.0` and `@reduxjs/toolkit` to `~1.9.0`
- [ ] Evaluate `react-router-dom` v6 migration (may be separate PR)
- [ ] Replace `ReactDOM.render()` with `createRoot()` in `src/index.js`
- [ ] All existing tests pass without modification (or document changes)
- [ ] Benchmark shows no regression > 20% vs `ai-track-docs/perf-baseline.md`
- [ ] Update `ai-track-docs/dependencies.md` with new compatibility matrix
- [ ] `npm run ci` passes
- [ ] `npm audit` shows zero high/critical vulnerabilities

---

## BL-005 · Add GitHub Actions CI workflow

**Priority:** P3
**Type:** CI / Infrastructure
**Estimated effort:** Medium (2–4 hours)

### Problem

All CI checks currently run via `scripts/ci-test.sh` on developer
machines only. There is no automated gate on pull requests — broken
code can be merged if a developer skips the local script.

### Code References

```
scripts/ci-test.sh                — existing local CI steps
ai-track-docs/ci-local.md         — migration section with starter YAML
package.json                      — "ci" script
```

### Acceptance Criteria

- [ ] Add `.github/workflows/ci.yml` that runs on `push` and `pull_request`
- [ ] Workflow steps mirror `ci