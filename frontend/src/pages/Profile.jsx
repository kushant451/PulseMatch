import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/useAuth';

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', weightKg: '', address: '' });
  const [logForm, setLogForm] = useState({ unitsGiven: 1, donatedAt: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/profile');
      setProfile(data);
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        weightKg: data.weightKg || '',
        address: data.location?.address || '',
      });
    } catch {
      setError('Could not load profile.');
    }
  };

  const loadDonations = async () => {
    if (user?.role !== 'donor') return;
    try {
      const { data } = await api.get('/profile/donations');
      setDonations(data);
    } catch {
      // non-fatal — donation history is supplementary
    }
  };

  useEffect(() => {
    loadProfile();
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.patch('/profile', {
        name: form.name,
        phone: form.phone,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        address: form.address,
      });
      setProfile(data);
      // keep the locally-stored auth user's display name in sync
      login({ ...user, name: data.name });
      setMessage('Profile updated.');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogDonation = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/profile/donations', {
        unitsGiven: Number(logForm.unitsGiven) || 1,
        donatedAt: logForm.donatedAt || undefined,
      });
      setMessage('Donation logged — your eligibility date has been updated.');
      setLogForm({ unitsGiven: 1, donatedAt: '' });
      loadProfile();
      loadDonations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log donation.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-muted">Loading profile...</div>;
  }

  const eligibleAgainDate = profile.lastDonationDate
    ? new Date(new Date(profile.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000)
    : null;
  const isEligibleNow = !eligibleAgainDate || eligibleAgainDate <= new Date();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold mb-1">My profile</h1>
      <p className="text-muted text-sm mb-6">Manage your account details{profile.role === 'donor' ? ' and donation history' : ''}.</p>

      {message && (
        <div className="mb-4 text-sm text-teal border border-teal/30 bg-teal/5 rounded px-3 py-2">{message}</div>
      )}
      {error && (
        <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">{error}</div>
      )}

      <div className="bg-white border border-ink/10 rounded-lg p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Account details</h2>
          <button onClick={() => setEditing(!editing)} className="text-sm text-blood font-medium">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="grid gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
            </div>
            {profile.role === 'donor' && (
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Weight (kg)</label>
                <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="justify-self-start bg-blood hover:bg-blood-dark text-paper text-sm font-medium rounded px-4 py-2 transition-colors disabled:opacity-60">
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        ) : (
          <dl className="text-sm grid gap-2">
            <Row label="Name" value={profile.name} />
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Role" value={profile.role} capitalize />
            {profile.role === 'donor' && <Row label="Blood group" value={profile.bloodGroup} mono />}
            {profile.role === 'donor' && <Row label="Weight" value={profile.weightKg ? `${profile.weightKg} kg` : '—'} />}
            <Row label="Address" value={profile.location?.address || '—'} />
          </dl>
        )}
      </div>

      {profile.role === 'donor' && (
        <>
          <div className="bg-white border border-ink/10 rounded-lg p-5 mb-8">
            <h2 className="font-display text-lg font-semibold mb-3">Eligibility</h2>
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-block w-2 h-2 rounded-full ${isEligibleNow ? 'bg-teal' : 'bg-blood'}`} />
              <p className="text-sm">
                {isEligibleNow
                  ? 'You are eligible to donate now.'
                  : `You'll be eligible again on ${eligibleAgainDate.toLocaleDateString()} (90-day gap).`}
              </p>
            </div>

            <form onSubmit={handleLogDonation} className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Units given</label>
                <input type="number" min="1" value={logForm.unitsGiven}
                  onChange={(e) => setLogForm({ ...logForm, unitsGiven: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="bg-teal hover:opacity-90 text-paper text-sm font-medium rounded px-4 py-2 transition-colors disabled:opacity-60">
                {loading ? 'Logging...' : 'Log a completed donation'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold mb-3">Donation history</h2>
            {donations.length === 0 ? (
              <p className="text-sm text-muted">No donations logged yet.</p>
            ) : (
              <div className="grid gap-2">
                {donations.map((d) => (
                  <div key={d._id} className="bg-white border border-ink/10 rounded-lg p-3 flex justify-between text-sm">
                    <span className="font-mono">{new Date(d.donatedAt).toLocaleDateString()}</span>
                    <span>{d.unitsGiven} unit{d.unitsGiven > 1 ? 's' : ''} · {d.bloodGroup}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, capitalize, mono }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono' : ''} font-medium`}>{value}</dd>
    </div>
  );
}
