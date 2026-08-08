import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSeo } from '../hooks/useSeo';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useSeo({
    title: 'Log in',
    description:
      'Log in to HoloMedia to share posts, loop reels, and connect with your community.',
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <div className="brand-mark">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" fill="url(#lg)" opacity=".2" />
            <path d="M12 6l2.2 3.8L18 11l-3.8 2.2L12 17l-2.2-3.8L6 11l3.8-1.2L12 6z" fill="url(#lg)" />
            <defs>
              <linearGradient id="lg" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>
          Welcome back to <span className="gradient-text">HoloMedia</span>
        </h1>
        <p>Share moments, follow friends, and join the conversation.</p>
      </div>

      <form className="auth-card card" onSubmit={submit}>
        <h2>Log in</h2>

        {error && <div className="error-msg">{error}</div>}

        <label htmlFor="username">Username or email</label>
        <input
          className="input"
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="you"
          autoComplete="username"
        />

        <label htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? 'Logging in...' : 'Log in'}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="demo-tip">
          Demo account: <code>you</code> / <code>demo1234</code>
        </p>
      </form>
    </div>
  );
}
