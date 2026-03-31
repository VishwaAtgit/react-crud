/**
 * CONTRACT TEST — Boundary: http-common (axios instance factory)
 *
 * Validates the structural contract that every consumer relies on:
 *   1. Default export is an axios-compatible instance.
 *   2. baseURL is set and is a valid URL string.
 *   3. Default Content-Type header is application/json.
 *   4. Standard HTTP methods (get, post, put, delete) exist.
 *
 * These tests are intentionally *structural* — they verify the shape of the
 * module's public surface so that any refactor that breaks the contract
 * (e.g. switching from axios to fetch) is caught immediately.
 */

import http from "../http-common";

describe("http-common — axios instance contract", () => {
  // -----------------------------------------------------------------------
  // 1. Module shape
  // -----------------------------------------------------------------------
  it("exports a non-null object", () => {
    expect(http).toBeDefined();
    expect(http).not.toBeNull();
  });

  // -----------------------------------------------------------------------
  // 2. Required HTTP methods
  // -----------------------------------------------------------------------
  const requiredMethods = ["get", "post", "put", "delete", "patch"];

  requiredMethods.forEach((method) => {
    it(`exposes .${method}() as a function`, () => {
      expect(typeof http[method]).toBe("function");
    });
  });

  // -----------------------------------------------------------------------
  // 3. baseURL contract
  // -----------------------------------------------------------------------
  it("has a baseURL that ends with /api", () => {
    const baseURL = http.defaults.baseURL;
    expect(baseURL).toBeDefined();
    expect(typeof baseURL).toBe("string");
    expect(baseURL).toMatch(/\/api\/?$/);
  });

  it("baseURL is a valid URL", () => {
    const baseURL = http.defaults.baseURL;
    // URL constructor throws for invalid URLs
    expect(() => new URL(baseURL)).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 4. Default headers contract
  // -----------------------------------------------------------------------
  it("sets Content-type to application/json by default", () => {
    const contentType =
      http.defaults.headers["Content-type"] ||
      http.defaults.headers.common?.["Content-type"] ||
      http.defaults.headers.post?.["Content-Type"];
    expect(contentType).toBe("application/json");
  });

  // -----------------------------------------------------------------------
  // 5. No accidental auth header leak in default config
  // -----------------------------------------------------------------------
  it("does not ship an Authorization header by default", () => {
    const auth =
      http.defaults.headers.Authorization ||
      http.defaults.headers.common?.Authorization;
    expect(auth).toBeUndefined();
  });
});