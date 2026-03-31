import { createLogger } from './logger';

const log = createLogger('Metrics');

const MAX_TIMER_VALUES = 1000;

let _counters = {};
let _gauges = {};
let _timers = {};
let _flushEndpoint = null;
let _flushIntervalId = null;
/**
 * Build a tag-qualified metric key: name{k1:v1,k2:v2}
 *
 * @param {string} name
 * @param {object} [labels]
 * @returns {string}
 */
function buildKey(name, labels) {
  if (!labels || Object.keys(labels).length === 0) {
    return name;
  }
  const tag = Object.entries(labels)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  return `${name}{${tag}}`;
}

/**
 * Increment a counter by a given amount.
 *
 * @param {string} name
 * @param {number} [amount=1]
 * @param {object} [labels]
 */
export function increment(name, amount = 1, labels) {
  const key = buildKey(name, labels);
  if (!_counters[key]) {
    _counters[key] = 0;
  }
  _counters[key] += amount;
  log.debug(`counter++ ${name}`, labels);
}

/**
 * Set a gauge to an absolute value.
 *
 * @param {string} name
 * @param {number} value
 * @param {object} [labels]
 */
export function gauge(name, value, labels) {
  const key = buildKey(name, labels);
  _gauges[key] = value;
  log.debug(`gauge ${name}`, labels);
}

/**
 * Start a timer. Returns a stop() function that records the elapsed time.
 *
 * @param {string} name
 * @returns {Function} stop — call to record elapsed time
 */
export function startTimer(name) {
  const start = performance.now();
  log.debug(`timer start ${name}`);

  return function stop() {
    const elapsed = performance.now() - start;

    if (!_timers[name]) {
      _timers[name] = { count: 0, sum: 0, min: Infinity, max: -Infinity, values: [], capped: false };
    }

    const t = _timers[name];
    const newCount = t.count + 1;
    const newSum = t.sum + elapsed;
    const newMin = Math.min(t.min, elapsed);
    const newMax = Math.max(t.max, elapsed);
    const newValues = [...t.values, elapsed];
    const isCapped = newValues.length > MAX_TIMER_VALUES;

    _timers[name] = {
      count: newCount,
      sum: newSum,
      min: newMin,
      max: newMax,
      values: isCapped ? newValues.slice(-MAX_TIMER_VALUES) : newValues,
      capped: t.capped || isCapped,
    };

    log.debug(`timer stop ${name}`, { elapsed_ms: elapsed.toFixed(2) });
    return elapsed;
  };
}

/**
 * Get a snapshot of all metrics.
 *
 * @returns {{ timestamp, counters, gauges, timers }}
 */
export function snapshot() {
  const timerSummary = {};
  for (const [name, t] of Object.entries(_timers)) {
    timerSummary[name] = {
      count: t.count,
      sum: t.sum,
      min: t.min === Infinity ? 0 : t.min,
      max: t.max === -Infinity ? 0 : t.max,
      avg: t.count > 0 ? t.sum / t.count : 0,
      capped: t.capped,
    };
  }

  return {
    timestamp: new Date().toISOString(),
    counters: { ..._counters },
    gauges: { ..._gauges },
    timers: timerSummary,
  };
}

/**
 * Reset all metrics. Only use in tests.
 */
export function reset() {
  _counters = {};
  _gauges = {};
  _timers = {};
  log.debug('Metrics reset');
}

/**
 * Flush metrics to the configured endpoint.
 */
export function flush() {
  const data = snapshot();
  log.info('Flushing metrics', { counters: Object.keys(_counters).length });

  if (_flushEndpoint) {
    try {
      fetch(_flushEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      log.warn('Metrics flush failed', { error: err.message });
    }
  } else {
    log.debug('Metrics snapshot (no endpoint configured)', data);
  }
}

/**
 * Configure metrics subsystem.
 *
 * @param {{ endpoint?: string, intervalMs?: number }} opts
 */
export function configure(opts = {}) {
  if (opts.endpoint) {
    _flushEndpoint = opts.endpoint;
  }
  if (opts.intervalMs && !_flushIntervalId) {
    _flushIntervalId = setInterval(flush, opts.intervalMs);
    log.info('Metrics auto-flush enabled', { intervalMs: opts.intervalMs });
  }
}