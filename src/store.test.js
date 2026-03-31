import store from './store';

describe('Redux Store', () => {
  test('store is created and exported as default', () => {
    expect(store).toBeDefined();
    expect(store).toHaveProperty('getState');
    expect(store).toHaveProperty('dispatch');
    expect(store).toHaveProperty('subscribe');
  });

  test('store.getState returns an object with users slice', () => {
    const state = store.getState();
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    expect(state).toHaveProperty('users');
  });

  test('users slice has expected initial shape', () => {
    const { users } = store.getState();
    expect(users).toBeDefined();
    // usersSlice typically has entities array or similar
    expect(typeof users).toBe('object');
  });

  test('dispatch unknown action does not crash', () => {
    const before = store.getState();
    store.dispatch({ type: '@@TEST/NOOP' });
    const after = store.getState();
    expect(after).toBeDefined();
    expect(after.users).toEqual(before.users);
  });

  test('subscribe and unsubscribe work correctly', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.dispatch({ type: '@@TEST/PING' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.dispatch({ type: '@@TEST/PING2' });
    expect(listener).toHaveBeenCalledTimes(1); // no extra call
  });
});