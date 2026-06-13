import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Public landing page. Shows a brief intro and a login form. After logging in
// the user is sent to the courses page.
export function Landing() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → skip the landing page.
  if (!loading && user) return <Navigate to="/courses" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing">
      <section className="landing__hero">
        <h1>Learn how crypto moves on Ethereum</h1>
        <p>
          A hands-on course that takes you from blockchain basics to sending your first
          transaction — wallets, gas, the mempool, and finality, one visual at a time.
        </p>
      </section>

      <form className="card auth-card landing__login" onSubmit={onSubmit}>
        <h2>Log in</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
