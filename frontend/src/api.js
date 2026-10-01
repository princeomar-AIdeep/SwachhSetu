// Single API client. The backend URL comes from VITE_API_URL (see .env.example).
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const assetUrl = (u) => (!u ? '' : u.startsWith('/uploads') ? BASE + u : u); // /assets/* are served by Vite, /uploads/* by the API

export async function api(path, { method = 'GET', body, form } = {}) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload }); }
  catch { throw new Error('Cannot reach the server. Please check your connection and try again.'); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) { // expired/invalid session
    localStorage.removeItem('token'); localStorage.removeItem('user'); window.dispatchEvent(new Event('auth:logout'));
  }
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}
