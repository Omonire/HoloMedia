import { useEffect, useState } from 'react';
import { api, type Post, type SpotifyTrack } from '@holomedia/shared';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

interface Sound {
  name: string;
  track_id: string | null;
  artist: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  spotify_url: string | null;
  count: number;
  creator: string;
  creator_username: string;
  avatar_color: string;
  posts: Post[];
}

export function Sounds() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [spotifyOk, setSpotifyOk] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ configured: boolean }>('/posts/spotify/config')
      .then((r) => setSpotifyOk(r.configured))
      .catch(() => setSpotifyOk(false));

    api.get<{ sounds: Sound[] }>('/posts/sounds')
      .then((r) => {
        setSounds(r.sounds);
        if (r.sounds.length > 0) {
          selectSound(r.sounds[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function selectSound(s: Sound) {
    setSelected(s.name);
    setPosts([]);
    try {
      const r = await api.get<{ posts: Post[] }>(`/posts/reels?sound=${encodeURIComponent(s.name)}`);
      setPosts(r.posts);
    } catch {
      setPosts([]);
    }
  }

  async function handleSearch(term: string) {
    setQuery(term);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await api.get<{ tracks: SpotifyTrack[] }>(`/posts/spotify/search?q=${encodeURIComponent(term)}`);
      setResults(r.tracks);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function togglePlay(t: SpotifyTrack) {
    if (playing === t.id) {
      setPlaying(null);
    } else {
      setPlaying(t.id);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-title"><h1>Sounds</h1></div>
        <Shimmer type="feed" n={3} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Sounds</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card panel">
          <h2 className="panel-title">Trending Sounds</h2>
          {sounds.length === 0 ? (
            <p className="empty">No trending sounds yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sounds.map((s) => (
                <button
                  key={s.name}
                  onClick={() => void selectSound(s)}
                  className="result"
                  style={{
                    border: 'none',
                    textAlign: 'left',
                    background: selected === s.name ? 'var(--surface-2)' : 'none',
                    padding: 10,
                    width: '100%',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s.artwork_url ? (
                      <img src={s.artwork_url} alt="" style={{ width: 40, height: 40, borderRadius: 6 }} />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: 'var(--gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                        }}
                      >
                        ♪
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {s.name}
                      </strong>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {s.artist || 'Unknown Artist'} &middot; {s.count} {s.count === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card panel">
          <h2 className="panel-title">Search Spotify</h2>
          {spotifyOk ? (
            <div>
              <div className="search-box" style={{ marginBottom: 12 }}>
                <input
                  className="search-input"
                  placeholder="Search songs..."
                  value={query}
                  onChange={(e) => void handleSearch(e.target.value)}
                />
              </div>

              {searching ? (
                <Shimmer type="list" n={3} />
              ) : results.length === 0 ? (
                <p className="empty" style={{ padding: '20px 0' }}>Type song name to search Spotify</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {results.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 8, background: 'var(--surface-2)' }}>
                      <img src={t.artwork_url || ''} alt="" style={{ width: 36, height: 36, borderRadius: 6 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </strong>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t.artist}</span>
                      </div>
                      {t.preview_url && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => togglePlay(t)}
                        >
                          {playing === t.id ? 'Stop' : 'Play'}
                        </button>
                      )}
                      {playing === t.id && t.preview_url && (
                        <audio src={t.preview_url} autoPlay onEnded={() => setPlaying(null)} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="empty" style={{ padding: '20px 0' }}>Spotify integration is currently not configured.</p>
          )}
        </div>
      </div>

      {selected && (
        <>
          <h2 style={{ marginBottom: 14 }}>Posts featuring "{selected}"</h2>
          {posts.length === 0 ? (
            <div className="card empty">No reels found featuring this sound.</div>
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
        </>
      )}
    </div>
  );
}
