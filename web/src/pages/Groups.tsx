import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Group } from '@holomedia/shared';
import { Shimmer } from '../components/Shimmer';

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [saving, setSaving] = useState(false);

  const colors = ['#7c3aed', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

  useEffect(() => {
    api.get<{ groups: Group[] }>('/groups/')
      .then((r) => setGroups(r.groups))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleJoin(g: Group) {
    try {
      const r = await (g.is_member
        ? api.delete<{ group: Group }>(`/groups/${g.id}/join`)
        : api.post<{ group: Group }>(`/groups/${g.id}/join`));
      setGroups((prev) => prev.map((x) => (x.id === g.id ? r.group : x)));
    } catch {
      /* ignore */
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || saving) return;
    setSaving(true);
    setError('');
    try {
      const r = await api.post<{ group: Group }>('/groups/', {
        name: n,
        description: description.trim(),
        icon_color: color,
      });
      setGroups((prev) => [r.group, ...prev]);
      setCreateOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-title"><h1>Groups</h1></div>
        <Shimmer type="feed" n={2} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Groups</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(!createOpen)}>
          {createOpen ? 'Close' : 'Create Group'}
        </button>
      </div>

      {createOpen && (
        <form className="card panel" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
          <h2 className="panel-title">Create a new community</h2>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', margin: '14px 0 6px' }}>Group Name</label>
          <input
            className="input"
            placeholder="Name your group..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', margin: '14px 0 6px' }}>Description</label>
          <textarea
            className="textarea"
            placeholder="What is this community about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', margin: '14px 0 6px' }}>Theme Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: color === c ? '3px solid #fff' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="card empty">
          <h3>No groups found</h3>
          Be the first to create a community or search for one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.map((g) => (
            <div className="card" key={g.id} style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: g.icon_color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                {g.name[0].toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/groups/${g.id}`}>
                  <strong style={{ fontSize: 16, display: 'block' }}>{g.name}</strong>
                </Link>
                <p style={{ margin: '4px 0', fontSize: 13.5, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.description || 'A community space.'}
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {g.members_count} {g.members_count === 1 ? 'member' : 'members'} &middot; {g.posts_count} {g.posts_count === 1 ? 'post' : 'posts'}
                </span>
              </div>

              <button
                className={`btn btn-sm ${g.is_member ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => void toggleJoin(g)}
              >
                {g.is_member ? 'Leave' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
