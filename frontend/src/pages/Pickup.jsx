import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useTitle, isInvalid } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import { Modal, Pill } from '../components/ui.jsx';

const TYPES = ['Wet Waste', 'Dry Waste', 'E-Waste', 'Hazardous Waste', 'Bulk / Garden Waste'];
const SLOTS = ['Morning (8 AM – 12 PM)', 'Afternoon (12 PM – 4 PM)', 'Evening (4 PM – 7 PM)'];
const today = new Date().toISOString().split('T')[0];

export default function Pickup() {
  useTitle('Request Pickup');
  const [f, setF] = useState({ wasteType: '', date: '', slot: '', address: '', phone: '', notes: '' }); const [coords, setCoords] = useState(null);
  const [bad, setBad] = useState({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value }); const cls = (k) => `input ${bad[k] ? 'bad' : ''}`;
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }), () => setErr('Could not get your location. Please type the address.'));
  const submit = async (e) => {
    e.preventDefault();
    const b = { wasteType: isInvalid(f.wasteType), date: isInvalid(f.date), slot: isInvalid(f.slot), address: isInvalid(f.address), phone: isInvalid(f.phone, { phone: true }) }; setBad(b);
    if (Object.values(b).some(Boolean)) return setErr('Please fill the highlighted fields correctly.');
    setBusy(true); setErr('');
    try { setDone(await api('/pickups', { method: 'POST', body: { ...f, ...(coords || {}) } })); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <AppShell>
      <h1 className="text-3xl">Request a waste pickup</h1><p className="text-mute">Need a collection beyond the regular round? A collector in your service area will be assigned.</p>
      <form onSubmit={submit} noValidate className="card mt-5 max-w-2xl">
        <label className="label !mt-0">Waste type</label><select className={cls('wasteType')} value={f.wasteType} onChange={set('wasteType')}><option value="">Select waste type</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Preferred date</label><input type="date" min={today} className={cls('date')} value={f.date} onChange={set('date')} /></div>
          <div><label className="label">Time slot</label><select className={cls('slot')} value={f.slot} onChange={set('slot')}><option value="">Select a slot</option>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div></div>
        <label className="label">Pickup address</label>
        <div className="flex gap-2"><input className={cls('address')} placeholder="House, street, area" value={f.address} onChange={set('address')} /><button type="button" className="btn btn-ghost shrink-0" onClick={locate}>📍 Pin</button></div>
        {coords && <p className="mt-1 text-xs text-leaf">Exact pin attached — visible only to you and your assigned collector.</p>}
        <label className="label">Contact phone</label><input inputMode="numeric" className={cls('phone')} value={f.phone} onChange={set('phone')} />
        <label className="label">Notes (optional)</label><textarea rows="3" className="input" value={f.notes} onChange={set('notes')} />
        <p className="mt-3 min-h-6 text-sm text-bin-haz" role="alert">{err}</p>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Requesting…' : 'Request pickup'}</button>
      </form>
      <Modal open={!!done} onClose={() => setDone(null)} label="Pickup requested">
        {done && <div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf text-2xl text-white">✓</div><h2 className="mt-3 text-2xl">Pickup requested</h2>
          <p className="mt-1 font-mono font-bold">{done.requestId}</p><div className="mt-1"><Pill>{done.status}</Pill></div>
          <p className="mt-3 text-sm text-mute">{done.status === 'Assigned' ? 'A collector has been assigned.' : 'We will assign a collector soon.'}</p>
          <div className="mt-5 flex justify-center gap-2"><Link to="/tracking" className="btn btn-primary">Track pickup</Link><Link to="/dashboard" className="btn btn-ghost">Dashboard</Link></div></div>}
      </Modal>
    </AppShell>
  );
}
