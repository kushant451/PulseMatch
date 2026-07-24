import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold mb-1">Welcome back</h1>
        <p className="text-muted mb-8 text-sm">Log in to find or fulfil a blood request.</p>

        {error && (
          <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blood hover:bg-blood-dark text-paper font-medium rounded py-2.5 transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6">
          No account yet?{' '}
          <Link to="/register" className="text-blood font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
