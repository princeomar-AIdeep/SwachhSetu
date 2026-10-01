import { useEffect, useState } from 'react';
import { api } from './api.js';

export const useTitle = (t) => useEffect(() => { document.title = `${t} — SWACHHSETU`; }, [t]);
export const isInvalid = (value, { email, phone } = {}) => {
  const v = String(value || '').trim();
  return !v || (email && !/^\S+@\S+\.\S+$/.test(v)) || (phone && !/^\d{10}$/.test(v));
};

// GET helper with loading / error / reload - every page uses this so states are consistent.
export function useApi(path, enabled = true) {
  const [s, setS] = useState({ data: null, loading: enabled, error: '' });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let on = true;
    setS((x) => ({ ...x, loading: true, error: '' }));
    api(path).then((d) => on && setS({ data: d, loading: false, error: '' })).catch((e) => on && setS({ data: null, loading: false, error: e.message }));
    return () => { on = false; };
  }, [path, n, enabled]);
  return { ...s, reload: () => setN((v) => v + 1) };
}

// Animated counter (score animations). Respects reduced motion.
export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(target);
    let raf, t0;
    const step = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
