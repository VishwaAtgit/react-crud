# ESLint Suppressions

## Policy

1. **No blanket disables** — `/* eslint-disable */` without a rule name is forbidden
2. **Every suppression must be documented** in this file with a justification
3. **Suppressions are reviewed** as part of PR review checklist
4. **Prefer refactoring** over suppression — only suppress when the rule is wrong for the context

## Active Suppressions

### `src/__tests__/**` — `no-shadow` off

```
Scope:    Test files only (.eslintrc.json override)
Rule:     no-shadow: off
Reason:   Test files frequently shadow variables like `log`, `spy` in
          nested describe/beforeEach blocks. This is idiomatic Jest.
Reviewed: 2026-03-31
```

### `src/__tests__/**` — `consistent-return` off

```
Scope:    Test files only (.eslintrc.json override)
Rule:     consistent-return: off
Reason:   Test functions often have early returns for setup/teardown
          that don't need to be consistent with the test body.
Reviewed: 2026-03-31
```

### `src/__tests__/**` — `no-param-reassign` off

```
Scope:    Test files only (.eslintrc.json override)
Rule:     no-param-reassign: off
Reason:   Tests frequently reassign process.env properties for setup.
          This is safe in test scope and cleaned up in afterEach.
Reviewed: 2026-03-31
```

## How to Add a Suppression

### Inline (single line)

```javascript
// eslint-disable-next-line no-param-reassign -- timer.count must be mutated in-place for performance
timer.count += 1;
```

### Block (multiple lines)

```javascript
/* eslint-disable consistent-return -- early exit pattern in switch */
switch (action) {
  case 'reset': return resetAll();
  case 'flush': return flush();
  // no default — exhaustive enum
}
/* eslint-enable consistent-return */
```

### File-level (.eslintrc.json override)

Add to the `overrides` array in `.eslintrc.json`:

```json
{
  "files": ["src/path/to/file.js"],
  "rules": {
    "rule-name": "off"
  }
}
```

**Then document it in this file.**

## Suppression Audit Schedule

| Date | Reviewer | Action |
|------|----------|--------|
| 2026-03-31 | AI + Author | Initial suppressions documented |
| 2026-Q2 | Team | Review: can any suppressions be removed? |
| 2026-Q3 | Team | Review: are new suppressions justified? |

## Rule Strictness by Directory

| Directory | Strictness | Key Rules |
|-----------|-----------|-----------|
| `src/utils/` | 🔴 Strictest | no-param-reassign (props), no-shadow, consistent-return, no-throw-literal |
| `src/features/` | 🟡 Strict | no-shadow, consistent-return, prefer-template |
| `src/services/` | 🟡 Strict | no-shadow, consistent-return, prefer-template |
| `src/components/` | 🟢 Standard | eqeqeq, prefer-const, curly |
| `src/__tests__/` | 🟢 Relaxed | no-shadow off, consistent-return off, no-param-reassign off |