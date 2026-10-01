import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useTitle, isInvalid } from '../hooks.js';
import { AppShell } from '../components/Shell.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import { Modal, Pill } from '../components/ui.jsx';

const ISSUES = ['Overflowing Bin', 'Garbage on Road', 'Missed Collection', 'Illegal Dumping', 'Other'];

export function AiResult({ ai }) {
  if (!ai) return <p className="text-sm text-mute">No photo attached, so no image analysis was done.</p>;
  if (!ai.available) return <p className="text-sm text-mute">Image analysis is unavailable right now. An admin will review your photo.</p>;
  const pct = Math.round(ai.confidence * 100);
  // Uncertainty is always communicated; AI is assistive, never proof.
  return ai.relevant && !ai.lowConfidence
    ? <div className="rounded-xl bg-leaf/10 p-3 text-sm"><b>Image analysis:</b> waste detected ({pct}% confidence). {ai.label}. <br /><span className="text-mute">Status: ready for review.</span></div>
    : <div className="rounded-xl bg-amber-50 p-3 text-sm"><b>The image could not be confidently identified as a waste issue.</b> Your report was still saved and an admin will review it. For faster handling, upload a clearer, closer, well-lit photo next time.</div>;
}

export default function Report() {
  useTitle('Report an Issue');
  const [f, setF] = useState({ type: '', desc: '', loc: '' }); const [coords, setCoords] = useState(null);
  const [file, setFile] = useState(null); const [bad, setBad] = useState({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); if (!f.loc) setF((x) => ({ ...x, loc: `GPS ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}` })); }, () => setErr('Could not get your location. Please type it instead.'));
  const submit = async (e) => {
    e.preventDefault();
    const b = { type: isInvalid(f.type), desc: isInvalid(f.desc), loc: isInvalid(f.loc) }; setBad(b);
    if (Object.values(b).some(Boolean)) return setErr('Please fill the highlighted fields correctly.');
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (coords) { fd.append('lat', coords.lat); fd.append('lng', coords.lng); }
      if (file) fd.append('photo', file);
      setDone(await api('/reports', { method: 'POST', form: fd }));
    } catch (x) { setErr(x.message || 'Image upload failed. Please try again.'); } finally { setBusy(false); }
  };
  return (
    <AppShell>
      <h1 className="text-3xl">Report a waste issue</h1><p className="text-mute">Help keep your community clean. Your name is never shown publicly.</p>
      <form onSubmit={submit} noValidate className="card mt-5 max-w-2xl">
        <label className="label !mt-0">Issue type</label>
        <select className={`input ${bad.type ? 'bad' : ''}`} value={f.type} onChange={set('type')}><option value="">Select an issue</option>{ISSUES.map((i) => <option key={i}>{i}</option>)}</select>
        <label className="label">Location</label>
        <div className="flex gap-2"><input className={`input ${bad.loc ? 'bad' : ''}`} placeholder="e.g. Civil Lines, near market gate" value={f.loc} onChange={set('loc')} /><button type="button" className="btn btn-ghost shrink-0" onClick={locate}>📍 Use GPS</button></div>
        {coords && <p className="mt-1 text-xs text-leaf">GPS location attached.</p>}
        <label className="label">Description</label><textarea rows="4" className={`input ${bad.desc ? 'bad' : ''}`} placeholder="Describe the issue…" value={f.desc} onChange={set('desc')} />
        <label className="label">Photograph</label><PhotoPicker file={file} onChange={setFile} onError={setErr} />
        <p className="mt-3 min-h-6 text-sm text-bin-haz" role="alert">{err}</p>
        <button className="btn btn-primary w-full sm:w-auto" disabled={busy}>{busy ? 'Submitting & analysing photo…' : 'Submit report'}</button>
      </form>
      <Modal open={!!done} onClose={() => setDone(null)} label="Report submitted">
        {done && <div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf text-2xl text-white">✓</div>
          <h2 className="mt-3 text-2xl">Report submitted</h2><p className="mt-1 font-mono font-bold">{done.complaintId}</p><div className="mt-1"><Pill>{done.status}</Pill></div>
          <div className="mt-4 text-left"><AiResult ai={done.ai} /></div>
          <div className="mt-5 flex justify-center gap-2"><Link to="/tracking" className="btn btn-primary">Track it</Link><Link to="/dashboard" className="btn btn-ghost">Dashboard</Link></div></div>}
      </Modal>
    </AppShell>
  );
}
