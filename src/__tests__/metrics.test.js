import { increment, gauge, startTimer, snapshot, reset } from '../utils/metrics';

describe('metrics', () => {
  beforeEach(() => reset());

  test('increment() creates and increments a counter', () => {
    increment('test_counter');
    increment('test_counter');
    increment('test_counter', 3);
    const snap = snapshot();
    expect(snap.counters['test_counter']).toBe(5);
  });

  test('increment() supports tags', () => {
    increment('api_calls', 1, { method: 'GET' });
    increment('api_calls', 1, { method: 'POST' });
    const snap = snapshot();
    expect(snap.counters['api_calls{method:GET}']).toBe(1);
    expect(snap.counters['api_calls{method:POST}']).toBe(1);
  });

  test('gauge() sets a value', () => {
    gauge('active_users', 10);
    gauge('active_users', 7);
    const snap = snapshot();
    expect(snap.gauges['active_users']).toBe(7);
  });

  test('startTimer() records elapsed time', () => {
    const stop = startTimer('response_ms');
    const elapsed = stop();
    expect(elapsed).toBeGreaterThanOrEqual(0);
    const snap = snapshot();
    expect(snap.timers['response_ms'].count).toBe(1);
    expect(snap.timers['response_ms'].min).toBeGreaterThanOrEqual(0);
  });

  test('snapshot() returns a complete summary', () => {
    increment('c1');
    gauge('g1', 99);
    const stop = startTimer('t1');
    stop();
    const snap = snapshot();
    expect(snap).toHaveProperty('timestamp');
    expect(snap).toHaveProperty('counters');
    expect(snap).toHaveProperty('gauges');
    expect(snap).toHaveProperty('timers');
  });

  test('reset() clears all data', () => {
    increment('x');
    gauge('y', 1);
    reset();
    const snap = snapshot();
    expect(Object.keys(snap.counters)).toHaveLength(0);
    expect(Object.keys(snap.gauges)).toHaveLength(0);
    expect(Object.keys(snap.timers)).toHaveLength(0);
  });

  test('timer values are capped at 1000', () => {
    for (let i = 0; i < 1500; i++) {
      const stop = startTimer('flood');
      stop();
    }
    const snap = snapshot();
    expect(snap.timers['flood'].count).toBe(1500);
    expect(snap.timers['flood'].capped).toBe(true);
  });
});