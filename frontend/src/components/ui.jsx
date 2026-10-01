import { useEffect } from 'react';
import { useCountUp } from '../hooks.js';

export const Logo = ({ className = 'h-10', full = false }) => (
  <img src={full ? '/assets/brand/logo.png' : '/assets/brand/logo-512.webp'} alt="SWACHHSETU" className={`${className} w-auto object-contain`} />
);

const PILL = { Pending: 'bg-amber-100 text-amber-800', 'Under Review': 'bg-sky-100 text-sky-800', 'In Progress': 'bg-blue-100 text-blue-800', Assigned: 'bg-indigo-100 text-indigo-800',
  Accepted: 'bg-cyan-100 text-cyan-800', 'On Route': 'bg-blue-100 text-blue-800', Resolved: 'bg-green-100 text-green-800', Completed: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800', Cancelled: 'bg-gray-200 text-gray-700', HIGH: 'bg-red-100 text-red-800', MEDIUM: 'bg-amber-100 text-amber-800', LOW: 'bg-green-100 text-green-800',
  verified: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', needs_review: 'bg-amber-100 text-amber-800', pending: 'bg-gray-100 text-gray-700' };
export const Pill = ({ children, k }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${PILL[k ?? children] || 'bg-gray-100 text-gray-700'}`}>{String(children).replace('_', ' ')}</span>;

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center gap-3 p-6 text-mute" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-leaf border-t-transparent" />{label}</div>
);
export const ErrorBox = ({ message, onRetry }) => (
  <div className="card border-red-200 bg-red-50 text-center" role="alert"><p className="font-semibold text-red-800">Unable to load data.</p><p className="text-sm text-red-700">{message}</p>
    {onRetry && <button className="btn btn-ghost mt-3" onClick={onRetry}>Try again</button>}</div>
);
export const Empty = ({ icon = '🌱', text, children }) => (
  <div className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-mute"><div className="text-3xl">{icon}</div><p className="mt-2">{text}</p>{children}</div>
);
// Wraps useApi() result: loading -> error -> children(data)
export const Async = ({ q, children }) => q.loading ? <Spinner /> : q.error ? <ErrorBox message={q.error} onRetry={q.reload} /> : children(q.data);

export function Modal({ open, onClose, children, label }) {
  useEffect(() => { if (!open) return; const f = (e) => e.key === 'Escape' && onClose?.(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-navy/60 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <div className="max-h-[90vh] w-full max-w-md animate-pop overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export const Stat = ({ value, label, color = 'text-navy' }) => {
  const v = useCountUp(Number(value) || 0);
  return <div className="card"><div className={`font-display text-4xl font-extrabold ${color}`}>{v}</div><div className="text-sm text-mute">{label}</div></div>;
};

export const Field = ({ label, error, children }) => (<div><label className="label">{label}</label>{children}{error && <p className="mt-1 text-sm text-bin-haz">{error}</p>}</div>);
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
