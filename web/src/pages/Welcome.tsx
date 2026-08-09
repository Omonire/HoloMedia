import React from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const FEATURES: { title: string; desc: string; icon: string; color: string }[] = [
  {
    title: 'Real-time Feed (X Style)',
    desc: 'Instant updates, hot takes, reposts, and trending hashtags. Fuses the speed of X/Twitter with vibrant, interactive multimedia comments.',
    icon: 'M4 5h16M4 12h16M4 19h10',
    color: '#3b82f6',
  },
  {
    title: 'Interactive Reels (TikTok Style)',
    desc: 'Pure vertical immersive fullscreen looping video feed with custom right-hand sidebar buttons, scrolling sound marquees, and spinning vinyl discs.',
    icon: 'M4 5h10l6 6-6 6H4z',
    color: '#ec4899',
  },
  {
    title: 'Aesthetic Visuals (Instagram Style)',
    desc: 'High-fidelity glassmorphic cards, ambient shadow glows, physical micro-reactions particle bursts, and customizable profiles with custom colors.',
    icon: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    color: '#a855f7',
  },
  {
    title: 'Interest Groups (Facebook Style)',
    desc: 'Build circles and dedicated channels to coordinate, discuss, and plan with like-minded friends in complete privacy.',
    icon: 'M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM4 20v-1a6 6 0 0 1 12 0v1M16 11a4 4 0 0 0 0-8M20 20v-1a6 6 0 0 0-4-5.6',
    color: '#10b981',
  },
  {
    title: 'Direct Messages & Audio Chats',
    desc: 'Ultra-fast fallback polling conversational threads. Keep your friends close with instant text messaging.',
    icon: 'M21 5H3v14h18zM3 7l9 6 9-6',
    color: '#06b6d4',
  },
  {
    title: 'Live Real-time Alerts',
    desc: 'Instantly notify users upon likes, reposts, comments, or follow counts so you never miss a beat of your growing social graph.',
    icon: 'M12 3v3M18.4 5.6l-2.1 2.1M21 12h-3M5.6 18.4l2.1-2.1M3 12h3M18.4 18.4l-2.1-2.1M5.6 5.6l2.1 2.1M12 9a3 3 0 1 1-3 3 3 3 0 0 1 3-3z',
    color: '#f59e0b',
  },
];

const Logo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.5))' }}>
    <path d="M12 6l2.2 3.8L18 11l-3.8 2.2L12 17l-2.2-3.8L6 11l3.8-1.2L12 6z" fill="url(#lg-welcome)" />
    <defs>
      <linearGradient id="lg-welcome" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

export function Welcome() {
  useSeo({
    title: 'HoloMedia — The Ultimate Merged Social Hub (X, TikTok, Instagram, Facebook)',
    description:
      'HoloMedia fuses the rapid conversation of X, visual fidelity of Instagram, community circle building of Facebook, and addictive viral loop of TikTok into a single premium social super-app.',
  });

  return (
    <div className="landing" style={landingStyle}>
      {/* Animated Glowing Ambient Orbs */}
      <div style={orb1Style} />
      <div style={orb2Style} />

      {/* Floating particles */}
      <div className="particle" style={{ width: 10, height: 10, left: '10%', top: '20%', animationDelay: '0s' }} />
      <div className="particle" style={{ width: 14, height: 14, left: '80%', top: '15%', animationDelay: '1.2s' }} />
      <div className="particle" style={{ width: 8, height: 8, left: '30%', top: '65%', animationDelay: '2s' }} />
      <div className="particle" style={{ width: 12, height: 12, left: '70%', top: '80%', animationDelay: '0.8s' }} />

      <header className="landing-nav" style={{ position: 'relative', zIndex: 10 }}>
        <a href="/welcome" className="landing-logo" aria-label="HoloMedia home" style={{ transform: 'scale(1.05)', transition: 'transform 0.2s' }}>
          <Logo />
          <span style={{ fontWeight: 900, fontSize: '21px', letterSpacing: '-0.5px' }}>
            Holo<span className="gradient-text">Media</span>
          </span>
        </a>
        <nav className="landing-navlinks">
          <Link to="/login" style={loginLinkStyle}>Log in</Link>
          <Link to="/register" className="btn btn-primary btn-sm" style={ctaButtonNavStyle}>
            Get started
          </Link>
        </nav>
      </header>

      <section className="hero" style={{ position: 'relative', zIndex: 10, padding: '100px 24px 80px' }}>
        <div className="hero-badge" style={badgeStyle}>
          🌌 The Ultimate Merged Social Universe
        </div>
        <h1 style={heroTitleStyle}>
          Where X, TikTok, IG &
          <br />
          <span className="gradient-text" style={{ fontSize: '1.15em', fontWeight: 900, filter: 'drop-shadow(0 0 20px rgba(236,72,153,0.35))' }}>
            Facebook Merge
          </span>
        </h1>
        <p className="hero-sub" style={heroSubStyle}>
          Why limit yourself? HoloMedia integrates real-time X-style microblogging, visual aesthetics from Instagram, community groups from Facebook, and addictive TikTok vertical reels into a single ultimate feed.
        </p>
        <div className="hero-cta" style={{ gap: 16 }}>
          <Link to="/register" className="btn btn-primary btn-lg" style={ctaMainStyle}>
            Create your account
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg" style={ctaGhostStyle}>
            Log in
          </Link>
        </div>
        <p className="hero-note" style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '20px' }}>
          Free forever. Fusing 4 massive social hubs into a single unified social layer.
        </p>
      </section>

      <section className="features" style={{ position: 'relative', zIndex: 10, padding: '40px 24px 100px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 10px' }}>
          Unifying the Social Giants
        </h2>
        <p className="features-sub" style={{ color: 'var(--text-dim)', fontSize: '16px', margin: '0 0 50px' }}>
          Experience the specific features that make each network legendary, working in total harmony.
        </p>
        <div className="features-grid" style={{ gap: 20 }}>
          {FEATURES.map((f) => (
            <div className="feature-card card" key={f.title} style={featureCardStyle}>
              <div className="feature-icon" style={{ ...featureIconStyle, color: f.color, border: `1px solid ${f.color}40`, background: `${f.color}10` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer" style={{ position: 'relative', zIndex: 10 }}>
        <div className="landing-logo">
          <Logo size={22} />
          <span style={{ fontWeight: 700, fontSize: '16px' }}>HoloMedia SuperApp</span>
        </div>
        <p>© 2026 HoloMedia. Fusing social networks together.</p>
      </footer>

      <style>{`
        @keyframes float-orb {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

const landingStyle: React.CSSProperties = {
  position: 'relative',
  backgroundColor: '#0a0a10',
  backgroundImage: 'radial-gradient(1200px 600px at 50% 10%, rgba(124, 58, 237, 0.1), transparent 60%)',
  overflow: 'hidden',
};

const orb1Style: React.CSSProperties = {
  position: 'absolute',
  width: '400px',
  height: '400px',
  top: '-100px',
  left: '-100px',
  borderRadius: '50%',
  background: 'rgba(124, 58, 237, 0.12)',
  filter: 'blur(80px)',
  pointerEvents: 'none',
  animation: 'float-orb 8s ease-in-out infinite',
};

const orb2Style: React.CSSProperties = {
  position: 'absolute',
  width: '500px',
  height: '500px',
  bottom: '100px',
  right: '-150px',
  borderRadius: '50%',
  background: 'rgba(236, 72, 153, 0.08)',
  filter: 'blur(100px)',
  pointerEvents: 'none',
  animation: 'float-orb 10s ease-in-out infinite alternate',
};

const loginLinkStyle: React.CSSProperties = {
  color: 'var(--text-dim)',
  fontWeight: 700,
  fontSize: '15px',
  transition: 'color 0.2s',
};

const ctaButtonNavStyle: React.CSSProperties = {
  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
  fontWeight: 700,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: 700,
  padding: '6px 14px',
  borderRadius: '999px',
  background: 'rgba(124, 58, 237, 0.12)',
  border: '1px solid rgba(124, 58, 237, 0.3)',
  color: '#c4b5fd',
  marginBottom: '24px',
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: 'clamp(36px, 6vw, 64px)',
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: '-1.5px',
  marginBottom: '20px',
};

const heroSubStyle: React.CSSProperties = {
  color: 'var(--text-dim)',
  fontSize: '18px',
  lineHeight: '1.6',
  maxWidth: '640px',
  margin: '0 auto 36px',
};

const ctaMainStyle: React.CSSProperties = {
  fontSize: '16px',
  padding: '14px 28px',
  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)',
  fontWeight: 700,
};

const ctaGhostStyle: React.CSSProperties = {
  fontSize: '16px',
  padding: '14px 28px',
  fontWeight: 700,
};

const featureCardStyle: React.CSSProperties = {
  padding: '30px 24px',
  borderRadius: '16px',
  background: 'rgba(19, 19, 29, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--border)',
};

const featureIconStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
};
