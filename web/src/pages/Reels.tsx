import { useEffect, useState, useRef } from 'react';
import { api, type Post } from '@holomedia/shared';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';

export function Reels() {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
    elements.forEach((el) => observer.observe(el));

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

  if (loading) {
    return (
      <div className="page">
        <div className="page-title"><h1>Reels</h1></div>
        <Shimmer type="feed" n={2} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Reels</h1>
      </div>

      {reels.length === 0 ? (
        <div className="card empty">No reels found.</div>
      ) : (
        <div className="reels-list" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {reels.map((p) => (
            <div
              className="card"
              key={p.id}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, backgroundColor: '#000' }}
            >
              <video
                ref={(el) => {
                  videoRefs.current[p.id] = el;
                }}
                data-id={p.id}
                src={p.video_url || ''}
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
                loop
                muted
                playsInline
                controls
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 20,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar name={p.author.full_name} color={p.author.avatar_color} size={36} />
                    <strong>@{p.author.username}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 14.5, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{p.content}</p>
                  {p.sound && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 13, color: '#c4b5fd' }}>
                      <span>♪ {p.sound} {p.sound_artist && `— ${p.sound_artist}`}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <button
                    className={`icon-btn ${p.liked ? 'liked' : ''}`}
                    onClick={() => void handleReact(p, 'like')}
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: 10 }}
                  >
                    ❤️ <span style={{ fontSize: 12, marginLeft: 4 }}>{p.likes_count}</span>
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => void handleBookmark(p)}
                    style={{ background: 'rgba(255,255,255,0.15)', color: p.bookmarked ? '#ec4899' : '#fff', padding: 10 }}
                  >
                    🔖
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
