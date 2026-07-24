import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client';
import { useAdminSocket } from '../hooks/useAdminSocket';

export default function Dashboard() {
  const [stock, setStock] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [liveFlash, setLiveFlash] = useState(false);
  const [connected, setConnected] = useState(false);

  const load = useCallback(async () => {
    try {
      const [stockRes, expiringRes, requestsRes] = await Promise.all([
        api.get('/stock'),
        api.get('/stock/expiring-soon'),
        api.get('/requests'),
      ]);
      setStock(stockRes.data);
      setExpiringSoon(expiringRes.data);
      setRequests(requestsRes.data);
    } catch {
      setError('Could not load dashboard data. Are you logged in as admin?');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Briefly flash the "live" indicator whenever a real-time update arrives,
  // then re-fetch so the dashboard reflects the change without a manual refresh.
  const flashAndReload = useCallback(() => {
    setLiveFlash(true);
    setTimeout(() => setLiveFlash(false), 1200);
    load();
  }, [load]);

  const socketRef = useAdminSocket({
    onRequestCreated: flashAndReload,
    onRequestUpdated: flashAndReload,
    onStockUpdated: flashAndReload,
  });

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const markConnected = () => setConnected(true);
    const markDisconnected = () => setConnected(false);
    socket.on('connect', markConnected);
    socket.on('disconnect', markDisconnected);
    return () => {
      socket.off('connect', markConnected);
      socket.off('disconnect', markDisconnected);
    };
  }, [socketRef]);

  // Aggregate units by blood group for the chart
  const chartData = Object.values(
    stock.reduce((acc, s) => {
      acc[s.bloodGroup] = acc[s.bloodGroup] || { group: s.bloodGroup, units: 0 };
      acc[s.bloodGroup].units += s.unitsAvailable;
      return acc;
    }, {})
  );

  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const totalUnits = stock.reduce((sum, s) => sum + s.unitsAvailable, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl font-semibold">Admin dashboard</h1>
        <LiveIndicator connected={connected} flash={liveFlash} />
      </div>
      <p className="text-muted text-sm mb-8">Inventory health and request activity at a glance — updates live.</p>

      {error && (
        <div className="mb-4 text-sm text-blood border border-blood/30 bg-blood/5 rounded px-3 py-2">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total units in stock" value={totalUnits} />
        <StatCard label="Pending requests" value={pendingRequests} accent="blood" />
        <StatCard label="Units expiring within 7 days" value={expiringSoon.length} accent="amber" />
      </div>

      <div className="bg-white border border-ink/10 rounded-lg p-5 mb-8">
        <h2 className="font-display text-lg font-semibold mb-4">Stock by blood group</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0B122010" />
            <XAxis dataKey="group" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }} />
            <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="units" fill="#C41E3A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Expiring within 7 days</h2>
          {expiringSoon.length === 0 ? (
            <p className="text-sm text-muted">Nothing expiring soon.</p>
          ) : (
            <div className="grid gap-2">
              {expiringSoon.map((s) => (
                <div key={s._id} className="bg-white border border-amber-200 rounded-lg p-3 flex justify-between text-sm">
                  <span className="font-mono font-medium">{s.bloodGroup} · {s.unitsAvailable} units</span>
                  <span className="text-muted font-mono">{new Date(s.expiryDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Recent requests</h2>
          {requests.length === 0 ? (
            <p className="text-sm text-muted">No requests yet.</p>
          ) : (
            <div className="grid gap-2">
              {requests.slice(0, 6).map((r) => (
                <div key={r._id} className="bg-white border border-ink/10 rounded-lg p-3 flex justify-between text-sm">
                  <span className="font-mono font-medium">{r.bloodGroup} · {r.unitsNeeded}u</span>
                  <span className="text-muted capitalize">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveIndicator({ connected, flash }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span
        className={`inline-block w-2 h-2 rounded-full transition-colors ${
          flash ? 'bg-blood' : connected ? 'bg-teal' : 'bg-muted/40'
        }`}
      />
      <span className="text-muted">{connected ? 'live' : 'offline'}</span>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentClass = accent === 'blood' ? 'text-blood' : accent === 'amber' ? 'text-amber-600' : 'text-ink';
  return (
    <div className="bg-white border border-ink/10 rounded-lg p-5">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`font-display text-3xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}
