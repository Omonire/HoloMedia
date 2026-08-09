import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type NotificationItem } from '@holomedia/shared';
import { useNotifications } from '../notifications';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';

export function Notifications() {
  const { clearUnread } = useNotifications();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ notifications: NotificationItem[]; unread_count: number }>('/notifications/')
      .then((r) => {
        setItems(r.notifications);
        clearUnread();
        if (r.notifications.some((n) => !n.read)) {
          markAllRead();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clearUnread]);

  async function markAllRead() {
    try {
      await api.post('/notifications/read');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  }

  function getNotificationText(n: NotificationItem): string {
    const who = `@${n.actor.username}`;
    switch (n.kind) {
      case 'follow': return `${who} started following you`;
      case 'like': return `${who} liked your post`;
      case 'comment': return `${who} commented on your post`;
      case 'message': return `${who} sent you a message`;
      case 'repost': return `${who} reposted your post`;
      case 'group': return `${who} joined your group`;
      default: return `${who} interacted with you`;
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Notifications</h1>
      </div>

      {loading ? (
        <Shimmer type="list" n={4} />
      ) : items.length === 0 ? (
        <div className="card empty">
          <h3>All caught up!</h3>
          Any likes, comments, follows, or messages will appear here in real-time.
        </div>
      ) : (
        <div className="card panel" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 10px',
                  borderBottom: '1px solid var(--border)',
                  background: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.08)',
                  borderRadius: 10,
                }}
              >
                <Link to={`/${n.actor.username}`}>
                  <Avatar name={n.actor.full_name} color={n.actor.avatar_color} size={38} />
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5 }}>{getNotificationText(n)}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>

                {n.post_id && (
                  <Link to={`/p/${n.post_id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                    View Post
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
