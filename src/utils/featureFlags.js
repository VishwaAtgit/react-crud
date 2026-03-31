/**
 * Feature flag helper — centralised toggle system with telemetry.
 *
 * Flags are resolved in order:
 *   1. Runtime overrides (setFlag / setFlags)
 *   2. Environment variables (REACT_APP_FF_<FLAG_NAME>)
 *   3. Hardcoded defaults
 */

import { increment } from './metrics';
import { createLogger } from './logger';

const log = createLogger('FeatureFlags');

// ── Flag Registry ────────────────────────────────────────────────

const FLAG_DEFINITIONS = {
  STRICT_SECRET_GUARD: {
    default: false,
    description: 'Throw on leaked secrets in production (vs. warn-only)',
  },
  METRICS_FLUSH_ENABLED: {
    default: false,
    description: 'Enable automatic metrics flush to remote endpoint',
  },
  LOG_TRANSPORT_ENABLED: {
    default: false,
    description: 'Enable remote log transport (vs. console-only)',
  },
  API_RETRY_ENABLED: {
    default: true,
    description: 'Enable automatic retry on transient API failures',
  },
  VERBOSE_ERROR_BOUNDARY: {
    default: false,
    description: 'Include component stack in ErrorBoundary metrics',
  },
};

// ── Exported flag name constants ─────────────────────────────────

export const FLAG = Object.freeze(
  Object.keys(FLAG_DEFINITIONS).reduce((acc, key) => ({ ...acc, [key]: key }), {})
);

// ── Internal state ───────────────────────────────────────────────

const _overrides = {};

// ── Helpers ──────────────────────────────────────────────────────

function resolveFlag(flagName) {
  // 1. Runtime override (highest priority)
  if (flagName in _overrides) {
    return { value: _overrides[flagName], source: 'override' };
  }

  // 2. Environment variable
  const envKey = `REACT_APP_FF_${flagName}`;
  const envVal = process.env[envKey];
  if (envVal !== undefined) {
    return { value: envVal === 'true' || envVal === '1', source: 'env' };
  }

  // 3. Hardcoded default
  return { value: FLAG_DEFINITIONS[flagName].default, source: 'default' };
}

// ── Core API ─────────────────────────────────────────────────────

/**
 * Check if a feature flag is enabled.
 *
 * @param {string} flagName — one of the FLAG.* constants
 * @returns {boolean}
 */
export function isEnabled(flagName) {
  if (!(flagName in FLAG_DEFINITIONS)) {
    log.warn(`Unknown feature flag: ${flagName}`);
    increment('ff_unknown_total', 1, { flag: flagName });
    return false;
  }

  const { value, source } = resolveFlag(flagName);

  increment('ff_evaluation_total', 1, { flag: flagName, value: String(value), source });

  return value;
}

/**
 * Set a runtime override for a single flag.
 *
 * @param {string} flagName
 * @param {boolean} value
 */
export function setFlag(flagName, value) {
  if (!(flagName in FLAG_DEFINITIONS)) {
    log.warn(`Cannot set unknown flag: ${flagName}`);
    return;
  }
  const prev = isEnabled(flagName);
  _overrides[flagName] = Boolean(value);
  log.info(`Flag ${flagName} changed: ${prev} → ${value}`, { source: 'setFlag' });
  increment('ff_override_total', 1, { flag: flagName, value: String(value) });
}

/**
 * Bulk-set multiple flags.
 *
 * @param {Record<string, boolean>} flags
 */
export function setFlags(flags) {
  for (const [name, value] of Object.entries(flags)) {
    setFlag(name, value);
  }
}

/**
 * Clear all runtime overrides.
 */
export function resetFlags() {
  for (const key of Object.keys(_overrides)) {
    delete _overrides[key];
  }
  log.info('All flag overrides cleared');
  increment('ff_reset_total');
}

/**
 * Get a snapshot of all flags with current resolved values.
 *
 * @returns {Record<string, { value: boolean, source: string, description: string }>}
 */
export function getAllFlags() {
  const result = {};
  for (const [name, def] of Object.entries(FLAG_DEFINITIONS)) {
    const { value, source } = resolveFlag(name);
    result[name] = { value, source, description: def.description };
  }
  return result;
}

/**
 * Log all current flag states. Call at app startup for audit trail.
 */
export function logFlagState() {
  const flags = getAllFlags();
  log.info('Feature flag state at startup:');
  for (const [name, state] of Object.entries(flags)) {
    log.info(`  ${name}: ${state.value} (${state.source})`);
  }
  increment('ff_startup_snapshot_total');
}