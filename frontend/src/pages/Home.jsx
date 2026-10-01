import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, useTitle, isInvalid } from '../hooks.js';
import { PublicNav, Footer } from '../components/Shell.jsx';
import Intro from '../components/Intro.jsx';
import { Stat, Async } from '../components/ui.jsx';
import { useAuth, homeFor } from '../auth.jsx';

const FEATURES = [['🏆', 'SwachhScore', 'Earn a score and a title for responsible waste actions. Verified by the backend, never editable from the browser.'], ['♻️', 'WasteWise', 'Know your waste. Search it or photograph it and get a category and disposal guide.'],
  ['📸', 'Report with a photo', 'Report garbage with location and a picture. AI checks relevance; admins make the final call.'], ['🚚', 'Smart pickup', 'Request a pickup, get a collector assigned and follow each step on a map.'],
  ['🌍', 'Awareness', 'Government campaigns, rules and simple habits, sourced from official bodies.'], ['🛠', 'Admin insight', 'Hotspots, verification queue and analytics for authorities.']];
const TEAM = [['Prince Omar', 'Frontend Developer · Team Leader'], ['Om Tiwari', 'Deployment Manager'], ['Piyush Tripathi', 'Backend Developer'], ['Vaishnavi Tripathi', 'Frontend & Bug Manager']];
const FLOW = ['Requested', 'Assigned', 'Accepted', 'On route', 'Completed'];

export default function Home() {
  useTitle('Clean City. Smart Waste. Responsible Action.');
  const { user } = useAuth();
  const cats = useApi('/wastewise/categories'); const aw = useApi('/awareness'); const st = useApi('/public/stats'); const titles = useApi('/score/titles');
  return (
    <>
      <Intro /><PublicNav />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_.9fr] md:py-20">
          <div>
            <p className="inline-block rounded-full bg-leaf/10 px-3 py-1 text-sm font-bold text-leaf">NeuralNest · Team 54 · Spectrum 2026</p>
            <h1 className="mt-4 text-5xl leading-[1.02] md:text-7xl">Clean City.<br />Smart Waste.<br /><span className="text-leaf">Responsible Action.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-mute">SWACHHSETU is the digital bridge between citizens, waste collectors and administrators: report, sort, schedule, track and learn — and get recognised for doing it right.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link className="btn btn-primary !px-7 !py-3.5 text-base" to={user ? homeFor(user.role) : '/register'}>Get started</Link><Link className="btn btn-ghost !px-7 !py-3.5 text-base" to="/wastewise">Explore WasteWise</Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <img src="/assets/waste/wet-waste-bin.webp" alt="Green organic waste collection bin" className="w-[78%] rotate-[-4deg] rounded-3xl shadow-2xl" />
            <img src="/assets/waste/dry-waste-bin.webp" alt="Blue dry waste collection bin" className="absolute -bottom-8 right-0 w-[70%] rotate-[5deg] rounded-3xl border-4 border-paper shadow-2xl" />
            <img src="/assets/brand/logo-512.webp" alt="" className="absolute left-0 -top-6 h-24 sm:-left-4 animate-float rounded-2xl bg-white p-1 shadow-xl" />
          </div>
        </div>
        <div className="flex h-2">{['bg-bin-wet', 'bg-bin-dry', 'bg-bin-haz', 'bg-bin-ewaste'].map((c) => <i key={c} className={`flex-1 ${c}`} />)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl md:text-4xl">Why a bridge?</h2>
        <p className="mt-3 max-w-3xl text-mute">Cities generate waste every day, but collection is still largely manual. Bins overflow, collection is missed, segregation is poor and citizens have no single place to report problems or see them solved. Authorities lack the data to find hotspots. SWACHHSETU connects those pieces.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map(([i, t, d]) => <div key={t} className="card transition hover:-translate-y-1 hover:shadow-lg"><div className="text-3xl">{i}</div><h3 className="mt-2 text-xl">{t}</h3><p className="mt-1 text-sm text-mute">{d}</p></div>)}</div>
      </section>

      <section className="bg-navy py-16 text-white"><div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        <div><h2 className="!text-white text-3xl md:text-4xl">Your SwachhScore grows with every good action.</h2>
          <p className="mt-3 text-white/70">Completed pickups, verified reports and learning earn points. Only verified events can lower it, and any reminder stays private to you. The public leaderboard shows just rank, name and title.</p>
          <Link to="/leaderboard" className="btn btn-primary mt-6">See the leaderboard</Link></div>
        <Async q={titles}>{(t) => <ol className="grid gap-2">{t.map((x, i) => <li key={x.title} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3" style={{ marginLeft: i * 8 }}><b>{x.title}</b><span className="text-sm text-leaf-2">{x.min}+ ⭐</span></li>)}</ol>}</Async>
      </div></section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-3xl md:text-4xl">WasteWise</h2><p className="text-mute">Know Your Waste. Sort It Right.</p></div><Link to="/wastewise" className="btn btn-ghost">Open WasteWise</Link></div>
        <Async q={cats}>{(c) => <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{c.map((x) => <div key={x.slug} className="overflow-hidden rounded-2xl border-l-8 bg-white shadow-sm" style={{ borderColor: x.color }}><div className="p-4"><h3 className="text-lg" style={{ color: x.color }}>{x.name}</h3><p className="text-xs text-mute">{x.hindi} · {x.bin}</p><p className="mt-1 text-sm">{x.description}</p></div></div>)}</div>}</Async>
      </section>

      <section className="bg-white py-16"><div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl md:text-4xl">Pickup you can follow</h2><p className="mt-2 text-mute">A real status trail from request to completion, with the collector's shared location on a map once they are on the way.</p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-5">{FLOW.map((s, i) => <li key={s} className="relative rounded-2xl border border-line p-4 text-center"><div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-leaf font-bold text-white">{i + 1}</div><p className="mt-2 font-semibold text-navy">{s}</p></li>)}</ol></div></section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-3xl md:text-4xl">Awareness</h2><Link to="/awareness" className="btn btn-ghost">Read more</Link></div>
        <Async q={aw}>{(a) => <div className="mt-6 grid gap-4 md:grid-cols-3">{a.filter((x) => x.kind === 'campaign').slice(0, 3).map((x) => <article key={x.slug} className="overflow-hidden rounded-2xl bg-white shadow-sm"><img src={x.image} alt="" loading="lazy" className="h-40 w-full object-cover" /><div className="p-4"><h3 className="text-lg">{x.title}</h3><p className="text-sm text-mute">{x.body}</p></div></article>)}</div>}</Async>
      </section>

      <section className="bg-leaf/10 py-14"><div className="mx-auto max-w-6xl px-4"><h2 className="text-3xl">Platform activity</h2><p className="text-sm text-mute">Live numbers from our database.</p>
        <Async q={st}>{(s) => <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4"><Stat value={s.citizens} label="Citizens" /><Stat value={s.reports} label="Reports filed" color="text-azure" /><Stat value={s.resolved} label="Issues resolved" color="text-leaf" /><Stat value={s.pickups} label="Pickups completed" color="text-navy" /></div>}</Async></div></section>

      <section id="team" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="text-3xl md:text-4xl">Team NeuralNest</h2><p className="text-mute">Team 54 · Spectrum 2026 · Dr. Virendra Swarup Institute of Computer Studies</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{TEAM.map(([n, r]) => <div key={n} className="card text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-navy font-display text-2xl text-white">{n[0]}</div><h3 className="mt-3 text-lg">{n}</h3><p className="text-sm text-mute">{r}</p></div>)}</div>
      </section>
      <Contact /><Footer />
    </>
  );
}

function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '' }); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (isInvalid(f.name) || isInvalid(f.email, { email: true }) || isInvalid(f.message)) return setMsg({ bad: true, t: 'Please fill all fields with a valid email.' });
    setBusy(true);
    try { await api('/contact', { method: 'POST', body: f }); setMsg({ t: 'Thank you! We received your message.' }); setF({ name: '', email: '', message: '' }); }
    catch (x) { setMsg({ bad: true, t: x.message }); } finally { setBusy(false); }
  };
  return (
    <section id="contact" className="scroll-mt-20 bg-white py-16"><div className="mx-auto max-w-2xl px-4">
      <h2 className="text-3xl">Contact us</h2><p className="text-mute">Questions, feedback or want to bring SWACHHSETU to your area?</p>
      <form onSubmit={send} noValidate className="mt-4">
        <input className="input" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input mt-3" type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <textarea className="input mt-3" rows="4" placeholder="Message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        {msg && <p className={`mt-2 text-sm ${msg.bad ? 'text-bin-haz' : 'text-leaf'}`} role="alert">{msg.t}</p>}
        <button className="btn btn-primary mt-3" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button></form></div></section>
  );
}
