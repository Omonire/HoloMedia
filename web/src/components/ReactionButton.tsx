import React, { useState } from 'react';
import { api, REACTIONS, reactionEmoji, type Post } from '@holomedia/shared';

export function ReactionButton({
  post,
  onUpdated,
}: {
  post: Post;
  onUpdated: (p: Post) => void;
}) {
  const [show, setShow] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; char: string }[]>([]);

  function triggerBurst(char: string) {
    const newBursts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      // Random coordinates spreading outwards
      x: (Math.random() - 0.5) * 80,
      y: -(Math.random() * 60 + 20),
      char,
    }));
    setBursts((prev) => [...prev, ...newBursts]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => !newBursts.some((nb) => nb.id === b.id)));
    }, 1000);
  }

  async function react(kind: string) {
    try {
      const emoji = REACTIONS.find((r) => r.kind === kind)?.emoji || '❤️';
      triggerBurst(emoji);
      const r = await api.post<{ post: Post }>(`/posts/${post.id}/like`, { kind });
      onUpdated(r.post);
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function toggle() {
    try {
      if (!post.liked) {
        triggerBurst('❤️');
      }
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
    <div
      className="react-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: 'relative' }}
    >
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

      {/* Render Floating Micro-reactions Particles */}
      {bursts.map((b) => (
        <span
          key={b.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            pointerEvents: 'none',
            zIndex: 100,
            animation: 'burst-fade 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
            '--tx': `${b.x}px`,
            '--ty': `${b.y}px`,
          } as React.CSSProperties}
        >
          {b.char}
        </span>
      ))}

      {show && (
        <div className="reaction-picker">
          {REACTIONS.map((r) => (
            <button key={r.kind} className="reaction" title={r.label} onClick={() => react(r.kind)}>
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes burst-fade {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
