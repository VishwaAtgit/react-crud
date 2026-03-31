import { isEnabled, FLAG } from './featureFlags';
import { createLogger } from './logger';
import { increment } from './metrics';

const log = createLogger('Security');

const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const HTML_ESCAPE_RE = /[&<>"']/g;

/**
 * Escape HTML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Strip all HTML tags from a string.
 *
 * @param {string} str
 * @returns {string}
 */
export function stripTags(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/<[^>]*>/g, '');
}

const BLOCKED_PREFIXES = ['SECRET', 'PRIVATE', 'KEY', 'TOKEN', 'PASSWORD'];
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];

/**
 * Check for leaked secrets in REACT_APP_* environment variables.
 *
 * Behavior controlled by FLAG.STRICT_SECRET_GUARD:
 *   OFF (default): logs a warning, increments counter, continues
 *   ON:            throws an Error to prevent app startup
 */
export function assertNoLeakedSecrets() {
  const leaked = Object.keys(process.env).filter((key) => {
    if (!key.startsWith('REACT_APP_')) {
      return false;
    }
    const suffix = key.replace('REACT_APP_', '');
    return BLOCKED_PREFIXES.some((p) => suffix.startsWith(p));
  });

  if (leaked.length === 0) {
    log.info('Secret guard passed — no leaked env vars detected');
    increment('security_secret_guard_pass_total');
    return;
  }

  const message = `Potentially leaked secrets in env: ${leaked.join(', ')}`;
  increment('security_secret_guard_fail_total', 1, { count: String(leaked.length) });

  if (isEnabled(FLAG.STRICT_SECRET_GUARD)) {
    log.error(`[STRICT] ${message}`);
    increment('security_strict_block_total');
    throw new Error(`[Security] ${message}`);
  }

  log.warn(`[PERMISSIVE] ${message} — set REACT_APP_FF_STRICT_SECRET_GUARD=true to enforce`);
  increment('security_permissive_warn_total');
}

/**
 * Redact sensitive headers from a headers object.
 *
 * @param {object} headers
 * @returns {object}
 */
export function redactHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return {};
  }
  const redacted = { ...headers };
  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    }
  }
  return redacted;
}