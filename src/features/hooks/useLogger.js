import { useRef, useEffect } from 'react';
import { createLogger } from '../../utils/logger';
import { increment } from '../../utils/metrics';

/**
 * React hook that provides a scoped logger and tracks mount/unmount metrics.
 *
 * @param {string} componentName
 * @returns {{ log: { debug, info, warn, error } }}
 */
export function useLogger(componentName) {
  const logRef = useRef(null);
  const prevNameRef = useRef(componentName);

  // Create or update logger only when componentName genuinely changes
  if (!logRef.current || prevNameRef.current !== componentName) {
    logRef.current = createLogger(componentName);
    prevNameRef.current = componentName;
  }

  useEffect(() => {
    logRef.current.debug('Mounted');
    increment('component_mount_total', 1, { component: componentName });

    return () => {
      logRef.current.debug('Unmounted');
      increment('component_unmount_total', 1, { component: componentName });
    };
    // componentName is intentionally in deps — if it changes, we
    // fire unmount for the old context and mount for the new one.
  }, [componentName]);

  return { log: logRef.current };
}