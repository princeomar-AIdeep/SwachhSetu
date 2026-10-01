import { useState } from 'react';
import { api } from '../api.js';
import { useApi, useTitle } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import MapView from '../components/MapView.jsx';
import { Async, Pill, Empty, Stat } from '../components/ui.jsx';
import { ScoreCard } from './Dashboard.jsx';

const NEXT = { Assigned: ['accept', 'Accept pickup'], Accepted: ['start', 'Start — on route'], 'On Route': ['complete', 'Mark completed'] };

function Card({ p, reload }) {
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const next = NEXT[p.status];
  const act = async () => { setBusy(true); setMsg(''); try { await api(`/pickups/${p.requestId}/${next[0]}`, { method: 'POST' }); reload(); } catch (x) { setMsg(x.message); } finally { setBusy(false); } };
  const send = (lat, lng, demo) => api(`/pickups/${p.requestId}/location`, { method: 'POST', body: { lat, lng, demo } }).then(() => { setMsg(demo ? 'Demo location sent.' : 'Location shared.'); reload(); }).catch((x) => setMsg(x.message));
  const share = () => navigator.geolocation?.getCurrentPosition((g) => send(g.coords.latitude, g.coords.longitude, false), () => setMsg('Could not read your GPS location.'));
  // Clearly-labelled DEMO helper for presentations only; stored with isDemo:true and shown as "demo" to the citizen.
  const demoMove = () => { const b = p.collectorLocation?.lat ? p.collectorLocation : { lat: (p.coords?.lat || 26.4499) - 0.01, lng: (p.coords?.lng || 80.3319) - 0.01 }; const t = p.coords || { lat: b.lat + 0.01, lng: b.lng + 0.01 }; send(b.lat + (t.lat - b.lat) * 0.3, b.lng + (t.lng - b.lng) * 0.3, true); };
  return (
    <div className="card"><div className="flex items-start justify-between gap-2"><div><h3 className="text-lg">{p.wasteType}</h3><p className="font-mono text-xs text-mute">{p.requestId}</p></div><Pill>{p.status}</Pill></div>
      <p className="mt-2 text-sm"><b>{p.user?.name}</b> · {p.address}</p><p className="text-sm text-mute">{p.date} · {p.slot}{p.phone ? ` · ☎ ${p.phone}` : ''}</p>{p.notes && <p className="mt-1 text-sm italic">“{p.notes}”</p>}
      {p.status === 'On Route' && <><div className="mt-3"><MapView height={200} markers={[p.coords && { ...p.coords, label: 'Pickup', color: '#2A9A3C' }, p.collectorLocation?.lat && { ...p.collectorLocation, label: 'You', color: '#1677C8' }].filter(Boolean)} /></div>
        <div className="mt-2 flex flex-wrap gap-2"><button className="btn btn-ghost !py-1.5 text-xs" onClick={share}>📡 Share my location</button><button className="btn btn-ghost !py-1.5 text-xs" onClick={demoMove}>🧪 Demo: simulate movement</button></div></>}
      {next && <button className="btn btn-primary mt-3 w-full" disabled={busy} onClick={act}>{next[1]}</button>}
      {msg && <p className="mt-2 text-sm text-mute" role="status">{msg}</p>}</div>
  );
}

export default function Collector() {
  useTitle('Collector'); const q = useApi('/pickups/assigned'); const score = useApi('/score/me');
  return (
    <AppShell>
      <h1 className="text-3xl">Today's work</h1><p className="text-mute">Accept, start and complete your assigned pickups.</p>
      <div className="mt-5"><Async q={q}>{(l) => {
        const active = l.filter((p) => p.status === 'On Route'); const pend = l.filter((p) => ['Assigned', 'Accepted'].includes(p.status)); const done = l.filter((p) => p.status === 'Completed');
        const rated = done.filter((p) => p.rating); const avg = rated.length ? (rated.reduce((a, p) => a + p.rating, 0) / rated.length).toFixed(1) : '–';
        const today = new Date().toISOString().slice(0, 10);
        return <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Stat value={l.filter((p) => p.date === today && p.status !== 'Cancelled').length} label="Today's pickups" /><Stat value={pend.length} label="Pending tasks" color="text-amber-600" /><Stat value={active.length} label="Active pickup" color="text-azure" /><Stat value={done.length} label={`Completed · avg rating ${avg}`} color="text-leaf" /></div>
          <div className="mt-5 max-w-md"><Async q={score}>{(s) => <ScoreCard s={s} />}</Async></div>
          <h2 className="mb-3 mt-8 text-xl">Active</h2>{active.length ? <div className="grid gap-4 md:grid-cols-2">{active.map((p) => <Card key={p._id} p={p} reload={q.reload} />)}</div> : <Empty icon="🛣" text="No active pickup. Start one from the list below." />}
          <h2 className="mb-3 mt-8 text-xl">Pending</h2>{pend.length ? <div className="grid gap-4 md:grid-cols-2">{pend.map((p) => <Card key={p._id} p={p} reload={q.reload} />)}</div> : <Empty text="No pending pickups. Nice work!" />}
          <h2 className="mb-3 mt-8 text-xl">History</h2>{done.length ? <div className="table-wrap bg-white"><table><thead><tr><th>ID</th><th>Type</th><th>Address</th><th>Date</th><th>Rating</th></tr></thead><tbody>{done.map((p) => <tr key={p._id}><td className="font-mono">{p.requestId}</td><td>{p.wasteType}</td><td>{p.address}</td><td>{p.date}</td><td>{p.rating ? '⭐'.repeat(p.rating) : '–'}</td></tr>)}</tbody></table></div> : <Empty text="No completed pickups yet." />}</>; }}</Async></div>
    </AppShell>
  );
}
