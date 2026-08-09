import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type User, type Post } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: me, updateProfile } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [followers, setFollowers] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editColor, setEditColor] = useState('#7c3aed');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const colors = ['#7c3aed', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    if (!username) return;
    loadProfileAll();
  }, [username]);

  async function loadProfileAll() {
    setLoading(true);
    setError('');
    setTab('posts');
    try {
      const uRes = await api.get<{ user: User }>(`/users/${username}`);
      setUser(uRes.user);

      const pRes = await api.get<{ posts: Post[] }>(`/users/${username}/posts`);
      setPosts(pRes.posts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isSelf = me?.id === user?.id;

  async function toggleFollow() {
    if (!user || isSelf) return;
    try {
      const r = await (user.is_following
        ? api.delete<{ user: User }>(`/users/${user.username}/follow`)
        : api.post<{ user: User }>(`/users/${user.username}/follow`));
      setUser(r.user);
    } catch {
      /* ignore */
    }
  }

  async function loadList(type: 'followers' | 'following') {
    setListLoading(true);
    try {
      const r = await api.get<{ users: User[] }>(`/users/${username}/${type}`);
      if (type === 'followers') setFollowers(r.users);
      else setFollowingList(r.users);
    } catch {
      /* ignore */
    } finally {
      setListLoading(false);
    }
  }

  function handleTabChange(newTab: 'posts' | 'followers' | 'following') {
    setTab(newTab);
    if (newTab === 'followers' && followers.length === 0) loadList('followers');
    if (newTab === 'following' && followingList.length === 0) loadList('following');
  }

  function openEdit() {
    if (!user) return;
    setEditName(user.full_name);
    setEditBio(user.bio || '');
    setEditColor(user.avatar_color);
    setEditOpen(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const r = await updateProfile({
        full_name: editName,
        bio: editBio,
        avatar_color: editColor,
      });
      setUser(r);
      setEditOpen(false);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Shimmer type="feed" n={2} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page">
        <div className="card empty">
          <h3>Profile not found</h3>
          {error || "This user doesn't exist on HoloMedia."}
          <div style={{ marginTop: 14 }}>
            <Link to="/" className="btn btn-primary btn-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card panel" style={{ display: 'flex', gap: 20, padding: 24, marginBottom: 20, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={user.full_name} color={user.avatar_color} size={80} />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: user.avatar_color,
              border: '3px solid var(--surface)',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>{user.full_name}</h1>
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>@{user.username}</span>
            </div>

            {isSelf ? (
              <button className="btn btn-ghost btn-sm" onClick={openEdit}>
                Edit Profile
              </button>
            ) : (
              <button
                className={`btn btn-sm ${user.is_following ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => void toggleFollow()}
              >
                {user.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <p style={{ margin: '12px 0 16px', fontSize: 14.5, color: 'var(--text)' }}>
            {user.bio || 'No bio yet.'}
          </p>

          <div style={{ display: 'flex', gap: 20, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button
              onClick={() => handleTabChange('posts')}
              style={{ background: 'none', border: 'none', color: tab === 'posts' ? 'var(--accent)' : 'var(--text-dim)', fontWeight: 600, cursor: 'pointer' }}
            >
              {posts.length} Posts
            </button>
            <button
              onClick={() => handleTabChange('followers')}
              style={{ background: 'none', border: 'none', color: tab === 'followers' ? 'var(--accent)' : 'var(--text-dim)', fontWeight: 600, cursor: 'pointer' }}
            >
              {user.followers_count} Followers
            </button>
            <button
              onClick={() => handleTabChange('following')}
              style={{ background: 'none', border: 'none', color: tab === 'following' ? 'var(--accent)' : 'var(--text-dim)', fontWeight: 600, cursor: 'pointer' }}
            >
              {user.following_count} Following
            </button>
          </div>
        </div>
      </div>

      {editOpen && (
        <form onSubmit={(e) => void saveEdit(e)} className="card panel" style={{ marginBottom: 20 }}>
          <h2 className="panel-title">Edit your profile</h2>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', margin: '14px 0 6px' }}>Full Name</label>
          <input
            className="input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            maxLength={50}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', margin: '14px 0 6px' }}>Bio</label>
          <textarea
            className="textarea"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            maxLength={160}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', margin: '14px 0 6px' }}>Avatar Theme Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setEditColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: editColor === c ? '3px solid #fff' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {saveError && <div className="error-msg">{saveError}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {tab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div className="card empty">
              <h3>No posts yet</h3>
              {isSelf ? 'Share your first post!' : `@${user.username} hasn't posted anything.`}
            </div>
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
      )}

      {tab === 'followers' && (
        <div className="card panel">
          <h2 className="panel-title">Followers</h2>
          {listLoading ? (
            <Shimmer type="list" n={3} />
          ) : followers.length === 0 ? (
            <p className="empty">No followers yet.</p>
          ) : (
            followers.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Link to={`/${f.username}`}>
                  <Avatar name={f.full_name} color={f.avatar_color} size={36} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/${f.username}`} style={{ fontWeight: 600, display: 'block', fontSize: 14 }}>
                    {f.full_name}
                  </Link>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{f.username}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'following' && (
        <div className="card panel">
          <h2 className="panel-title">Following</h2>
          {listLoading ? (
            <Shimmer type="list" n={3} />
          ) : followingList.length === 0 ? (
            <p className="empty">Not following anyone yet.</p>
          ) : (
            followingList.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Link to={`/${f.username}`}>
                  <Avatar name={f.full_name} color={f.avatar_color} size={36} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/${f.username}`} style={{ fontWeight: 600, display: 'block', fontSize: 14 }}>
                    {f.full_name}
                  </Link>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{f.username}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
