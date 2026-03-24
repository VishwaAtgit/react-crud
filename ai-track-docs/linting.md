# Linting Guide — react-crud

> Last updated: 2026-03-24

---

## Configuration

| File | Purpose |
|---|---|
| `.eslintrc.json` | Project-wide ESLint config |
| `react-app` preset | CRA default rules (base) |
| `react-app/jest` preset | Jest-specific globals and rules |
| `overrides[0]` | **Strict rules** for `src/utils/` and `src/features/` |

---

## Rule Tiers

### Base (all of `src/`)

Inherits `react-app` + `react-app/jest` defaults — warnings only.

### Strict (`src/utils/`, `src/features/`)

| Rule | Level | Why |
|---|---|---|
| `no-unused-vars` | error | Dead code removal; `_` prefix allowed for intentional skips |
| `no-shadow` | error | Prevents accidental variable shadowing in nested scopes |
| `eqeqeq` | error | Forces `===` / `!==` over `==` / `!=` |
| `no-var` | error | Forces `let` / `const` |
| `prefer-const` | error | Use `const` when variable is never reassigned |
| `curly` | error | Requires `{}` braces on all control flow |
| `no-implicit-coercion` | error | No `!!x`, `+x`, `""+x` — use explicit casts |
| `no-param-reassign` | error | Prevents accidental mutation; `state` is exempted for Redux Toolkit |

---

## Commands

```bash
# Lint entire src/ (base rules, zero-warning policy)
npm run lint

# Lint and auto-fix what can be fixed
npm run lint:fix

# Lint only strict paths (utils + features)
npm run lint:strict
```

---

## Running in CI

The local CI script (`scripts/ci-test.sh`) already runs lint at step 3.
Alternatively:

```bash
npx eslint src/ --ext .js,.jsx --max-warnings 0
echo $?
# 0 = clean, 1 = errors found
```

---

## Common Fix Patterns

### Unused function argument

```javascript
// ✗ error
[fetchUsers.pending]: (state, action) => { ... }

// ✓ fixed — prefix with underscore
[fetchUsers.pending]: (state, _action) => { ... }
```

### Missing curly braces

```javascript
// ✗ error
if (SILENT) return;

// ✓ fixed
if (SILENT) { return; }
```

### Implicit coercion

```javascript
// ✗ error
if (entities.length) { ... }

// ✓ fixed
if (entities.length > 0) { ... }
```

### Loose equality

```javascript
// ✗ error
if (id == otherId) { ... }

// ✓ fixed
if (id === otherId) { ... }
```

---

## Adding Strict Rules to More Paths

Edit `.eslintrc.json` → `overrides[0].files`:

```json
"files": [
  "src/utils/**/*.js",
  "src/features/**/*.js",
  "src/features/**/*.jsx",
  "src/components/**/*.jsx"   // ← add new path here
]
```

---

## Checking a Single File

```bash
npx eslint src/features/users/usersSlice.js
```

---

## IDE Integration

VS Code users should have the **ESLint extension** installed.
It reads `.eslintrc.json` automatically and shows inline errors.

Recommended `.vscode/settings.json`:

```json
{
  "eslint.validate": ["javascript", "javascriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```