import React from "react";

export default function StatusMessage({ loading, error, empty }) {
  if (loading) {
    return <p className="status-message status-loading">Loading users...</p>;
  }

  if (error) {
    return (
      <p className="status-message status-error">
        Error: {typeof error === "string" ? error : error.message || "Something went wrong"}
      </p>
    );
  }

  if (empty) {
    return <p className="status-message status-empty">No users found.</p>;
  }

  return null;
}