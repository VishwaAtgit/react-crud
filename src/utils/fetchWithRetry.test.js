/**
 * @file fetchWithRetry.test.js
 * @description Tests for the resilient fetch wrapper.
 *
 * Run: CI=true npm test -- --testPathPattern=fetchWithRetry --verbose
 */
import { fetchWithRetry, FetchError } from './fetchWithRetry';

// Silence structured logs during tests
beforeAll(() => { process.env.REACT_APP_LOG_LEVEL = 'silent'; });
afterAll(() => { delete process.env.REACT_APP_LOG_LEVEL; });

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ── Success path ──────────────────────────────────────

  test('returns response on success (no retry needed)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ users: [] }),
    });

    const response = await fetchWithRetry('https://example.com/api');

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // ── Retry then succeed ───────────────────────────────

  test('retries on failure then succeeds', async () => {
    const mockFetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('connection reset'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [] }),
      });

    global.fetch = mockFetch;

    const response = await fetchWithRetry('https://example.com/api', {
      retries: 2,
      backoffBase: 10,   // fast backoff for tests
    });

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── Failure: network error after all retries ─────────

  test('throws NETWORK_ERROR after exhausting retries', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    let thrownError;
    try {
      await fetchWithRetry('https://example.com/api', {
        retries: 1,          // 2 total attempts
        backoffBase: 10,
      });
      // If we reach here, the function didn't throw as expected
      throw new Error('fetchWithRetry should have thrown but did not');
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(FetchError);
    expect(thrownError.code).toBe('NETWORK_ERROR');
    expect(thrownError.attempts).toBe(2);
    expect(thrownError.message).toContain('ECONNREFUSED');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // ── Failure: timeout ─────────────────────────────────

  test('throws TIMEOUT when request exceeds timeout', async () => {
    // Simulate a request that never resolves
    global.fetch = jest.fn().mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts && opts.signal) {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    });

    let thrownError;
    try {
      await fetchWithRetry('https://example.com/slow', {
        timeout: 50,         // 50ms timeout
        retries: 0,          // no retries — fail fast
        backoffBase: 10,
      });
      throw new Error('fetchWithRetry should have thrown but did not');
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(FetchError);
    expect(thrownError.code).toBe('TIMEOUT');
    expect(thrownError.attempts).toBe(1);
    expect(thrownError.message).toContain('timed out');
  });

  // ── Failure: HTTP error ──────────────────────────────

  test('throws HTTP_ERROR on non-ok response after retries', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    let thrownError;
    try {
      await fetchWithRetry('https://example.com/api', {
        retries: 1,
        backoffBase: 10,
      });
      throw new Error('fetchWithRetry should have thrown but did not');
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(FetchError);
    expect(thrownError.code).toBe('HTTP_ERROR');
    expect(thrownError.message).toContain('503');
  });

  // ── FetchError shape ─────────────────────────────────

  test('FetchError has code, message, and attempts fields', () => {
    const err = new FetchError('TEST_CODE', 'test message', 3);

    expect(err.name).toBe('FetchError');
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('test message');
    expect(err.attempts).toBe(3);
    expect(err instanceof Error).toBe(true);
  });
});