# Dependency Notes — react-crud

> Last updated: 2026-03-24

---

## Critical Runtime Dependencies

| Package | Current | Role | Risk if Broken |
|---|---|---|---|
| `react` | `^17.0.1` | UI rendering engine | **Fatal** — nothing renders |
| `react-dom` | `^17.0.1` | DOM mounting | **Fatal** — nothing mounts |
| `react-redux` | `^7.2.2` | Connects Redux store to React | **Fatal** — all state access breaks |
| `@reduxjs/toolkit` | `^1.5.0` | Store creation, slices, thunks | **Fatal** — no CRUD logic |
| `react-router-dom` | `^5.2.0` | Client-side routing | **Fatal** — navigation breaks |
| `react-scripts` | `4.0.1` | Build toolchain (CRA) | **Fatal** — can't build or test |
| `web-vitals` | `^0.2.4` | Performance reporting | Low — app works without it |

## Critical Dev / Test Dependencies (via react-scripts)

| Package | Provided By | Role |
|---|---|---|
| `jest` | `react-scripts` | Test runner |
| `@testing-library/react` | `^11.1.0` (direct) | Component rendering in tests |
| `@testing-library/jest-dom` | `^5.11.4` (direct) | Custom DOM matchers |
| `@testing-library/user-event` | `^12.1.10` (direct) | Simulated user interactions |

---

## Compatibility Matrix

| Pair | Constraint | Why |
|---|---|---|
| `react` ↔ `react-dom` | Must be identical major.minor | They share internal modules |
| `react` ↔ `react-redux` | react-redux 7.x requires React ≥16.8 | Hooks API dependency |
| `react-router-dom` 5.x | Requires React ≥16.8, < 18 ideally | v5 not tested against React 18 |
| `react-scripts` 4.x | Expects React 17, webpack 4 | Upgrading to 5.x requires React 18 |
| `@reduxjs/toolkit` 1.x | Works with react-redux 7.x | 2.x requires react-redux 8+ |

---

## Pinning Recommendations

### Strategy: Pin to **safe caret ranges** — no major upgrades

The `^` ranges in `package.json` allow minor + patch updates.
Below are tighter constraints that prevent accidental major bumps
while still receiving security patches.

```jsonc
// Changes to consider in package.json "dependencies":
{
  "react":             "~17.0.1",   // was ^17.0.1 — lock to 17.0.x
  "react-dom":         "~17.0.1",   // must match react
  "react-redux":       "~7.2.2",    // was ^7.2.2 — lock to 7.2.x
  "@reduxjs/toolkit":  "~1.5.0",    // was ^1.5.0 — lock to 1.5.x
  "react-router-dom":  "~5.2.0",    // was ^5.2.0 — lock to 5.2.x
  "react-scripts":     "4.0.1",     // already exact-pinned ✓
  "web-vitals":        "~0.2.4"     // was ^0.2.4 — lock to 0.2.x
}
```

### Why `~` instead of exact pins

| Approach | Pros | Cons |
|---|---|---|
| Exact (`4.0.1`) | Fully deterministic | Misses security patches |
| Tilde (`~17.0.1`) | Gets patch fixes (17.0.x) | Tiny risk of patch regression |
| Caret (`^17.0.1`) | Gets minor updates (17.x.x) | Could pull in breaking changes |

**Tilde is the sweet spot** — patches only, no surprise minor bumps.

### Lock file

> **Always commit `package-lock.json`.** The lock file is the real
> pin — semver ranges in `package.json` only matter on fresh `npm install`.

```bash
# Verify lock file is tracked
git ls-files package-lock.json
```

---

## Known Risks with Current Versions

| Risk | Detail | Mitigation |
|---|---|---|
| React 17 is EOL | No new patches from React team | Plan React 18 migration as a Walk-phase task |
| react-scripts 4.x uses webpack 4 | No security patches upstream | Plan CRA 5 or Vite migration later |
| react-router-dom 5.x is legacy | v6 has breaking API changes | Stay on 5.x during Crawl phase |
| `^` ranges allow minor bumps | A fresh `npm install` without lock file could pull untested versions | Commit lock file, use `npm ci` in CI |

---

## CI Recommendation

```bash
# In CI pipelines, always use:
npm ci          # installs exactly from lock file
# Never use:
npm install     # may update lock file
```

---

## When to Revisit

- [ ] Before any PR that adds a new dependency
- [ ] If `npm audit` reports a high/critical vulnerability
- [ ] At the start of Walk phase — plan major upgrades then
- [ ] If CI fails with "peer dependency" warnings after an install