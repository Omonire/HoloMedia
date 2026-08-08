import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type User } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from './Avatar';
import { Shimmer } from './Shimmer';

export function UserSearch({ q, onClose }: { q: string; onClose: () => void }) {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`)
      .then((r) => {
        if (!active) return;
        setResults(r.users.filter((u) => me && u.id !== me.id));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [q, me]);

  function open(u: User) {
    onClose();
    navigate(`/${u.username}`);
  }

  return (
    <div className="search-results card">
      {loading ? (
        <Shimmer type="list" n={3} />
      ) : results.length === 0 ? (
        <div className="empty" style={{ padding: 16 }}>
          No users found.
        </div>
      ) : (
        results.map((u) => (
          <button className="result" key={u.id} onClick={() => open(u)}>
            <Avatar name={u.full_name} color={u.avatar_color} size={36} />
            <div className="res-info">
              <strong>{u.full_name}</strong>
              <span>
                @{u.username} &middot; {u.post_count} posts
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
