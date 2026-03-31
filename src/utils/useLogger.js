/**
 * @file useLogger.js
 * @description React hook for structured component telemetry.
 *
 * Emits structured log entries for:
 *   - Component mount    (start)
 *   - Component unmount  (success + elapsed_ms)
 *   - Arbitrary events   (via returned log methods)
 *
 * Usage:
 *   import { useLogger } from '../utils/useLogger';
 *
 *   function UserList() {
 *     const log = useLogger('UserList');
 *     // log.event({ action: 'delete', userId: 5 });
 *     // log.metric('rowCount', users.length);
 *   }
 *
 * Log output:
 *   {"ts":"...","op":"UserList","status":"mount"}
 *   {"ts":"...","op":"UserList","status":"event","detail":{"action":"delete","userId":5}}
 *   {"ts":"...","op":"UserList","status":"metric","detail":{"name":"rowCount","value":10}}
 *   {"ts":"...","op":"UserList","status":"unmount","elapsed_ms":34521}
 */
import { useEffect, useRef, useCallback } from 'react';
import { logger } from './logger';

/**
 * @param {string} componentName — identifies this component in logs
 * @returns {{ event: Function, metric: Function, trace: Function }}
 */
export function useLogger(componentName) {
  const logRef = useRef(null);
  const mountTimeRef = useRef(null);

  // Create the logger instance once per component name
  if (logRef.current === null) {
    logRef.current = logger(componentName);
  }

  // ── Mount / Unmount lifecycle ────────────────────────────────────
  useEffect(() => {
    mountTimeRef.current = performance.now();
    logRef.current.start({ lifecycle: 'mount' });

    return () => {
      const elapsed = Math.round(performance.now() - mountTimeRef.current);
      // We can't call logRef.current.success here because start()
      // already set its own startTime. Build the entry manually.
      const log = logger(componentName);
      log.start();
      // Overwrite elapsed with actual mount duration
      const record = log.success({ lifecycle: 'unmount', mounted_ms: elapsed });
      return record;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Event logger (user actions, state changes) ──────────────────
  const event = useCallback(
    (detail = {}) => {
      const log = logger(componentName);
      return log.start({ type: 'event', ...detail });
    },
    [componentName]
  );

  // ── Metric logger (numeric measurements) ────────────────────────
  const metric = useCallback(
    (name, value, detail = {}) => {
      const log = logger(componentName);
      return log.start({ type: 'metric', name, value, ...detail });
    },
    [componentName]
  );

  // ── Trace logger (start/end spans for async work) ───────────────
  const trace = useCallback(
    (spanName) => {
      const span = logger(`${componentName}.${spanName}`);
      span.start();
      return {
        /** End the span successfully */
        end: (detail = {}) => span.success(detail),
        /** End the span with an error */
        fail: (err) => span.error(err),
      };
    },
    [componentName]
  );

  return { event, metric, trace };
}