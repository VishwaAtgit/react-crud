/**
 * @file App.test.js
 * @description Micro-benchmark for <App /> render time.
 *
 * This is NOT a correctness test — it measures and records mount
 * duration so we can detect regressions as components grow.
 *
 * Run:  CI=true npm test -- --testPathPattern=App.test --verbose
 */
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';

const createTestStore = () =>
  configureStore({
    reducer: {
      users: (state = { entities: [] }, _action) => state,
      loading: (state = false, _action) => state,
    },
  });

afterEach(cleanup);

describe('App render benchmark', () => {
  const ITERATIONS = 20;
  const WARMUP = 3;
  const MAX_MEAN_MS = 200; // fail if mean exceeds this

  /**
   * Renders <App /> `n` times, returns duration array in ms.
   * Uses performance.now() for sub-millisecond precision.
   */
  const benchmark = (n, { warmup = 0 } = {}) => {
    // Warmup renders — JIT, module init, etc. Not recorded.
    for (let i = 0; i < warmup; i++) {
      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );
      cleanup();
    }

    const durations = [];
    for (let i = 0; i < n; i++) {
      const start = performance.now();
      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      );
      const end = performance.now();
      durations.push(end - start);
      cleanup();
    }
    return durations;
  };

  /**
   * Compute basic stats from a durations array.
   * @param {number[]} d — array of ms values
   */
  const stats = (d) => {
    const sorted = [...d].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const variance =
      sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / sorted.length;
    const stddev = Math.sqrt(variance);
    return { mean, median, min, max, stddev };
  };

  test(`mean render time stays under ${MAX_MEAN_MS}ms (n=${ITERATIONS})`, () => {
    const durations = benchmark(ITERATIONS, { warmup: WARMUP });
    const s = stats(durations);

    // Log results for baseline recording
    console.table({
      iterations: ITERATIONS,
      warmup: WARMUP,
      'mean (ms)': s.mean.toFixed(3),
      'median (ms)': s.median.toFixed(3),
      'min (ms)': s.min.toFixed(3),
      'max (ms)': s.max.toFixed(3),
      'stddev (ms)': s.stddev.toFixed(3),
    });

    expect(s.mean).toBeLessThan(MAX_MEAN_MS);
  });

  test('first measured render is not more than 5x slower than median', () => {
    // Warmup eliminates JIT / module-init noise from the first sample
    const durations = benchmark(ITERATIONS, { warmup: WARMUP });
    const s = stats(durations);
    const firstRender = durations[0];

    console.log(
      `First render (post-warmup): ${firstRender.toFixed(3)}ms | Median: ${s.median.toFixed(3)}ms | Ratio: ${(firstRender / s.median).toFixed(2)}x`
    );

    // After warmup, first render should be within 5x of median
    expect(firstRender).toBeLessThan(s.median * 5);
  });
});
