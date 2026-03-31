import {
    isEnabled,
    setFlag,
    setFlags,
    resetFlags,
    getAllFlags,
    logFlagState,
    FLAG,
  } from '../utils/featureFlags';
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    resetFlags();
  });
  
  afterEach(() => {
    resetFlags();
    jest.restoreAllMocks();
  });
  
  describe('featureFlags', () => {
    describe('FLAG constants', () => {
      test('exports known flag names', () => {
        expect(FLAG.STRICT_SECRET_GUARD).toBe('STRICT_SECRET_GUARD');
        expect(FLAG.METRICS_FLUSH_ENABLED).toBe('METRICS_FLUSH_ENABLED');
        expect(FLAG.LOG_TRANSPORT_ENABLED).toBe('LOG_TRANSPORT_ENABLED');
        expect(FLAG.API_RETRY_ENABLED).toBe('API_RETRY_ENABLED');
        expect(FLAG.VERBOSE_ERROR_BOUNDARY).toBe('VERBOSE_ERROR_BOUNDARY');
      });
  
      test('FLAG object is frozen', () => {
        expect(() => { FLAG.NEW_FLAG = 'x'; }).toThrow();
      });
    });
  
    describe('isEnabled()', () => {
      test('returns default value when no override or env var', () => {
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(false);
        expect(isEnabled(FLAG.API_RETRY_ENABLED)).toBe(true);
      });
  
      test('returns false for unknown flag and logs warning', () => {
        expect(isEnabled('NONEXISTENT_FLAG')).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
  
      test('env var overrides default', () => {
        process.env.REACT_APP_FF_STRICT_SECRET_GUARD = 'true';
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(true);
        delete process.env.REACT_APP_FF_STRICT_SECRET_GUARD;
      });
  
      test('env var "1" is treated as true', () => {
        process.env.REACT_APP_FF_STRICT_SECRET_GUARD = '1';
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(true);
        delete process.env.REACT_APP_FF_STRICT_SECRET_GUARD;
      });
  
      test('env var "false" is treated as false', () => {
        process.env.REACT_APP_FF_API_RETRY_ENABLED = 'false';
        expect(isEnabled(FLAG.API_RETRY_ENABLED)).toBe(false);
        delete process.env.REACT_APP_FF_API_RETRY_ENABLED;
      });
  
      test('runtime override takes priority over env var', () => {
        process.env.REACT_APP_FF_STRICT_SECRET_GUARD = 'true';
        setFlag(FLAG.STRICT_SECRET_GUARD, false);
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(false);
        delete process.env.REACT_APP_FF_STRICT_SECRET_GUARD;
      });
    });
  
    describe('setFlag()', () => {
      test('overrides a flag value', () => {
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(false);
        setFlag(FLAG.STRICT_SECRET_GUARD, true);
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(true);
      });
  
      test('ignores unknown flag names', () => {
        setFlag('BOGUS', true);
        expect(console.warn).toHaveBeenCalled();
      });
    });
  
    describe('setFlags()', () => {
      test('sets multiple flags at once', () => {
        setFlags({
          [FLAG.STRICT_SECRET_GUARD]: true,
          [FLAG.METRICS_FLUSH_ENABLED]: true,
        });
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(true);
        expect(isEnabled(FLAG.METRICS_FLUSH_ENABLED)).toBe(true);
      });
    });
  
    describe('resetFlags()', () => {
      test('clears all overrides back to defaults', () => {
        setFlag(FLAG.STRICT_SECRET_GUARD, true);
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(true);
        resetFlags();
        expect(isEnabled(FLAG.STRICT_SECRET_GUARD)).toBe(false);
      });
    });
  
    describe('getAllFlags()', () => {
      test('returns all flags with value, source, description', () => {
        const all = getAllFlags();
        expect(all).toHaveProperty('STRICT_SECRET_GUARD');
        expect(all.STRICT_SECRET_GUARD).toMatchObject({
          value: false,
          source: 'default',
          description: expect.any(String),
        });
      });
  
      test('reflects overrides in snapshot', () => {
        setFlag(FLAG.STRICT_SECRET_GUARD, true);
        const all = getAllFlags();
        expect(all.STRICT_SECRET_GUARD.value).toBe(true);
        expect(all.STRICT_SECRET_GUARD.source).toBe('override');
      });
  
      test('reflects env vars in snapshot', () => {
        process.env.REACT_APP_FF_LOG_TRANSPORT_ENABLED = 'true';
        const all = getAllFlags();
        expect(all.LOG_TRANSPORT_ENABLED.value).toBe(true);
        expect(all.LOG_TRANSPORT_ENABLED.source).toBe('env');
        delete process.env.REACT_APP_FF_LOG_TRANSPORT_ENABLED;
      });
    });
  
    describe('logFlagState()', () => {
      test('logs all flags without throwing', () => {
        expect(() => logFlagState()).not.toThrow();
        expect(console.log).toHaveBeenCalled();
      });
    });
  });