export function Shimmer({
  type = 'feed',
  n = 3,
}: {
  type?: 'feed' | 'list' | 'bubbles' | 'reels' | 'users';
  n?: number;
}) {
  const count = Math.max(1, n);
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="shimmer">
      {items.map((i) => {
        switch (type) {
          case 'list':
            return (
              <div className="sk sk-list" key={i}>
                <div className="sk-avatar" />
                <div className="sk-lines">
                  <div className="sk-line w-60" />
                  <div className="sk-line w-40" />
                </div>
              </div>
            );
          case 'bubbles':
            return (
              <div className="sk-bubble-row" style={i % 2 === 1 ? { justifyContent: 'flex-end' } : {}} key={i}>
                <div className="sk-bubble" />
              </div>
            );
          case 'reels':
            return <div className="sk sk-reel" key={i} />;
          case 'users':
            return (
              <div className="sk sk-user" key={i}>
                <div className="sk-avatar lg" />
                <div className="sk-line w-70" />
                <div className="sk-line w-50" />
                <div className="sk-chip center" />
              </div>
            );
          case 'feed':
          default:
            return (
              <div className="sk sk-post" key={i}>
                <div className="sk-row">
                  <div className="sk-avatar" />
                  <div className="sk-lines">
                    <div className="sk-line w-60" />
                    <div className="sk-line w-40" />
                  </div>
                </div>
                <div className="sk-line w-100" />
                <div className="sk-line w-85" />
                <div className="sk-block sk-img" />
                <div className="sk-row sk-actions">
                  <div className="sk-chip" />
                  <div className="sk-chip" />
                  <div className="sk-chip" />
                  <div className="sk-chip" />
                </div>
              </div>
            );
        }
      })}
    </div>
  );
}
