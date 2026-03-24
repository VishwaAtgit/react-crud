# Security Notes — react-crud

> Last updated: 2026-03-24

---

## 1. CRA Environment Variable Risk (REMEDIATED)

### Problem

Create React App embeds **every** `REACT_APP_*` variable into the
production JS bundle at build time. This means:

- Any secret placed in `.env` with the `REACT_APP_` prefix is
  **visible to anyone** who opens browser DevTools.
- If `.env` is committed to git, secrets are in the repo history forever.

### Remediation Applied

| Action | Status |
|---|---|
| `.gitignore` updated to block `.env` and all `.env.*` variants | ✅ Done |
| `.env.example` added with placeholder values only | ✅ Done |
| Verified no `.env` is currently tracked | See check below |

### Verify no secrets are tracked

```bash
# Check if any env file is in git history
git ls-files | grep -i '\.env'
# Should return only .env.example

# Deep scan for secrets in history (requires git-secrets or trufflehog)
npx trufflehog git file://. --only-verified 2>/dev/null
```

### Rule

> **Never put tokens, passwords, or API keys in any `REACT_APP_*`
> variable.** Use a backend proxy or server-side environment instead.

---

## 2. Dependency Audit

Run regularly:

```bash
npm audit
```

| Severity | Action |
|---|---|
| Critical / High | Fix immediately — `npm audit fix` or pin a patched version |
| Moderate | Fix within one sprint |
| Low | Track in backlog |

### Current audit

```bash
# Run and record
npm audit 2>&1 | tee ai-track-docs/npm-audit-$(date +%F).log
```

---

## 3. Lock File Integrity

| Rule | Why |
|---|---|
| Always commit `package-lock.json` | Prevents supply-chain swaps on `npm install` |
| Use `npm ci` in CI pipelines | Installs exact versions from lock file |
| Never run `npm install` in CI | It may silently update the lock file |

---

## 4. Common Secret Patterns to Watch For

| Pattern | Example | Where to look |
|---|---|---|
| Hardcoded API keys | `const API_KEY = "sk-..."` | `grep -rn 'API_KEY\|SECRET\|TOKEN\|PASSWORD' src/` |
| Firebase service accounts | `serviceAccountKey.json` | project root, `config/` |
| AWS credentials | `aws_access_key_id` | `.aws/`, `.env`, `config/` |
| Private keys | `-----BEGIN RSA PRIVATE KEY-----` | `find . -name '*.pem' -o -name '*.key'` |

### Quick scan command

```bash
grep -rn \
  --include='*.js' --include='*.jsx' --include='*.ts' \
  --include='*.json' --include='*.env*' \
  -iE '(api.?key|secret|token|password|credential)\s*[:=]' \
  . --exclude-dir=node_modules --exclude-dir=.git
```

---

## 5. Checklist Before Every PR

- [ ] `git diff --cached | grep -iE '(secret|token|key|password)'` — no secrets in staged files
- [ ] `.env` is **not** staged — `git ls-files .env` returns empty
- [ ] `npm audit` shows no new critical/high issues
- [ ] No `console.log` dumping state that may contain user data