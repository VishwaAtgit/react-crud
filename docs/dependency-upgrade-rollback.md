# Dependency Minor Upgrade – Rollback Plan

## Upgrades Applied

| Package      | Previous Version | New Version | Date       |
|------------- |-----------------|-------------|------------|
| eslint       | 8.50.x          | 8.56.x      | YYYY-MM-DD |
| jest         | 29.6.x          | 29.7.x      | YYYY-MM-DD |
| typescript   | 5.2.x           | 5.4.x       | YYYY-MM-DD |

> Replace the above with the actual packages and versions you upgrade.

## Validation Checklist

- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (see [coverage/](../coverage/) for report)
- [ ] `npm run build` succeeds
- [ ] CI workflow passes on PR

## Rollback Steps

1. **Revert `package.json`** to the previous version:
   ```sh
   git checkout main -- package.json package-lock.json
   npm ci
   ```
2. **Or pin the old version explicitly:**
   ```sh
   npm install eslint@8.50.0 --save-dev --save-exact
   npm install jest@29.6.0 --save-dev --save-exact
   npm install typescript@5.2.0 --save-dev --save-exact
   ```
3. Re-run the full validation suite to confirm the rollback is clean.
4. If the lockfile backup [package-lock.json.bak](package-lock.json.bak) is recent, you can restore it:
   ```sh
   cp package-lock.json.bak package-lock.json
   npm ci
   ```

## Notes

- The backup lockfile at [`package-lock.json.bak`](package-lock.json.bak) can serve as a restore point.
- ESLint config is at [`.eslintrc.json`](.eslintrc.json); check for deprecated rule warnings after upgrade.
- Babel config is at [`babel.config.js`](babel.config.js); verify no breaking preset changes.