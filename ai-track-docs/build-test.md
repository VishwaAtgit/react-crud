# Build & Test Guide — react-crud

> Last updated: 2026-03-24

## Prerequisites

- Node.js ≥ 14 (LTS recommended)
- npm ≥ 6

## Install

```bash
npm install
```

## Dev Server

```bash
npm start
# Opens http://localhost:3000
```

## Production Build

```bash
npm run build
# Output: build/
```

## Tests

| Command | Behaviour |
|---|---|
| `npm test` | Jest in watch mode (interactive) |
| `CI=true npm test` | Single run, non-interactive (CI) |
| `CI=true npm test -- --coverage` | Single run + coverage report |

## Verify the New Unit Test

```bash
CI=true npm test -- --verbose 2>&1 | grep -E '(PASS|FAIL|✓|✕)'
```

Expected output:

```
PASS  src/App.test.js
  ✓ renders without crashing (smoke)
  ✓ renders a heading or identifiable text node
```

## Assumptions

| Assumption | Verify with |
|---|---|
| CRA default test setup (Jest + RTL) | `grep react-scripts package.json` |
| `<App />` renders an `<h1>` | `grep -rn '<h1' src/App.js` |
| No custom test config overrides | `ls jest.config.* .babelrc babel.config.* 2>/dev/null` |

If the `<h1>` assertion fails, inspect `src/App.js` for the actual top-level
element and adjust the `getByRole` query accordingly.