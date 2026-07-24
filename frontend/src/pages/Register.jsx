import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/useAuth';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'donor', bloodGroup: '', weightKg: '', address: '',
  });
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser — you can still enter your address.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Could not get location. Please allow location access or enter address manually.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
      };
      const { data } = await api.post('/auth/register', payload);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold mb-1">Create an account</h1>
        <p className="text-muted mb-8 text-sm">Join as a donor or register your hospital.</p>

        {error && (
          <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {['donor', 'hospital'].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2 rounded border text-sm font-medium capitalize transition-colors ${
                  form.role === r
                    ? 'bg-ink text-paper border-ink'
                    : 'border-ink/15 text-muted hover:border-ink/40'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none" />
          </div>

          {form.role === 'donor' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Blood group</label>
                <select required value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none bg-white">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input type="number" min="30" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none" />
                <p className="text-xs text-muted mt-1">Minimum 50kg required for donation eligibility.</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-ink/15 rounded px-3 py-2 focus:border-blood outline-none" />
          </div>

          <button type="button" onClick={captureLocation}
            className="text-sm text-teal font-medium flex items-center gap-1">
            {coords ? `Location captured ✓ (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : 'Use my current location'}
          </button>

          <button type="submit" disabled={loading}
            className="w-full bg-blood hover:bg-blood-dark text-paper font-medium rounded py-2.5 transition-colors disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6">
          Already have an account? <Link to="/login" className="text-blood font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
