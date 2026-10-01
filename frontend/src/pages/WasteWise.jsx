import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, useTitle } from '../hooks.js';
import { Page } from '../components/Shell.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import { Async, Empty } from '../components/ui.jsx';

const FLOW = ['Identify', 'Classify', 'Understand', 'Segregate', 'Dispose'];
const Badge = ({ yes, a, b }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${yes ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{yes ? a : b}</span>;

function ItemCard({ it, cats }) {
  const c = cats.find((x) => x.slug === it.category);
  return (
    <div className="card border-l-8" style={{ borderLeftColor: c?.color }}>
      <h3 className="text-xl">{it.name}</h3>
      <p className="text-sm font-semibold" style={{ color: c?.color }}>{c?.name}{c ? ` · ${c.bin}` : ''}</p>
      <div className="mt-2 flex gap-2"><Badge yes={it.biodegradable} a="Biodegradable" b="Non-biodegradable" /><Badge yes={it.recyclable} a="Recyclable" b="Not recyclable" /></div>
      <dl className="mt-3 space-y-1 text-sm"><div><b>Handling:</b> {it.handling}</div>{it.composting && <div><b>Composting:</b> {it.composting}</div>}
        {it.mistakes && <div><b>Common mistake:</b> {it.mistakes}</div>}{it.safety && <div className="text-bin-haz"><b>Safety:</b> {it.safety}</div>}{it.environment && <div><b>Environment:</b> {it.environment}</div>}</dl>
    </div>
  );
}

function Search({ cats }) {
  const [q, setQ] = useState(''); const [res, setRes] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { // debounced search against the DB
    if (q.trim().length < 2) return setRes(null);
    const t = setTimeout(() => api('/wastewise/search?q=' + encodeURIComponent(q)).then((d) => { setRes(d); setErr(''); }).catch((e) => setErr(e.message)), 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div>
      <input className="input !py-3.5 text-lg" placeholder="Search waste… banana peel, battery, plastic bottle" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search waste" />
      {err && <p className="mt-2 text-sm text-bin-haz">{err}</p>}
      {res && (res.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{res.map((it) => <ItemCard key={it._id} it={it} cats={cats} />)}</div> : <div className="mt-4"><Empty icon="🔎" text={`Nothing found for "${q}". Try another word, or use the photo identifier.`} /></div>)}
    </div>
  );
}

function Identify({ cats }) {
  const { user } = useAuth(); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [r, setR] = useState(null);
  if (!user) return <div className="card text-center"><p>Sign in to identify waste from a photo.</p><Link to="/login" className="btn btn-primary mt-3">Login</Link></div>;
  const go = async () => {
    if (!file) return setErr('Please choose a photo first.'); setBusy(true); setErr(''); setR(null);
    try { const fd = new FormData(); fd.append('photo', file); setR(await api('/wastewise/identify', { method: 'POST', form: fd })); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const c = r?.categoryInfo;
  return (
    <div className="card"><PhotoPicker file={file} onChange={(f) => { setFile(f); setR(null); }} onError={setErr} />
      <button className="btn btn-primary mt-3" onClick={go} disabled={busy}>{busy ? 'Analysing…' : '✨ Identify waste'}</button>
      {err && <p className="mt-2 text-sm text-bin-haz" role="alert">{err}</p>}
      {r && !r.available && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">AI identification is not enabled on this server yet. You can still use the search above.</p>}
      {r?.available && (r.lowConfidence || !r.item ?
        <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm"><b>The image could not be identified confidently.</b><ul className="mt-1 list-disc pl-5"><li>Use a clearer photograph</li><li>Try better lighting</li><li>Take a closer image of one item</li></ul></div> :
        <div className="mt-4 rounded-2xl border-l-8 bg-paper p-4" style={{ borderLeftColor: c?.color }}>
          <p className="text-xs font-bold text-mute">AI IDENTIFICATION · may be wrong</p>
          <p className="mt-1 text-sm">Possible match:</p><h3 className="text-2xl">{r.item}</h3>
          <p className="text-sm text-mute">Confidence: {Math.round(r.confidence * 100)}%</p>
          {c && <p className="mt-2 font-bold" style={{ color: c.color }}>{c.name} — {c.bin}</p>}
          <div className="mt-2 flex gap-2"><Badge yes={r.biodegradable} a="Biodegradable" b="Non-biodegradable" /><Badge yes={r.recyclable} a="Recyclable" b="Not recyclable" /></div>
          <p className="mt-3 text-sm"><b>Suggested disposal:</b> {r.disposal}</p>
          {r.guide && <div className="mt-3"><ItemCard it={r.guide} cats={cats} /></div>}</div>)}
    </div>
  );
}

function Three({ aw }) {
  const s = aw.find((x) => x.slug === '3rs'); const [open, setOpen] = useState(0);
  const parts = (s?.body || '').split(/(?<=\.)\s+/).filter(Boolean); const icons = ['📉', '🔁', '♻️']; const cols = ['#1F5FBF', '#C9871A', '#2E9D34'];
  return <div className="grid gap-3 md:grid-cols-3">{parts.map((p, i) => { const [t, ...rest] = p.split(':');
    return <button key={t} onClick={() => setOpen(i)} className={`rounded-2xl p-5 text-left text-white transition ${open === i ? 'scale-[1.03] shadow-xl' : 'opacity-80'}`} style={{ background: cols[i] }}>
      <div className="text-3xl">{icons[i]}</div><h3 className="!text-white text-2xl">{t}</h3><p className={`mt-1 text-sm ${open === i ? '' : 'hidden md:block'}`}>{rest.join(':').trim()}</p></button>; })}</div>;
}

export default function WasteWise() {
  useTitle('WasteWise');
  const cats = useApi('/wastewise/categories'); const aw = useApi('/awareness'); const mis = useApi('/wastewise/mistakes');
  return (
    <Page>
      <div className="bg-gradient-to-br from-navy to-navy-2 text-white"><div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="!text-white text-5xl md:text-6xl">WasteWise</h1><p className="mt-2 text-xl text-leaf-2">Know Your Waste. Sort It Right.</p>
        <ol className="mt-6 flex flex-wrap gap-2">{FLOW.map((f, i) => <li key={f} className="rounded-full bg-white/10 px-4 py-1.5 text-sm">{i + 1}. {f}</li>)}</ol></div></div>
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        <Async q={cats}>{(c) => <>
          <section><h2 className="mb-3 text-2xl">Search your waste</h2><Search cats={c} /></section>
          <section><h2 className="mb-1 text-2xl">Identify from a photo</h2><p className="mb-3 text-sm text-mute">AI gives a suggestion with a confidence score. Always double-check when unsure.</p><Identify cats={c} /></section>
          <section><h2 className="mb-3 text-2xl">Waste categories</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{c.map((x) => <article key={x.slug} className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="relative h-40"><img src={x.image} alt="" loading="lazy" className="h-full w-full object-cover" /><span className="absolute inset-x-0 bottom-0 px-4 py-2 font-display text-lg font-bold text-white" style={{ background: x.color }}>{x.name}</span></div>
              <div className="p-4 text-sm"><p className="text-mute">{x.hindi} · {x.bin}</p><p className="mt-1">{x.description}</p><p className="mt-2 font-semibold">Examples</p><p className="text-mute">{x.examples.join(' · ')}</p>
                <ol className="mt-2 list-decimal space-y-0.5 pl-5">{x.steps.map((s) => <li key={s}>{s}</li>)}</ol></div></article>)}</div></section>
          <section><h2 className="mb-3 text-2xl">Home waste manual</h2>
            <Async q={aw}>{(a) => { const by = (s) => a.find((x) => x.slug === s); const sec = [['Understand waste', by('why-clean')?.body], ['Segregate at source', by('segregation')?.body],
              ...c.filter((x) => ['wet', 'dry', 'hazardous', 'ewaste', 'sanitary'].includes(x.slug)).map((x) => [x.name, `${x.description} ${x.steps.join('. ')}.`]), ['Composting basics', by('composting')?.body], ['The 3Rs', by('3rs')?.body],
              ['Common mistakes', (mis.data || []).slice(0, 4).map((m) => `${m.name}: ${m.mistakes}`).join(' ')]];
              return <div className="grid gap-3 md:grid-cols-2">{sec.map(([t, b], i) => <details key={t} className="card group" open={i === 0}><summary className="cursor-pointer list-none font-display text-lg font-bold text-navy"><span className="mr-2 text-leaf">{String(i + 1).padStart(2, '0')}</span>{t}</summary><p className="mt-2 text-sm text-mute">{b}</p></details>)}</div>; }}</Async></section>
          <section><h2 className="mb-3 text-2xl">Reduce · Reuse · Recycle</h2><Async q={aw}>{(a) => <Three aw={a} />}</Async></section></>}</Async>
        <div className="rounded-2xl bg-leaf/10 p-6 text-center"><b className="text-navy">Sorted it right? Put it into action.</b><div className="mt-3 flex justify-center gap-2"><Link to="/pickup" className="btn btn-primary">Request pickup</Link><Link to="/report" className="btn btn-ghost">Report an issue</Link></div></div>
      </div>
    </Page>
  );
}
