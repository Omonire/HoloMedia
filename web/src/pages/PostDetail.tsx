import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, type Post, type Comment } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [commentDraft, setCommentDraft] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadPostAll();
  }, [id]);

  async function loadPostAll() {
    setLoading(true);
    setError('');
    try {
      const pRes = await api.get<{ post: Post }>(`/posts/${id}`);
      setPost(pRes.post);

      const cRes = await api.get<{ comments: Comment[] }>(`/posts/${id}/comments`);
      setComments(cRes.comments);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost() {
    if (!post) return;
    if (!confirm('Delete this post permanently?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const content = commentDraft.trim();
    if (!content || commenting || !post) return;
    setCommenting(true);
    try {
      const r = await api.post<{ comment: Comment; post: Post }>(`/posts/${post.id}/comments`, { content });
      setComments((prev) => [...prev, r.comment]);
      setPost(r.post);
      setCommentDraft('');
    } catch {
      /* ignore */
    } finally {
      setCommenting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Shimmer type="feed" n={2} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page">
        <div className="card empty">
          <h3>Post not found</h3>
          {error || 'It may have been deleted.'}
          <div style={{ marginTop: 14 }}>
            <Link to="/" className="btn btn-primary btn-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const isMine = me?.id === post.author.id;

  return (
    <div className="page">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Post Details</h1>
        {isMine && (
          <button className="btn btn-danger btn-sm" onClick={() => void deletePost()}>
            Delete Post
          </button>
        )}
      </div>

      <PostCard
        post={post}
        onUpdated={(updated) => setPost(updated)}
      />

      <div className="card panel" style={{ marginTop: 20 }}>
        <h3 style={{ margin: '0 0 16px' }}>Comments ({comments.length})</h3>

        {comments.length === 0 ? (
          <p className="empty" style={{ padding: '16px 0' }}>No comments yet. Start the conversation!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar name={c.author.full_name} color={c.author.avatar_color} size={32} />
                <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13 }}>{c.author.full_name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{c.author.username}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)' }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Write a comment..."
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={commenting}>
            {commenting ? 'Posting...' : 'Comment'}
          </button>
        </form>
      </div>
    </div>
  );
}
