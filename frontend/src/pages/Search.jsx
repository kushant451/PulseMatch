import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/useAuth';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Search() {
  const { user } = useAuth();
  const defaultMode = user?.role === 'hospital' ? 'blood-banks' : 'donors';
  const [mode, setMode] = useState(defaultMode);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [coords, setCoords] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const captureLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Could not get your location. Please allow location access.')
    );
  };

  const runSearch = async (e) => {
    e.preventDefault();
    setError('');
    if (!coords) {
      setError('Capture your location first so we can find the nearest matches.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'donors' ? '/search/donors' : '/search/blood-banks';
      const { data } = await api.get(endpoint, {
        params: { bloodGroup, longitude: coords.lng, latitude: coords.lat, maxDistanceKm },
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold mb-1">Find nearby {mode === 'donors' ? 'donors' : 'blood banks'}</h1>
      <p className="text-muted text-sm mb-6">Results are sorted by distance — closest match first.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setMode('donors'); setResults(null); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${mode === 'donors' ? 'bg-ink text-paper border-ink' : 'border-ink/15 text-muted'}`}>
          Donors
        </button>
        <button onClick={() => { setMode('blood-banks'); setResults(null); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${mode === 'blood-banks' ? 'bg-ink text-paper border-ink' : 'border-ink/15 text-muted'}`}>
          Blood banks with stock
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">{error}</div>
      )}

      <form onSubmit={runSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8 bg-white border border-ink/10 rounded-lg p-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Blood group</label>
          <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full border border-ink/15 rounded px-2 py-2 text-sm bg-white">
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Max distance (km)</label>
          <input type="number" min="1" max="100" value={maxDistanceKm} onChange={(e) => setMaxDistanceKm(e.target.value)}
            className="w-full border border-ink/15 rounded px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col justify-end">
          <button type="button" onClick={captureLocation}
            className="text-xs font-medium text-teal border border-teal/30 rounded px-2 py-2 hover:bg-teal/5 transition-colors">
            {coords ? 'Location set ✓' : 'Use my location'}
          </button>
        </div>
        <div className="flex flex-col justify-end">
          <button type="submit" disabled={loading}
            className="bg-blood hover:bg-blood-dark text-paper text-sm font-medium rounded px-3 py-2 transition-colors disabled:opacity-60">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {results && (
        <div>
          <p className="text-sm font-mono text-muted mb-3">
            {mode === 'donors' ? results.count : results.count} match{(mode === 'donors' ? results.count : results.count) !== 1 ? 'es' : ''} found
          </p>

          {mode === 'donors' ? (
            <ResultsDonorList donors={results.donors} />
          ) : (
            <ResultsBankList results={results.results} />
          )}
        </div>
      )}
    </div>
  );
}

function ResultsDonorList({ donors }) {
  if (!donors?.length) return <EmptyState label="No eligible donors found in this radius." />;
  return (
    <div className="grid gap-3">
      {donors.map((d) => (
        <div key={d._id} className="bg-white border border-ink/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{d.name}</p>
            <p className="text-sm text-muted">{d.location?.address || 'Address not set'}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-blood/10 text-blood font-mono text-sm font-semibold px-2 py-1 rounded">{d.bloodGroup}</span>
            <p className="text-xs text-muted mt-1">{d.phone}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsBankList({ results }) {
  if (!results?.length) return <EmptyState label="No blood banks with this stock found in this radius." />;
  return (
    <div className="grid gap-3">
      {results.map((r, i) => (
        <div key={i} className="bg-white border border-ink/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{r.bloodBank?.name}</p>
            <p className="text-sm text-muted">{r.bloodBank?.location?.address}</p>
            <p className="text-xs text-muted">{r.bloodBank?.contactPhone}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-teal/10 text-teal font-mono text-sm font-semibold px-2 py-1 rounded">
              {r.unitsAvailable} units
            </span>
            <p className="text-xs text-muted mt-1 font-mono">
              expires {new Date(r.expiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="text-center py-12 border border-dashed border-ink/15 rounded-lg">
      <p className="text-muted text-sm">{label}</p>
      <p className="text-xs text-muted mt-1">Try widening the distance or checking a different blood group.</p>
    </div>
  );
}
