# PR: Improve Test Coverage for Low-Coverage Modules

## Summary

Identified `store.js` (0%) and `usersSlice.js` (16.66%) as the lowest-covered
modules. Added targeted unit tests that raised overall project coverage by
**+6.28% statements** and **+5.55% lines**, well above the 2% target.

## Changes

| File | Action |
|------|--------|
| `src/store.test.js` | **Created** — 5 tests covering store creation, state shape, dispatch, subscribe |
| `src/features/users/usersSlice.test.js` | **Created** — 7 tests covering reducers (add, update, delete), initial state, edge cases |
| `src/App.coverage.test.js` | **Created** — 6 tests covering routing branches |

## Before/After Metrics

| Metric             | Before  | After   | Delta        |
|--------------------|---------|---------|--------------|
| Global Statements  | 48.57%  | 54.85%  | **+6.28%** ✅ |
| Global Branches    | 62.85%  | 65.71%  | **+2.86%** ✅ |
| Global Functions   | 38.77%  | 51.02%  | **+12.25%** ✅|
| Global Lines       | 49.38%  | 54.93%  | **+5.55%** ✅ |
| usersSlice Stmts   | 16.66%  | 62.5%   | +45.84%      |
| usersSlice Branches| 0%      | 100%    | +100%        |
| usersSlice Funcs   | 10%     | 70%     | +60%         |

## Acceptance Criteria

- [x] Identified modules with low coverage (`store.js` at 0%, `usersSlice.js` at 16.66%)
- [x] Added tests to raise coverage by at least 2% (+6.28% statements, +5.55% lines)
- [x] Captured before/after metrics
- [x] All 76 tests passing, 0 failures

## How to Verify

```sh
npx react-scripts test --coverage --watchAll=false
```

## Risk

Low — only adds new test files. Zero changes to application source code.