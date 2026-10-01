import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Modal } from './ui.jsx';

// Private, educational (non-humiliating) popup shown only to the affected user after a VERIFIED penalty.
export default function AwarenessPopup() {
  const [n, setN] = useState(null);
  useEffect(() => { api('/score/notifications').then((l) => setN(l.find((x) => x.type === 'penalty' && !x.read && x.awarenessSlug) || null)).catch(() => {}); }, []);
  const close = () => { setN(null); api('/score/notifications/read', { method: 'POST' }).catch(() => {}); };
  return (
    <Modal open={!!n} onClose={close} label="Waste reminder">
      <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf/10 text-3xl">🌱</div>
        <h2 className="mt-3 text-2xl">A quick reminder</h2>
        <p className="mt-2 text-mute">Proper waste segregation helps recyclable materials stay useful and reduces unnecessary landfill waste. Small habits add up — and you can earn your score back.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/awareness" onClick={close} className="btn btn-primary">Learn more</Link>
          <Link to="/wastewise" onClick={close} className="btn btn-ghost">Try WasteWise</Link></div>
        <button onClick={close} className="mt-3 text-sm text-mute underline">Maybe later</button></div>
    </Modal>
  );
}
