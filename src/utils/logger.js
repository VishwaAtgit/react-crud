/**
 * Structured operation logger for the React CRUD app.
 *
 * Usage:
 *   import { logger } from './logger';
 *   const log = logger('fetchUsers');
 *   log.start();
 *   // ... do work ...
 *   log.success({ count: 10 });
 *
 * Or on error:
 *   log.error(new Error('boom'));
 *
 * Also re-exports createLogger() for simple leveled logging.
 */

// --- Operation logger (matches existing test contract) --------------------

export function logger(op) {
  let _startTime = null;

  return {
    start(detail) {
      _startTime = performance.now();
      const record = {
        op,
        status: 'start',
        timestamp: new Date().toISOString(),
      };
      if (detail && Object.keys(detail).length > 0) {
        record.detail = detail;
      }
      console.log(JSON.stringify(record));
      return record;
    },

    success(detail) {
      const record = {
        op,
        status: 'success',
        timestamp: new Date().toISOString(),
      };
      if (_startTime !== null) {
        record.elapsed_ms = Math.round(performance.now() - _startTime);
      }
      if (detail && Object.keys(detail).length > 0) {
        record.detail = detail;
      }
      console.log(JSON.stringify(record));
      return record;
    },

    error(err, detail) {
      const record = {
        op,
        status: 'error',
        timestamp: new Date().toISOString(),
      };
      if (_startTime !== null) {
        record.elapsed_ms = Math.round(performance.now() - _startTime);
      }
      if (err instanceof Error) {
        record.error = err.message;
        record.errorType = err.constructor.name;
      } else if (err) {
        record.error = String(err);
      }
      if (detail && Object.keys(detail).length > 0) {
        record.detail = detail;
      }
      console.error(JSON.stringify(record));
      return record;
    },
  };
}

// --- Simple leveled logger (for components / services) --------------------

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

const MIN_LEVEL = LEVELS[process.env.REACT_APP_LOG_LEVEL] || LEVELS.DEBUG;

let _transport = null;
let _transportFailCount = 0;
const TRANSPORT_WARN_THRESHOLD = 5;

const CONSOLE_METHOD_MAP = {
  ERROR: 'error',
  WARN: 'warn',
  DEBUG: 'debug',
  INFO: 'log',
};

function emit(level, context, message, meta) {
  if (LEVELS[level] < MIN_LEVEL) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };

  const method = CONSOLE_METHOD_MAP[level] || 'log';
  console[method](`[${entry.timestamp}] [${level}] [${context}] ${message}`);

  if (_transport) {
    try {
      _transport(entry);
      _transportFailCount = 0;
    } catch (err) {
      _transportFailCount += 1;
      if (_transportFailCount === TRANSPORT_WARN_THRESHOLD) {
        console.warn(
          `[Logger] Transport failed ${TRANSPORT_WARN_THRESHOLD} consecutive times: ${err.message}`
        );
      }
    }
  }
}

/**
 * Create a scoped logger bound to a context string.
 *
 * @param {string} context
 * @returns {{ debug, info, warn, error }}
 */
export function createLogger(context) {
  return {
    debug: (msg, meta) => emit('DEBUG', context, msg, meta),
    info: (msg, meta) => emit('INFO', context, msg, meta),
    warn: (msg, meta) => emit('WARN', context, msg, meta),
    error: (msg, meta) => emit('ERROR', context, msg, meta),
  };
}

/**
 * Set the log transport function (or null to disable).
 *
 * @param {Function|null} fn
 */
export function setTransport(fn) {
  _transport = typeof fn === 'function' ? fn : null;
  _transportFailCount = 0;
}