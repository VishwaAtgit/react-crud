import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUsers } from "./usersAPI";
import { logger } from "../../utils/logger";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async () => {
    return await getUsers();
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    entities: [],
    loading: false,
    error: null,
  },
  reducers: {
    userAdded(state, action) {
      state.entities.push(action.payload);
    },
    userUpdated(state, action) {
      const { id, name, email } = action.payload;
      const existingUser = state.entities.find((user) => user.id === id);
      if (existingUser) {
        existingUser.name = name;
        existingUser.email = email;
      }
    },
    userDeleted(state, action) {
      const { id } = action.payload;
      state.entities = state.entities.filter((user) => user.id !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        logger.info("fetchUsers: pending");
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
        logger.info("fetchUsers: fulfilled", { count: action.payload.length });
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        logger.error("fetchUsers: rejected", { error: action.error.message });
      });
  },
});

export const { userAdded, userUpdated, userDeleted } = usersSlice.actions;
export default usersSlice.reducer;
