import usersReducer, { userAdded, userUpdated, userDeleted } from './usersSlice';

describe('usersSlice', () => {
  const initialState = {
    entities: [],
    loading: false,
    error: null,
  };

  test('returns initial state when called with undefined', () => {
    const state = usersReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  test('handles unknown action type', () => {
    const state = usersReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });

  test('userAdded adds a user to entities', () => {
    const state = usersReducer(initialState, userAdded({ id: '1', name: 'Alice', email: 'alice@test.com' }));
    expect(state.entities.length).toBe(1);
    expect(state.entities[0].name).toBe('Alice');
    expect(state.entities[0].email).toBe('alice@test.com');
  });

  test('userUpdated modifies an existing user', () => {
    const withUser = {
      ...initialState,
      entities: [{ id: '1', name: 'Alice', email: 'alice@test.com' }],
    };
    const state = usersReducer(withUser, userUpdated({ id: '1', name: 'Bob', email: 'bob@test.com' }));
    const user = state.entities.find((u) => u.id === '1');
    expect(user.name).toBe('Bob');
    expect(user.email).toBe('bob@test.com');
  });

  test('userUpdated does nothing if user not found', () => {
    const withUser = {
      ...initialState,
      entities: [{ id: '1', name: 'Alice', email: 'alice@test.com' }],
    };
    const state = usersReducer(withUser, userUpdated({ id: '999', name: 'Ghost', email: 'ghost@test.com' }));
    expect(state.entities.length).toBe(1);
    expect(state.entities[0].name).toBe('Alice');
  });

  test('userDeleted removes a user from entities', () => {
    const withUser = {
      ...initialState,
      entities: [{ id: '1', name: 'Alice', email: 'alice@test.com' }],
    };
    const state = usersReducer(withUser, userDeleted({ id: '1' }));
    expect(state.entities.length).toBe(0);
  });

  test('userDeleted does nothing if user not found', () => {
    const withUser = {
      ...initialState,
      entities: [{ id: '1', name: 'Alice', email: 'alice@test.com' }],
    };
    const state = usersReducer(withUser, userDeleted({ id: '999' }));
    expect(state.entities.length).toBe(1);
  });
});