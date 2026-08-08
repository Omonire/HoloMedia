import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, type NotificationItem } from '@holomedia/shared';

export interface Toast {
  id: string;
  title: string;
  message: string;
  time: string;
  variant: 'info' | 'success' | 'warning';
}

const KIND_MESSAGES: Record<string, { message: string; variant: Toast['variant'] }> = {
  follow: { message: 'started following you', variant: 'info' },
  like: { message: 'liked your post', variant: 'success' },
  comment: { message: 'commented on your post', variant: 'info' },
  message: { message: 'sent you a message', variant: 'info' },
  repost: { message: 'reposted your post', variant: 'success' },
  group: { message: 'invited you to a group', variant: 'warning' },
};

function timeAgoShort(value: string): string {
  const then = new Date(value).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString();
}

interface NotificationsContextValue {
  unread: number;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  start: () => void;
  stop: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  unread: 0,
  toasts: [],
  dismissToast: () => {},
  start: () => {},
  stop: () => {},
});

export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<number | null>(null);
  const seenRef = useRef<Set<number>>(new Set());
  const firstLoadRef = useRef(true);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(() => {
    api
      .get<{ notifications: NotificationItem[]; unread_count: number }>('/notifications/')
      .then((r) => {
        setUnread(r.unread_count);
        for (const n of r.notifications) {
          if (seenRef.current.has(n.id)) continue;
          seenRef.current.add(n.id);
          if (firstLoadRef.current) continue;
          const kind = KIND_MESSAGES[n.kind] ?? KIND_MESSAGES['like'];
          setToasts((prev) =>
            [
              {
                id: `notif-${n.id}`,
                title: n.actor.full_name,
                message: kind.message,
                time: timeAgoShort(n.created_at),
                variant: kind.variant,
              },
              ...prev,
            ].slice(0, 5),
          );
        }
        firstLoadRef.current = false;
      })
      .catch(() => {});
  }, []);

  const start = useCallback(() => {
    if (timerRef.current !== null) return;
    refresh();
    timerRef.current = window.setInterval(refresh, 15000);
  }, [refresh]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setUnread(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return (
    <NotificationsContext.Provider value={{ unread, toasts, dismissToast, start, stop }}>
      {children}
    </NotificationsContext.Provider>
  );
}
