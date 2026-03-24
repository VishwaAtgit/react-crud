# Structured Logging Guide — react-crud

> Last updated: 2026-03-24

---

## Log Format

Every log entry is a single-line JSON object:

```json
{"ts":"2026-03-24T10:15:30.123Z","op":"fetchUsers","status":"start"}
{"ts":"2026-03-24T10:15:30.456Z","op":"fetchUsers","status":"success","elapsed_ms":333,"detail":{"count":10}}
```

### Fields

| Field | Type | Always Present | Description |
|---|---|---|---|
| `ts` | string | ✅ | ISO-8601 timestamp |
| `op` | string | ✅ | Operation name |
| `status` | string | ✅ | `start`, `success`, or `error` |
| `elapsed_ms` | number | ❌ | ms since matching `start()` |
| `detail` | object | ❌ | Extra context (count, id, error message) |

---

## Viewing Logs

### Browser DevTools (development)

1. Open DevTools → **Console** tab
2. Filter by typing `fetchUsers` or `userDeleted` in the filter bar
3. Errors appear in red (`console.error`)

### Filter JSON in DevTools

```javascript
// Paste in console to pretty-print structured logs only
const _log = console.log;
console.log = (...args) => {
  try { const o = JSON.parse(args[0]); _log(o); } catch { _log(...args); }
};
```

### Terminal (CI / test output)

```bash
# Run tests, extract only structured logs
CI=true npm test -- --verbose 2>&1 | grep '"op":'

# Pretty-print with jq
CI=true npm test -- --verbose 2>&1 \
  | grep '"op":' \
  | jq '.'
```

### Filter by operation

```bash
# Only fetchUsers logs
CI=true npm test -- --verbose 2>&1 \
  | grep '"op":"fetchUsers"'

# Only errors
CI=true npm test -- --verbose 2>&1 \
  | grep '"status":"error"'
```

---

## Silencing Logs in Tests

Set the env variable before running:

```bash
REACT_APP_LOG_LEVEL=silent CI=true npm test -- --verbose
```

Or in a specific test file:

```javascript
beforeAll(() => { process.env.REACT_APP_LOG_LEVEL = 'silent'; });
afterAll(() => { delete process.env.REACT_APP_LOG_LEVEL; });
```

---

## Adding Logs to a New Operation

```javascript
import { logger } from '../utils/logger';

async function myOperation() {
  const log = logger('myOperation');   // ← operation name
  log.start({ input: 'foo' });        // ← optional detail
  try {
    const result = await doWork();
    log.success({ resultId: result.id });
  } catch (err) {
    log.error(err);
    throw err;
  }
}
```

---

## Checklist

- [ ] Every async thunk has `log.start()` / `log.success()` / `log.error()`
- [ ] Operation names match the slice action name (e.g. `fetchUsers`)
- [ ] No secrets or PII in `detail` fields
- [ ] `REACT_APP_LOG_LEVEL=silent` works in test runs