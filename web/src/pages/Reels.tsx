import { useEffect, useState, useRef } from 'react';
import { api, type Post } from '@holomedia/shared';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';

export function Reels() {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentOverlayPost, setCommentOverlayPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  useEffect(() => {
    api.get<{ posts: Post[] }>('/posts/reels')
      .then((r) => {
        setReels(r.posts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = Number((entry.target as HTMLElement).dataset.id);
          const vid = videoRefs.current[id];
          if (!vid) continue;
          if (entry.isIntersecting) {
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        }
      },
      { threshold: 0.6 }
    );

    const elements = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[];
    elements.forEach((el) => {
      const parent = el.closest('.tiktok-reel-item');
      if (parent) observer.observe(parent);
    });

    return () => {
      observer.disconnect();
    };
  }, [reels]);

  async function handleReact(p: Post, kind: string) {
    try {
      const r = await api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind });
      setReels((prev) => prev.map((x) => (x.id === r.post.id ? r.post : x)));
    } catch {
      /* ignore */
    }
  }

  async function handleBookmark(p: Post) {
    try {
      const r = await (p.bookmarked
        ? api.delete<{ post: Post }>(`/posts/${p.id}/bookmark`)
        : api.post<{ post: Post }>(`/posts/${p.id}/bookmark`));
      setReels((prev) => prev.map((x) => (x.id === r.post.id ? r.post : x)));
    } catch {
      /* ignore */
    }
  }

  async function handleRepost(p: Post) {
    try {
      const r = await (p.reposted
        ? api.delete<{ post: Post }>(`/posts/${p.id}/repost`)
        : api.post<{ post: Post }>(`/posts/${p.id}/repost`));
      setReels((prev) => prev.map((x) => (x.id === r.post.id ? r.post : x)));
    } catch {
      /* ignore */
    }
  }

  async function openComments(p: Post) {
    setCommentOverlayPost(p);
    setLoadingComments(true);
    setComments([]);
    try {
      const r = await api.get<{ comments: any[] }>(`/posts/${p.id}/comments`);
      setComments(r.comments);
    } catch {
      /* ignore */
    } finally {
      setLoadingComments(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentOverlayPost || !commentText.trim()) return;
    try {
      const r = await api.post<{ comment: any }>(`/posts/${commentOverlayPost.id}/comments`, {
        content: commentText,
      });
      setComments((prev) => [r.comment, ...prev]);
      setCommentText('');
      // update comments count in reels
      setReels((prev) =>
        prev.map((x) =>
          x.id === commentOverlayPost.id ? { ...x, comments_count: x.comments_count + 1 } : x
        )
      );
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ paddingBottom: 100 }}>
        <div className="page-title">
          <h1>Reels</h1>
        </div>
        <Shimmer type="feed" n={2} />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 100, position: 'relative' }}>
      <div className="page-title" style={{ marginBottom: 12 }}>
        <h1>Reels</h1>
      </div>

      {reels.length === 0 ? (
        <div className="card empty">No reels found.</div>
      ) : (
        <div className="tiktok-reels-container">
          {reels.map((p) => (
            <div
              className="tiktok-reel-item"
              key={p.id}
              data-id={p.id}
            >
              {/* Main Fullscreen Video with Dark Cinematic Background */}
              <div className="tiktok-video-wrapper">
                <video
                  ref={(el) => {
                    videoRefs.current[p.id] = el;
                  }}
                  src={p.video_url || ''}
                  className="tiktok-video"
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* TikTok Bottom-Left Info Overlay */}
              <div className="tiktok-bottom-overlay">
                <div className="tiktok-user-info">
                  <Avatar name={p.author.full_name} color={p.author.avatar_color} size={40} />
                  <div className="tiktok-user-meta">
                    <strong className="tiktok-author">@{p.author.username}</strong>
                    <span className="tiktok-badge-tiktok">PRO</span>
                  </div>
                </div>

                <p className="tiktok-caption">{p.content}</p>

                {/* Animated Scrolling Musical Marquee Ticker */}
                <div className="tiktok-music-marquee">
                  <span className="tiktok-music-icon">🎵</span>
                  <div className="tiktok-marquee-container">
                    <div className="tiktok-marquee-text">
                      {p.sound ? `${p.sound} — ${p.sound_artist || 'Original Audio'}` : 'Original Sound - Merged HoloMedia Beats'}
                      &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp;
                      {p.sound ? `${p.sound} — ${p.sound_artist || 'Original Audio'}` : 'Original Sound - Merged HoloMedia Beats'}
                    </div>
                  </div>
                </div>
              </div>

              {/* TikTok Right-Side Floating Actions */}
              <div className="tiktok-right-actions">
                {/* TikTok style avatar with pink follow button */}
                <div className="tiktok-action-avatar">
                  <Avatar name={p.author.full_name} color={p.author.avatar_color} size={48} />
                  <div className="tiktok-follow-plus">+</div>
                </div>

                {/* Heart Like Action */}
                <button
                  className={`tiktok-action-btn ${p.liked ? 'liked' : ''}`}
                  onClick={() => void handleReact(p, 'like')}
                  title="Like"
                >
                  <div className="tiktok-action-icon-wrap heart-icon">
                    ❤️
                  </div>
                  <span className="tiktok-action-count">{p.likes_count}</span>
                </button>

                {/* Comment Action */}
                <button
                  className="tiktok-action-btn"
                  onClick={() => void openComments(p)}
                  title="Comments"
                >
                  <div className="tiktok-action-icon-wrap comment-icon">
                    💬
                  </div>
                  <span className="tiktok-action-count">{p.comments_count}</span>
                </button>

                {/* Repost Action */}
                <button
                  className={`tiktok-action-btn ${p.reposted ? 'reposted' : ''}`}
                  onClick={() => void handleRepost(p)}
                  title="Repost"
                >
                  <div className="tiktok-action-icon-wrap repost-icon">
                    🔁
                  </div>
                  <span className="tiktok-action-count">{p.reposts_count}</span>
                </button>

                {/* Bookmark Action */}
                <button
                  className={`tiktok-action-btn ${p.bookmarked ? 'bookmarked' : ''}`}
                  onClick={() => void handleBookmark(p)}
                  title="Save Bookmark"
                >
                  <div className="tiktok-action-icon-wrap bookmark-icon">
                    🔖
                  </div>
                  <span className="tiktok-action-count">{p.bookmarks_count}</span>
                </button>

                {/* Rotating Vinyl Disc Component */}
                <div className="tiktok-vinyl-wrapper">
                  <div className="tiktok-vinyl-disc" style={{ background: p.author.avatar_color }}>
                    <div className="tiktok-vinyl-center" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Slide-Up Bottom Comments Overlay Panel */}
      {commentOverlayPost && (
        <div className="tiktok-comments-overlay" onClick={() => setCommentOverlayPost(null)}>
          <div className="tiktok-comments-content" onClick={(e) => e.stopPropagation()}>
            <div className="tiktok-comments-header">
              <h3>Comments ({commentOverlayPost.comments_count})</h3>
              <button className="tiktok-comments-close" onClick={() => setCommentOverlayPost(null)}>×</button>
            </div>

            <div className="tiktok-comments-list">
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Loading comments...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Be the first to comment!</div>
              ) : (
                comments.map((c: any) => (
                  <div className="tiktok-comment-item" key={c.id}>
                    <Avatar name={c.author.full_name} color={c.author.avatar_color} size={32} />
                    <div className="tiktok-comment-body">
                      <strong>@{c.author.username}</strong>
                      <p>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={submitComment} className="tiktok-comments-form">
              <input
                type="text"
                placeholder="Add comment..."
                className="input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
