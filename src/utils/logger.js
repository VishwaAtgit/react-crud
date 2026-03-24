/**
 * @file logger.js
 * @description Structured logger for consistent runtime telemetry.
 *
 * Every log entry includes:
 *   - op        : operation name (e.g. "fetchUsers", "userDeleted")
 *   - status    : "start" | "success" | "error"
 *   - elapsed_ms: time since the matching "start" call (on success/error)
 *   - ts        : ISO-8601 timestamp
 *   - detail    : optional extra context
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   const log = logger('fetchUsers');
 *   log.start();
 *   // ... work ...
 *   log.success({ count: 5 });
 *   // or
 *   log.error(err);
 */

const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || 'info';
const SILENT = LOG_LEVEL === 'silent';

/**
 * Create a structured logger bound to an operation name.
 * @param {string} op — operation identifier
 * @returns {{ start: Function, success: Function, error: Function }}
 */
export function logger(op) {
  let startTime = null;

  const entry = (status, detail = {}) => {
    if (SILENT) {
        return;
    }
    
    const record = {
      ts: new Date().toISOString(),
      op,
      status,
      ...(startTime && status !== 'start'
        ? { elapsed_ms: Math.round(performance.now() - startTime) }
        : {}),
      ...(Object.keys(detail).length > 0 ? { detail } : {}),
    };

    if (status === 'error') {
      console.error(JSON.stringify(record));
    } else {
      console.log(JSON.stringify(record));
    }

    return record;
  };

  return {
    /** Mark the beginning of the operation. */
    start: (detail = {}) => {
      startTime = performance.now();
      return entry('start', detail);
    },

    /** Mark successful completion. */
    success: (detail = {}) => {
      const result = entry('success', detail);
      startTime = null;
      return result;
    },

    /** Mark a failure. Accepts an Error or a plain object. */
    error: (err = {}) => {
      const detail =
        err instanceof Error
          ? { message: err.message, name: err.name }
          : err;
      const result = entry('error', detail);
      startTime = null;
      return result;
    },
  };
}