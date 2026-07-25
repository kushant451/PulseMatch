import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/useAuth';

const URGENCY_STYLES = {
  normal: 'bg-muted/10 text-muted',
  urgent: 'bg-amber-100 text-amber-700',
  critical: 'bg-blood/10 text-blood',
};

export default function FindRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlyMyGroup, setOnlyMyGroup] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/requests');
      setRequests(data.filter((r) => r.status === 'pending' || r.status === 'matched'));
    } catch {
      setError('Could not load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const visibleRequests = onlyMyGroup && user?.bloodGroup
    ? requests.filter((r) => r.bloodGroup === user.bloodGroup)
    : requests;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl font-semibold">Find requests</h1>
        <button onClick={loadRequests}
          className="text-xs font-medium text-teal border border-teal/30 rounded px-3 py-1.5 hover:bg-teal/5 transition-colors">
          Refresh
        </button>
      </div>
      <p className="text-muted text-sm mb-6">Hospitals nearby are waiting on these units of blood.</p>

      {user?.bloodGroup && (
        <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer w-fit">
          <input type="checkbox" checked={onlyMyGroup} onChange={(e) => setOnlyMyGroup(e.target.checked)} />
          Only show requests matching my blood group ({user.bloodGroup})
        </label>
      )}

      {error && (
        <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-muted text-center py-10">Loading requests...</p>
      ) : (
        <div className="grid gap-3">
          {visibleRequests.length === 0 && (
            <div className="text-center py-12 border border-dashed border-ink/15 rounded-lg">
              <p className="text-muted text-sm">No matching requests right now.</p>
              <p className="text-xs text-muted mt-1">Check back soon, or turn off the blood group filter above.</p>
            </div>
          )}
          {visibleRequests.map((r) => (
            <div key={r._id} className="bg-white border border-ink/10 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium font-mono">{r.bloodGroup} · {r.unitsNeeded} unit{r.unitsNeeded > 1 ? 's' : ''}</p>
                <p className="text-sm text-muted mt-1">{r.requestedBy?.name || 'Hospital'}{r.location?.address ? ` · ${r.location.address}` : ''}</p>
                {r.requestedBy?.phone && (
                  <p className="text-xs text-muted mt-0.5">{r.requestedBy.phone}</p>
                )}
                <p className="text-xs text-muted mt-1">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded capitalize h-fit ${URGENCY_STYLES[r.urgency]}`}>{r.urgency}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}