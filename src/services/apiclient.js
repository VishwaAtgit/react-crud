/**
 * Centralized API client with structured logging and metrics.
 * Every service file should use this instead of raw fetch/axios.
 */

import { createLogger } from '../utils/logger';
import { increment, startTimer, gauge } from '../utils/metrics';

const log = createLogger('ApiClient');

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

let _activeRequests = 0;

/**
 * Generic request wrapper.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path – e.g. '/users'
 * @param {object} [body]
 * @returns {Promise<any>}
 */
async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const tags = { method, path };

  log.info(`→ ${method} ${path}`, body ? { body } : undefined);
  increment('api_call_total', 1, tags);

  _activeRequests++;
  gauge('active_requests', _activeRequests);

  const stopTimer = startTimer('api_response_ms', tags);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const elapsed = stopTimer();

    if (!res.ok) {
      increment('api_error_total', 1, { ...tags, status: res.status });
      log.error(`← ${res.status} ${method} ${path}`, { elapsed_ms: elapsed });
      throw new Error(`API ${method} ${path} failed with status ${res.status}`);
    }

    const data = await res.json();
    increment('api_success_total', 1, tags);
    log.info(`← ${res.status} ${method} ${path}`, { elapsed_ms: elapsed });
    return data;
  } catch (err) {
    increment('api_error_total', 1, { ...tags, error: err.message });
    log.error(`✗ ${method} ${path}`, { error: err.message });
    throw err;
  } finally {
    _activeRequests--;
    gauge('active_requests', _activeRequests);
  }
}

const api = {
  get:    (path)        => request('GET', path),
  post:   (path, body)  => request('POST', path, body),
  put:    (path, body)  => request('PUT', path, body),
  delete: (path)        => request('DELETE', path),
};

export default api;