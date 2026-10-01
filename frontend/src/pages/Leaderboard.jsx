import { useState } from 'react';
import { useApi, useTitle } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import { Async, Empty } from '../components/ui.jsx';
import { ScoreCard } from './Dashboard.jsx';

// Public-safe by construction: the API returns only rank, display name, score, title.
export default function Leaderboard() {
  useTitle('Leaderboard'); const [role, setRole] = useState('citizen');
  const lb = useApi('/score/leaderboard?role=' + role); const me = useApi('/score/me');
  const medal = ['🥇', '🥈', '🥉'];
  return (
    <AppShell>
      <h1 className="text-3xl">SwachhScore Leaderboard</h1><p className="text-mute">Only name, score and title are shown. Penalties and personal data are never public.</p>
      <div className="mt-4 max-w-md"><Async q={me}>{(s) => <ScoreCard s={s} />}</Async></div>
      <div className="mt-6 inline-flex rounded-full border border-line bg-white p-1">{[['citizen', 'Citizens'], ['collector', 'Collectors']].map(([k, l]) => <button key={k} onClick={() => setRole(k)} className={`rounded-full px-5 py-2 text-sm font-bold ${role === k ? 'bg-navy text-white' : 'text-navy'}`}>{l}</button>)}</div>
      <div className="mt-4 max-w-2xl"><Async q={lb}>{(l) => !l.length ? <Empty text="No one is on the board yet." /> : <ol className="grid gap-2">{l.map((u) => <li key={u.rank} className={`flex items-center justify-between rounded-2xl border bg-white px-4 py-3 ${u.rank <= 3 ? 'border-leaf shadow-md' : 'border-line'}`}>
        <span className="flex items-center gap-3"><b className="w-10 font-display text-xl text-navy">{medal[u.rank - 1] || '#' + u.rank}</b><span><b>{u.name}</b><br /><span className="text-xs text-mute">{u.title}</span></span></span><b className="text-lg">⭐ {u.score}</b></li>)}</ol>}</Async></div>
    </AppShell>
  );
}
