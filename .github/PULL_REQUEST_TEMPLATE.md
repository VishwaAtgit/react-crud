## Summary

<!-- Describe what changed and why -->

## Review Focus Areas

- [ ] **Security**: New/changed input handling, env var usage, API endpoints
- [ ] **Logging**: Correct log levels, no PII, structured format
- [ ] **Metrics**: Naming conventions, no leaks, flush configuration
- [ ] **CI**: Workflow changes tested on branch before merge

## Evidence

- [ ] `./scripts/ai-review.sh` passes (attach report artifact)
- [ ] `./scripts/ci-health-check.sh` passes (attach evidence)
- [ ] Manual smoke test completed

## AI Review

<!-- Paste or link the automated review summary -->
```
✅ Passed:  X/Y
⚠️ Warnings: X/Y
❌ Failed:  X/Y
```

## Risk Level

- [ ] 🟢 Low — no security/infra changes
- [ ] 🟡 Medium — logging/metrics/CI changes
- [ ] 🔴 High — security changes, dependency updates, rollback

## Checklist

- [ ] AI review script passes with 0 failures
- [ ] Lint passes (`npm run lint`)
- [ ] All tests pass (`npm test -- --watchAll=false`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated if needed
- [ ] At least 1 human reviewer approved

## Sign-off

| Role | Status |
|------|--------|
| AI Review | ⬜ |
| Human Reviewer | ⬜ |
| Author | ⬜ |