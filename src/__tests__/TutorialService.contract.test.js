/**
 * CONTRACT TEST — Boundary: TutorialService ↔ http-common
 *
 * Validates that TutorialService calls the correct HTTP verbs and paths on
 * the axios instance.  The axios instance is fully mocked so no network
 * traffic occurs — this is a *consumer-driven contract* test.
 *
 * What is verified:
 *   - Correct HTTP method for each operation
 *   - Correct URL path / query string
 *   - Payload forwarding for create / update
 *   - Edge-case guards (null id, empty title)
 *   - Return type is always a Promise
 */

import TutorialService from "../services/TutorialService";
import http from "../http-common";

// Mock the entire http-common module
jest.mock("../http-common");

// Helper: make every mocked method resolve with a standard AxiosResponse shape
beforeEach(() => {
  const axiosResponse = (data = {}, status = 200) =>
    Promise.resolve({ data, status, headers: {}, config: {} });

  http.get.mockImplementation(() => axiosResponse([]));
  http.post.mockImplementation((_url, data) => axiosResponse(data, 201));
  http.put.mockImplementation((_url, data) => axiosResponse(data));
  http.delete.mockImplementation(() => axiosResponse(null, 204));
});

afterEach(() => {
  jest.clearAllMocks();
});

// --------------------------------------------------------------------------
// 1. getAll
// --------------------------------------------------------------------------
describe("getAll()", () => {
  it("calls GET /tutorials", async () => {
    await TutorialService.getAll();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith("/tutorials");
  });

  it("returns a Promise", () => {
    const result = TutorialService.getAll();
    expect(result).toBeInstanceOf(Promise);
  });
});

// --------------------------------------------------------------------------
// 2. get(id)
// --------------------------------------------------------------------------
describe("get(id)", () => {
  it("calls GET /tutorials/:id with numeric id", async () => {
    await TutorialService.get(5);
    expect(http.get).toHaveBeenCalledWith("/tutorials/5");
  });

  it("calls GET /tutorials/:id with string id", async () => {
    await TutorialService.get("42");
    expect(http.get).toHaveBeenCalledWith("/tutorials/42");
  });

  // Edge: null / undefined id
  it("rejects when id is null", async () => {
    await expect(TutorialService.get(null)).rejects.toThrow("id is required");
  });

  it("rejects when id is undefined", async () => {
    await expect(TutorialService.get(undefined)).rejects.toThrow(
      "id is required"
    );
  });
});

// --------------------------------------------------------------------------
// 3. create(data)
// --------------------------------------------------------------------------
describe("create(data)", () => {
  const payload = { title: "React", description: "Guide", published: false };

  it("calls POST /tutorials with the payload", async () => {
    await TutorialService.create(payload);
    expect(http.post).toHaveBeenCalledWith("/tutorials", payload);
  });

  // Edge: empty object
  it("forwards an empty object without throwing", async () => {
    await TutorialService.create({});
    expect(http.post).toHaveBeenCalledWith("/tutorials", {});
  });
});

// --------------------------------------------------------------------------
// 4. update(id, data)
// --------------------------------------------------------------------------
describe("update(id, data)", () => {
  const payload = { title: "Updated", description: "New", published: true };

  it("calls PUT /tutorials/:id with the payload", async () => {
    await TutorialService.update(3, payload);
    expect(http.put).toHaveBeenCalledWith("/tutorials/3", payload);
  });

  it("rejects when id is null", async () => {
    await expect(TutorialService.update(null, payload)).rejects.toThrow(
      "id is required"
    );
  });
});

// --------------------------------------------------------------------------
// 5. remove(id)
// --------------------------------------------------------------------------
describe("remove(id)", () => {
  it("calls DELETE /tutorials/:id", async () => {
    await TutorialService.remove(7);
    expect(http.delete).toHaveBeenCalledWith("/tutorials/7");
  });

  it("rejects when id is null", async () => {
    await expect(TutorialService.remove(null)).rejects.toThrow(
      "id is required"
    );
  });
});

// --------------------------------------------------------------------------
// 6. removeAll()
// --------------------------------------------------------------------------
describe("removeAll()", () => {
  it("calls DELETE /tutorials (no id)", async () => {
    await TutorialService.removeAll();
    expect(http.delete).toHaveBeenCalledWith("/tutorials");
  });
});

// --------------------------------------------------------------------------
// 7. findByTitle(title)
// --------------------------------------------------------------------------
describe("findByTitle(title)", () => {
  it("calls GET /tutorials?title=<encoded title>", async () => {
    await TutorialService.findByTitle("React Basics");
    expect(http.get).toHaveBeenCalledWith(
      "/tutorials?title=React%20Basics"
    );
  });

  // Edge: special characters
  it("encodes special characters in the title", async () => {
    await TutorialService.findByTitle("C++ & Java");
    expect(http.get).toHaveBeenCalledWith(
      "/tutorials?title=C%2B%2B%20%26%20Java"
    );
  });

  // Edge: null / undefined → defaults to empty string
  it("treats null title as empty string", async () => {
    await TutorialService.findByTitle(null);
    expect(http.get).toHaveBeenCalledWith("/tutorials?title=");
  });

  it("treats undefined title as empty string", async () => {
    await TutorialService.findByTitle(undefined);
    expect(http.get).toHaveBeenCalledWith("/tutorials?title=");
  });
});