/**
 * @file App.perf.test.js
 * @description Micro-benchmark for <App /> render time.
 *
 * This is NOT a correctness test — it measures and records mount
 * duration so we can detect regressions as components grow.
 *
 * Run:  CI=true npm test -- --testPathPattern=App.perf --verbose
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
      users: (state = { entities: [] }, action) => state,
      loading: (state = false, action) => state,
    },
  });

afterEach(cleanup);

describe('App render benchmark', () => {
  const ITERATIONS = 20;
  const MAX_MEAN_MS = 200; // fail if mean exceeds this

  /**
   * Renders <App /> `n` times, returns duration array in ms.
   * Uses performance.now() for sub-millisecond precision.
   */
  const benchmark = (n) => {
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
    const durations = benchmark(ITERATIONS);
    const s = stats(durations);

    // Log results for baseline recording
    console.table({
      iterations: ITERATIONS,
      'mean (ms)': s.mean.toFixed(3),
      'median (ms)': s.median.toFixed(3),
      'min (ms)': s.min.toFixed(3),
      'max (ms)': s.max.toFixed(3),
      'stddev (ms)': s.stddev.toFixed(3),
    });

    expect(s.mean).toBeLessThan(MAX_MEAN_MS);
  });

  test('first render is not more than 5x slower than median', () => {
    const durations = benchmark(ITERATIONS);
    const s = stats(durations);
    const firstRender = durations[0];

    console.log(
      `First render: ${firstRender.toFixed(3)}ms | Median: ${s.median.toFixed(3)}ms`
    );

    // First render is always slower (JIT, module init).
    // 5x is generous — flag anything beyond that.
    expect(firstRender).toBeLessThan(s.median * 5);
  });
});