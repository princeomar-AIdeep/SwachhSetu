import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { useTitle, isInvalid } from '../hooks.js';
import { Logo } from '../components/ui.jsx';
import Intro from '../components/Intro.jsx';

export function AuthLayout({ title, sub, children }) {
  return (
    <>
    <Intro force />
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/"><Logo className="h-20 rounded-2xl bg-white p-2" /></Link>
        <div className="relative z-10"><h1 className="!text-white text-5xl">Connecting citizens with cleaner communities.</h1>
          <p className="mt-4 text-lg text-white/70">Report → Resolve → Clean</p></div>
        <img src="/assets/waste/separation-guide-poster.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        <small className="relative z-10 text-white/50">© 2026 NeuralNest · Team 54</small>
      </aside>
      <main className="grid place-items-center p-5">
        <div className="w-full max-w-md"><Link to="/" className="lg:hidden"><Logo className="mx-auto mb-4 h-20" /></Link>
          <h2 className="text-3xl">{title}</h2><p className="text-mute">{sub}</p>{children}</div>
      </main>
    </div>
    </>
  );
}

export default function Login() {
  useTitle('Login');
  const { login } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' }); const [bad, setBad] = useState({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const b = { email: isInvalid(f.email, { email: true }), password: isInvalid(f.password) }; setBad(b);
    if (b.email || b.password) return setErr('Please fill the highlighted fields correctly.');
    setBusy(true); setErr('');
    try { const u = await login(f.email, f.password); nav(loc.state?.from || homeFor(u.role), { replace: true }); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Welcome back" sub="Sign in to continue to SWACHHSETU">
      <form onSubmit={submit} noValidate>
        <label className="label">Email</label><input type="email" autoComplete="email" className={`input ${bad.email ? 'bad' : ''}`} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <label className="label">Password</label><input type="password" autoComplete="current-password" className={`input ${bad.password ? 'bad' : ''}`} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <p className="mt-2 min-h-6 text-sm text-bin-haz" role="alert">{err}</p>
        <button className="btn btn-primary mt-2 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        <p className="mt-4 text-center text-sm text-mute">New to SWACHHSETU? <Link className="font-bold text-leaf" to="/register">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}
