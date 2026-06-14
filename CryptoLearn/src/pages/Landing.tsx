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
    <div className="landing relative overflow-hidden">
      {/* Decorative animated gradient blobs (Tailwind) */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple/30 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-20 right-6 h-64 w-64 rounded-full bg-aqua/30 blur-3xl animate-float [animation-delay:1.2s]" />
      <div className="pointer-events-none absolute top-1/3 left-1/3 h-56 w-56 rounded-full bg-yellow/25 blur-3xl animate-float [animation-delay:2.4s]" />

      <section className="landing__hero animate-fade-in relative z-10">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-purple/10 px-4 py-1.5 text-sm font-bold text-purple-strong ring-1 ring-purple/20">
          🎓 Interactive crypto course
        </span>
        <h1>Learn how crypto moves on Ethereum</h1>
        <p>
          A hands-on course that takes you from blockchain basics to sending your first
          transaction — wallets, gas, the mempool, and finality, one visual at a time.
        </p>
      </section>

      <form
        className="card auth-card landing__login animate-fade-in [animation-delay:120ms] relative z-10 transition-all duration-300 ease-smooth hover:-translate-y-1.5 hover:shadow-2xl"
        onSubmit={onSubmit}
      >
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
