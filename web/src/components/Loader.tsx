import React, { useEffect, useState } from 'react';

// Highly-polished Premium Launch / Splash Screen with smooth loading bar, glowing states, and floating ambient particles
export function Loader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1200; // 1.2s smooth mock progression

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(Math.floor((elapsed / duration) * 100), 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={containerStyle}>
      {/* Floating Ambient background particles */}
      <div className="particle" style={{ width: 8, height: 8, left: '20%', top: '40%', animationDelay: '0s' }} />
      <div className="particle" style={{ width: 12, height: 12, left: '75%', top: '25%', animationDelay: '1s' }} />
      <div className="particle" style={{ width: 6, height: 6, left: '45%', top: '70%', animationDelay: '2s' }} />
      <div className="particle" style={{ width: 10, height: 10, left: '80%', top: '65%', animationDelay: '0.5s' }} />
      <div className="particle" style={{ width: 14, height: 14, left: '15%', top: '75%', animationDelay: '1.5s' }} />

      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle} />
        <div style={innerSpinnerStyle} />
        <div style={logoContainerStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#lg-loader)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={svgStyle}
          >
            <defs>
              <linearGradient id="lg-loader" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" opacity=".25" />
            <path d="M12 6l2.2 3.8L18 11l-3.8 2.2L12 17l-2.2-3.8L6 11l3.8-1.2L12 6z" />
          </svg>
        </div>
      </div>

      <div style={titleStyle}>
        Holo<span style={gradientSpanStyle}>Media</span>
      </div>

      <div style={progressBarContainerStyle}>
        <div style={{ ...progressBarStyle, width: `${progress}%` }} />
      </div>

      <div style={textStyle}>Initializing application... {progress}%</div>

      <style>{`
        @keyframes rotate-outer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotate-inner {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 16px rgba(236, 72, 153, 0.8)); }
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 4px rgba(124, 58, 237, 0.2); opacity: 0.7; }
          50% { text-shadow: 0 0 12px rgba(236, 72, 153, 0.6); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: '#0a0a10',
  backgroundImage: 'radial-gradient(1200px 600px at 50% 50%, rgba(124, 58, 237, 0.18), transparent 75%)',
  zIndex: 9999,
  fontFamily: "'Inter', sans-serif",
  overflow: 'hidden',
};

const spinnerContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '120px',
  height: '120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
};

const spinnerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  border: '3px solid transparent',
  borderTopColor: '#7c3aed',
  borderBottomColor: '#ec4899',
  animation: 'rotate-outer 1.6s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite',
};

const innerSpinnerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '94px',
  height: '94px',
  borderRadius: '50%',
  border: '2px solid transparent',
  borderLeftColor: '#c4b5fd',
  borderRightColor: '#f472b6',
  animation: 'rotate-inner 1.2s ease-in-out infinite',
  opacity: 0.7,
};

const logoContainerStyle: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'pulse-logo 2s ease-in-out infinite',
};

const svgStyle: React.CSSProperties = {
  filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.7))',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  color: '#ececf6',
  marginBottom: '24px',
};

const gradientSpanStyle: React.CSSProperties = {
  background: 'linear-gradient(120deg, #7c3aed, #ec4899)',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
};

const progressBarContainerStyle: React.CSSProperties = {
  width: '180px',
  height: '4px',
  backgroundColor: '#1f1f2e',
  borderRadius: '2px',
  overflow: 'hidden',
  marginBottom: '14px',
  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
  boxShadow: '0 0 8px #ec4899',
  borderRadius: '2px',
  transition: 'width 0.08s linear',
};

const textStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  color: '#9b9bb4',
  animation: 'text-glow 2.5s ease-in-out infinite',
};
