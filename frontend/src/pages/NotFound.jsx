import { Link } from 'react-router-dom';
import PulseLine from '../components/PulseLine';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-mono text-xs tracking-widest text-blood uppercase mb-4">404</p>
        <h1 className="font-display text-3xl font-semibold mb-3">Page not found</h1>
        <p className="text-muted text-sm mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="mb-8">
          <PulseLine color="#0B1220" />
        </div>
        <Link
          to="/"
          className="inline-block bg-blood hover:bg-blood-dark text-paper font-medium rounded px-6 py-3 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
