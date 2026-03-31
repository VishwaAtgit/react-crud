import { assertNoLeakedSecrets } from '../utils/security';
import { setFlag, resetFlags, FLAG } from '../utils/featureFlags';

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  resetFlags();
});

afterEach(() => {
  resetFlags();
  // Clean up any test env vars
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('REACT_APP_SECRET') ||
        key.startsWith('REACT_APP_TOKEN') ||
        key.startsWith('REACT_APP_PASSWORD') ||
        key.startsWith('REACT_APP_PRIVATE') ||
        key.startsWith('REACT_APP_KEY')) {
      delete process.env[key];
    }
  }
  jest.restoreAllMocks();
});

describe('assertNoLeakedSecrets — safety switch', () => {
  describe('FLAG OFF (default — permissive mode)', () => {
    test('does NOT throw when secrets are present', () => {
      process.env.REACT_APP_SECRET_API_KEY = 'leaked-value';
      expect(() => assertNoLeakedSecrets()).not.toThrow();
    });

    test('logs a warning when secrets are present', () => {
      process.env.REACT_APP_TOKEN_STRIPE = 'tk_test_123';
      assertNoLeakedSecrets();
      const allCalls = [
        ...console.warn.mock.calls,
        ...console.log.mock.calls,
      ].map((c) => c.join(' ')).join('\n');
      expect(allCalls).toMatch(/PERMISSIVE|leaked|TOKEN/i);
    });

    test('passes silently when no secrets are present', () => {
      expect(() => assertNoLeakedSecrets()).not.toThrow();
    });
  });

  describe('FLAG ON (strict mode)', () => {
    beforeEach(() => {
      setFlag(FLAG.STRICT_SECRET_GUARD, true);
    });

    test('throws when secrets are present', () => {
      process.env.REACT_APP_SECRET_DB_PASS = 'p@ssw0rd';
      expect(() => assertNoLeakedSecrets()).toThrow(/leaked secrets/i);
    });

    test('throws with the leaked key names in message', () => {
      process.env.REACT_APP_TOKEN_AUTH = 'abc';
      process.env.REACT_APP_PASSWORD_DB = 'xyz';
      expect(() => assertNoLeakedSecrets()).toThrow(/TOKEN_AUTH/);
    });

    test('passes silently when no secrets are present', () => {
      expect(() => assertNoLeakedSecrets()).not.toThrow();
    });

    test('logs error before throwing', () => {
      process.env.REACT_APP_KEY_PRIVATE = 'secret';
      try {
        assertNoLeakedSecrets();
      } catch {
        // expected
      }
      const errorCalls = console.error.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(errorCalls).toMatch(/STRICT/);
    });
  });

  describe('flag toggle mid-session', () => {
    test('can switch from permissive to strict at runtime', () => {
      process.env.REACT_APP_SECRET_KEY = 'oops';

      // Permissive — no throw
      expect(() => assertNoLeakedSecrets()).not.toThrow();

      // Switch to strict — now throws
      setFlag(FLAG.STRICT_SECRET_GUARD, true);
      expect(() => assertNoLeakedSecrets()).toThrow();

      // Switch back — no throw
      setFlag(FLAG.STRICT_SECRET_GUARD, false);
      expect(() => assertNoLeakedSecrets()).not.toThrow();
    });
  });

  describe('env var control', () => {
    test('REACT_APP_FF_STRICT_SECRET_GUARD=true enables strict mode', () => {
      process.env.REACT_APP_FF_STRICT_SECRET_GUARD = 'true';
      process.env.REACT_APP_SECRET_LEAK = 'oops';
      expect(() => assertNoLeakedSecrets()).toThrow();
      delete process.env.REACT_APP_FF_STRICT_SECRET_GUARD;
    });

    test('REACT_APP_FF_STRICT_SECRET_GUARD=false keeps permissive mode', () => {
      process.env.REACT_APP_FF_STRICT_SECRET_GUARD = 'false';
      process.env.REACT_APP_SECRET_LEAK = 'oops';
      expect(() => assertNoLeakedSecrets()).not.toThrow();
      delete process.env.REACT_APP_FF_STRICT_SECRET_GUARD;
    });
  });
});