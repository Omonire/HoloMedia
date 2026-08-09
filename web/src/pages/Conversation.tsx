import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Message, type User } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';

export function Conversation() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();

  const [other, setOther] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) return;
    loadConversation();

    // Poll for new messages every 6 seconds as a robust fallback
    const interval = setInterval(() => {
      refreshConversation();
    }, 6000);

    return () => clearInterval(interval);
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversation() {
    setLoading(true);
    setError('');
    try {
      const r = await api.get<{ user: User; messages: Message[] }>(`/messages/${username}`);
      setOther(r.user);
      setMessages(r.messages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshConversation() {
    if (!username) return;
    try {
      const r = await api.get<{ user: User; messages: Message[] }>(`/messages/${username}`);
      setMessages(r.messages);
    } catch {
      /* ignore */
    }
  }

  function scrollToBottom() {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !other) return;

    try {
      const r = await api.post<{ message: Message }>(`/messages/${username}`, { content });
      setMessages((prev) => [...prev, r.message]);
      setText('');
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Shimmer type="feed" n={3} />
      </div>
    );
  }

  if (error || !other) {
    return (
      <div className="page">
        <div className="card empty">
          <h3>Error loading chat</h3>
          {error || "Conversation not found."}
          <div style={{ marginTop: 14 }}>
            <Link to="/messages" className="btn btn-primary btn-sm">Back to Messages</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', marginBottom: 0 }}>
        <Link to="/messages" style={{ fontSize: 18, color: 'var(--text-dim)' }}>←</Link>
        <Avatar name={other.full_name} color={other.avatar_color} size={38} />
        <div>
          <h1 style={{ fontSize: 16, margin: 0 }}>{other.full_name}</h1>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{other.username}</span>
        </div>
      </div>

      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'rgba(0,0,0,0.1)',
          borderRadius: 12,
          margin: '12px 0',
        }}
      >
        {messages.length === 0 ? (
          <p className="empty">No messages yet. Send a message to start chatting!</p>
        ) : (
          messages.map((m) => {
            const isMine = m.mine || m.sender_id === me?.id;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  background: isMine ? 'var(--gradient)' : 'var(--surface-2)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}
              >
                <p style={{ margin: 0, fontSize: 14.5 }}>{m.content}</p>
                <span style={{ fontSize: 10, opacity: 0.7, float: 'right', marginTop: 4 }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 10, paddingBottom: 16 }}>
        <input
          className="input"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
          Send
        </button>
      </form>
    </div>
  );
}
