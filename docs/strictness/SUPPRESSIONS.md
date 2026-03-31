# Lint & Type Suppression Registry

> Every `eslint-disable`, `@ts-ignore`, and `@ts-expect-error` in the strict
> observability path **must** be registered here. CI enforces a maximum budget.

---

## TS 3.9 Limitation

This project uses TypeScript 3.9.10. This version **cannot fully skip
`node_modules` type checking** even with `skipLibCheck: true`. The validation
script and CI workflow filter `node_modules` errors and only fail on errors
in our source files. When the project upgrades to TS 4.x+, this workaround
can be removed.

---

## Budget

| Metric | Limit | Current |
|--------|-------|---------|
| Total suppressions in `src/hooks/useObservability.ts` | **6** | 6 |

If you need to add a suppression, **increase the budget** in
`.github/workflows/strict-typecheck.yml` and `scripts/validate-strict.sh`
(`MAX_SUPPRESSIONS`) and add a row below.

---

## Registry

### S-001 · `@typescript-eslint/no-explicit-any` — globalThis cast

| Field | Value |
|-------|-------|
| Rule | `@typescript-eslint/no-explicit-any` |
| Occurrences | 4 |
| Files | `src/hooks/useObservability.ts` (lines with `globalThis as any`) |
| Reason | `globalThis.__observability` is a debug-only escape hatch for browser DevTools. TypeScript has no built-in type for extending `globalThis` without `declare global`, which would leak types into the entire project. |
| Risk | Low — only used for runtime debugging, never in component logic. |
| Retirement plan | When the project adopts a `declare global` pattern or moves to an external collector, remove the casts and this entry. |

---

### S-002 · `Math.random` fallback in `generateTraceId`

| Field | Value |
|-------|-------|
| Rule | N/A (documented for auditability) |
| Occurrences | 1 |
| Files | `src/hooks/useObservability.ts` |
| Reason | `crypto.getRandomValues` is unavailable in jsdom (Jest) and some SSR environments. `Math.random` is acceptable because trace IDs are for correlation, not cryptographic security. |
| Risk | Low — IDs may collide in theory but never in practice for debugging purposes. |
| Retirement plan | Remove when the test environment supports `crypto` natively or when a polyfill is added. |

---

### S-003 · `react-hooks/rules-of-hooks` — conditional hook calls

| Field | Value |
|-------|-------|
| Rule | `react-hooks/rules-of-hooks` |
| Occurrences | 4 |
| Files | `src/hooks/useObservability.ts` (`useRef`, 3× `useCallback`) |
| Reason | The hook returns a no-op object **before** any React hooks when `_isEnabled` is `false`. This is safe because `_isEnabled` is a module-level variable that is constant for the lifetime of the app bundle. The early return means React hooks are either **always** called or **never** called — the call count is stable across renders. |
| Risk | Medium — if `_setObservabilityEnabled()` is called between renders in production (not just tests), React will throw. The setter is exported with a `_` prefix and marked `@internal` to signal test-only use. |
| Retirement plan | When React supports conditional hooks (React compiler), or when the flag is retired, remove the early return and these suppressions. |

---

## How to Add a New Suppression

1. Add the `eslint-disable-next-line` or `@ts-expect-error` comment in code.
2. Assign the next `S-XXX` ID.
3. Add a row to this registry with all fields filled.
4. Bump `MAX_SUPPRESSIONS` in the workflow and script.
5. Note the change in your PR description.

---

### `src/services/TutorialService.js` — `eqeqeq` (3 lines)

```
Scope:    Lines 27, 41, 48 — id null-guard
Rule:     eqeqeq
Reason:   `id == null` intentionally catches both null and undefined.
          Using === would miss undefined, breaking the API guard.
Reviewed: 2026-03-31
```

### `src/utils/fetchWithRetry.js` — `consistent-return`

```
Scope:    async function fetchWithRetry
Rule:     consistent-return
Reason:   The retry loop always either returns (success) or throws
          (final attempt). The function has no reachable end-of-body,
          but ESLint cannot prove this statically.
Reviewed: 2026-03-31
```

_Last updated: 2026-03-31_