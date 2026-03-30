# Contributing to React CRUD

Thank you for your interest in contributing! This guide will help you get started quickly.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 14.x |
| npm | >= 6.x |
| Git | >= 2.x |

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/react-crud.git
cd react-crud

# 2. Install dependencies
npm install

# 3. Start the development server
npm start

# 4. Run tests
npm test
```

---

## Project Structure

```
react-crud/
├── src/
│   ├── app/                  # Redux store configuration
│   ├── features/
│   │   └── users/            # User feature (components, API, slice, tests)
│   │       ├── AddUser.jsx
│   │       ├── EditUser.jsx
│   │       ├── UserList.jsx
│   │       ├── UserRow.jsx
│   │       ├── StatusMessage.jsx
│   │       ├── usersAPI.js
│   │       ├── usersSlice.js
│   │       └── *.test.js
│   ├── utils/                # Shared utilities (logger, fetchWithRetry)
│   ├── App.js                # Root component with routing
│   ├── setupTests.js         # Jest + jest-dom setup
│   └── index.js              # Entry point
├── package.json
└── CONTRIBUTING.md
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/<short-description>
# or
git checkout -b fix/<short-description>
```

### 2. Make Changes

- **Components** go in `src/features/<feature>/`
- **Utilities** go in `src/utils/`
- **Every component or utility must have a co-located test file** (`*.test.js`)

### 3. Run Tests Locally

```bash
# Run all tests
npm test

# Run a specific test file
npx react-scripts test --testPathPattern=StatusMesssage.test.js

# Run with coverage
npx react-scripts test --coverage --watchAll=false
```

### 4. Lint & Format

```bash
# If ESLint is configured
npx eslint src/ --fix
```

### 5. Commit

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user search functionality
fix: resolve named vs default export mismatch in App.js
test: add StatusMessage unit tests
docs: update CONTRIBUTING.md
```

### 6. Push & Open a Pull Request

```bash
git push origin feature/<short-description>
```

Open a PR against `main`. Ensure:
- [ ] All tests pass
- [ ] No console warnings or errors
- [ ] New code has test coverage

---

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| `toBeInTheDocument is not a function` | Ensure `src/setupTests.js` imports `@testing-library/jest-dom` |
| `Element type is invalid: got undefined` | Check default vs named exports — use `import Foo from ...` for `export default` |
| `babel-jest` version conflict | Don't install `babel-jest` manually — `react-scripts` manages it |
| `Cannot use import statement outside a module` | Don't add a custom `babel.config.js` or `jest.config.js` — CRA handles this |

---

## Testing Guidelines

- Use **React Testing Library** (`@testing-library/react`) for component tests
- Use **jest-dom** matchers (`toBeInTheDocument`, `toHaveAttribute`, etc.)
- Wrap components that use routing in `<MemoryRouter>`
- Wrap components that use Redux in `<Provider store={store}>`
- Co-locate test files next to the source: `UserRow.jsx` → `UserRow.test.js`

---

## Code Style

- Functional components with hooks (no class components)
- Default exports for components
- Named exports for utilities and API functions
- JSX files use `.jsx` extension
- Plain JS files use `.js` extension