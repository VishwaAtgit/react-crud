import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserRow from "./UserRow.jsx";

const renderInTable = (ui) =>
  render(
    <MemoryRouter>
      <table>
        <tbody>{ui}</tbody>
      </table>
    </MemoryRouter>
  );

const mockUser = { id: 1, name: "Alice", email: "alice@test.com" };

describe("UserRow", () => {
  test("renders user name and email", () => {
    renderInTable(<UserRow user={mockUser} onDelete={jest.fn()} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
  });

  test("renders Edit link with correct path", () => {
    renderInTable(<UserRow user={mockUser} onDelete={jest.fn()} />);

    const editLink = screen.getByText("Edit");
    expect(editLink.closest("a")).toHaveAttribute("href", "/edit-user/1");
  });

  test("calls onDelete with user id when Delete is clicked", () => {
    const onDelete = jest.fn();
    renderInTable(<UserRow user={mockUser} onDelete={onDelete} />);

    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});