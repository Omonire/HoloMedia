import { useEffect, useState } from 'react';
import { api } from '@holomedia/shared';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_color: string;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
  post_count: number;
  followers_count: number;
}

interface AdminPost {
  id: number;
  content: string;
  image_url: string | null;
  video_url: string | null;
  sound: string | null;
  created_at: string;
  author: AdminUser;
  likes_count: number;
  comments_count: number;
}

interface AdminComment {
  id: number;
  content: string;
  post_id: number;
  created_at: string;
  author: AdminUser;
}

interface AdminGroup {
  id: number;
  name: string;
  description: string;
  icon_color: string;
  created_at: string;
  members_count: number;
  posts_count: number;
  creator: AdminUser;
}

export function Admin() {
  const [tab, setTab] = useState<'dashboard' | 'users' | 'posts' | 'comments' | 'groups' | 'settings'>('dashboard');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  const [userQ, setUserQ] = useState('');
  const [postQ, setPostQ] = useState('');
  const [commentQ, setCommentQ] = useState('');

  useEffect(() => {
    loadStats();
    loadUsers();
    loadGroups();
    loadSettings();
  }, []);

  function loadStats() {
    api.get<{ stats: Record<string, number> }>('/admin/stats')
      .then((r) => setStats(r.stats))
      .catch((e) => setError(e.message));
  }

  async function loadUsers(q = '') {
    setLoading(true);
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    try {
      const r = await api.get<{ users: AdminUser[] }>(`/admin/users${query}`);
      setUsers(r.users);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(u: AdminUser) {
    try {
      await api.patch<{ user: AdminUser }>(`/admin/users/${u.id}`, { is_admin: !u.is_admin });
      loadUsers(userQ);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleSuspend(u: AdminUser) {
    try {
      await api.patch<{ user: AdminUser }>(`/admin/users/${u.id}`, { is_suspended: !u.is_suspended });
      loadUsers(userQ);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteUser(u: AdminUser) {
    if (!confirm(`Delete @${u.username} and all their content?`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      loadUsers(userQ);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadPosts(q = '') {
    setLoading(true);
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    try {
      const r = await api.get<{ posts: AdminPost[] }>(`/admin/posts${query}`);
      setPosts(r.posts);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(p: AdminPost) {
    if (!confirm(`Delete post #${p.id}?`)) return;
    try {
      await api.delete(`/admin/posts/${p.id}`);
      loadPosts(postQ);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadComments(q = '') {
    setLoading(true);
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    try {
      const r = await api.get<{ comments: AdminComment[] }>(`/admin/comments${query}`);
      setComments(r.comments);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(c: AdminComment) {
    if (!confirm(`Delete comment #${c.id}?`)) return;
    try {
      await api.delete(`/admin/comments/${c.id}`);
      loadComments(commentQ);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadGroups() {
    try {
      const r = await api.get<{ groups: AdminGroup[] }>('/admin/groups');
      setGroups(r.groups);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteGroup(g: AdminGroup) {
    if (!confirm(`Delete group "${g.name}"?`)) return;
    try {
      await api.delete(`/admin/groups/${g.id}`);
      loadGroups();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadSettings() {
    try {
      const r = await api.get<{ settings: Record<string, string> }>('/admin/settings');
      setSettings(r.settings);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveSettings() {
    try {
      const r = await api.patch<{ settings: Record<string, string> }>('/admin/settings', { settings });
      setSettings(r.settings);
      alert('Settings saved!');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function handleTabChange(t: typeof tab) {
    setTab(t);
    setError('');
    if (t === 'posts') loadPosts();
    if (t === 'comments') loadComments();
    if (t === 'groups') loadGroups();
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Admin Control Panel</h1>
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20 }}>
        {(['dashboard', 'users', 'posts', 'comments', 'groups', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {tab === 'dashboard' && stats && (
        <div className="card panel">
          <h2 className="panel-title">System Metrics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: 20 }}>{v}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card panel">
          <h2 className="panel-title">Manage Users</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadUsers(userQ);
            }}
            className="search-box"
            style={{ marginBottom: 16 }}
          >
            <input
              className="search-input"
              placeholder="Search user by name/username/email..."
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>

          {loading ? (
            <Shimmer type="list" n={3} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={u.full_name} color={u.avatar_color} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{u.full_name}</strong>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>
                      @{u.username} &middot; {u.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => void toggleAdmin(u)}>
                      {u.is_admin ? 'Demote' : 'Make Admin'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => void toggleSuspend(u)}>
                      {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => void deleteUser(u)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="card panel">
          <h2 className="panel-title">Manage Posts</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadPosts(postQ);
            }}
            className="search-box"
            style={{ marginBottom: 16 }}
          >
            <input
              className="search-input"
              placeholder="Search post content..."
              value={postQ}
              onChange={(e) => setPostQ(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>

          {loading ? (
            <Shimmer type="list" n={3} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.map((p) => (
                <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>@{p.author.username}</strong>
                    <button className="btn btn-danger btn-sm" onClick={() => void deletePost(p)}>Delete</button>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>{p.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'comments' && (
        <div className="card panel">
          <h2 className="panel-title">Manage Comments</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadComments(commentQ);
            }}
            className="search-box"
            style={{ marginBottom: 16 }}
          >
            <input
              className="search-input"
              placeholder="Search comment content..."
              value={commentQ}
              onChange={(e) => setCommentQ(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>

          {loading ? (
            <Shimmer type="list" n={3} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map((c) => (
                <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>@{c.author.username}</strong>
                    <button className="btn btn-danger btn-sm" onClick={() => void deleteComment(c)}>Delete</button>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'groups' && (
        <div className="card panel">
          <h2 className="panel-title">Manage Communities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{g.name}</strong>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>{g.description || 'No description'}</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => void deleteGroup(g)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && settings && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings();
          }}
          className="card panel"
        >
          <h2 className="panel-title">System Settings</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <input
              type="checkbox"
              id="maintenance"
              checked={settings.maintenance_mode === 'true'}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked ? 'true' : 'false' })}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="maintenance" style={{ fontWeight: 600 }}>Enable Maintenance Mode</label>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">Save Settings</button>
        </form>
      )}
    </div>
  );
}
