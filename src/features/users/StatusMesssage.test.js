import React from "react";
import { render, screen } from "@testing-library/react";
import StatusMessage from "./StatusMessage.jsx";

describe("StatusMessage", () => {
  test("renders loading message", () => {
    render(<StatusMessage loading={true} error={null} empty={false} />);
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  test("renders error string", () => {
    render(<StatusMessage loading={false} error="Server error" empty={false} />);
    expect(screen.getByText("Error: Server error")).toBeInTheDocument();
  });

  test("renders error object with message", () => {
    render(
      <StatusMessage loading={false} error={{ message: "Timeout" }} empty={false} />
    );
    expect(screen.getByText("Error: Timeout")).toBeInTheDocument();
  });

  test("renders empty state", () => {
    render(<StatusMessage loading={false} error={null} empty={true} />);
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  test("renders nothing when all flags are false", () => {
    const { container } = render(
      <StatusMessage loading={false} error={null} empty={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});