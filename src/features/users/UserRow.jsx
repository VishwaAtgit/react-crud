import React from "react";
import { Link } from "react-router-dom";

/**
 * Micro-optimization: React.memo
 *
 * UserRow is a pure presentational component — its output depends only
 * on `user` and `onDelete`. Wrapping it in React.memo skips re-renders
 * when the parent (UserList) re-renders but these props stay the same.
 *
 * Evidence: see UserRow.perf.test.js
 *   BEFORE: 150 re-renders (50 rows × 3 parent updates)
 *   AFTER:    0 re-renders
 */
const UserRow = React.memo(function UserRow({ user, onDelete }) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        <Link to={`/edit-user/${user.id}`} className="btn btn-primary btn-sm me-2">
          Edit
        </Link>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(user.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
});

export default UserRow;