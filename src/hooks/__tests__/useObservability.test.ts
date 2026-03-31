import { renderHook, act } from "@testing-library/react-hooks";
import { useObservability, dumpObservability, _setObservabilityEnabled } from "../useObservability";

beforeEach(() => {
  // Ensure flag is ON for the core tests
  _setObservabilityEnabled(true);
  const obs = (globalThis as any).__observability;
  if (obs) {
    obs.spans.length = 0;
    obs.metrics.length = 0;
    obs.logs.length = 0;
  }
});

afterEach(() => {
  _setObservabilityEnabled(false);
});


describe("useObservability", () => {
  it("records a successful trace span with duration", async () => {
    const { result } = renderHook(() => useObservability("Test"));

    await act(async () => {
      await result.current.trace("myOp", () => new Promise((r) => setTimeout(r, 50)));
    });

    const obs = (globalThis as any).__observability;
    expect(obs.spans).toHaveLength(1);
    expect(obs.spans[0].name).toBe("Test.myOp");
    expect(obs.spans[0].status).toBe("OK");
    expect(obs.spans[0].endTime! - obs.spans[0].startTime).toBeGreaterThanOrEqual(40);
  });

  it("records an error span when the traced fn throws", async () => {
    const { result } = renderHook(() => useObservability("Test"));

    await act(async () => {
      await result.current
        .trace("failing", () => {
          throw new Error("boom");
        })
        .catch(() => {});
    });

    const obs = (globalThis as any).__observability;
    expect(obs.spans).toHaveLength(1);
    expect(obs.spans[0].status).toBe("ERROR");
  });

  it("pushes a metric with labels", () => {
    const { result } = renderHook(() => useObservability("Test"));

    act(() => {
      result.current.metric("items_loaded", 42, "count", { source: "api" });
    });

    const obs = (globalThis as any).__observability;
    expect(obs.metrics).toHaveLength(1);
    expect(obs.metrics[0]).toMatchObject({
      name: "Test.items_loaded",
      value: 42,
      unit: "count",
      labels: { source: "api" },
    });
  });

  it("emits a structured log correlated to a traceId", () => {
    const { result } = renderHook(() => useObservability("Test"));

    act(() => {
      result.current.log("INFO", "hello world", { extra: 1 });
    });

    const obs = (globalThis as any).__observability;
    expect(obs.logs).toHaveLength(1);
    expect(obs.logs[0].traceId).toBe(result.current.traceId);
    expect(obs.logs[0].message).toBe("hello world");
    expect(obs.logs[0].data).toEqual({ extra: 1 });
  });

  it("dumpObservability returns all signals", () => {
    const { result } = renderHook(() => useObservability("Dump"));

    act(() => {
      result.current.metric("x", 1);
      result.current.log("WARN", "w");
    });

    const dump = dumpObservability();
    expect(dump.metrics.length).toBeGreaterThanOrEqual(1);
    expect(dump.logs.length).toBeGreaterThanOrEqual(1);
  });
});


