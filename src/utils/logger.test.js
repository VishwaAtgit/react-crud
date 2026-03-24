/**
 * @file logger.test.js
 * @description Tests for the structured logger utility.
 *
 * Run:  CI=true npm test -- --testPathPattern=logger --verbose
 */
import { logger } from './logger';

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('logger', () => {
  test('start() emits a record with op and status "start"', () => {
    const log = logger('testOp');
    const record = log.start();

    expect(record).toMatchObject({
      op: 'testOp',
      status: 'start',
    });
    expect(record.ts).toBeDefined();
    expect(record.elapsed_ms).toBeUndefined();
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  test('success() includes elapsed_ms after start()', () => {
    const log = logger('testOp');
    log.start();
    const record = log.success({ count: 3 });

    expect(record).toMatchObject({
      op: 'testOp',
      status: 'success',
    });
    expect(typeof record.elapsed_ms).toBe('number');
    expect(record.elapsed_ms).toBeGreaterThanOrEqual(0);
    expect(record.detail).toEqual({ count: 3 });
  });

  test('error() uses console.error and extracts Error fields', () => {
    const log = logger('testOp');
    log.start();
    const record = log.error(new TypeError('boom'));

    expect(record).toMatchObject({
      op: 'testOp',
      status: 'error',
      detail: { message: 'boom', name: 'TypeError' },
    });
    expect(typeof record.elapsed_ms).toBe('number');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test('success() without prior start() omits elapsed_ms', () => {
    const log = logger('orphan');
    const record = log.success();

    expect(record.elapsed_ms).toBeUndefined();
  });

  test('detail is omitted when empty', () => {
    const log = logger('clean');
    const record = log.start();

    expect(record.detail).toBeUndefined();
  });
});