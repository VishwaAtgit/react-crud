# Logging & Metrics Guide

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React Components                                       │
│   └─ useLogger('Name')  ─┐                              │
│                           ├──▶  src/utils/logger.js      │
│  Service Layer            │      ├─ console (dev)        │
│   └─ createLogger('Svc') ─┘      └─ transport (prod)    │
│                                                          │
│  API Client ───────────────────▶ src/utils/metrics.js    │
│   └─ increment / startTimer       ├─ counters            │
│                                    ├─ gauges              │
│  ErrorBoundary ────────────────    ├─ timers              │
│   └─ log.error + increment        └─ flush → endpoint    │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### In a component:
```js
import { useLogger } from '../hooks/useLogger';
import { increment } from '../utils/metrics';

function MyComponent() {
  const { log } = useLogger('MyComponent');
  log.info('Rendered');
  increment('my_component_render_total');
}
```

### In a service:
```js
import { createLogger } from '../utils/logger';
const log = createLogger('MyService');
log.info('Operation complete', { id: 123 });
```

### In a utility or non-React file:
```js
import logger from '../utils/logger';
logger.warn('Something unexpected', { detail: '...' });
```

## Log Levels

| Level | When to use | Visible in prod? |
|-------|-------------|-------------------|
| `DEBUG` | Verbose tracing, renders, state changes | No (unless `REACT_APP_LOG_LEVEL=DEBUG`) |
| `INFO` | Normal operations, API calls, load events | No by default |
| `WARN` | Degraded state, retries, fallbacks | **Yes** |
| `ERROR` | Failures, caught exceptions, boundary hits | **Yes** |

Set via environment variable:
```sh
REACT_APP_LOG_LEVEL=DEBUG npm start
```

## Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `api_call_total` | counter | Total API requests |
| `api_success_total` | counter | Successful responses |
| `api_error_total` | counter | Failed responses |
| `api_response_ms` | timer | Response time per endpoint |
| `active_requests` | gauge | In-flight API requests |
| `component_mount_total` | counter | Component mount events |
| `react_error_boundary_total` | counter | Uncaught React errors |

### Viewing metrics locally:
```js
// In browser console:
import { snapshot } from './utils/metrics';
console.table(snapshot().counters);
```

### Production flush:
```sh
REACT_APP_METRICS_ENDPOINT=https://metrics.example.com/ingest npm run build
```

## Validation Checklist

### Automated (run in CI or locally):
```sh
# 1. Unit tests pass (logger + metrics)
npm test -- --watchAll=false

# 2. Build succeeds with no warnings
npm run build 2>&1 | tee build.log
grep -i "warning" build.log && echo "⚠ Build warnings found" || echo "✅ Clean build"

# 3. Lint passes
npm run lint

# 4. Verify no console.log leaks (should use logger instead)
grep -rn "console\.log\|console\.warn\|console\.error" src/ \
  --include="*.js" --include="*.jsx" \
  | grep -v "node_modules" \
  | grep -v "utils/logger.js" \
  | grep -v "__tests__" \
  && echo "⚠ Found raw console usage — migrate to logger" \
  || echo "✅ All logging uses structured logger"
```

### Manual smoke test:
1. Run `REACT_APP_LOG_LEVEL=DEBUG npm start`
2. Open browser DevTools → Console
3. Verify logs show `[TIMESTAMP] [LEVEL] [Context] message` format
4. Perform CRUD operations and confirm:
   - API calls show `→ GET /users` and `← 200 GET /users` entries
   - Errors show `[ERROR]` with stack details
5. In Console, run: `window.__metrics_snapshot && window.__metrics_snapshot()`
   or import `snapshot()` to verify counters increment

## File Map

| File | Purpose |
|------|---------|
| `src/utils/logger.js` | Core structured logger |
| `src/utils/metrics.js` | Counters, gauges, timers, flush |
| `src/services/apiClient.js` | Fetch wrapper with auto-logging/metrics |
| `src/hooks/useLogger.js` | React hook for component logging |
| `src/components/ErrorBoundary.js` | Catches React errors with logging |
| `src/utils/__tests__/logger.test.js` | Logger unit tests |
| `src/utils/__tests__/metrics.test.js` | Metrics unit tests |

## Adding Logging to a New File

1. **Import**: `import { createLogger } from '../utils/logger';`
2. **Create**: `const log = createLogger('MyFileName');`
3. **Use**: `log.info('action', { key: value });`
4. **Metrics** (optional): `import { increment } from '../utils/metrics';`
5. **No raw `console.*`** — the lint check will catch it.