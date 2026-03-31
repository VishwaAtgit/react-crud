# Feature Flags

## Overview

The feature flag system provides a centralised way to toggle risky behavior
changes with a safety switch. Flags are resolved in priority order:

```
Runtime override  →  Environment variable  →  Hardcoded default
   (setFlag)      (REACT_APP_FF_<NAME>)      (FLAG_DEFINITIONS)
```

## Current Flags

| Flag | Default | Description |
|------|---------|-------------|
| `STRICT_SECRET_GUARD` | `false` | Throw on leaked secrets (vs. warn) |
| `METRICS_FLUSH_ENABLED` | `false` | Auto-flush metrics to endpoint |
| `LOG_TRANSPORT_ENABLED` | `false` | Send logs to remote transport |
| `API_RETRY_ENABLED` | `true` | Retry transient API failures |
| `VERBOSE_ERROR_BOUNDARY` | `false` | Include component stack in error metrics |

## Usage

### In Application Code

```javascript
import { isEnabled, FLAG } from './utils/featureFlags';

if (isEnabled(FLAG.STRICT_SECRET_GUARD)) {
  throw new Error('Secrets leaked!');
} else {
  console.warn('Secrets leaked — running in permissive mode');
}
```

### Via Environment Variables

```sh
# .env.local
REACT_APP_FF_STRICT_SECRET_GUARD=true
REACT_APP_FF_METRICS_FLUSH_ENABLED=true
```

### Via Runtime Override (tests / admin)

```javascript
import { setFlag, resetFlags, FLAG } from './utils/featureFlags';

setFlag(FLAG.STRICT_SECRET_GUARD, true);
// ... test strict behavior ...
resetFlags();
```

## Telemetry

Every flag evaluation emits a metric:

```
ff_evaluation_total{flag:STRICT_SECRET_GUARD, value:true, source:env}
ff_override_total{flag:STRICT_SECRET_GUARD, value:true}
ff_unknown_total{flag:BOGUS_FLAG}
ff_reset_total
ff_startup_snapshot_total
```

## Adding a New Flag

1. Add to `FLAG_DEFINITIONS` in `src/utils/featureFlags.js`:
   ```javascript
   MY_NEW_FLAG: {
     default: false,
     description: 'What this flag controls',
   },
   ```
2. Use in code: `isEnabled(FLAG.MY_NEW_FLAG)`
3. Add test in `src/__tests__/featureFlags.test.js`
4. Document in this file
5. Add to `.env.example` if it should be visible

## Safety Switch Pattern

For any higher-risk behavior change:

```
┌──────────────────────────────────────────────────┐
│  1. Add flag with default: false (safe default)  │
│  2. Gate the risky behavior behind isEnabled()   │
│  3. Ship — all users get the safe (old) path     │
│  4. Enable via env var for canary / staging       │
│  5. Monitor telemetry for errors                  │
│  6. Roll out to production                        │
│  7. After bake period, remove flag + old path     │
└──────────────────────────────────────────────────┘
```

## Precedence Diagram

```
┌──────────────┐    ┌──────────────────────┐    ┌──────────────┐
│   setFlag()  │───▶│  REACT_APP_FF_<NAME> │───▶│   default    │
│  (override)  │    │   (environment)       │    │  (hardcoded) │
│  highest     │    │  medium               │    │  lowest      │
└──────────────┘    └──────────────────────┘    └──────────────┘
```