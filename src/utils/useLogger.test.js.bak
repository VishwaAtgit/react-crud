/**
 * @file useLogger.test.js
 * @description Tests for the useLogger React hook.
 *
 * Verifies:
 *   1. Mount emits a structured "start" log
 *   2. Unmount emits a structured "success" log with elapsed_ms
 *   3. event() emits a structured event entry
 *   4. metric() emits a structured metric entry
 *   5. trace() creates a span with start/end timing
 *
 * Run: CI=true npm test -- --testPathPattern=useLogger --verbose
 */
import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { useLogger } from './useLogger';

// ── Capture structured log output ────────────────────────────────────
let logEntries = [];
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  logEntries = [];
  console.log = jest.fn((msg) => {
    try {
      logEntries.push(JSON.parse(msg));
    } catch {
      // non-JSON output — ignore
    }
  });
  console.error = jest.fn((msg) => {
    try {
      logEntries.push(JSON.parse(msg));
    } catch {
      // non-JSON output — ignore
    }
  });
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  cleanup();
});

// ── Helpers ──────────────────────────────────────────────────────────

/** Find all log entries matching a predicate */
const findLogs = (predicate) => logEntries.filter(predicate);

/** Test component that exposes hook methods via ref */
function TestComponent({ onReady, name = 'TestComponent' }) {
  const log = useLogger(name);

  React.useEffect(() => {
    if (onReady) onReady(log);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div data-testid="test">Mounted</div>;
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useLogger', () => {
  test('emits structured "start" log on mount', () => {
    render(<TestComponent name="MountTest" />);

    const mountLogs = findLogs(
      (e) => e.op === 'MountTest' && e.status === 'start'
    );

    expect(mountLogs.length).toBe(1);
    expect(mountLogs[0]).toMatchObject({
      op: 'MountTest',
      status: 'start',
      detail: { lifecycle: 'mount' },
    });
    expect(mountLogs[0].ts).toBeDefined();
  });

  test('emits structured "success" log with elapsed_ms on unmount', async () => {
    const { unmount } = render(<TestComponent name="UnmountTest" />);

    // Small delay so elapsed_ms > 0
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50// filepath: /Users/vishwac/personal/react-crud/src/utils/useLogger.test.js
/**
 * @file useLogger.test.js
 * @description Tests for the useLogger React hook.
 *
 * Verifies:
 *   1. Mount emits a structured "start" log
 *   2. Unmount emits a structured "success" log with elapsed_ms
 *   3. event() emits a structured event entry
 *   4. metric() emits a structured metric entry
 *   5. trace() creates a span with start/end timing
 *
 * Run: CI=true npm test -- --testPathPattern=useLogger --verbose
 */
import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { useLogger } from './useLogger';

// ── Capture structured log output ────────────────────────────────────
let logEntries = [];
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  logEntries = [];
  console.log = jest.fn((msg) => {
    try {
      logEntries.push(JSON.parse(msg));
    } catch {
      // non-JSON output — ignore
    }
  });
  console.error = jest.fn((msg) => {
    try {
      logEntries.push(JSON.parse(msg));
    } catch {
      // non-JSON output — ignore
    }
  });
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  cleanup();
});

// ── Helpers ──────────────────────────────────────────────────────────

/** Find all log entries matching a predicate */
const findLogs = (predicate) => logEntries.filter(predicate);

/** Test component that exposes hook methods via ref */
function TestComponent({ onReady, name = 'TestComponent' }) {
  const log = useLogger(name);

  React.useEffect(() => {
    if (onReady) onReady(log);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div data-testid="test">Mounted</div>;
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useLogger', () => {
  test('emits structured "start" log on mount', () => {
    render(<TestComponent name="MountTest" />);

    const mountLogs = findLogs(
      (e) => e.op === 'MountTest' && e.status === 'start'
    );

    expect(mountLogs.length).toBe(1);
    expect(mountLogs[0]).toMatchObject({
      op: 'MountTest',
      status: 'start',
      detail: { lifecycle: 'mount' },
    });
    expect(mountLogs[0].ts).toBeDefined();
  });

  test('emits structured "success" log with elapsed_ms on unmount', async () => {
    const { unmount } = render(<TestComponent name="UnmountTest" />);

    // Small delay so elapsed_ms > 0
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50