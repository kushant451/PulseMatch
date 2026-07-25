import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PulseLine from './PulseLine';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-ink text-paper sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-blood">&#10084;</span> PulseMatch
        </Link>

        <nav className="flex items-center gap-6 text-sm font-body">
          {user?.role === 'donor' && (
            <Link to="/find-requests" className="hover:text-blood transition-colors">Find Requests</Link>
          )}
          {user?.role === 'hospital' && (
            <>
              <Link to="/search" className="hover:text-blood transition-colors">Find Blood</Link>
              <Link to="/requests" className="hover:text-blood transition-colors">My Requests</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/dashboard" className="hover:text-blood transition-colors">Dashboard</Link>
          )}
          {user && (
            <Link to="/profile" className="hover:text-blood transition-colors">Profile</Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded border border-paper/30 hover:border-blood hover:text-blood transition-colors"
            >
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" className="hover:text-blood transition-colors">Log in</Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded bg-blood hover:bg-blood-dark transition-colors font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
      <PulseLine color="#C41E3A" />
    </header>
  );
}