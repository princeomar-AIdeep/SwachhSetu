import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, useTitle, isInvalid } from '../hooks.js';
import { AuthLayout } from './Login.jsx';

export default function Register() {
  useTitle('Register');
  const nav = useNavigate(); const locs = useApi('/locations');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', city: 'Kanpur' });
  const [bad, setBad] = useState({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const b = { name: isInvalid(f.name), email: isInvalid(f.email, { email: true }), phone: isInvalid(f.phone, { phone: true }), password: f.password.length < 6, confirm: f.confirm !== f.password }; setBad(b);
    if (Object.values(b).some(Boolean)) return setErr(b.confirm && !b.password ? 'Passwords do not match.' : 'Please fill the highlighted fields (password 6+ characters, 10-digit phone).');
    setBusy(true); setErr('');
    try {
      const loc = (locs.data || []).find((l) => l.city === f.city);
      await api('/auth/register', { method: 'POST', body: { name: f.name, email: f.email, phone: f.phone, password: f.password, city: f.city, state: loc?.state } });
      nav('/login');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const inp = (k, label, extra = {}) => (<><label className="label">{label}</label><input className={`input ${bad[k] ? 'bad' : ''}`} value={f[k]} onChange={set(k)} {...extra} /></>);
  return (
    <AuthLayout title="Create account" sub="Join the bridge to a cleaner community">
      <form onSubmit={submit} noValidate>
        {inp('name', 'Full name', { autoComplete: 'name' })}{inp('email', 'Email', { type: 'email', autoComplete: 'email' })}
        {inp('phone', 'Phone (10 digits)', { inputMode: 'numeric', autoComplete: 'tel' })}
        <label className="label">City</label>
        <select className="input" value={f.city} onChange={set('city')}>{(locs.data?.length ? locs.data : [{ city: 'Kanpur' }]).map((l) => <option key={l.city}>{l.city}</option>)}</select>
        {inp('password', 'Password', { type: 'password', autoComplete: 'new-password' })}{inp('confirm', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
        <p className="mt-2 min-h-6 text-sm text-bin-haz" role="alert">{err}</p>
        <button className="btn btn-primary mt-2 w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="mt-4 text-center text-sm text-mute">Already registered? <Link className="font-bold text-leaf" to="/login">Login</Link></p>
      </form>
    </AuthLayout>
  );
}
