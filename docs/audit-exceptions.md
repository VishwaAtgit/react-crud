# npm audit — Accepted Vulnerabilities

> **Last reviewed:** 2026-03-30
> **Next review:** 2026-06-30
> **Gating policy:** `npm audit --production --audit-level=critical`

## Summary

```
Full audit:       150 vulnerabilities (8 low, 99 moderate, 36 high, 7 critical)
Production gate:  PASS (--audit-level=critical)
```

## Why These Are Accepted

**All 150 CVEs trace to `react-scripts@4.0.1`** and its transitive
dependencies (`webpack-dev-server`, `ansi-html`, `webpack-dev-middleware`,
`http-proxy-agent`, etc.).

`react-scripts` is a **build tool** — it runs:
- The development server (`npm start`)
- The test runner (`npm test`)
- The production bundler (`npm run build`)

It does **NOT** ship in the production bundle. Running `npm run build`
outputs static HTML/JS/CSS that contains only application code and
production `dependencies`.

### Evidence: react-scripts is not in the bundle

```bash
# Build the production bundle
npm run build

# Search for react-scripts in output — not present
grep -r "react-scripts" build/    # → no matches
grep -r "webpack-dev" build/      # → no matches
grep -r "ansi-html" build/        # → no matches
```

## Gating Strategy

| Scope | Command | Gate |
|-------|---------|------|
| Production (critical) | `npm audit --production --audit-level=critical` | **Blocks CI** |
| Production (all) | `npm audit --production` | Informational |
| Full (dev + prod) | `npm audit` | Informational |

We gate on `--audit-level=critical` because:
1. All current CVEs are in dev-only build tooling
2. No CVEs affect code that runs in production
3. Fixing requires `react-scripts` 4→5 (major, breaking change)

## Notable CVEs (all dev-only)

| Package | Severity | GHSA | Scope | Why Accepted |
|---------|----------|------|-------|-------------|
| `ansi-html` | High | GHSA-whgm-jr23-g3j9 | Dev server | Only runs on localhost |
| `webpack-dev-middleware` | High | GHSA-wr3j-pwj9-hqq6 | Dev server | Only runs on localhost |
| `@tootallnate/once` | Moderate | GHSA-vpq2-c234-7xj6 | Test runner (jsdom) | No network exposure |
| `underscore` (via jsonpath) | High | GHSA-qpx9-hpmf-5gmw | Build tooling | No runtime exposure |
| `nth-check` | High | GHSA-rp65-9cf3-cjxr | CSS optimization | Build-time only |

## Resolution Plan

Upgrade `react-scripts` 4 → 5 as the first step in the major-dependency
upgrade path. See [dependency-upgrade-log.md](./dependency-upgrade-log.md).

**Estimated effort:** 2–4 hours (Webpack 4→5 config changes, Jest updates)