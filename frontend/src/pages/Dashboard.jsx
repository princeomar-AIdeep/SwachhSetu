import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi, useTitle, useCountUp } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import { Async, Pill, Empty, fmtDate } from '../components/ui.jsx';
import Intro from '../components/Intro.jsx';

const ACTIONS = [['/pickup', '🚚', 'Request Pickup', 'Schedule a collection'], ['/tracking', '📍', 'Track Pickup', 'Follow it on the map'], ['/wastewise', '♻️', 'WasteWise', 'Identify & sort waste'], ['/report', '📸', 'Report Waste', 'Upload a photo'], ['/awareness', '🌍', 'Awareness', 'Learn & earn points']];

export function ScoreCard({ s }) {
  const v = useCountUp(s.score);
  const pct = s.next ? Math.min(100, ((s.score - s.min) / (s.next.min - s.min)) * 100) : 100;
  return (
    <div className="rounded-3xl bg-navy p-6 text-white shadow-xl">
      <p className="text-sm text-white/70">Your SwachhScore</p>
      <div className="flex items-end gap-3"><span className="font-display text-6xl font-extrabold">⭐ {v}</span><span className="mb-2 rounded-full bg-leaf px-3 py-1 text-sm font-bold">{s.title}</span></div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-leaf to-leaf-2 transition-all duration-1000" style={{ width: pct + '%' }} /></div>
      <p className="mt-2 text-sm text-white/70">{s.next ? `${s.next.min - s.score} more to reach ${s.next.title}` : 'Top title reached — legend!'} · Rank #{s.rank}</p>
    </div>
  );
}

export default function Dashboard() {
  useTitle('Dashboard'); const { user } = useAuth();
  const score = useApi('/score/me'); const lb = useApi('/score/leaderboard'); const rep = useApi('/reports/mine'); const pk = useApi('/pickups/mine');
  const { key } = useLocation();
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => { setShowIntro(true); }, [key]);
  return (
    <>
    {showIntro && <Intro force />}
    <AppShell>
      <h1 className="text-3xl">Hello, {user.name.split(' ')[0]} 👋</h1><p className="text-mute">What would you like to do today?</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Async q={score}>{(s) => <ScoreCard s={s} />}</Async>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">{ACTIONS.map(([to, i, t, d]) => <Link key={to} to={to} className="card transition hover:-translate-y-1 hover:border-leaf hover:shadow-lg"><div className="text-2xl">{i}</div><b className="text-navy">{t}</b><p className="text-xs text-mute">{d}</p></Link>)}</div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="card"><h3 className="text-lg">My pickups</h3>
          <Async q={pk}>{(l) => !l.length ? <Empty icon="🚚" text="No pickup requests yet."><Link className="btn btn-primary mt-3" to="/pickup">Request one</Link></Empty> :
            l.slice(0, 4).map((p) => <div key={p._id} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"><div><b>{p.wasteType}</b><br /><span className="text-mute">{p.requestId} · {p.date}</span></div><Pill>{p.status}</Pill></div>)}</Async></div>
        <div className="card"><h3 className="text-lg">My reports</h3>
          <Async q={rep}>{(l) => !l.length ? <Empty icon="📸" text="No reports found."><Link className="btn btn-primary mt-3" to="/report">Report an issue</Link></Empty> :
            l.slice(0, 4).map((r) => <div key={r._id} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"><div><b>{r.type}</b><br /><span className="text-mute">{r.complaintId} · {r.loc}</span></div><Pill>{r.status}</Pill></div>)}</Async></div>
        <div className="card"><h3 className="text-lg">Recent score activity</h3>
          <Async q={score}>{(s) => !s.events.length ? <Empty text="Complete a pickup or learn something to earn points." /> :
            s.events.slice(0, 5).map((e, i) => <div key={i} className="flex justify-between border-b border-line py-2 text-sm last:border-0"><span>{e.reason}<br /><span className="text-xs text-mute">{fmtDate(e.createdAt)}</span></span><b className={e.points < 0 ? 'text-bin-haz' : 'text-leaf'}>{e.points > 0 ? '+' : ''}{e.points}</b></div>)}</Async></div>
        <div className="card"><div className="flex items-center justify-between"><h3 className="text-lg">Leaderboard</h3><Link to="/leaderboard" className="text-sm font-bold text-leaf">View all</Link></div>
          <Async q={lb}>{(l) => l.slice(0, 5).map((u) => <div key={u.rank} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"><span><b className="mr-2 text-navy">#{u.rank}</b>{u.name} <span className="text-xs text-mute">{u.title}</span></span><b>⭐ {u.score}</b></div>)}</Async></div>
      </div>
      <div className="mt-6 rounded-2xl bg-leaf/10 p-5"><b className="text-navy">Not sure where your waste belongs?</b><p className="text-sm text-mute">Snap a photo or search in WasteWise — it explains the category and how to dispose of it.</p><Link to="/wastewise" className="btn btn-primary mt-3">Open WasteWise</Link></div>
    </AppShell>
    </>
  );
}
