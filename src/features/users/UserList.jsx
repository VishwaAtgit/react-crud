import React, { useEffect, useState } from 'react';
import { useLogger } from '../hooks/useLogger';
import { getUsers } from '../../services/userService';
import { increment } from '../../utils/metrics';

function UserList() {
  const { log } = useLogger('UserList');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        log.info('Fetching users');
        const data = await getUsers();
        if (!cancelled) {
          setUsers(data);
          log.info('Users loaded', { count: data.length });
          increment('users_loaded_total', 1);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          log.error('Failed to load users', { error: err.message });
          increment('users_load_error_total', 1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [log]);

  if (loading) {
    return <p>Loading…</p>;
  }
  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}

export default UserList;