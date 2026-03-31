# Onboarding Walk — Copilot Chat Prompt

> **How to use:** Copy the entire fenced block below and paste it into
> GitHub Copilot Chat (or any LLM-based assistant) while you have this
> repository open. It will orient the assistant to the codebase so it can
> answer follow-up questions accurately.

---

```text
You are helping me onboard onto a React CRUD application. Here is everything
you need to know about the project. Use this context to answer any follow-up
questions I ask.

## Project Overview
- React 17 single-page app bootstrapped with Create React App (react-scripts)
- State management: Redux Toolkit
- Routing: react-router-dom v5
- Testing: Jest (via react-scripts) + React Testing Library + jest-dom
- No custom babel.config.js or jest.config.js — CRA handles both

## Folder Structure
src/
├── app/
│   └── store.js               # Redux store configuration
├── features/
│   └── users/                  # User feature module
│       ├── AddUser.jsx         # Create-user form
│       ├── EditUser.jsx        # Edit-user form
│       ├── UserList.jsx        # Main page — fetches & lists users
│       ├── UserRow.jsx         # Single table row (edit / delete)
│       ├── StatusMessage.jsx   # Loading / error / empty banner
│       ├── usersSlice.js       # Redux slice (actions, reducers, thunks)
│       ├── usersAPI.js         # HTTP helpers (getUsers, createUser, …)
│       ├── usersAPI.test.js
│       ├── StatusMesssage.test.js
│       └── UserRow.test.js
├── utils/
│   ├── fetchWithRetry.js       # fetch wrapper with exponential back-off
│   ├── fetchWithRetry.test.js
│   ├── logger.js               # Structured JSON logger
│   └── logger.test.js
├── App.js                      # Root component — defines routes
├── App.test.js                 # Render-performance benchmark
├── setupTests.js               # Imports @testing-library/jest-dom globally
└── index.js                    # ReactDOM entry point

## Routing (defined in App.js)
| Path             | Component   | Purpose            |
|------------------|-------------|--------------------|
| /                | UserList    | List all users     |
| /add-user        | AddUser     | Create a new user  |
| /edit-user/:id   | EditUser    | Edit existing user |

## Component Hierarchy
App
├── UserList
│   ├── StatusMessage   (loading / error / empty)
│   └── UserRow         (one per user — contains Edit link & Delete button)
├── AddUser
└── EditUser

## Key Conventions
- Components use DEFAULT exports  → import Foo from "./Foo"
- Utilities use NAMED exports     → import { bar } from "./bar"
- Component files use .jsx extension; plain JS files use .js
- Test files are co-located: Foo.jsx → Foo.test.js
- src/setupTests.js imports @testing-library/jest-dom (do NOT add it per file)
- Do NOT add babel.config.js, jest.config.js, or install babel-jest manually

## Running the Project
npm start                  # Dev server on localhost:3000
npm test                   # Jest in watch mode (via react-scripts)
npm test -- --watchAll=false  # Single CI run
npx react-scripts test --testPathPattern=<pattern> --verbose  # Run one file

## Common Pitfalls
| Symptom                                    | Cause & Fix                                         |
|--------------------------------------------|-----------------------------------------------------|
| toBeInTheDocument is not a function         | setupTests.js missing import "@testing-library/jest-dom" |
| Element type is invalid: got undefined      | Named import used for a default export (remove {})  |
| babel-jest version conflict                 | Remove manually installed babel-jest; let CRA manage it |
| Cannot use import statement outside module  | Remove custom babel.config.js; CRA already configures Babel |

## Test Reading Order (for orientation)
1. StatusMesssage.test.js  — simple render assertions
2. UserRow.test.js         — table row + router + callback
3. usersAPI.test.js        — mocked HTTP layer
4. fetchWithRetry.test.js  — retry & error logic
5. logger.test.js          — structured log output
6. App.test.js             — full-app render benchmark

Now you are fully oriented. Wait for my questions.
```

---

## After Pasting — Suggested Follow-up Questions

Use these to explore the codebase with Copilot:

1. **"Walk me through how a user gets deleted end-to-end."**
2. **"Which components re-render when the Redux users array changes?"**
3. **"Show me how fetchWithRetry handles a 500 error."**
4. **"What would I need to change to add a View User detail page?"**
5. **"Are there any components missing test coverage?"**
6. **"Explain the App.test.js benchmark — what does it measure?"**