import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSeo } from '../hooks/useSeo';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useSeo({
    title: 'Create your free account',
    description:
      'Join HoloMedia free — no email verification needed. Share posts, loop reels, and connect in groups.',
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!username || !email || !fullName || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register({ username, email, full_name: fullName, password });
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
          Join <span className="gradient-text">HoloMedia</span>
        </h1>
        <p>No email verification. Just pick a name and go.</p>
      </div>

      <form className="auth-card card" onSubmit={submit}>
        <h2>Create your free account</h2>

        {error && <div className="error-msg">{error}</div>}

        <label htmlFor="username">Username</label>
        <input
          className="input"
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="you"
          autoComplete="username"
        />

        <label htmlFor="email">Email</label>
        <input
          className="input"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <label htmlFor="fullName">Full name</label>
        <input
          className="input"
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your Name"
          autoComplete="name"
        />

        <label htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
