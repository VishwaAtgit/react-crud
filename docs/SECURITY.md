# Security Policy

## Overview

This project uses three layers of security hygiene:

| Layer | What | Where |
|-------|------|-------|
| **CI Audit** | Weekly `npm audit` + auto-fix PR | `.github/workflows/security-audit.yml` |
| **Local Script** | On-demand audit, fix, validate, branch | `scripts/security-patch.sh` |
| **Runtime Guard** | Block leaked secrets + XSS helpers | `src/utils/security.js` |

## Running a Security Patch

### Automated (CI)

The `security-audit.yml` workflow runs every Monday. If vulnerabilities are
found, it opens a PR on branch `security/npm-audit-autofix`.

### Manual (local)

```sh
./scripts/security-patch.sh
```

This will:
1. Verify a clean working tree.
2. Back up `package-lock.json` → `package-lock.json.bak`.
3. Run `npm audit` and save `audit-report.json`.
4. Apply `npm audit fix`.
5. Run `npm run build` and `npm test`.
6. Commit to a timestamped branch `security/patch-*`.

## Rollback Procedure

### If a security PR breaks something:

```sh
# Option A – Revert the merge commit
git revert --no-edit <merge-sha>
npm ci

# Option B – Restore the lockfile backup
cp package-lock.json.bak package-lock.json
npm ci

# Option C – Pin to exact previous version
npm install <package>@<old-version> --save-exact
```

### Verify rollback:

```sh
npm run build
npm test -- --passWithNoTests --watchAll=false
npm audit
```

## Runtime Security

### XSS Prevention

```js
import { escapeHtml, stripTags } from './utils/security';

const safe = escapeHtml(userInput);      // for rare innerHTML use
const plain = stripTags(richTextInput);  // strip all tags
```

> **Prefer JSX** – React auto-escapes by default. Only use these helpers
> when working with `dangerouslySetInnerHTML` or non-React contexts.

### Environment Variable Guard

`assertNoLeakedSecrets()` runs at startup and throws if any `REACT_APP_*`
variable contains a blocked prefix (`SECRET_`, `AWS_`, `DB_`, `PRIVATE_`).

## Reporting a Vulnerability

Email **security@your-domain.com** or open a private GitHub advisory.
Do **not** open a public issue for security bugs.