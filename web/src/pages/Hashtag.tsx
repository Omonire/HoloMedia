import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Post } from '@holomedia/shared';
import { Shimmer } from '../components/Shimmer';
import { PostCard } from '../components/PostCard';

export function Hashtag() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    api.get<{ posts: Post[] }>(`/posts/?tag=${encodeURIComponent(tag)}`)
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <div className="page">
      <div className="page-title">
        <h1>#{tag}</h1>
      </div>

      {loading ? (
        <Shimmer type="feed" n={3} />
      ) : posts.length === 0 ? (
        <div className="card empty">
          <h3>No posts found</h3>
          Be the first to post using #{tag}!
        </div>
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
  );
}
