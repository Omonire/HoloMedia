import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type TrendingTag, type User } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { UserSearch } from '../components/UserSearch';

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

export function RightSide() {
  const { user: me } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api
      .get<{ users: User[] }>('/suggestions')
      .then((r) => {
        if (me) setSuggestions(r.users.filter((u) => u.id !== me.id).slice(0, 4));
      })
      .catch(() => {});
    api
      .get<{ trending: TrendingTag[] }>('/posts/trending')
      .then((r) => setTrending(r.trending))
      .catch(() => {});
  }, [me]);

  async function follow(u: User) {
    try {
      const r = await (u.is_following
        ? api.delete<{ user: User }>(`/users/${u.username}/follow`)
        : api.post<{ user: User }>(`/users/${u.username}/follow`));
      setSuggestions((prev) =>
        prev.map((s) => (s.id === u.id ? { ...s, is_following: r.user.is_following, followers_count: r.user.followers_count } : s)),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <aside className="right">
      <div className="right-rail">
        <button className="rail-btn" title="Search HoloMedia">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button className="rail-btn" title="Who to follow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </button>
        <button className="rail-btn" title="Trending now">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9h16" />
            <path d="M4 15h16" />
            <path d="M10 3L8 21" />
            <path d="M16 3l-2 18" />
          </svg>
        </button>
      </div>

      <div className="right-content">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Search HoloMedia"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(e.target.value.length > 0);
            }}
          />
        </div>

        {searchOpen && query.trim() && <UserSearch q={query.trim()} onClose={() => setSearchOpen(false)} />}

        <div className="card panel">
          <h2 className="panel-title">Who to follow</h2>
          {suggestions.length === 0 ? (
            <p className="empty" style={{ padding: 16 }}>
              No suggestions yet.
            </p>
          ) : (
            suggestions.map((u) => (
              <div className="suggestion" key={u.id}>
                <Link to={`/${u.username}`} className="suggestion-user">
                  <Avatar name={u.full_name} color={u.avatar_color} size={40} />
                  <div className="sug-info">
                    <strong>{u.full_name}</strong>
                    <span>@{u.username}</span>
                  </div>
                </Link>
                <button
                  className={`btn btn-sm ${u.is_following ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => void follow(u)}
                >
                  {u.is_following ? CHECK_ICON : FOLLOW_ICON}
                  <span className="btn-label">{u.is_following ? 'Following' : 'Follow'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card panel">
          <h2 className="panel-title">Trending now</h2>
          {trending.length === 0 ? (
            <p className="empty" style={{ padding: 16 }}>
              Nothing trending yet.
            </p>
          ) : (
            trending.slice(0, 5).map((t) => (
              <Link to={`/hashtag/${t.tag}`} className="trend" key={t.tag}>
                <span className="trend-tag">#{t.tag}</span>
                <span className="trend-count">
                  {t.count} {t.count === 1 ? 'post' : 'posts'}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="foot-note">
          <p>HoloMedia &copy; 2026</p>
          <p>Built with React + Flask</p>
        </div>
      </div>
    </aside>
  );
}
