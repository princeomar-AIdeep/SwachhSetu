import { useState } from 'react';
import { useApi } from '../hooks.js';
import { api } from '../api.js';
import { fmtDate } from './ui.jsx';

export default function Bell() {
  const q = useApi('/score/notifications'); const [open, setOpen] = useState(false);
  const list = q.data || []; const unread = list.filter((n) => !n.read).length;
  const toggle = async () => { setOpen(!open); if (!open && unread) { await api('/score/notifications/read', { method: 'POST' }).catch(() => {}); setTimeout(q.reload, 1500); } };
  return (
    <div className="relative">
      <button onClick={toggle} className="btn btn-ghost relative !px-3" aria-label="Notifications">🔔{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bin-haz px-1 text-[11px] text-white">{unread}</span>}</button>
      {open && <div className="absolute right-0 mt-2 max-h-96 w-[min(92vw,22rem)] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
        {q.error ? <p className="p-3 text-sm text-red-700">{q.error}</p> : !list.length ? <p className="p-4 text-center text-sm text-mute">No notifications yet.</p> :
          list.map((n) => <div key={n._id} className="rounded-xl p-3 hover:bg-paper"><p className="text-sm font-bold text-navy">{n.title}</p><p className="text-sm text-mute">{n.message}</p><p className="mt-1 text-xs text-mute/70">{fmtDate(n.createdAt)}</p></div>)}</div>}
    </div>
  );
}
