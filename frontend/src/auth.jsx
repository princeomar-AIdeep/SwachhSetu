import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const homeFor = (r) => (r === 'admin' ? '/admin' : r === 'collector' ? '/collector' : '/dashboard');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const update = (u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); };
  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener('auth:logout', out);
    if (localStorage.getItem('token')) api('/auth/me').then((d) => update(d.user)).catch(() => {}); // re-validate session on load
    return () => window.removeEventListener('auth:logout', out);
  }, []);
  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', d.token); update(d.user); return d.user;
  };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  return <Ctx.Provider value={{ user, login, logout, update }}>{children}</Ctx.Provider>;
}

// Frontend route guard. The backend ALSO enforces auth + roles on every protected endpoint.
export function RequireAuth({ roles, children }) {
  const { user } = useAuth(); const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
