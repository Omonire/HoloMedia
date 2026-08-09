import { useEffect, useState } from 'react';
import { api, type Post, type User } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

const FOLLOW_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export function Explore() {
  const { user: me } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get<{ posts: Post[] }>('/posts/')
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    setSearched(true);
    try {
      const r = await api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(term)}`);
      setUsers(r.users.filter((u) => me && u.id !== me.id));
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }

  async function toggleFollow(u: User) {
    try {
      const r = await (u.is_following
        ? api.delete<{ user: User }>(`/users/${u.username}/follow`)
        : api.post<{ user: User }>(`/users/${u.username}/follow`));
      setUsers((prev) =>
        prev.map((s) => (s.id === u.id ? { ...s, is_following: r.user.is_following, followers_count: r.user.followers_count } : s)),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Explore</h1>
      </div>

      <div className="card panel" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        {searched && (
          <div style={{ marginTop: 16 }}>
            <h3>Users</h3>
            {searching ? (
              <Shimmer type="list" n={2} />
            ) : users.length === 0 ? (
              <p className="empty" style={{ padding: '16px 0' }}>No users found matching "{query}"</p>
            ) : (
              users.map((u) => (
                <div className="suggestion" key={u.id} style={{ padding: '10px 0' }}>
                  <div className="suggestion-user">
                    <Avatar name={u.full_name} color={u.avatar_color} size={40} />
                    <div className="sug-info">
                      <strong>{u.full_name}</strong>
                      <span>@{u.username}</span>
                    </div>
                  </div>
                  <button
                    className={`btn btn-sm ${u.is_following ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => void toggleFollow(u)}
                  >
                    {u.is_following ? CHECK_ICON : FOLLOW_ICON}
                    <span className="btn-label" style={{ display: 'inline' }}>{u.is_following ? 'Following' : 'Follow'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <h2>Trending Posts</h2>
      {loading ? (
        <Shimmer type="feed" n={3} />
      ) : posts.length === 0 ? (
        <div className="card empty">No posts found.</div>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onUpdated={(updated) =>
              setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
          />
        ))
      )}
    </div>
  );
}
