import { useState } from 'react';
import { api, assetUrl } from '../api.js';
import { useApi, useTitle, isInvalid } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import MapView from '../components/MapView.jsx';
import { Async, Pill, Empty, Stat, fmtDate, Modal } from '../components/ui.jsx';
import { AiResult } from './Report.jsx';

// ENHANCE ideas: CRUD for Awareness/WasteWise content, CSV export, date-range analytics, real-time updates, audit log.
const TABS = [['overview', 'Overview'], ['reports', 'Reports & verification'], ['pickups', 'Pickups'], ['users', 'Users & score'], ['messages', 'Messages']];

function Overview() {
  const q = useApi('/admin/stats');
  return <Async q={q}>{(s) => { const max = Math.max(1, ...s.byType.map((t) => t.n));
    return <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Stat value={s.total} label="Total complaints" /><Stat value={s.pending} label="Pending" color="text-amber-600" /><Stat value={s.progress} label="In progress" color="text-azure" /><Stat value={s.resolved} label="Resolved" color="text-leaf" /></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card"><h3 className="text-lg">Complaints by type</h3>{s.byType.length ? s.byType.map((t) => <div key={t._id} className="mt-3 text-sm"><div className="flex justify-between"><span>{t._id}</span><b>{t.n}</b></div><div className="h-2.5 rounded-full bg-gray-100"><div className="h-full rounded-full bg-leaf" style={{ width: (t.n / max) * 100 + '%' }} /></div></div>) : <Empty text="No reports yet." />}
          <p className="mt-4 text-sm text-mute">{s.users} citizens · {s.collectors} collectors · Pickups: {s.pickupsByStatus.map((p) => `${p._id} ${p.n}`).join(', ') || 'none'}</p></div>
        <div className="card"><h3 className="text-lg">Waste hotspots</h3><MapView height={240} markers={s.hotspots.filter((h) => h.lat).map((h) => ({ lat: h.lat, lng: h.lng, label: `${h._id} — ${h.n} report(s)`, color: h.n > 1 ? '#D0312D' : '#C9871A' }))} />
          <ul className="mt-3 text-sm">{s.hotspots.map((h) => <li key={h._id} className="flex justify-between border-b border-line py-1 last:border-0"><span>{h._id}</span><b>{h.n}</b></li>)}</ul></div></div></>; }}</Async>;
}

function Reports() {
  const [status, setStatus] = useState(''); const q = useApi('/admin/reports' + (status ? '?status=' + status : '')); const [sel, setSel] = useState(null); const [remark, setRemark] = useState(''); const [msg, setMsg] = useState('');
  const patch = async (body) => { try { await api('/admin/reports/' + sel.complaintId, { method: 'PATCH', body: { adminRemark: remark, ...body } }); setMsg(''); setSel(null); q.reload(); } catch (x) { setMsg(x.message); } };
  return <>
    <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'].map((s) => <option key={s}>{s}</option>)}</select>
    <div className="mt-4"><Async q={q}>{(l) => !l.length ? <Empty text="No reports found." /> : <div className="table-wrap bg-white"><table><thead><tr><th>ID</th><th>Issue</th><th>Location</th><th>By</th><th>AI</th><th>Verification</th><th>Status</th><th /></tr></thead>
      <tbody>{l.map((r) => <tr key={r._id}><td className="font-mono">{r.complaintId}</td><td>{r.type}</td><td>{r.loc}</td><td>{r.user?.name}</td><td>{r.ai?.available ? `${Math.round(r.ai.confidence * 100)}%` : '–'}</td><td><Pill k={r.verification}>{r.verification}</Pill></td><td><Pill>{r.status}</Pill></td><td><button className="btn btn-ghost !py-1 text-xs" onClick={() => { setSel(r); setRemark(r.adminRemark || ''); }}>Review</button></td></tr>)}</tbody></table></div>}</Async></div>
    <Modal open={!!sel} onClose={() => setSel(null)} label="Review report">{sel && <div>
      <h2 className="text-xl">{sel.type}</h2><p className="font-mono text-sm text-mute">{sel.complaintId} · {sel.loc} · {fmtDate(sel.createdAt)}</p><p className="mt-2 text-sm">{sel.desc}</p>
      {sel.photo && <img src={assetUrl(sel.photo)} alt="Reported" className="mt-3 max-h-56 rounded-xl" />}<div className="mt-3"><AiResult ai={sel.ai} /></div>
      <p className="mt-2 text-xs text-mute">AI is assistive only. Verify by looking at the photo yourself. Verifying awards the citizen SwachhScore; rejecting does not penalise.</p>
      <label className="label">Remark (shown to citizen)</label><input className="input" value={remark} onChange={(e) => setRemark(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => patch({ verification: 'verified', status: 'In Progress' })}>✓ Verify</button><button className="btn btn-ghost" onClick={() => patch({ verification: 'needs_review', status: 'Under Review' })}>Needs review</button><button className="btn btn-danger" onClick={() => patch({ verification: 'rejected', status: 'Rejected' })}>Reject</button><button className="btn btn-ghost" onClick={() => patch({ status: 'Resolved' })}>Mark resolved</button></div>
      {msg && <p className="mt-2 text-sm text-bin-haz">{msg}</p>}</div>}</Modal></>;
}

function Pickups() {
  const q = useApi('/admin/pickups'); const us = useApi('/admin/users'); const [msg, setMsg] = useState('');
  const cols = (us.data || []).filter((u) => u.role === 'collector');
  const assign = async (id, collectorId) => { if (!collectorId) return; try { await api(`/admin/pickups/${id}/assign`, { method: 'PATCH', body: { collectorId } }); q.reload(); } catch (x) { setMsg(x.message); } };
  return <><Async q={q}>{(l) => !l.length ? <Empty text="No pickup requests yet." /> : <div className="table-wrap bg-white"><table><thead><tr><th>ID</th><th>Type</th><th>Citizen</th><th>Date</th><th>Collector</th><th>Status</th><th>Assign</th></tr></thead>
    <tbody>{l.map((p) => <tr key={p._id}><td className="font-mono">{p.requestId}</td><td>{p.wasteType}</td><td>{p.user?.name}</td><td>{p.date}</td><td>{p.collector?.name || '–'}</td><td><Pill>{p.status}</Pill></td>
      <td>{!['Completed', 'Cancelled', 'On Route'].includes(p.status) && <select className="input !py-1 text-xs" defaultValue="" onChange={(e) => assign(p.requestId, e.target.value)}><option value="">Assign…</option>{cols.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}</td></tr>)}</tbody></table></div>}</Async>{msg && <p className="mt-2 text-sm text-bin-haz">{msg}</p>}</>;
}

function Users() {
  const q = useApi('/admin/users'); const ev = useApi('/admin/score-events');
  const [pen, setPen] = useState({ userId: '', points: 10, reason: '', topic: 'segregation' }); const [nu, setNu] = useState({ name: '', email: '', phone: '', password: '', role: 'collector' }); const [m1, setM1] = useState(''); const [m2, setM2] = useState('');
  const penalise = async (e) => { e.preventDefault(); try { await api('/admin/penalty', { method: 'POST', body: pen }); setM1('Applied. The user gets a private reminder.'); ev.reload(); q.reload(); setPen({ ...pen, reason: '' }); } catch (x) { setM1(x.message); } };
  const add = async (e) => { e.preventDefault(); if (isInvalid(nu.name) || isInvalid(nu.email, { email: true }) || isInvalid(nu.phone, { phone: true }) || nu.password.length < 6) return setM2('Check the details (password 6+ chars).'); try { await api('/admin/users', { method: 'POST', body: nu }); setM2('User created.'); q.reload(); } catch (x) { setM2(x.message); } };
  return <>
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={penalise} className="card"><h3 className="text-lg">Apply a verified penalty</h3><p className="text-xs text-mute">Only after you have verified a genuine violation — never based on AI output alone.</p>
        <select className="input mt-2" value={pen.userId} onChange={(e) => setPen({ ...pen, userId: e.target.value })}><option value="">Select citizen…</option>{(q.data || []).filter((u) => u.role === 'citizen').map((u) => <option key={u._id} value={u._id}>{u.name} ({u.swachhScore})</option>)}</select>
        <div className="mt-2 flex gap-2"><input type="number" min="1" max="50" className="input !w-24" value={pen.points} onChange={(e) => setPen({ ...pen, points: e.target.value })} /><input className="input" placeholder="Reason (required)" value={pen.reason} onChange={(e) => setPen({ ...pen, reason: e.target.value })} /></div>
        <button className="btn btn-danger mt-3">Apply penalty</button>{m1 && <p className="mt-2 text-sm">{m1}</p>}</form>
      <form onSubmit={add} className="card"><h3 className="text-lg">Add collector / admin</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{['name', 'email', 'phone', 'password'].map((k) => <input key={k} className="input" placeholder={k} type={k === 'password' ? 'password' : 'text'} value={nu[k]} onChange={(e) => setNu({ ...nu, [k]: e.target.value })} />)}<select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}><option>collector</option><option>admin</option></select></div>
        <button className="btn btn-primary mt-3">Create</button>{m2 && <p className="mt-2 text-sm">{m2}</p>}</form></div>
    <h3 className="mb-2 mt-6 text-lg">All users</h3>
    <Async q={q}>{(l) => <div className="table-wrap bg-white"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Score</th><th>Title</th></tr></thead><tbody>{l.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.city}</td><td>{u.swachhScore}</td><td>{u.title}</td></tr>)}</tbody></table></div>}</Async>
    <h3 className="mb-2 mt-6 text-lg">Recent SwachhScore activity</h3>
    <Async q={ev}>{(l) => !l.length ? <Empty text="No score events yet." /> : <div className="table-wrap bg-white"><table><thead><tr><th>User</th><th>Points</th><th>Reason</th><th>Type</th><th>Date</th></tr></thead><tbody>{l.map((e) => <tr key={e._id}><td>{e.user?.name}</td><td className={e.points < 0 ? 'font-bold text-bin-haz' : 'font-bold text-leaf'}>{e.points}</td><td>{e.reason}</td><td>{e.kind}</td><td>{fmtDate(e.createdAt)}</td></tr>)}</tbody></table></div>}</Async></>;
}

function Messages() {
  const q = useApi('/admin/messages');
  return <Async q={q}>{(l) => !l.length ? <Empty icon="✉️" text="No messages yet." /> : <div className="grid gap-3">{l.map((m) => <div key={m._id} className="card"><b>{m.name}</b> <span className="text-sm text-mute">{m.email} · {fmtDate(m.createdAt)}</span><p className="mt-1 text-sm">{m.message}</p></div>)}</div>}</Async>;
}

export default function Admin() {
  useTitle('Admin'); const [tab, setTab] = useState('overview'); const View = { overview: Overview, reports: Reports, pickups: Pickups, users: Users, messages: Messages }[tab];
  return (
    <AppShell>
      <h1 className="text-3xl">Admin console</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tab === k ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}>{l}</button>)}</div>
      <div className="mt-5"><View /></div>
    </AppShell>
  );
}
