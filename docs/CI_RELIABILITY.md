# CI Reliability Guide

## Architecture

```
  push / PR
      │
      ▼
  ┌─────────┐     ┌─────────────────────┐
  │  Lint    │────▶│  Test (matrix)      │
  │  5 min   │     │  Node 18 + 20       │
  └─────────┘     │  3 retries per run   │
      │            │  10 min timeout      │
      │            └────────┬────────────┘
      │                     │
      ▼                     ▼
  ┌─────────┐     ┌─────────────────────┐
  │  Audit   │     │  Build (matrix)     │
  │  5 min   │     │  Node 18 + 20       │
  │  non-block│    │  10 min timeout     │
  └─────────┘     └─────────────────────┘
```

## Reliability Features

| Feature | Implementation | Why |
|---------|---------------|-----|
| **Dependency caching** | `actions/setup-node` with `cache: 'npm'` | Cuts install time ~60% |
| **Concurrency control** | `concurrency.cancel-in-progress: true` | Stops stale runs on force-push |
| **Timeouts** | 5–10 min per job | Prevents hung runners |
| **Test retry** | 3 attempts with backoff (0s / 5s / 10s) | Absorbs transient flakes |
| **Flaky detection** | `::warning` annotation when retry passes | Surfaces instability |
| **Matrix testing** | Node 18 + 20 | Catches version-specific bugs |
| **fail-fast: false** | Matrix continues on failure | Full picture, not partial |
| **Evidence artifacts** | Every job uploads logs + JSON | Audit trail for 14–90 days |

## Running Locally

```sh
# Full CI simulation with evidence
./scripts/ci-health-check.sh

# Evidence files saved to ci-evidence-YYYYMMDD-HHMMSS/
#   ├── lint.txt
#   ├── test-attempt-1.txt
#   ├── test-attempt-2.txt   (only if retried)
#   ├── test-attempt-3.txt   (only if retried)
#   ├── build.txt
#   ├── audit.txt
#   ├── audit.json
#   └── summary.json
```

## Rollback

### Via GitHub UI
1. Go to **Actions → Rollback → Run workflow**
2. Enter the target SHA and reason
3. CI validates build + tests at that SHA
4. A PR is opened automatically — review and merge

### Via CLI
```sh
# Find the last known good SHA
git log --oneline -10

# Trigger rollback
gh workflow run rollback.yml \
  -f target_sha=abc1234 \
  -f reason="Build regression from dependency upgrade"
```

### Manual emergency rollback
```sh
git checkout main
git reset --hard <known-good-sha>
npm ci
npm run build
npm test -- --watchAll=false
git push --force-with-lease origin main
```

## Validating CI Changes

After modifying any workflow file, run this checklist:

```sh
# 1. YAML syntax check
npx yaml-lint .github/workflows/*.yml

# 2. Local simulation
./scripts/ci-health-check.sh

# 3. Push to a branch and verify all jobs pass
git checkout -b ci/reliability-improvements
git add .github/workflows/ scripts/ci-health-check.sh docs/CI_RELIABILITY.md
git commit -m "ci: add cache, retry, timeout, matrix, rollback"
git push origin ci/reliability-improvements
# Open PR and watch Actions tab
```

## Evidence Retention

| Artifact | Retention | Purpose |
|----------|-----------|---------|
| `lint-output` | 14 days | Lint compliance proof |
| `test-results-node*` | 14 days | Test pass/fail + flake detection |
| `build-evidence-node*` | 30 days | Build success proof with SHA |
| `audit-report` | 30 days | Security audit trail |
| `rollback-evidence` | 90 days | Rollback audit trail |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tests pass locally, fail in CI | Node version mismatch | Check matrix version matches local `node -v` |
| Tests fail once then pass on retry | Flaky test (timing, network) | Look for `⚡ Flaky test detected` warning; fix the root cause |
| Install takes > 2 min | Cache miss | Check `actions/setup-node` cache key; run `npm ci` not `npm install` |
| Build times out at 10 min | Bundle size / memory | Add `NODE_OPTIONS=--max-old-space-size=4096` |
| Stale runs pile up | Missing concurrency control | Verify `concurrency.cancel-in-progress: true` |