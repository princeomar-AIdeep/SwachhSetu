import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi, useTitle } from '../hooks.js';
import { Page } from '../components/Shell.jsx';
import { Async } from '../components/ui.jsx';

// Editorial/magazine feel, deliberately different from the dashboard. All content is read from MongoDB (Awareness + WasteCategory).
// ENHANCE: embed official videos (YouTube nocookie) per section; add admin CRUD for content.
function Source({ x }) { return x.sourceUrl ? <a href={x.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-azure underline">Source: {x.sourceName}</a> : null; }

function ReadBtn({ slug }) {
  const { user } = useAuth(); const [m, setM] = useState('');
  if (!user) return null;
  const go = async () => { try { const d = await api('/score/awareness-read', { method: 'POST', body: { slug } }); setM(d.awarded ? '+2 SwachhScore earned ⭐' : 'Already counted — thanks for revisiting!'); } catch (e) { setM(e.message); } };
  return <div className="mt-3">{m ? <span className="text-sm font-bold text-leaf" role="status">{m}</span> : <button onClick={go} className="btn btn-ghost !py-1.5 text-xs">I read this (+2 ⭐)</button>}</div>;
}

export default function Awareness() {
  useTitle('Awareness');
  const aw = useApi('/awareness'); const cats = useApi('/wastewise/categories');
  return (
    <Page>
      <header className="relative overflow-hidden bg-[#10301d] text-white">
        <img src="/assets/waste/separation-guide-poster.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="relative mx-auto max-w-5xl px-4 py-20"><p className="font-display text-sm tracking-widest text-leaf-2">THE SWACHHSETU JOURNAL</p>
          <h1 className="mt-3 max-w-3xl font-serif !text-white text-5xl leading-tight md:text-7xl" style={{ fontFamily: 'Georgia, serif' }}>A cleaner city begins at the kitchen bin.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">Why cleanliness matters, what the law and government campaigns say, and the small habits that make the biggest difference.</p></div>
      </header>
      <Async q={aw}>{(a) => { const of = (k) => a.filter((x) => x.kind === k);
        return (
          <div className="mx-auto max-w-5xl space-y-20 px-4 py-14">
            {of('section').slice(0, 2).map((s, i) => <article key={s.slug} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <img src={s.image} alt="" loading="lazy" className="w-full rounded-3xl object-cover shadow-xl" />
              <div><h2 className="text-4xl" style={{ fontFamily: 'Georgia, serif' }}>{s.title}</h2><p className="mt-3 text-lg leading-relaxed text-ink/80">{s.body}</p>{s.objective && <p className="mt-3 border-l-4 border-leaf pl-3 italic text-navy">{s.objective}</p>}<ReadBtn slug={s.slug} /></div></article>)}

            <section><h2 className="text-4xl" style={{ fontFamily: 'Georgia, serif' }}>Facts & rules</h2><p className="text-mute">Drawn from official sources. Follow the links for full details.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">{[...of('rule'), ...of('fact')].map((f) => <div key={f.slug} className="rounded-2xl border border-line bg-white p-5"><h3 className="text-xl">{f.title}</h3><p className="mt-1 text-sm text-ink/80">{f.body}</p><Source x={f} /></div>)}</div></section>

            <section><h2 className="text-4xl" style={{ fontFamily: 'Georgia, serif' }}>Government campaigns</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">{of('campaign').map((c) => <article key={c.slug} className="overflow-hidden rounded-3xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"><img src={c.image} alt="" loading="lazy" className="h-44 w-full object-cover" />
                <div className="p-5"><h3 className="text-2xl">{c.title}</h3><p className="mt-1 text-sm">{c.body}</p><p className="mt-2 text-sm"><b>Objective:</b> {c.objective}</p><Source x={c} /></div></article>)}</div></section>

            <section><h2 className="text-4xl" style={{ fontFamily: 'Georgia, serif' }}>Understanding waste types</h2>
              <Async q={cats}>{(c) => <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{c.slice(0, 4).map((x) => <div key={x.slug} className="overflow-hidden rounded-2xl text-white" style={{ background: x.color }}><img src={x.image} alt="" loading="lazy" className="h-32 w-full object-cover" /><div className="p-4"><h3 className="!text-white text-lg">{x.name}</h3><p className="text-xs opacity-80">{x.hindi} · {x.bin}</p><p className="mt-1 text-sm">{x.description}</p></div></div>)}</div>}</Async></section>

            {of('section').slice(2).map((s) => <article key={s.slug} className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr]">
              {s.image ? <img src={s.image} alt="" loading="lazy" className="w-full rounded-3xl object-cover shadow-lg" /> : <div className="grid h-56 place-items-center rounded-3xl bg-leaf text-7xl">♻️</div>}
              <div><h2 className="text-3xl" style={{ fontFamily: 'Georgia, serif' }}>{s.title}</h2><p className="mt-2 leading-relaxed text-ink/80">{s.body}</p><ReadBtn slug={s.slug} /></div></article>)}

            {of('tip').map((t) => <section key={t.slug} className="rounded-3xl bg-navy p-8 text-center text-white md:p-12"><h2 className="!text-white text-3xl" style={{ fontFamily: 'Georgia, serif' }}>{t.title}</h2><p className="mx-auto mt-3 max-w-2xl text-white/80">{t.body}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/report" className="btn btn-primary">Report an issue</Link><Link to="/pickup" className="btn bg-white text-navy hover:bg-leaf-2">Request pickup</Link><Link to="/wastewise" className="btn btn-ghost !border-white/40 !text-white hover:!bg-white hover:!text-navy">WasteWise</Link></div></section>)}
          </div>); }}</Async>
    </Page>
  );
}
