import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, useTitle } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import { Async } from '../components/ui.jsx';
import { ScoreCard } from './Dashboard.jsx';

export default function Profile() {
  useTitle('Profile'); const { user, update } = useAuth(); const score = useApi('/score/me');
  const [f, setF] = useState({ name: user.name, alias: user.alias || '', showOnLeaderboard: user.showOnLeaderboard !== false }); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const save = async (e) => { e.preventDefault(); setBusy(true); setMsg(''); try { const d = await api('/auth/me', { method: 'PATCH', body: f }); update(d.user); setMsg('Saved ✓'); } catch (x) { setMsg(x.message); } finally { setBusy(false); } };
  return (
    <AppShell>
      <h1 className="text-3xl">Profile & privacy</h1>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <form onSubmit={save} className="card"><label className="label !mt-0">Full name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <label className="label">Public display name (leaderboard)</label><input className="input" maxLength={24} placeholder="Leave blank to show your first name" value={f.alias} onChange={(e) => setF({ ...f, alias: e.target.value })} />
          <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-leaf" checked={f.showOnLeaderboard} onChange={(e) => setF({ ...f, showOnLeaderboard: e.target.checked })} />Show me on the public leaderboard</label>
          <button className="btn btn-primary mt-5" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>{msg && <span className="ml-3 text-sm text-leaf" role="status">{msg}</span>}</form>
        <div className="card text-sm"><h3 className="text-lg">Private to you</h3><p className="mt-2"><b>Email:</b> {user.email}</p><p><b>Phone:</b> {user.phone}</p><p><b>City:</b> {user.city}, {user.state}</p><p className="mt-3 text-mute">Your email, phone, address, reports, pickups and any score reminders are never shown to other users.</p></div>
      </div>
      <div className="mt-5 max-w-md"><Async q={score}>{(s) => <ScoreCard s={s} />}</Async></div>
    </AppShell>
  );
}
