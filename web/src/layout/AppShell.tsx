import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { connectSocket, disconnectSocket } from '@holomedia/shared';
import { NotificationsProvider, useNotifications } from '../notifications';
import { Sidebar } from './Sidebar';
import { RightSide } from './RightSide';
import { Toasts } from '../components/Toasts';

function ShellInner() {
  const { start, stop } = useNotifications();

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
