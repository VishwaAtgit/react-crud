# Review Policy

## Required Reviews

Every PR to `main` requires:

1. **AI Review** — `./scripts/ai-review.sh` must pass with 0 ❌ FAIL
2. **Human Review** — At least 1 approving review from a team member
3. **CI Green** — All workflow jobs must pass

## How to Run AI Review

```sh
chmod +x scripts/ai-review.sh
./scripts/ai-review.sh
```

Output is saved to `review-report-YYYYMMDD-HHMMSS/`:
- `summary.txt` — one-line-per-check results
- `checks.jsonl` — machine-readable results
- `REVIEW_CHECKLIST.md` — full checklist with human sign-off section
- `lint.txt`, `test.txt`, `build.txt` — raw evidence

## Addressing Review Comments

### Process

1. AI review generates `REVIEW_CHECKLIST.md` with specific items
2. Human reviewer adds comments on the PR
3. Author addresses each comment with one of:
   - **Fixed** — commit SHA that resolves it
   - **Won't fix** — rationale why it's acceptable
   - **Deferred** — linked issue for future fix
4. Re-run `./scripts/ai-review.sh` to verify fixes
5. Human reviewer re-approves

### Comment Resolution Template

```
#### Comment: [reviewer's comment]
**Status**: Fixed | Won't fix | Deferred
**Action**: [what was done]
**Evidence**: [commit SHA or issue link]
```

## Review Focus by Change Type

| Change Type | Focus Areas | Required Reviewers |
|------------|-------------|-------------------|
| `src/utils/security.js` | XSS, input validation, env guards | 2 human + AI |
| `src/utils/logger.js` | PII leaks, log levels, transport | 1 human + AI |
| `src/utils/metrics.js` | Memory leaks, naming, flush config | 1 human + AI |
| `.github/workflows/*` | Timeouts, permissions, secrets | 1 human + AI |
| `src/components/*` | Rendering, accessibility, error handling | 1 human + AI |
| `docs/*` | Accuracy, completeness | 1 human + AI |

## GitHub Branch Protection Settings

Apply these settings to the `main` branch:

```
Settings → Branches → Branch protection rules → main

✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale pull request approvals when new commits are pushed
✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  Required checks:
    - lint
    - test (18)
    - test (20)
    - build (18)
    - build (20)
✅ Require conversation resolution before merging
✅ Do not allow bypassing the above settings
```