import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, signOut } = useAuth();
  return (
    <nav className="navbar">
      <Link to={user ? '/courses' : '/'} className="brand">
        CryptoLearn
      </Link>
      {user && (
        <div className="nav-right">
          <span className="nav-email">{user.email}</span>
          <button className="btn btn--ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
