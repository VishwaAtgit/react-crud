/**
 * Contract / Golden tests for the Users API boundary.
 *
 * These tests verify that:
 *   1. Known-good ("golden") payloads still conform to the schema.
 *   2. Payloads with missing or wrong-typed fields are rejected.
 *   3. The real usersAPI functions return data that matches the schema
 *      (using mocked fetch so we stay unit-level).
 */
import {
  UserSchema,
  UserListSchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  DeleteUserResponseSchema,
} from "./usersAPI.contract";

// ─── Golden Fixtures ─────────────────────────────────────────────────
const GOLDEN_USER = { id: 1, name: "Alice", email: "alice@example.com" };

const GOLDEN_USER_LIST = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

const GOLDEN_CREATE_REQUEST = { name: "Charlie", email: "charlie@example.com" };

const GOLDEN_UPDATE_REQUEST = {
  id: 1,
  name: "Alice Updated",
  email: "alice.updated@example.com",
};

const GOLDEN_DELETE_RESPONSE_FULL = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};

const GOLDEN_DELETE_RESPONSE_ID_ONLY = { id: 1 };

// ─── Helpers ─────────────────────────────────────────────────────────
function expectValid(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Schema validation failed:\n${JSON.stringify(result.error.format(), null, 2)}`
    );
  }
}

function expectInvalid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
}

// ─── Schema: UserSchema ──────────────────────────────────────────────

describe("Users API Contract — UserSchema", () => {
  test("golden user passes", () => {
    expectValid(UserSchema, GOLDEN_USER);
  });

  test("rejects user without id", () => {
    expectInvalid(UserSchema, { name: "Alice", email: "a@b.com" });
  });

  test("rejects user with non-integer id", () => {
    expectInvalid(UserSchema, { id: 1.5, name: "Alice", email: "a@b.com" });
  });

  test("rejects user with empty name", () => {
    expectInvalid(UserSchema, { id: 1, name: "", email: "a@b.com" });
  });

  test("rejects user with invalid email", () => {
    expectInvalid(UserSchema, { id: 1, name: "Alice", email: "not-an-email" });
  });

  test("rejects user with missing email", () => {
    expectInvalid(UserSchema, { id: 1, name: "Alice" });
  });

  test("allows extra fields (Zod strips them by default in parse)", () => {
    expectValid(UserSchema, {
      id: 1,
      name: "Alice",
      email: "a@b.com",
      phone: "123",
    });
  });
});

// ─── Schema: UserListSchema ──────────────────────────────────────────

describe("Users API Contract — UserListSchema", () => {
  test("golden user list passes", () => {
    expectValid(UserListSchema, GOLDEN_USER_LIST);
  });

  test("empty array passes", () => {
    expectValid(UserListSchema, []);
  });

  test("rejects if an item is invalid", () => {
    expectInvalid(UserListSchema, [{ id: "bad", name: 123 }]);
  });

  test("rejects non-array", () => {
    expectInvalid(UserListSchema, { users: [] });
  });
});

// ─── Schema: CreateUserRequestSchema ─────────────────────────────────

describe("Users API Contract — CreateUserRequestSchema", () => {
  test("golden create request passes", () => {
    expectValid(CreateUserRequestSchema, GOLDEN_CREATE_REQUEST);
  });

  test("rejects missing name", () => {
    expectInvalid(CreateUserRequestSchema, { email: "a@b.com" });
  });

  test("rejects missing email", () => {
    expectInvalid(CreateUserRequestSchema, { name: "Alice" });
  });

  test("rejects invalid email", () => {
    expectInvalid(CreateUserRequestSchema, {
      name: "Alice",
      email: "bad",
    });
  });
});

// ─── Schema: UpdateUserRequestSchema ─────────────────────────────────

describe("Users API Contract — UpdateUserRequestSchema", () => {
  test("golden update request passes", () => {
    expectValid(UpdateUserRequestSchema, GOLDEN_UPDATE_REQUEST);
  });

  test("rejects missing id", () => {
    expectInvalid(UpdateUserRequestSchema, {
      name: "Alice",
      email: "a@b.com",
    });
  });

  test("rejects negative id", () => {
    expectInvalid(UpdateUserRequestSchema, {
      id: -1,
      name: "Alice",
      email: "a@b.com",
    });
  });
});

// ─── Schema: DeleteUserResponseSchema ────────────────────────────────

describe("Users API Contract — DeleteUserResponseSchema", () => {
  test("golden full-user delete response passes", () => {
    expectValid(DeleteUserResponseSchema, GOLDEN_DELETE_RESPONSE_FULL);
  });

  test("golden id-only delete response passes", () => {
    expectValid(DeleteUserResponseSchema, GOLDEN_DELETE_RESPONSE_ID_ONLY);
  });

  test("rejects empty object", () => {
    expectInvalid(DeleteUserResponseSchema, {});
  });
});

// ─── Integration: mock fetch & validate real API functions ───────────

// Mock logger factory — returns an object with start/success/error
jest.mock("../../utils/logger", () => ({
  logger: () => ({
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock fetchWithRetry to delegate to global.fetch
jest.mock("../../utils/fetchWithRetry", () => ({
  fetchWithRetry: (...args) => global.fetch(...args),
  FetchError: class FetchError extends Error {},
}));

describe("Users API Contract — usersAPI integration", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("getUsers returns data matching UserListSchema", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(GOLDEN_USER_LIST),
      })
    );

    const { getUsers } = require("./usersAPI");
    const users = await getUsers();

    expectValid(UserListSchema, users);
  });
});