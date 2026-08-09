import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Conversation, type User } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';

export function Messages() {
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    api.get<{ conversations: Conversation[] }>('/messages/conversations')
      .then((r) => setConversations(r.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(term: string) {
    setSearch(term);
    const q = term.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      const r = await api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(
        r.users
          .filter((u) => me && u.id !== me.id)
          .filter((u) => !conversations.some((c) => c.user.id === u.id))
      );
    } catch {
      setSearchResults([]);
    }
  }

  function startChat(u: User) {
    navigate(`/messages/${u.username}`);
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Messages</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card panel">
          <h2 className="panel-title">Direct Messages</h2>
          {loading ? (
            <Shimmer type="list" n={3} />
          ) : conversations.length === 0 ? (
            <p className="empty">No conversations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conversations.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => startChat(c.user)}
                  className="result"
                  style={{
                    border: 'none',
                    textAlign: 'left',
                    background: 'none',
                    padding: '8px 10px',
                    width: '100%',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Avatar name={c.user.full_name} color={c.user.avatar_color} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {c.user.full_name}
                      </strong>
                      {c.unread > 0 && (
                        <span
                          style={{
                            background: 'var(--gradient)',
                            color: '#fff',
                            borderRadius: '50%',
                            minWidth: 18,
                            height: 18,
                            fontSize: 10,
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                          }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {c.last_message ? c.last_message.content : 'Start messaging!'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card panel">
          <h2 className="panel-title">Start a Chat</h2>
          <div className="search-box" style={{ marginBottom: 12 }}>
            <input
              className="search-input"
              placeholder="Search users..."
              value={search}
              onChange={(e) => void handleSearch(e.target.value)}
            />
          </div>

          {search.trim() === '' ? (
            <p className="empty" style={{ padding: '20px 0' }}>Search users to start a conversation</p>
          ) : searchResults.length === 0 ? (
            <p className="empty" style={{ padding: '20px 0' }}>No users found matching "{search}"</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startChat(u)}
                  className="result"
                  style={{
                    border: 'none',
                    textAlign: 'left',
                    background: 'var(--surface-2)',
                    padding: 8,
                    width: '100%',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Avatar name={u.full_name} color={u.avatar_color} size={36} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 13 }}>{u.full_name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{u.username}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
