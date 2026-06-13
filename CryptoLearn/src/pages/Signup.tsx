import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { needsVerification } = await signUp({ email, password, username, dob });
      if (needsVerification) {
        // Account created, but the user must confirm their email first.
        setVerifyEmail(email);
      } else {
        navigate('/courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setBusy(false);
    }
  }

  // Confirmation screen shown after a successful signup that needs verification.
  if (verifyEmail) {
    return (
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1>Check your email 📬</h1>
          <p>
            We sent a verification link to <strong>{verifyEmail}</strong>. Click the link in that
            email to verify your registration, then come back and log in.
          </p>
          <p className="muted">
            Didn’t get it? Check your spam folder, or wait a moment and try logging in once you’ve
            verified.
          </p>
          <Link className="btn btn--primary" to="/">
            Go to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Create your account</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Date of birth
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </button>
        <p className="muted">
          Already have an account? <Link to="/">Log in</Link>
        </p>
      </form>
    </div>
  );
}
