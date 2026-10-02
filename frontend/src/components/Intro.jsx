import { useEffect, useState } from 'react';

// Logo-reveal video: plays ONCE per browser session, muted, skippable, skipped for reduced-motion. 240KB optimised file.
export default function Intro({ force = false }) {
  const [show, setShow] = useState(() => (force || !sessionStorage.getItem('intro')) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const end = () => { sessionStorage.setItem('intro', '1'); setShow(false); };
  useEffect(() => { if (show) { const t = setTimeout(end, 7000); return () => clearTimeout(t); } }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black">
      <video autoPlay muted playsInline onEnded={end} poster="/assets/brand/logo-reveal-poster.png" className="max-h-[80vh] w-auto max-w-full">
        <source src="/assets/brand/logo-reveal.webm" type="video/webm" /><source src="/assets/brand/logo-reveal.mp4" type="video/mp4" /></video>
      <button onClick={end} className="absolute bottom-6 right-6 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/30">Skip</button>
    </div>
  );
}
