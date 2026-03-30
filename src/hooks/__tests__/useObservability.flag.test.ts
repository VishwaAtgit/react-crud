import { renderHook, act } from "@testing-library/react-hooks";
import {
  useObservability,
  dumpObservability,
  _setObservabilityEnabled,
} from "../useObservability";

function clearGlobal() {
  delete (globalThis as any).__observability;
}

describe("Feature flag: REACT_APP_ENABLE_OBSERVABILITY", () => {
  describe("when flag is ON (true)", () => {
    beforeEach(() => {
      _setObservabilityEnabled(true);
    });

    afterEach(() => {
      _setObservabilityEnabled(false);
      clearGlobal();
    });

    it("hook returns enabled: true", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      expect(result.current.enabled).toBe(true);
    });

    it("trace records a span", async () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      const obs = (globalThis as any).__observability;
      const before = obs.spans.length;

      await act(async () => {
        await result.current.trace("op", () => Promise.resolve("ok"));
      });

      expect(obs.spans.length).toBe(before + 1);
      expect(obs.spans[obs.spans.length - 1].name).toBe("FlagTest.op");
    });

    it("metric records an entry", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      const obs = (globalThis as any).__observability;
      const before = obs.metrics.length;

      act(() => {
        result.current.metric("count", 5);
      });

      expect(obs.metrics.length).toBe(before + 1);
    });

    it("log records an entry", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      const obs = (globalThis as any).__observability;
      const before = obs.logs.length;

      act(() => {
        result.current.log("INFO", "test message");
      });

      expect(obs.logs.length).toBe(before + 1);
    });

    it("dumpObservability returns populated data", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));

      act(() => {
        result.current.metric("x", 1);
      });

      const dump = dumpObservability();
      expect(dump.metrics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("when flag is OFF (false)", () => {
    beforeEach(() => {
      _setObservabilityEnabled(false);
      clearGlobal();
    });

    it("hook returns enabled: false", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      expect(result.current.enabled).toBe(false);
    });

    it("trace executes the function but records no span", async () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      let executed = false;

      await act(async () => {
        await result.current.trace("op", () => {
          executed = true;
          return Promise.resolve("ok");
        });
      });

      expect(executed).toBe(true);
      expect((globalThis as any).__observability).toBeUndefined();
    });

    it("metric is a no-op", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));

      act(() => {
        result.current.metric("count", 5);
      });

      expect((globalThis as any).__observability).toBeUndefined();
    });

    it("log is a no-op", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));

      act(() => {
        result.current.log("ERROR", "should be silent");
      });

      expect((globalThis as any).__observability).toBeUndefined();
    });

    it("traceId is a zero string", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      expect(result.current.traceId).toBe("0000000000000000");
    });

    it("dumpObservability warns and returns empty", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation();

      const dump = dumpObservability();

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("disabled")
      );
      expect(dump).toEqual({ spans: [], metrics: [], logs: [] });
      spy.mockRestore();
    });
  });

  describe("when flag is unset (defaults)", () => {
    beforeEach(() => {
      _setObservabilityEnabled(false);
      clearGlobal();
    });

    it("defaults to disabled", () => {
      const { result } = renderHook(() => useObservability("FlagTest"));
      expect(result.current.enabled).toBe(false);
    });
  });
});