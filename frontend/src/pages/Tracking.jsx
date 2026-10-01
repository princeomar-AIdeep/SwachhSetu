import { useEffect, useState } from 'react';
import { api, assetUrl } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, useTitle } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import MapView from '../components/MapView.jsx';
import { Async, Pill, Empty, fmtDate } from '../components/ui.jsx';
import { AiResult } from './Report.jsx';

const STEPS = ['Pending', 'Assigned', 'Accepted', 'On Route', 'Completed'];
const RSTEPS = ['Pending', 'Under Review', 'In Progress', 'Resolved'];

function Timeline({ steps, current, history }) {
  const idx = steps.indexOf(current);
  return <ol className="mt-3 grid gap-2">{steps.map((s, i) => { const at = history?.find((h) => h.status === s)?.at;
    return <li key={s} className={`flex items-center gap-3 rounded-xl p-2 ${i === idx ? 'bg-leaf/10 font-bold' : ''}`}>
      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs text-white ${i < idx ? 'bg-leaf' : i === idx ? 'bg-azure animate-pulse' : 'bg-gray-300'}`}>{i < idx ? '✓' : i + 1}</span>
      <span className={i > idx ? 'text-mute' : ''}>{s}</span>{at && <span className="ml-auto text-xs text-mute">{fmtDate(at)}</span>}</li>; })}</ol>;
}

function PickupTrack({ p, center, reload }) {
  const [rate, setRate] = useState(0); const [msg, setMsg] = useState('');
  // Real refresh: re-fetch from the server every 15s while the collector is on the way.
  useEffect(() => { if (p.status !== 'On Route') return; const t = setInterval(reload, 15000); return () => clearInterval(t); }, [p.status]); // eslint-disable-line
  const markers = [p.coords && { ...p.coords, label: 'Pickup location', color: '#2A9A3C' }, p.collectorLocation?.lat && { ...p.collectorLocation, label: p.collectorLocation.isDemo ? 'Collector (demo location)' : 'Collector', color: '#1677C8' }].filter(Boolean);
  const cancel = async () => { try { await api(`/pickups/${p.requestId}/cancel`, { method: 'POST' }); reload(); } catch (x) { setMsg(x.message); } };
  const feedback = async (r) => { setRate(r); try { await api(`/pickups/${p.requestId}/feedback`, { method: 'POST', body: { rating: r } }); setMsg('Thanks for your feedback!'); reload(); } catch (x) { setMsg(x.message); } };
  return (
    <div className="card"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-xl">{p.wasteType}</h3><p className="font-mono text-sm text-mute">{p.requestId}</p></div><Pill>{p.status}</Pill></div>
      <div className="mt-4 grid gap-5 lg:grid-cols-2"><div>
        <MapView markers={markers} center={center} height={280} />
        {!p.coords && <p className="mt-2 text-xs text-mute">No exact pin was provided, so the map shows the city centre.</p>}
        {p.collectorLocation?.updatedAt && <p className="mt-2 text-xs text-mute">Collector location updated {new Date(p.collectorLocation.updatedAt).toLocaleTimeString()}{p.collectorLocation.isDemo ? ' · demo data' : ''}</p>}
        {p.status === 'On Route' && !p.collectorLocation?.lat && <p className="mt-2 text-xs text-mute">Collector is on the way but has not shared a location yet.</p>}</div>
        <div><Timeline steps={STEPS} current={p.status === 'Cancelled' ? 'Pending' : p.status} history={p.history} />
          {p.collector && <p className="mt-3 text-sm"><b>Collector:</b> {p.collector.name}{p.collector.phone ? ` · ${p.collector.phone}` : ''}</p>}
          <p className="text-sm text-mute">{p.date} · {p.slot}</p></div></div>
      {['Pending', 'Assigned'].includes(p.status) && <button className="btn btn-ghost mt-4" onClick={cancel}>Cancel pickup</button>}
      {p.status === 'Completed' && !p.rating && <div className="mt-4"><b className="text-sm">Rate this pickup:</b> {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => feedback(n)} className={`text-2xl ${n <= rate ? '' : 'grayscale'}`} aria-label={`${n} stars`}>⭐</button>)}</div>}
      {msg && <p className="mt-2 text-sm text-leaf" role="status">{msg}</p>}
    </div>
  );
}

function ReportCard({ r }) {
  return (
    <div className="card mt-4"><div className="flex items-center justify-between"><h3 className="text-xl">{r.type}</h3><Pill>{r.status}</Pill></div><p className="font-mono text-sm text-mute">{r.complaintId} · {r.loc}</p>
      <p className="mt-2 text-sm">{r.desc}</p>{r.photo && <img src={assetUrl(r.photo)} alt="Reported waste" className="mt-3 max-h-56 rounded-xl" />}
      <div className="mt-3"><AiResult ai={r.ai} /></div><Timeline steps={RSTEPS} current={r.status === 'Rejected' ? 'Pending' : r.status} />
      {r.adminRemark && <p className="mt-2 rounded-xl bg-paper p-3 text-sm"><b>Admin remark:</b> {r.adminRemark}</p>}</div>
  );
}

export default function Tracking() {
  useTitle('Tracking'); const { user } = useAuth();
  const [tab, setTab] = useState('pickups'); const [sel, setSel] = useState(null); const [cid, setCid] = useState(''); const [found, setFound] = useState(null); const [err, setErr] = useState('');
  const pk = useApi('/pickups/mine'); const rep = useApi('/reports/mine'); const locs = useApi('/locations');
  const loc = locs.data?.find((l) => l.city === user.city); const center = loc ? [loc.center.lat, loc.center.lng] : undefined;
  const lookup = async (e) => { e.preventDefault(); setErr(''); setFound(null); try { setFound(await api('/reports/track/' + encodeURIComponent(cid.trim()))); } catch (x) { setErr(x.message); } };
  return (
    <AppShell>
      <h1 className="text-3xl">Tracking</h1>
      <div className="mt-4 inline-flex rounded-full border border-line bg-white p-1">{[['pickups', '🚚 Pickups'], ['reports', '📸 Complaints']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 text-sm font-bold ${tab === k ? 'bg-navy text-white' : 'text-navy'}`}>{l}</button>)}</div>
      {tab === 'pickups' && <div className="mt-4"><Async q={pk}>{(l) => !l.length ? <Empty icon="🚚" text="No pickup requests yet." /> : <>
        <div className="flex flex-wrap gap-2">{l.map((p) => <button key={p._id} onClick={() => setSel(p.requestId)} className={`rounded-xl border px-3 py-2 text-left text-sm ${(sel || l[0].requestId) === p.requestId ? 'border-leaf bg-leaf/10' : 'border-line bg-white'}`}><b>{p.wasteType}</b><br /><span className="text-xs text-mute">{p.requestId}</span></button>)}</div>
        <div className="mt-4"><PickupTrack key={sel || l[0].requestId} p={l.find((p) => p.requestId === (sel || l[0].requestId))} center={center} reload={pk.reload} /></div></>}</Async></div>}
      {tab === 'reports' && <div className="mt-4">
        <form onSubmit={lookup} className="card flex max-w-xl gap-2"><input className="input" placeholder="Enter complaint ID, e.g. SWC-2026-1234" value={cid} onChange={(e) => setCid(e.target.value)} /><button className="btn btn-primary">Track</button></form>
        {err && <p className="mt-2 text-sm text-bin-haz" role="alert">{err}</p>}{found && <ReportCard r={found} />}
        <h3 className="mb-2 mt-6 text-lg">My complaints</h3>
        <Async q={rep}>{(l) => !l.length ? <Empty icon="📸" text="No reports found." /> : <div className="table-wrap bg-white"><table><thead><tr><th>ID</th><th>Issue</th><th>Location</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{l.map((r) => <tr key={r._id} className="cursor-pointer hover:bg-paper" onClick={() => setFound(r)}><td className="font-mono">{r.complaintId}</td><td>{r.type}</td><td>{r.loc}</td><td>{fmtDate(r.createdAt)}</td><td><Pill>{r.status}</Pill></td></tr>)}</tbody></table></div>}</Async></div>}
    </AppShell>
  );
}
