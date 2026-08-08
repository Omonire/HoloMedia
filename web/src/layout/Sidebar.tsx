import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../notifications';
import { Avatar } from '../components/Avatar';

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" fill="url(#lg)" opacity=".25" />
    <path d="M12 6l2.2 3.8L18 11l-3.8 2.2L12 17l-2.2-3.8L6 11l3.8-1.2L12 6z" fill="url(#lg)" />
    <defs>
      <linearGradient id="lg" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const NAV = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/explore',
    label: 'Explore',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    to: '/reels',
    label: 'Reels',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="2" y="4" width="20" height="16" rx="4" />
        <path d="M9 4l2 4 3-4" />
      </svg>
    ),
  },
  {
    to: '/sounds',
    label: 'Sounds',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    to: '/groups',
    label: 'Groups',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/bookmarks',
    label: 'Saved',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();

  return (
    <nav className="sidebar">
      <NavLink to="/" className="logo">
        <span className="logo-mark">
          <Logo />
        </span>
        <span className="logo-text">
          Holo<span className="gradient-text">Media</span>
        </span>
      </NavLink>

      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}

      {user?.is_admin && (
        <NavLink
          to="/admin"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg {...ICON_PROPS}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Admin</span>
        </NavLink>
      )}

      <NavLink
        to="/notifications"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        <span style={{ position: 'relative' }}>
          <svg {...ICON_PROPS}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unread > 0 && <span className="badge">{unread}</span>}
        </span>
        <span>Notifications</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        <svg {...ICON_PROPS}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Messages</span>
      </NavLink>

      {user && (
        <>
          <NavLink
            to={`/${user.username}`}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <svg {...ICON_PROPS}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </NavLink>

          <div className="sidebar-footer">
            <button
              className="suggestion-user"
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => navigate(`/${user.username}`)}
            >
              <Avatar name={user.full_name} color={user.avatar_color} size={38} />
            </button>
            <div className="me-info">
              <strong>{user.full_name}</strong>
              <span>@{user.username}</span>
            </div>
            <button className="icon-btn" onClick={() => void logout()} title="Log out">
              <svg {...ICON_PROPS} width={18} height={18}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
