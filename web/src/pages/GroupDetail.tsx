import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, uploadVideo, type Group, type Post, type User } from '@holomedia/shared';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadGroupAll();
  }, [id]);

  async function loadGroupAll() {
    setLoading(true);
    setError('');
    try {
      const gRes = await api.get<{ group: Group }>(`/groups/${id}`);
      setGroup(gRes.group);

      const pRes = await api.get<{ posts: Post[] }>(`/groups/${id}/posts`);
      setPosts(pRes.posts);

      const mRes = await api.get<{ members: User[] }>(`/groups/${id}/members`);
      setMembers(mRes.members);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleJoin() {
    if (!group) return;
    try {
      const r = await (group.is_member
        ? api.delete<{ group: Group }>(`/groups/${group.id}/join`)
        : api.post<{ group: Group }>(`/groups/${group.id}/join`));
      setGroup(r.group);
      if (r.group.is_member) {
        // Refresh posts & members
        const pRes = await api.get<{ posts: Post[] }>(`/groups/${id}/posts`);
        setPosts(pRes.posts);
        const mRes = await api.get<{ members: User[] }>(`/groups/${id}/members`);
        setMembers(mRes.members);
      }
    } catch {
      /* ignore */
    }
  }

  async function publish() {
    if (!group) return;
    const content = draft.trim();
    if (!content && !imageUrl && !videoUrl) return;
    setPosting(true);
    setPostError('');
    try {
      const r = await api.post<{ post: Post }>(`/groups/${group.id}/posts`, {
        content,
        image_url: imageUrl.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
      });
      setPosts((prev) => [r.post, ...prev]);
      setDraft('');
      setImageUrl('');
      setVideoUrl('');
      setGroup({ ...group, posts_count: group.posts_count + 1 });
    } catch (err) {
      setPostError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  async function onVideoFile(file: File | null) {
    setUploadError('');
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setUploadError('Please choose a video file.');
      return;
    }
    setUploading(true);
    try {
      const r = await uploadVideo<{ url: string }>(file);
      setVideoUrl(r.url);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Shimmer type="feed" n={3} />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page">
        <div className="card empty">
          <h3>Error loading group</h3>
          {error || "Group doesn't exist."}
          <div style={{ marginTop: 14 }}>
            <Link to="/groups" className="btn btn-primary btn-sm">Back to Groups</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title" style={{ borderLeft: `6px solid ${group.icon_color}` }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: group.icon_color,
                color: '#fff',
                fontSize: 16,
                fontWeight: 'bold',
              }}
            >
              {group.name[0].toUpperCase()}
            </span>
            {group.name}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 'normal', color: 'var(--text-dim)' }}>
            {group.description || 'A community space.'}
          </p>
        </div>
        <button
          className={`btn btn-sm ${group.is_member ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => void toggleJoin()}
        >
          {group.is_member ? 'Leave Group' : 'Join Group'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, alignItems: 'start' }}>
        <div className="group-feed">
          {group.is_member ? (
            <div className="card panel" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 10px' }}>Post to community</h3>
              <textarea
                className="textarea"
                placeholder="Share something with the group..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <input
                  className="input"
                  placeholder="Paste Image URL (optional)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                />
                <label className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  {uploading ? 'Uploading…' : 'Upload Video'}
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={(e) => void onVideoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              {videoUrl && <div style={{ fontSize: 12, color: 'var(--ok)', marginTop: 4 }}>✓ Video attached</div>}
              {uploadError && <div className="error-msg" style={{ marginTop: 6 }}>{uploadError}</div>}
              {postError && <div className="error-msg" style={{ marginTop: 6 }}>{postError}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => void publish()}
                  disabled={posting || (!draft.trim() && !imageUrl && !videoUrl)}
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card empty" style={{ marginBottom: 16, padding: '24px 16px' }}>
              Only members can view and post to this community. Click "Join Group" above to participate!
            </div>
          )}

          {group.is_member && (
            <div>
              {posts.length === 0 ? (
                <div className="card empty">No posts in this community yet. Be the first!</div>
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
        </div>

        <div className="group-members card panel" style={{ padding: 14 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Members ({members.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
            {members.map((m) => (
              <Link to={`/${m.username}`} key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={m.full_name} color={m.avatar_color} size={28} />
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {m.full_name}
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{m.username}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
