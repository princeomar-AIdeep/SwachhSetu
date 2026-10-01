import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { Logo } from './ui.jsx';
import Bell from './Bell.jsx';
import AwarenessPopup from './AwarenessPopup.jsx';

const LINKS = {
  citizen: [['/dashboard', '🏠', 'Dashboard'], ['/report', '📸', 'Report Issue'], ['/pickup', '🚚', 'Request Pickup'], ['/tracking', '📍', 'Tracking'], ['/wastewise', '♻️', 'WasteWise'], ['/awareness', '🌍', 'Awareness'], ['/leaderboard', '🏆', 'Leaderboard'], ['/profile', '👤', 'Profile']],
  collector: [['/collector', '🚛', 'My Pickups'], ['/leaderboard', '🏆', 'Leaderboard'], ['/awareness', '🌍', 'Awareness'], ['/wastewise', '♻️', 'WasteWise'], ['/profile', '👤', 'Profile']],
  admin: [['/admin', '🛠', 'Admin'], ['/awareness', '🌍', 'Awareness'], ['/wastewise', '♻️', 'WasteWise'], ['/leaderboard', '🏆', 'Leaderboard'], ['/profile', '👤', 'Profile']],
};

// Authenticated layout: sidebar (drawer on mobile) + topbar with notifications.
export function AppShell({ children }) {
  const { user, logout } = useAuth(); const nav = useNavigate(); const [open, setOpen] = useState(false);
  const links = LINKS[user.role] || [];
  const side = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link to="/" className="mb-4 block"><Logo className="h-14" /></Link>
      {links.map(([to, icon, label]) => (
        <NavLink key={to} to={to} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-navy text-white shadow' : 'text-navy hover:bg-leaf/10'}`}>
          <span aria-hidden>{icon}</span>{label}</NavLink>
      ))}
      <button onClick={() => { logout(); nav('/'); }} className="mt-auto rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-bin-haz hover:bg-red-50">↩ Log out</button>
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-2xl">{side}</aside></div>}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="btn btn-ghost !px-3 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
          <p className="hidden text-sm text-mute lg:block">Signed in as <b className="text-navy">{user.name}</b> · {user.role}</p>
          <Bell />
        </header>
        <main className="mx-auto max-w-6xl p-4 lg:p-8">{children}</main>
      </div>
      {user.role === 'citizen' && <AwarenessPopup />}
    </div>
  );
}

export function PublicNav() {
  const { user } = useAuth(); const [open, setOpen] = useState(false);
  const items = [['/', 'Home'], ['/awareness', 'Awareness'], ['/wastewise', 'WasteWise'], ['/tracking', 'Tracking'], ['/#team', 'Team'], ['/#contact', 'Contact']];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link to="/"><Logo className="h-14" /></Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-navy md:flex">{items.map(([to, l]) => <Link key={l} to={to} className="hover:text-leaf">{l}</Link>)}</nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? <Link className="btn btn-primary" to={homeFor(user.role)}>My dashboard</Link> : <><Link className="btn btn-ghost" to="/login">Login</Link><Link className="btn btn-primary" to="/register">Get started</Link></>}
        </div>
        <button className="btn btn-ghost !px-3 md:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      </div>
      {open && <div className="grid gap-1 border-t border-line bg-white p-3 md:hidden">
        {items.map(([to, l]) => <Link key={l} to={to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold text-navy hover:bg-leaf/10">{l}</Link>)}
        <Link className="btn btn-primary mt-2" to={user ? homeFor(user.role) : '/login'} onClick={() => setOpen(false)}>{user ? 'My dashboard' : 'Login / Sign up'}</Link></div>}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div><img src="/assets/brand/logo-512.webp" alt="" className="h-16 rounded-xl bg-white p-1" /><h3 className="mt-3 !text-white">SWACHHSETU</h3>
          <p className="text-sm text-white/70">Clean City • Smart Waste • Responsible Action</p></div>
        <div className="grid grid-cols-2 gap-1 text-sm text-white/80">{[['/', 'Home'], ['/awareness', 'Awareness'], ['/wastewise', 'WasteWise'], ['/tracking', 'Tracking'], ['/#team', 'Team'], ['/#contact', 'Contact']].map(([to, l]) => <Link key={l} to={to} className="hover:text-leaf-2">{l}</Link>)}</div>
        <div className="text-sm text-white/80"><b className="text-white">NEURALNEST</b><br />Team 54 · Spectrum 2026<br />Dr. Virendra Swarup Institute of Computer Studies</div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/60">© 2026 NeuralNest · SWACHHSETU Hackathon Prototype</p>
    </footer>
  );
}

// Pages like Awareness / WasteWise are public, but look native inside the app when logged in.
export function Page({ children }) {
  const { user } = useAuth();
  return user ? <AppShell>{children}</AppShell> : <><PublicNav />{children}<Footer /></>;
}
