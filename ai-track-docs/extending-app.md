# Extending `src/App.test.js`

> A short guide for adding new tests to the root component test file.

---

## File Structure at a Glance

```
describe('<App />')
  ├── renderApp()          ← shared helper, edit here to add providers
  ├── mounts without …     ← smoke
  ├── renders a top-level … ← structure
  └── heading text is …    ← content
```

---

## Adding a New Test

### 1. Pick a category

| Category | Tests for | Example assertion |
|---|---|---|
| Smoke | Component mounts | `expect(() => …).not.toThrow()` |
| Structure | DOM landmarks, roles | `screen.getByRole(…)` |
| Content | Visible text, labels | `expect(el.textContent).toBe(…)` |
| Interaction | Clicks, form input | `fireEvent.click(…)` / `userEvent.type(…)` |

### 2. Use the helper

Always call `renderApp()` instead of `render(<App />)` directly:

```jsx
test('shows a create button', () => {
  renderApp();
  const btn = screen.getByRole('button', { name: /create/i });
  expect(btn).toBeInTheDocument();
});
```

### 3. Keep tests deterministic

- No network calls — mock with `jest.fn()` or `msw`.
- No timers — use `jest.useFakeTimers()` if needed.
- No random data — hard-code expected values.

### 4. Wrapping with providers

If `<App />` starts depending on a Router or Context, update
`renderApp()` once:

```jsx
const renderApp = () =>
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
```

All existing tests continue to work — no other edits needed.

---

## Naming Convention

```
<category>: <what is asserted>
```

Examples:
- `mounts without throwing`
- `renders a top-level heading`
- `displays empty state when no items exist`
- `creates an item on form submit`

---

## Running

```bash
# All tests, verbose
CI=true npm test -- --verbose

# Only this file
CI=true npm test -- --testPathPattern=App.test --verbose

# With coverage
CI=true npm test -- --coverage --collectCoverageFrom='src/App.js'
```

---

## Checklist Before Pushing

- [ ] `CI=true npm test` passes with zero failures
- [ ] New test follows a category (smoke / structure / content / interaction)
- [ ] New test uses `renderApp()` helper
- [ ] No `console.warn` or `act(...)` warnings in output
- [ ] PR description includes the prompt and evidence (see `.copilot-track/crawl/README.md`)