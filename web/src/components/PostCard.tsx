import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, splitContent, timeAgo, type Post } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from './Avatar';
import { ReactionButton } from './ReactionButton';

function Content({ text }: { text: string }) {
  const parts = splitContent(text);
  return (
    <p className="content">
      {parts.map((part, i) =>
        part.isTag ? (
          <Link key={i} to={`/hashtag/${part.text.slice(1)}`} className="tag-link">
            {part.text}
          </Link>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}

export function PostCard({
  post,
  onUpdated,
  onOpenComments,
}: {
  post: Post;
  onUpdated: (p: Post) => void;
  onOpenComments?: (p: Post) => void;
}) {
  const { user } = useAuth();
  const original = post.repost_of ?? post;
  const canEdit = user?.id === post.author.id;
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  function triggerBookmarkBurst() {
    const newBursts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: -(Math.random() * 60 + 20),
    }));
    setBursts((prev) => [...prev, ...newBursts]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => !newBursts.some((nb) => nb.id === b.id)));
    }, 1000);
  }

  async function toggleRepost() {
    const id = original.repost_of?.id ?? original.id;
    try {
      const r = await (original.reposted
        ? api.delete<{ post: Post }>(`/posts/${id}/repost`)
        : api.post<{ post: Post }>(`/posts/${id}/repost`));
      onUpdated(r.post);
    } catch {
      /* ignore */
    }
  }

  async function toggleBookmark() {
    try {
      if (!original.bookmarked) {
        triggerBookmarkBurst();
      }
      const r = await (original.bookmarked
        ? api.delete<{ post: Post }>(`/posts/${original.id}/bookmark`)
        : api.post<{ post: Post }>(`/posts/${original.id}/bookmark`));
      onUpdated(r.post);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className="card post" style={{ position: 'relative' }}>
      {post.is_repost && (
        <div className="repost-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <Link to={`/${post.author.username}`}>@{post.author.username}</Link> reposted
        </div>
      )}

      <header className="post-head">
        <Link to={`/${original.author.username}`}>
          <Avatar name={original.author.full_name} color={original.author.avatar_color} size={44} />
        </Link>
        <div className="post-meta">
          <Link to={`/${original.author.username}`} className="name">
            {original.author.full_name}
          </Link>
          <span className="username">
            @{original.author.username} &middot; {timeAgo(original.created_at)}
          </span>
        </div>
        {canEdit && <span className="you-tag">you</span>}
      </header>

      <Content text={original.content} />

      {original.image_url && (
        <img src={original.image_url} alt="Post image" className="post-img" loading="lazy" />
      )}
      {original.video_url && (
        <video src={original.video_url} className="post-video" controls preload="metadata" playsInline />
      )}
      {original.sound && (
        <Link to="/sounds" className="sound-chip">
          ♪ {original.sound}
          {original.sound_artist && <span className="sc-artist">— {original.sound_artist}</span>}
        </Link>
      )}

      <footer className="post-actions" style={{ position: 'relative' }}>
        <ReactionButton post={original} onUpdated={onUpdated} />
        <button className="action" onClick={() => onOpenComments?.(original)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{original.comments_count}</span>
        </button>

        <div className="action-wrap">
          <button className={`action ${original.reposted ? 'active' : ''}`} onClick={toggleRepost} title="Repost">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>{original.reposts_count}</span>
          </button>
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button className={`action ${original.bookmarked ? 'active' : ''}`} onClick={toggleBookmark} title="Save">
            <svg width="20" height="20" viewBox={original.bookmarked ? '0 0 24 24' : '0 0 24 24'} fill={original.bookmarked ? 'currentColor' : 'none'}
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>{original.bookmarks_count}</span>
          </button>

          {/* Floating Bookmark particles burst */}
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
                animation: 'bookmark-burst-fade 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                '--tx': `${b.x}px`,
                '--ty': `${b.y}px`,
              } as React.CSSProperties}
            >
              🔖
            </span>
          ))}
        </div>

        <Link to={`/p/${original.id}`} className="action link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          </svg>
          <span className="btn-label">View</span>
        </Link>
      </footer>

      <style>{`
        @keyframes bookmark-burst-fade {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.3); opacity: 0; }
        }
      `}</style>
    </article>
  );
}
