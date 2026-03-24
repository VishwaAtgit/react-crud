/**
 * @file fetchWithRetry.js
 * @description Resilient fetch wrapper with timeout, retry, and exponential backoff.
 *
 * Features:
 *   - Configurable timeout per request (default 5000ms)
 *   - Configurable retry count (default 2 retries = 3 total attempts)
 *   - Exponential backoff: 500ms → 1000ms → 2000ms …
 *   - Maps network/timeout errors to a consistent { code, message } shape
 *
 * Usage:
 *   import { fetchWithRetry } from '../utils/fetchWithRetry';
 *   const data = await fetchWithRetry('https://api.example.com/users');
 */

/**
 * @typedef {Object} FetchRetryOptions
 * @property {number}  [timeout=5000]    — ms before aborting a single attempt
 * @property {number}  [retries=2]       — number of retries after first failure
 * @property {number}  [backoffBase=500] — base delay in ms (doubled each retry)
 * @property {RequestInit} [init={}]     — standard fetch RequestInit options
 */

/**
 * Custom error class for resilient fetch failures.
 * Always contains a machine-readable `code` and human-readable `message`.
 */
export class FetchError extends Error {
  /**
   * @param {string} code    — machine-readable code
   * @param {string} message — human-readable description
   * @param {number} attempts — total attempts made
   */
  constructor(code, message, attempts) {
    super(message);
    this.name = 'FetchError';
    this.code = code;
    this.attempts = attempts;
  }
}

/**
 * Sleep helper for backoff delays.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with timeout, retry, and exponential backoff.
 *
 * @param {string} url
 * @param {FetchRetryOptions} [options={}]
 * @returns {Promise<Response>}
 * @throws {FetchError}
 */
export async function fetchWithRetry(url, options = {}) {
  const {
    timeout = 5000,
    retries = 2,
    backoffBase = 500,
    init = {},
  } = options;

  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new FetchError(
          'HTTP_ERROR',
          `HTTP ${response.status}: ${response.statusText}`,
          attempt
        );
      }

      return response;
    } catch (err) {
      clearTimeout(timer);

      // ── Map to consistent error codes ────────────────
      let mapped;
      if (err instanceof FetchError) {
        mapped = err;
      } else if (err.name === 'AbortError') {
        mapped = new FetchError(
          'TIMEOUT',
          `Request timed out after ${timeout}ms`,
          attempt
        );
      } else {
        mapped = new FetchError(
          'NETWORK_ERROR',
          err.message || 'Unknown network error',
          attempt
        );
      }

      // ── Last attempt — throw ─────────────────────────
      if (attempt === maxAttempts) {
        throw mapped;
      }

      // ── Backoff before retry ─────────────────────────
      const delay = backoffBase * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}