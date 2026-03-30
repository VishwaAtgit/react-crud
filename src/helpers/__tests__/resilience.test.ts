import {
    withResilience,
    fetchWithResilience,
    calculateDelay,
    TimeoutError,
    MaxRetriesError,
    DEFAULT_OPTIONS,
  } from "../resilience";
  
  // ── Helpers ──
  
  /** Create a function that fails `n` times then succeeds. */
  function failNTimes(n: number, successValue = "ok") {
    let callCount = 0;
    return jest.fn(async () => {
      callCount++;
      if (callCount <= n) {
        throw new Error(`Fail #${callCount}`);
      }
      return successValue;
    });
  }
  
  /** Create a function that takes `ms` to resolve. */
  function slowFn(ms: number, value = "slow-ok") {
    return jest.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve(value), ms))
    );
  }
  
  /** Suppress console noise during tests. */
  beforeEach(() => {
    jest.spyOn(console, "debug").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // ── calculateDelay ──
  
  describe("calculateDelay", () => {
    it("returns baseDelayMs on attempt 0 (± jitter)", () => {
      const delay = calculateDelay(0, {
        baseDelayMs: 200,
        backoffFactor: 2,
        maxDelayMs: 5000,
        jitter: 0,
      });
      expect(delay).toBe(200);
    });
  
    it("applies exponential backoff", () => {
      const opts = { baseDelayMs: 100, backoffFactor: 2, maxDelayMs: 10000, jitter: 0 };
      expect(calculateDelay(0, opts)).toBe(100);
      expect(calculateDelay(1, opts)).toBe(200);
      expect(calculateDelay(2, opts)).toBe(400);
      expect(calculateDelay(3, opts)).toBe(800);
    });
  
    it("caps delay at maxDelayMs", () => {
      const delay = calculateDelay(10, {
        baseDelayMs: 100,
        backoffFactor: 2,
        maxDelayMs: 500,
        jitter: 0,
      });
      expect(delay).toBe(500);
    });
  
    it("applies jitter within expected range", () => {
      const results = new Set<number>();
      for (let i = 0; i < 100; i++) {
        results.add(
          calculateDelay(0, {
            baseDelayMs: 1000,
            backoffFactor: 2,
            maxDelayMs: 5000,
            jitter: 0.25,
          })
        );
      }
      // With jitter 0.25 on 1000ms: range is 750–1250
      const arr = Array.from(results);
      expect(Math.min(...arr)).toBeGreaterThanOrEqual(750);
      expect(Math.max(...arr)).toBeLessThanOrEqual(1250);
      // Should have some variance (not all the same)
      expect(results.size).toBeGreaterThan(1);
    });
  });
  
  // ── withResilience: success paths ──
  
  describe("withResilience — success", () => {
    it("resolves on first attempt when fn succeeds", async () => {
      const fn = jest.fn(async () => "hello");
  
      const result = await withResilience(fn, { maxRetries: 3, baseDelayMs: 0 });
  
      expect(result.data).toBe("hello");
      expect(result.attempts).toBe(1);
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  
    it("retries and eventually succeeds", async () => {
      const fn = failNTimes(2, "recovered");
  
      const result = await withResilience(fn, {
        maxRetries: 3,
        baseDelayMs: 10,
        jitter: 0,
      });
  
      expect(result.data).toBe("recovered");
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  
    it("passes attempt number to fn", async () => {
      const attempts: number[] = [];
      const fn = jest.fn(async (attempt: number) => {
        attempts.push(attempt);
        if (attempt < 2) throw new Error("not yet");
        return "done";
      });
  
      await withResilience(fn, { maxRetries: 3, baseDelayMs: 10, jitter: 0 });
  
      expect(attempts).toEqual([0, 1, 2]);
    });
  });
  
  // ── withResilience: failure paths ──
  
  describe("withResilience — failure", () => {
    it("throws MaxRetriesError after all attempts exhausted", async () => {
      const fn = jest.fn(async () => {
        throw new Error("always fails");
      });
  
      await expect(
        withResilience(fn, { maxRetries: 3, baseDelayMs: 10, jitter: 0 })
      ).rejects.toThrow(MaxRetriesError);
  
      expect(fn).toHaveBeenCalledTimes(3);
    });
  
    it("MaxRetriesError contains attempt count and last error", async () => {
      const fn = jest.fn(async () => {
        throw new Error("boom");
      });
  
      try {
        await withResilience(fn, { maxRetries: 2, baseDelayMs: 10, jitter: 0 });
        fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(MaxRetriesError);
        const mre = err as MaxRetriesError;
        expect(mre.attempts).toBe(2);
        expect(mre.lastError).toBeInstanceOf(Error);
        expect((mre.lastError as Error).message).toBe("boom");
        expect(mre.message).toContain("boom");
      }
    });
  
    it("stops retrying when retryable returns false", async () => {
      const fn = jest.fn(async () => {
        const err = new Error("not found") as Error & { status: number };
        err.status = 404;
        throw err;
      });
  
      await expect(
        withResilience(fn, {
          maxRetries: 5,
          baseDelayMs: 10,
          jitter: 0,
          retryable: (error) => {
            if (
              error !== null &&
              typeof error === "object" &&
              "status" in error &&
              (error as Record<string, unknown>).status === 404
            ) {
              return false; // don't retry 404
            }
            return true;
          },
        })
      ).rejects.toThrow(MaxRetriesError);
  
      // Should have stopped after 1 attempt (no retries)
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
  
  // ── withResilience: timeout ──
  
  describe("withResilience — timeout", () => {
    it("throws MaxRetriesError wrapping TimeoutError when fn exceeds timeoutMs", async () => {
      const fn = slowFn(500);
  
      try {
        await withResilience(fn, {
          maxRetries: 1,
          timeoutMs: 50,
          baseDelayMs: 10,
          jitter: 0,
        });
        fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(MaxRetriesError);
        const mre = err as MaxRetriesError;
        expect(mre.attempts).toBe(1);
        expect(mre.lastError).toBeInstanceOf(TimeoutError);
        expect(mre.message).toContain("timed out");
      }
    });
  
    it("retries after a timeout", async () => {
      let callCount = 0;
      const fn = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          // First call: slow (will timeout)
          return new Promise<string>((resolve) =>
            setTimeout(() => resolve("too late"), 500)
          );
        }
        // Second call: fast
        return "fast";
      });
  
      const result = await withResilience(fn, {
        maxRetries: 3,
        timeoutMs: 50,
        baseDelayMs: 10,
        jitter: 0,
      });
  
      expect(result.data).toBe("fast");
      expect(result.attempts).toBe(2);
    });
  
    it("skips timeout when timeoutMs is 0", async () => {
      const fn = slowFn(100, "no-timeout");
  
      const result = await withResilience(fn, {
        maxRetries: 1,
        timeoutMs: 0,
        baseDelayMs: 10,
        jitter: 0,
      });
  
      expect(result.data).toBe("no-timeout");
    });
  });
  
  // ── withResilience: backoff timing ──
  
  describe("withResilience — backoff timing", () => {
    it("waits between retries (exponential)", async () => {
      const fn = failNTimes(2, "ok");
      const start = Date.now();
  
      await withResilience(fn, {
        maxRetries: 3,
        baseDelayMs: 50,
        backoffFactor: 2,
        maxDelayMs: 5000,
        timeoutMs: 0,
        jitter: 0,
      });
  
      const elapsed = Date.now() - start;
      // attempt 0 fails → wait 50ms → attempt 1 fails → wait 100ms → attempt 2 succeeds
      // Total wait ≈ 150ms (± timer precision)
      expect(elapsed).toBeGreaterThanOrEqual(120);
      expect(elapsed).toBeLessThan(500);
    });
  });
  
  // ── withResilience: default retryable ──
  
  describe("withResilience — default retryable predicate", () => {
    it("retries on TypeError (network error)", async () => {
      let callCount = 0;
      const fn = jest.fn(async () => {
        callCount++;
        if (callCount === 1) throw new TypeError("Failed to fetch");
        return "recovered";
      });
  
      const result = await withResilience(fn, { maxRetries: 2, baseDelayMs: 10, jitter: 0 });
      expect(result.data).toBe("recovered");
    });
  
    it("retries on 500 errors", async () => {
      let callCount = 0;
      const fn = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          const err = new Error("server error") as Error & { status: number };
          err.status = 500;
          throw err;
        }
        return "ok";
      });
  
      const result = await withResilience(fn, { maxRetries: 2, baseDelayMs: 10, jitter: 0 });
      expect(result.data).toBe("ok");
    });
  
    it("retries on 429 (rate limited)", async () => {
      let callCount = 0;
      const fn = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          const err = new Error("rate limited") as Error & { status: number };
          err.status = 429;
          throw err;
        }
        return "ok";
      });
  
      const result = await withResilience(fn, { maxRetries: 2, baseDelayMs: 10, jitter: 0 });
      expect(result.data).toBe("ok");
    });
  
    it("does NOT retry on 400 errors (via default predicate)", async () => {
      const fn = jest.fn(async () => {
        const err = new Error("bad request") as Error & { status: number };
        err.status = 400;
        throw err;
      });
  
      await expect(
        withResilience(fn, { maxRetries: 3, baseDelayMs: 10, jitter: 0 })
      ).rejects.toThrow(MaxRetriesError);
  
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
  
  // ── withResilience: edge cases ──
  
  describe("withResilience — edge cases", () => {
    it("maxRetries = 1 means no retry", async () => {
      const fn = jest.fn(async () => {
        throw new Error("fail");
      });
  
      await expect(
        withResilience(fn, { maxRetries: 1, baseDelayMs: 10, jitter: 0 })
      ).rejects.toThrow(MaxRetriesError);
  
      expect(fn).toHaveBeenCalledTimes(1);
    });
  
    it("returns totalTimeMs in result", async () => {
      const fn = jest.fn(async () => "fast");
  
      const result = await withResilience(fn, { maxRetries: 1 });
  
      expect(typeof result.totalTimeMs).toBe("number");
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });
  
    it("handles synchronous throw inside async fn", async () => {
      const fn = jest.fn(async () => {
        throw new RangeError("sync throw inside async");
      });
  
      await expect(
        withResilience(fn, { maxRetries: 2, baseDelayMs: 10, jitter: 0 })
      ).rejects.toThrow(MaxRetriesError);
  
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
  
  // ── fetchWithResilience ──
  
  describe("fetchWithResilience", () => {
    const originalFetch = globalThis.fetch;
  
    afterEach(() => {
      globalThis.fetch = originalFetch;
    });
  
    it("returns response on success", async () => {
      globalThis.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
      })) as unknown as typeof fetch;
  
      const result = await fetchWithResilience("/api/test", undefined, {
        maxRetries: 1,
        timeoutMs: 0,
      });
  
      expect(result.data.ok).toBe(true);
      expect(result.attempts).toBe(1);
    });
  
    it("retries on 503 then succeeds", async () => {
      let callCount = 0;
      globalThis.fetch = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: false, status: 503, statusText: "Service Unavailable" };
        }
        return { ok: true, status: 200, statusText: "OK" };
      }) as unknown as typeof fetch;
  
      const result = await fetchWithResilience("/api/test", undefined, {
        maxRetries: 3,
        baseDelayMs: 10,
        jitter: 0,
        timeoutMs: 0,
      });
  
      expect(result.data.ok).toBe(true);
      expect(result.attempts).toBe(2);
    });
  
    it("fails fast on 404", async () => {
      globalThis.fetch = jest.fn(async () => ({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })) as unknown as typeof fetch;
  
      await expect(
        fetchWithResilience("/api/missing", undefined, {
          maxRetries: 3,
          baseDelayMs: 10,
          jitter: 0,
          timeoutMs: 0,
        })
      ).rejects.toThrow(MaxRetriesError);
  
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });