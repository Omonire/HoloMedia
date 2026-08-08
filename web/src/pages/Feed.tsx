import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadVideo, type Post, type SpotifyTrack } from '@holomedia/shared';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

export function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mode, setMode] = useState<'text' | 'video'>('text');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  const [sound, setSound] = useState('');
  const [soundTrackId, setSoundTrackId] = useState('');
  const [soundArtist, setSoundArtist] = useState('');
  const [soundArtwork, setSoundArtwork] = useState('');
  const [soundPreview, setSoundPreview] = useState('');
  const [soundUrl, setSoundUrl] = useState('');

  const [spotifyOk, setSpotifyOk] = useState(false);
  const [searching, setSearching] = useState(false);
  const [soundResults, setSoundResults] = useState<SpotifyTrack[]>([]);
  const [soundSuggestions, setSoundSuggestions] = useState<string[]>([]);
  const searchTimer = useRef<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    api
      .get<{ posts: Post[] }>('/posts/feed')
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
    api
      .get<{ sounds: { name: string }[] }>('/posts/sounds')
      .then((r) => setSoundSuggestions(r.sounds.map((s) => s.name)))
      .catch(() => {});
    api
      .get<{ configured: boolean }>('/posts/spotify/config')
      .then((r) => setSpotifyOk(r.configured))
      .catch(() => setSpotifyOk(false));
    return () => {
      if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    };
  }, []);

  const onSoundSearch = useCallback((q: string) => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    if (q.trim().length < 2) {
      setSoundResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = window.setTimeout(() => {
      api
        .get<{ tracks: SpotifyTrack[] }>(`/posts/spotify/search?q=${encodeURIComponent(q)}`)
        .then((r) => {
          setSoundResults(r.tracks);
          setSpotifyOk(true);
        })
        .catch(() => {
          setSoundResults([]);
          setSpotifyOk(false);
        })
        .finally(() => setSearching(false));
    }, 350);
  }, []);

  function clearSound() {
    setSound('');
    setSoundTrackId('');
    setSoundArtist('');
    setSoundArtwork('');
    setSoundPreview('');
    setSoundUrl('');
    setSoundResults([]);
  }

  function pickTrack(t: SpotifyTrack) {
    setSound(t.name);
    setSoundTrackId(t.id);
    setSoundArtist(t.artist);
    setSoundArtwork(t.artwork_url ?? '');
    setSoundPreview(t.preview_url ?? '');
    setSoundUrl(t.spotify_url ?? '');
    setSoundResults([]);
  }

  async function publish() {
    const content = draft.trim();
    const video = mode === 'video' ? videoUrl.trim() : '';
    if ((!content && !video) || posting) return;
    if (video && !/^(https?:\/\/|\/api\/uploads\/)/i.test(video)) {
      setError('Video must be a URL (http/https) or an uploaded file.');
      return;
    }
    setPosting(true);
    setError('');
    try {
      const r = await api.post<{ post: Post }>('/posts/', {
        content,
        video_url: video || undefined,
        sound: mode === 'video' ? sound.trim() || undefined : undefined,
        sound_track_id: soundTrackId || undefined,
        sound_artist: soundArtist || undefined,
        sound_artwork: soundArtwork || undefined,
        sound_preview: soundPreview || undefined,
        sound_url: soundUrl || undefined,
      });
      setPosts((prev) => [r.post, ...prev]);
      setDraft('');
      setVideoUrl('');
      clearSound();
    } catch (e) {
      setError((e as Error).message);
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

  const canPost = Boolean((draft.trim() || (mode === 'video' && videoUrl.trim())) && !posting);

  if (!user) return null;

  return (
    <div className="page">
      <div className="composer card">
        <Avatar name={user.full_name} color={user.avatar_color} size={44} />
        <div className="composer-main">
          <div className="mode-switch">
            <button className={`mode-btn${mode === 'text' ? ' on' : ''}`} onClick={() => setMode('text')}>
              <span className="mb-icon">✍️</span>
              <span className="btn-label">Text</span>
            </button>
            <button className={`mode-btn${mode === 'video' ? ' on' : ''}`} onClick={() => setMode('video')}>
              <span className="mb-icon">🎬</span>
              <span className="btn-label">Reel</span>
            </button>
          </div>

          {mode === 'video' && (
            <>
              <div className="video-input-row">
                <input
                  className="input video-input"
                  type="url"
                  placeholder="Paste a video URL (mp4/webm)..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <label className="btn upload-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="btn-label">{uploading ? 'Uploading…' : 'Upload video'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={(e) => void onVideoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              {videoUrl && <video className="video-preview" src={videoUrl} muted controls playsInline />}
              {uploadError && <div className="error-msg">{uploadError}</div>}

              <div className="sound-row">
                <span className="sound-label">♪ Sound</span>
                {sound ? (
                  <div className="sound-selected">
                    {soundArtwork ? (
                      <img src={soundArtwork} alt="" className="ss-art" />
                    ) : (
                      <span className="ss-art ss-art-fallback">♪</span>
                    )}
                    <div className="ss-info">
                      <strong>{sound}</strong>
                      <span>{soundArtist || 'Unknown artist'}</span>
                    </div>
                    <button type="button" className="icon-btn" title="Remove sound" onClick={clearSound}>
                      ✕
                    </button>
                  </div>
                ) : spotifyOk ? (
                  <div className="sound-picker">
                    <input
                      className="input"
                      type="text"
                      placeholder="Search Spotify for a song..."
                      value={sound}
                      onChange={(e) => {
                        setSound(e.target.value);
                        onSoundSearch(e.target.value);
                      }}
                    />
                    {searching ? (
                      <div className="sound-drop hint">Searching Spotify...</div>
                    ) : (
                      soundResults.length > 0 && (
                        <div className="sound-drop">
                          {soundResults.map((t) => (
                            <button type="button" className="sound-result" key={t.id} onClick={() => pickTrack(t)}>
                              <img src={t.artwork_url ?? ''} alt="" className="sr-art" />
                              <div className="sr-info">
                                <strong>{t.name}</strong>
                                <span>{t.artist}</span>
                              </div>
                              {t.explicit && <span className="ex-badge">E</span>}
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <input
                    className="input"
                    type="text"
                    list="sound-options"
                    placeholder="Pick or type a sound..."
                    value={sound}
                    onChange={(e) => setSound(e.target.value)}
                  />
                )}
                <datalist id="sound-options">
                  {soundSuggestions.map((s) => (
                    <option value={s} key={s} />
                  ))}
                </datalist>
              </div>
            </>
          )}

          <textarea
            className="textarea"
            rows={2}
            placeholder={
              mode === 'text'
                ? `What's happening, ${user.full_name.split(' ')[0]}?  Use #hashtags`
                : 'Add a caption for your reel...  Use #hashtags'
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') void publish();
            }}
          />

          {error && <div className="error-msg">{error}</div>}

          <div className="composer-foot">
            <span className="hint">Ctrl + Enter to post</span>
            <button className="btn btn-primary" disabled={!canPost} onClick={() => void publish()}>
              {posting ? 'Posting...' : mode === 'video' ? 'Publish reel' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-title">
        <h1>Home</h1>
      </div>

      {loading ? (
        <Shimmer type="feed" n={4} />
      ) : posts.length === 0 ? (
        <div className="card empty">
          <h3>Your feed is quiet</h3>
          Follow people to see their posts here, or write something yourself.
        </div>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onUpdated={(updated) =>
              setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
            onOpenComments={(p) => navigate(`/p/${p.id}`)}
          />
        ))
      )}
    </div>
  );
}
