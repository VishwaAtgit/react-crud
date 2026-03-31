import React, { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { fetchUsers, userDeleted } from "./usersSlice";
import StatusMessage from "./StatusMessage";
import UserRow from "./UserRow";

export default function UserList() {
  const dispatch = useDispatch();
  const { entities: users, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDelete = useCallback(
    (id) => dispatch(userDeleted({ id })),
    [dispatch]
  );

  const showTable = !loading && !error && users.length > 0;

  return (
    <div className="container mt-4">
      <h2>Users</h2>
      <Link to="/add-user" className="btn btn-success mb-3">
        Add User
      </Link>

      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && users.length === 0}
      />

      {showTable && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
