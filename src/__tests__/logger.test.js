import { createLogger } from '../utils/logger';

describe('createLogger', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('creates a scoped logger with all four levels', () => {
    const log = createLogger('TestCtx');
    expect(log).toHaveProperty('debug');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('error');
  });

  test('info() writes to console.log with context prefix', () => {
    const log = createLogger('TestCtx');
    log.info('hello world');
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('[INFO]');
    expect(output).toContain('[TestCtx]');
  });

  test('error() writes to console.error', () => {
    const log = createLogger('ErrCtx');
    log.error('boom', { code: 500 });
    expect(console.error).toHaveBeenCalled();
    const output = console.error.mock.calls[0][0];
    expect(output).toContain('[ERROR]');
    expect(output).toContain('[ErrCtx]');
  });

  test('info() includes context and message in output', () => {
    const log = createLogger('Meta');
    log.info('user loaded', { userId: 42 });
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('[Meta]');
    expect(output).toContain('user loaded');
  });
});
