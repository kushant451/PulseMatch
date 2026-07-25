import { useEffect, useState } from 'react';
import api from '../api/client';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_STYLES = {
  normal: 'bg-muted/10 text-muted',
  urgent: 'bg-amber-100 text-amber-700',
  critical: 'bg-blood/10 text-blood',
};
const STATUS_STYLES = {
  pending: 'bg-muted/10 text-muted',
  matched: 'bg-teal/10 text-teal',
  fulfilled: 'bg-teal/20 text-teal',
  cancelled: 'bg-ink/10 text-ink',
};

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bloodGroup: 'O+', unitsNeeded: 1, urgency: 'normal', patientDetails: '', address: '',
  });
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch {
      setError('Could not load requests.');
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const captureLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Could not get location.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!coords) {
      setError('Please capture location for this request.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/requests', {
        ...form,
        unitsNeeded: Number(form.unitsNeeded),
        longitude: coords.lng,
        latitude: coords.lat,
      });
      setShowForm(false);
      setForm({ bloodGroup: 'O+', unitsNeeded: 1, urgency: 'normal', patientDetails: '', address: '' });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">My requests</h1>
          <p className="text-muted text-sm">Track the status of blood you've requested.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blood hover:bg-blood-dark text-paper text-sm font-medium rounded px-4 py-2 transition-colors">
          {showForm ? 'Cancel' : 'New request'}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-lg p-5 mb-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Blood group</label>
            <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="w-full border border-ink/15 rounded px-2 py-2 text-sm bg-white">
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Units needed</label>
            <input type="number" min="1" value={form.unitsNeeded} onChange={(e) => setForm({ ...form, unitsNeeded: e.target.value })}
              className="w-full border border-ink/15 rounded px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Urgency</label>
            <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              className="w-full border border-ink/15 rounded px-2 py-2 text-sm bg-white">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-ink/15 rounded px-2 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">Patient note (optional)</label>
            <input value={form.patientDetails} onChange={(e) => setForm({ ...form, patientDetails: e.target.value })}
              className="w-full border border-ink/15 rounded px-2 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between">
            <button type="button" onClick={captureLocation} className="text-xs font-medium text-teal">
              {coords ? 'Location set ✓' : 'Use current location'}
            </button>
            <button type="submit" disabled={loading}
              className="bg-blood hover:bg-blood-dark text-paper text-sm font-medium rounded px-4 py-2 transition-colors disabled:opacity-60">
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {requests.length === 0 && (
          <p className="text-sm text-muted text-center py-10 border border-dashed border-ink/15 rounded-lg">
            No requests yet. Create one when you need blood.
          </p>
        )}
        {requests.map((r) => (
          <div key={r._id} className="bg-white border border-ink/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium font-mono">{r.bloodGroup} · {r.unitsNeeded} unit{r.unitsNeeded > 1 ? 's' : ''}</p>
              <p className="text-xs text-muted mt-1">{new Date(r.createdAt).toLocaleString()}</p>
              {r.status === 'matched' && r.respondedDonor && (
                <p className="text-xs text-teal font-medium mt-1">
                  Donor: {r.respondedDonor.name} · {r.respondedDonor.phone}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${URGENCY_STYLES[r.urgency]}`}>{r.urgency}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}