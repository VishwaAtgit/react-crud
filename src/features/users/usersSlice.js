import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { logger } from "../../utils/logger";
import { fetchWithRetry } from "../../utils/fetchWithRetry";

// ── Async thunk: fetch users from API ──────────────────────

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, thunkAPI) => {
    const log = logger("fetchUsers");
    log.start();
    try {
      const response = await fetchWithRetry(
        "https://jsonplaceholder.typicode.com/users",
        { timeout: 5000, retries: 2, backoffBase: 500 }
      );
      const data = await response.json();
      log.success({ count: data.length });
      return data;
    } catch (err) {
      log.error(err);
      return thunkAPI.rejectWithValue({
        code: err.code || "UNKNOWN",
        message: err.message,
        attempts: err.attempts || 1,
      });
    }
  }
);

// ...existing code...

const usersSlice = createSlice({
  name: "users",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {
    userAdded(state, action) {
      const log = logger("userAdded");
      log.start({ user: action.payload });
      state.entities.push(action.payload);
      log.success({ id: action.payload.id });
    },
    userUpdated(state, action) {
      const log = logger("userUpdated");
      const { id, name, email } = action.payload;
      log.start({ id });
      const existingUser = state.entities.find((user) => user.id === id);
      if (existingUser) {
        existingUser.name = name;
        existingUser.email = email;
        log.success({ id });
      } else {
        log.error({ message: "User not found", id });
      }
    },
    userDeleted(state, action) {
      const log = logger("userDeleted");
      const { id } = action.payload;
      log.start({ id });
      const existingUser = state.entities.find((user) => user.id === id);
      if (existingUser) {
        state.entities = state.entities.filter((user) => user.id !== id);
        log.success({ removedId: id });
      } else {
        log.error({ message: "User not found", id });
      }
    },
  },
  extraReducers: {
    [fetchUsers.pending]: (state, _action) => {
      state.loading = true;
    },
    [fetchUsers.fulfilled]: (state, action) => {
      state.loading = false;
      state.entities = [...state.entities, ...action.payload];
    },
    [fetchUsers.rejected]: (state, _action) => {
      state.loading = false;
    },
  },
});

export const { userAdded, userUpdated, userDeleted } = usersSlice.actions;

export default usersSlice.reducer;
