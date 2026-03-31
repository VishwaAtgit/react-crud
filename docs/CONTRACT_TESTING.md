# Contract Testing Guide

> **doc-with-code policy**: Update this document when adding, modifying, or removing any contract test.

## What Are Contract Tests?

Contract tests verify the **shape and behaviour of boundaries** between subsystems without making real network calls. They catch breaking changes at integration seams earlier than end-to-end tests, and faster than manual QA.

```
┌────────────────────┐    contract    ┌──────────────────┐
│  TutorialService   │──────────────▶│   http-common     │
│  (consumer)        │   (mocked)    │   (axios factory) │
└────────────────────┘               └──────────────────┘
         │                                    │
    contract test                       contract test
    verifies calls                     verifies shape
```

## Boundaries Under Test

| # | Boundary | Test File | What It Validates |
|---|----------|-----------|-------------------|
| 1 | `http-common` instance shape | `src/__tests__/http-common.contract.test.js` | Axios methods exist, baseURL format, default headers, no auth leakage |
| 2 | `TutorialService` → `http-common` | `src/__tests__/TutorialService.contract.test.js` | Correct verb, path, query string, payload forwarding, null-id guards |

## Running Contract Tests

```bash
# All tests
npm test

# Contract tests only (by filename pattern)
npm test -- --testPathPattern="contract"

# With coverage
npm test -- --testPathPattern="contract" --coverage
```

## When to Update Contract Tests

| Trigger | Action |
|---------|--------|
| New service method added | Add corresponding test block verifying verb + path |
| URL path changed | Update path assertions in the service contract test |
| New default header added to `http-common` | Add assertion in `http-common.contract.test.js` |
| Axios replaced with `fetch` or another client | Rewrite `http-common.contract.test.js` to test new shape |
| New service file created | Create a new `<ServiceName>.contract.test.js` following the template |

## Adding a Contract Test for a New Service

### Template

```js
import NewService from "../services/NewService";
import http from "../http-common";

jest.mock("../http-common");

beforeEach(() => {
  http.get.mockResolvedValue({ data: [] });
  http.post.mockResolvedValue({ data: {}, status: 201 });
  http.put.mockResolvedValue({ data: {} });
  http.delete.mockResolvedValue({ data: null, status: 204 });
});

afterEach(() => jest.clearAllMocks());

describe("NewService.getAll()", () => {
  it("calls GET /new-resources", async () => {
    await NewService.getAll();
    expect(http.get).toHaveBeenCalledWith("/new-resources");
  });
});

// ... repeat for each method
```

### Checklist

- [ ] Every public method of the service has at least one happy-path test
- [ ] Null/undefined arguments are tested for methods accepting `id`
- [ ] Special characters are tested for methods accepting free-text input
- [ ] Destructive operations (`remove`, `removeAll`) are tested for correct path
- [ ] Test file name ends in `.contract.test.js`

## Relationship to Other Test Types

| Test Type | Scope | Speed | When |
|-----------|-------|-------|------|
| **Contract** (these) | Boundary shape & call correctness | ⚡ Fast | Every PR |
| **Unit** | Single function logic | ⚡ Fast | Every PR |
| **Integration** | Service + real API | 🐢 Slow | Nightly / staging |
| **E2E** | Browser + API | 🐌 Slowest | Pre-release |

Contract tests **do not replace** integration tests. They complement them by catching contract drift instantly in CI while integration tests validate actual server behaviour.

## Risk Notes

- ⚠️ **Mock drift** — If `http-common` gains interceptors that transform responses, mocked return values in contract tests won't reflect that. Periodically run integration tests to re-validate.
- ⚠️ **False confidence** — A passing contract test only means the *consumer* calls the right shape. The *provider* (backend) may still break the contract. Consider adopting [Pact](https://pact.io/) for two-sided contract verification if the backend is also under your control.
- ⚠️ **Over-mocking** — Avoid asserting internal implementation details (e.g. exact number of times a logger was called). Focus on the boundary: verb, path, payload, return type.