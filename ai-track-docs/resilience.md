# Resilience Guide — react-crud

> Last updated: 2026-03-24

---

## Overview

`src/utils/fetchWithRetry.js` wraps the native `fetch()` API with:

| Feature | Default | Configurable |
|---|---|---|
| Timeout per attempt | 5000 ms | `timeout` |
| Retry count | 2 (3 total attempts) | `retries` |
| Exponential backoff | 500 → 1000 → 2000 ms | `backoffBase` |
| Error mapping | Always returns `FetchError` | — |

---

## Error Codes

| Code | Meaning | Retried? |
|---|---|---|
| `TIMEOUT` | Single attempt exceeded `timeout` ms | Yes |
| `NETWORK_ERROR` | DNS failure, connection refused, etc. | Yes |
| `HTTP_ERROR` | Server returned non-2xx status | Yes |

All errors include:

```javascript
{
  name: 'FetchError',
  code: 'TIMEOUT',              // machine-readable
  message: 'Request timed out…', // human-readable
  attempts: 3                    // total attempts made
}
```

---

## Backoff Timeline (defaults)

```
Attempt 1 → immediate
  fail → wait  500ms
Attempt 2
  fail → wait 1000ms
Attempt 3 (final)
  fail → throw FetchError
```

---

## Usage

```javascript
import { fetchWithRetry, FetchError } from '../utils/fetchWithRetry';

try {
  const response = await fetchWithRetry('https://api.example.com/users', {
    timeout: 3000,
    retries: 3,
    backoffBase: 200,
  });
  const data = await response.json();
} catch (err) {
  if (err instanceof FetchError) {
    console.error(`[${err.code}] ${err.message} after ${err.attempts} attempts`);
  }
}
```

---

## Test Coverage

```bash
CI=true npm test -- --testPathPattern=fetchWithRetry --verbose
```

| Test | What it verifies |
|---|---|
| Returns response on success | Happy path — no retry needed |
| Retries on failure then succeeds | Recovery after transient error |
| Throws NETWORK_ERROR after retries | All attempts fail with connection error |
| Throws TIMEOUT when request is slow | AbortController fires, mapped to TIMEOUT |
| Throws HTTP_ERROR on non-ok response | Server 5xx mapped correctly |
| FetchError shape | Custom error has code, message, attempts |

---

## Tuning for Production

| Scenario | Recommended Settings |
|---|---|
| Fast internal API | `timeout: 2000, retries: 1, backoffBase: 200` |
| Slow external API | `timeout: 10000, retries: 3, backoffBase: 1000` |
| Health check | `timeout: 1000, retries: 0` |