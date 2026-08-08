import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const FEATURES: { title: string; desc: string; icon: string }[] = [
  {
    title: 'Timeline',
    desc: 'A feed of the people and communities you care about, with rich embeds and reactions.',
    icon: 'M4 5h16M4 12h16M4 19h10',
  },
  {
    title: 'Reels',
    desc: 'Short, looping video stories with sound. Swipe, like, and share in a flash.',
    icon: 'M4 5h10l6 6-6 6H4z',
  },
  {
    title: 'Sounds',
    desc: 'Browse trending audio, preview tracks, and attach the perfect sound to any post.',
    icon: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  },
  {
    title: 'Groups',
    desc: 'Private spaces to hang out with your people — post, chat, and plan together.',
    icon: 'M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM4 20v-1a6 6 0 0 1 12 0v1M16 11a4 4 0 0 0 0-8M20 20v-1a6 6 0 0 0-4-5.6',
  },
  {
    title: 'Direct messages',
    desc: 'One-on-one conversations that stay fast, personal, and private.',
    icon: 'M21 5H3v14h18zM3 7l9 6 9-6',
  },
  {
    title: 'Live notifications',
    desc: 'Realtime alerts for likes, follows, comments, and messages — right as they happen.',
    icon: 'M12 3v3M18.4 5.6l-2.1 2.1M21 12h-3M5.6 18.4l2.1-2.1M3 12h3M18.4 18.4l-2.1-2.1M5.6 5.6l2.1 2.1M12 9a3 3 0 1 1-3 3 3 3 0 0 1 3-3z',
  },
];

const Logo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 6l2.2 3.8L18 11l-3.8 2.2L12 17l-2.2-3.8L6 11l3.8-1.2L12 6z" fill="url(#lg)" />
    <defs>
      <linearGradient id="lg" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

export function Welcome() {
  useSeo({
    title: 'HoloMedia — Share posts, loop reels, drop sounds',
    description:
      'HoloMedia is a social media platform to share posts, loop short-form video reels, drop sounds, and connect in interest-based groups — free forever.',
  });

  return (
    <div className="landing">
      <header className="landing-nav">
        <a href="/welcome" className="landing-logo" aria-label="HoloMedia home">
          <Logo />
          <span>HoloMedia</span>
        </a>
        <nav className="landing-navlinks">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-badge">A fresh take on social</div>
        <h1>
          Where your moments
          <br />
          <span className="gradient-text">go live</span>
        </h1>
        <p className="hero-sub">
          Share posts, loop reels, drop sounds, and hang out in groups — all in one place built for
          people who move fast.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Create your account
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            Log in
          </Link>
        </div>
        <p className="hero-note">Free forever. No email verification needed.</p>
      </section>

      <section className="features">
        <h2>Everything you love, in one feed</h2>
        <p className="features-sub">Six ways to connect — designed to feel effortless.</p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card card" key={f.title}>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-logo">
          <Logo size={22} />
          <span>HoloMedia</span>
        </div>
        <p>© 2026 HoloMedia. Made with care.</p>
      </footer>
    </div>
  );
}
