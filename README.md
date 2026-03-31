# React CRUD

A React 17 CRUD application using Redux Toolkit, react-router-dom v5, and
Create React App.

## Quick Start

```bash
git clone https://github.com/<your-username>/react-crud.git
cd react-crud
npm install
npm start
```

## Running Tests

```bash
npm test                            # Watch mode
npm test -- --watchAll=false        # Single run (CI)
npm test -- --coverage --watchAll=false  # With coverage report
```

### Contract / Schema Tests

Contract tests verify that the API boundary (request/response shapes) hasn't
changed unexpectedly. They use [Zod](https://zod.dev/) schemas as the source
of truth.

```bash
# Run contract tests only
npx react-scripts test --testPathPattern="contract\.test" --watchAll=false --verbose
```

| File | Purpose |
|------|---------|
| `src/features/users/usersAPI.contract.js` | Zod schema definitions (the "contract") |
| `src/features/users/usersAPI.contract.test.js` | Golden-value & integration tests |
| `src/features/users/__fixtures__/golden-users.json` | Canonical fixture data |

**When to update the contract:**
- The backend API changes its response shape → update schemas + fixtures
- A new field is added → add it to the schema, add a golden test
- A field is removed → remove from schema, update golden fixtures

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push
and PR to `main`:

1. **Lint & Test** — runs all tests across Node 16/18/20
2. **Contract Schema Gate** — runs contract tests as a separate gate that
   must pass before merge

## Documentation

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow, code style, testing guidelines |
| [Onboarding Walk](./.github/ONBOARDING.md) | Step-by-step guide to understanding the codebase |
| [Copilot Onboarding Prompt](./docs/onboarding-walk.md) | Paste into Copilot Chat to orient the AI assistant |

## Project Structure

```
src/
├── app/                    # Redux store
├── features/users/         # User CRUD components, slice, API, and tests
│   ├── __fixtures__/       # Golden test fixtures
│   ├── usersAPI.contract.js      # Zod schema definitions
│   └── usersAPI.contract.test.js # Contract / golden tests
├── utils/                  # Shared utilities (fetchWithRetry, logger)
├── App.js                  # Root component with route definitions
├── setupTests.js           # Jest + jest-dom global setup
└── index.js                # Entry point
```

## Key Conventions

- **Components** use default exports and `.jsx` extension
- **Utilities** use named exports and `.js` extension
- **Tests** are co-located with source files (`Foo.jsx` → `Foo.test.js`)
- **Contract tests** use `*.contract.test.js` naming convention
- **Do not** add `babel.config.js`, `jest.config.js`, or install `babel-jest` manually

## Tech Stack

- React 17
- Redux Toolkit
- react-router-dom v5
- Jest + React Testing Library + jest-dom
- Zod (contract schema validation)
- Create React App (react-scripts)
- GitHub Actions (CI)
