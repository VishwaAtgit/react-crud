import { getUsers } from "./usersAPI";
import { fetchWithRetry } from "../../utils/fetchWithRetry";

jest.mock("../../utils/fetchWithRetry");
jest.mock("../../utils/logger", () => ({
  logger: () => ({
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

describe("usersAPI", () => {
  afterEach(() => jest.resetAllMocks());

  test("getUsers returns parsed JSON data", async () => {
    const mockUsers = [
      { id: 1, name: "Alice", email: "alice@test.com" },
      { id: 2, name: "Bob", email: "bob@test.com" },
    ];
    fetchWithRetry.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockUsers),
    });

    const result = await getUsers();

    expect(fetchWithRetry).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/users"
    );
    expect(result).toEqual(mockUsers);
  });

  test("getUsers propagates fetch errors", async () => {
    fetchWithRetry.mockRejectedValue(new Error("Network failure"));

    await expect(getUsers()).rejects.toThrow("Network failure");
  });
});