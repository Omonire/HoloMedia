import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { connectSocket, disconnectSocket } from '@holomedia/shared';
import { NotificationsProvider, useNotifications } from '../notifications';
import { Sidebar } from './Sidebar';
import { RightSide } from './RightSide';
import { Toasts } from '../components/Toasts';

function ShellInner() {
  const { start, stop } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    start();
    connectSocket();
    return () => {
      stop();
      disconnectSocket();
    };
  }, [start, stop]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
      <RightSide />
      <Toasts />

      {/* Mobile-only Quick-Action FAB */}
      <button
        className="mobile-fab"
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="Compose New Post"
      >
        <span style={{ fontSize: '22px' }}>✍️</span>
      </button>
    </div>
  );
}

export function AppShell() {
  return (
    <NotificationsProvider>
      <ShellInner />
    </NotificationsProvider>
  );
}
