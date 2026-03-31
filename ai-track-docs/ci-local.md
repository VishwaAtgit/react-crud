# Local CI Guide — react-crud

> Last updated: 2026-03-24

---

## Why a Local CI Script?

This project does not have a remote CI pipeline (GitHub Actions, etc.) yet.
The `scripts/ci-test.sh` script reproduces what a CI server would do so
every developer gets the same checks before pushing.

---

## Quick Start

```bash
# Standard run (lint → secrets → tests → build → audit)
npm run ci

# With coverage report
npm run ci:coverage
```

---

## What It Checks

| # | Check | Fails if |
|---|---|---|
| 1 | Node / npm version | Node.js not installed |
| 2 | `npm ci` install | Dependencies fail to install |
| 3 | ESLint | Any lint error (zero-warning policy) |
| 4 | Secret scan | Hardcoded key/token/password in `src/` or `public/` |
| 5 | `.env` tracking | Any `.env` file (not `.env.example`) is in git |
| 6 | Unit tests | Any Jest test fails |
| 7 | Production build | `npm run build` exits non-zero |
| 8 | `npm audit` | High or critical vulnerability found |

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | All checks passed |
| `1` | One or more checks failed |

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `CI` | `true` | Forces Jest single-run mode (no watch) |
| `REACT_APP_LOG_LEVEL` | `silent` | Suppresses structured logs in test output |

---

## Reading Test Output

```bash
# After a run, the full test log is at:
cat /tmp/ci-test-output.log

# Filter for failures only:
grep -E '(FAIL|✕|Error)' /tmp/ci-test-output.log

# Filter for structured logs (if LOG_LEVEL != silent):
grep '"op":' /tmp/ci-test-output.log | jq '.'
```

---

## Pre-Push Hook (optional)

Add to `.git/hooks/pre-push`:

```bash
#!/usr/bin/env bash
echo "Running local CI checks..."
npm run ci || {
  echo "CI checks failed — push aborted."
  exit 1
}
```

Then make it executable:

```bash
chmod +x .git/hooks/pre-push
```

---

## Migrating to GitHub Actions

When ready, translate `ci-test.sh` steps into a workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npx eslint src/ --ext .js,.jsx --max-warnings 0
      - run: CI=true REACT_APP_LOG_LEVEL=silent npm test -- --verbose --coverage
      - run: npm run build
      - run: npm audit --audit-level=high
```

---

## Checklist Before Pushing

- [ ] `npm run ci` exits with code 0
- [ ] No new warnings in lint output
- [ ] Coverage is not lower than the previous run
- [ ] PR description includes the prompt used (see `.copilot-track/crawl/README.md`)