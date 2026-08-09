import { useEffect, useState } from 'react';
import { api, type Post } from '@holomedia/shared';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

export function Bookmarks() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ posts: Post[] }>('/posts/bookmarks')
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(p: Post) {
    if (!p.bookmarked) {
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
    } else {
      setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Saved Posts</h1>
      </div>

      {loading ? (
        <Shimmer type="feed" n={3} />
      ) : posts.length === 0 ? (
        <div className="card empty">
          <h3>No bookmarked posts yet</h3>
          Any post you bookmark will appear here for private viewing.
        </div>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onUpdated={handleUpdated}
          />
        ))
      )}
    </div>
  );
}
