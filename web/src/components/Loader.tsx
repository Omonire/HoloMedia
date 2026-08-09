import type React from 'react';

// Self-contained CSS and HTML loader with CSS Keyframes and inline styles
export function Loader() {
  return (
    <div style={containerStyle}>
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle} />
        <div style={innerSpinnerStyle} />
        <div style={logoContainerStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={svgStyle}
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 2a7 7 0 1 0 7 7" />
            <path d="M12 2a4 4 0 1 0 4 4" />
          </svg>
        </div>
      </div>
      <div style={textStyle}>Loading HoloMedia...</div>
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
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
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
  backgroundImage: 'radial-gradient(1200px 600px at 50% 50%, rgba(124, 58, 237, 0.15), transparent 70%)',
  zIndex: 9999,
  fontFamily: "'Inter', sans-serif",
};

const spinnerContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const spinnerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  border: '3px solid transparent',
  borderTopColor: '#7c3aed',
  borderBottomColor: '#ec4899',
  animation: 'rotate-outer 1.8s linear infinite',
};

const innerSpinnerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '76px',
  height: '76px',
  borderRadius: '50%',
  border: '2px solid transparent',
  borderLeftColor: '#c4b5fd',
  borderRightColor: '#f472b6',
  animation: 'rotate-inner 1.2s linear infinite',
  opacity: 0.8,
};

const logoContainerStyle: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'pulse-logo 2s ease-in-out infinite',
};

const svgStyle: React.CSSProperties = {
  color: '#ececf6',
  filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))',
};

const textStyle: React.CSSProperties = {
  marginTop: '24px',
  fontSize: '15px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#ececf6',
  animation: 'text-glow 2s ease-in-out infinite',
};
