# Performance Baseline — `<App />` Render

> Recorded: 2026-03-24
> Machine: Mac (local dev)
> Command: `CI=true npm test -- --testPathPattern=App.perf --verbose`

## Configuration

| Parameter | Value |
|---|---|
| Iterations | 20 |
| Timer | `performance.now()` (sub-ms) |
| Store | Empty (`entities: []`, `loading: false`) |
| Threshold | Mean < 200 ms |

## Expected Baseline (fill after first run)

| Metric | Value (ms) |
|---|---|
| Mean | ___ |
| Median | ___ |
| Min | ___ |
| Max | ___ |
| Stddev | ___ |
| First render | ___ |

## Variance Notes

- **First render** is expected to be 2–5× slower than median due to
  module initialization, JIT warm-up, and React internal setup.
- **Stddev > 30% of mean** indicates noisy results — re-run with
  other apps closed, or increase `ITERATIONS` to 50.
- **CI vs local** numbers will differ. Record both if available.
- If mean approaches 100 ms, investigate which child component
  is expensive: add a second benchmark file for that component.

## When to Update This Baseline

- After adding new Redux slices or route-level components
- After upgrading React, Redux Toolkit, or React Router
- After any refactor that changes the `<App />` component tree

## Re-run Command

```bash
CI=true npm test -- --testPathPattern=App.perf --verbose
```