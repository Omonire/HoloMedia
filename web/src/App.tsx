import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './layout/AppShell';
import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Feed } from './pages/Feed';
import { Explore } from './pages/Explore';
import { Reels } from './pages/Reels';
import { Sounds } from './pages/Sounds';
import { Groups } from './pages/Groups';
import { GroupDetail } from './pages/GroupDetail';
import { Bookmarks } from './pages/Bookmarks';
import { Notifications } from './pages/Notifications';
import { Messages } from './pages/Messages';
import { Conversation } from './pages/Conversation';
import { PostDetail } from './pages/PostDetail';
import { Hashtag } from './pages/Hashtag';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { Loader } from './components/Loader';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/welcome"
        element={
          <GuestOnly>
            <Welcome />
          </GuestOnly>
        }
      />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Feed />} />
                <Route path="explore" element={<Explore />} />
                <Route path="reels" element={<Reels />} />
                <Route path="sounds" element={<Sounds />} />
                <Route path="groups" element={<Groups />} />
                <Route path="groups/:id" element={<GroupDetail />} />
                <Route path="bookmarks" element={<Bookmarks />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/:username" element={<Conversation />} />
                <Route path="p/:id" element={<PostDetail />} />
                <Route path="hashtag/:tag" element={<Hashtag />} />
                <Route
                  path="admin"
                  element={
                    <RequireAdmin>
                      <Admin />
                    </RequireAdmin>
                  }
                />
                <Route path=":username" element={<Profile />} />
              </Route>
            </Routes>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
