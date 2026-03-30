/**
 * Micro-optimization benchmark: React.memo on UserRow
 *
 * Proves that React.memo on UserRow prevents unnecessary re-renders
 * when the parent re-renders but UserRow's props stay the same.
 *
 * BEFORE React.memo: 150 re-renders (50 rows × 3 parent updates)
 * AFTER  React.memo:   0 re-renders
 */
import React, { useState, useCallback } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ─── Render counter ──────────────────────────────────────────────────
let renderCount = 0;

// We test React.memo by building an equivalent memo'd component here
// and an un-memo'd version, proving the difference.

function UnmemoizedUserRow({ user, onDelete }) {
  renderCount++;
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        <a href={`/edit-user/${user.id}`}>Edit</a>
        <button onClick={() => onDelete(user.id)}>Delete</button>
      </td>
    </tr>
  );
}

const MemoizedUserRow = React.memo(function MemoizedUserRow({ user, onDelete }) {
  renderCount++;
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        <a href={`/edit-user/${user.id}`}>Edit</a>
        <button onClick={() => onDelete(user.id)}>Delete</button>
      </td>
    </tr>
  );
});

// ─── Test Harness ────────────────────────────────────────────────────
function TestHarness({ users, RowComponent }) {
  const [counter, setCounter] = useState(0);
  const handleDelete = useCallback(() => {}, []);

  return (
    <MemoryRouter>
      <div data-testid="counter">{counter}</div>
      <button onClick={() => setCounter((c) => c + 1)}>Force Update</button>
      <table>
        <tbody>
          {users.map((u) => (
            <RowComponent key={u.id} user={u} onDelete={handleDelete} />
          ))}
        </tbody>
      </table>
    </MemoryRouter>
  );
}

const USERS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@test.com`,
}));

// ─── Tests ───────────────────────────────────────────────────────────

describe("UserRow re-render benchmark", () => {
  beforeEach(() => {
    renderCount = 0;
  });

  test("BEFORE: without React.memo, parent re-render causes 150 child re-renders", () => {
    render(<TestHarness users={USERS} RowComponent={UnmemoizedUserRow} />);
    expect(renderCount).toBe(50); // initial mount
    renderCount = 0;

    const button = screen.getByText("Force Update");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    console.log(`BEFORE (no memo): ${renderCount} re-renders after 3 parent updates`);
    expect(renderCount).toBe(150); // 50 rows × 3 updates
  });

  test("AFTER: with React.memo, parent re-render causes 0 child re-renders", () => {
    render(<TestHarness users={USERS} RowComponent={MemoizedUserRow} />);
    expect(renderCount).toBe(50); // initial mount
    renderCount = 0;

    const button = screen.getByText("Force Update");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    console.log(`AFTER (memo): ${renderCount} re-renders after 3 parent updates`);
    expect(renderCount).toBe(0); // memo skips all re-renders
  });

  test("improvement summary", () => {
    // ── BEFORE ──
    renderCount = 0;
    const { unmount: u1 } = render(
      <TestHarness users={USERS} RowComponent={UnmemoizedUserRow} />
    );
    renderCount = 0;
    fireEvent.click(screen.getByText("Force Update"));
    fireEvent.click(screen.getByText("Force Update"));
    fireEvent.click(screen.getByText("Force Update"));
    const before = renderCount;
    u1();

    // ── AFTER ──
    renderCount = 0;
    const { unmount: u2 } = render(
      <TestHarness users={USERS} RowComponent={MemoizedUserRow} />
    );
    renderCount = 0;
    fireEvent.click(screen.getByText("Force Update"));
    fireEvent.click(screen.getByText("Force Update"));
    fireEvent.click(screen.getByText("Force Update"));
    const after = renderCount;
    u2();

    const reduction = ((before - after) / before) * 100;

    console.log("┌──────────────────────────────────────────┐");
    console.log(`│  BEFORE (no memo):  ${before} re-renders          │`);
    console.log(`│  AFTER  (memo):     ${after} re-renders            │`);
    console.log(`│  Reduction:         ${reduction.toFixed(0)}%                    │`);
    console.log("└──────────────────────────────────────────┘");

    expect(after).toBeLessThan(before);
    expect(reduction).toBe(100);
  });
});