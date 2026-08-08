import { useState } from 'react';
import { api, REACTIONS, reactionEmoji, type Post } from '@holomedia/shared';

export function ReactionButton({
  post,
  onUpdated,
}: {
  post: Post;
  onUpdated: (p: Post) => void;
}) {
  const [show, setShow] = useState(false);

  async function react(kind: string) {
    try {
      const r = await api.post<{ post: Post }>(`/posts/${post.id}/like`, { kind });
      onUpdated(r.post);
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function toggle() {
    try {
      if (post.liked) {
        const req =
          post.my_reaction === 'like'
            ? api.delete<{ post: Post }>(`/posts/${post.id}/like`)
            : api.post<{ post: Post }>(`/posts/${post.id}/like`, { kind: 'like' });
        onUpdated((await req).post);
      } else {
        const r = await api.post<{ post: Post }>(`/posts/${post.id}/like`, { kind: 'like' });
        onUpdated(r.post);
      }
    } catch {
      /* ignore */
    }
  }

  const myEmoji = post.liked ? reactionEmoji(post.my_reaction) : '';

  return (
    <div className="react-wrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button className={`action ${post.liked ? 'liked' : ''}`} onClick={toggle} title="React">
        {myEmoji ? (
          <span className="my-reaction">{myEmoji}</span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'}
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )}
        <span>{post.likes_count}</span>
      </button>

      {show && (
        <div className="reaction-picker">
          {REACTIONS.map((r) => (
            <button key={r.kind} className="reaction" title={r.label} onClick={() => react(r.kind)}>
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
