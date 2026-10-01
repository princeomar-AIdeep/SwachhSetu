// Single API client. Production never talks to localhost — that is why the live site was failing.
function resolveBase() {
  const raw = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  const isLoopback = !raw || /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);
  if (import.meta.env.PROD) {
    if (isLoopback) return ''; // same-origin; Vercel rewrites /api and /uploads to Render
    return raw;
  }
  return raw || 'http://localhost:5000';
}

const BASE = resolveBase();

export const assetUrl = (u) => (!u ? '' : u.startsWith('/uploads') ? BASE + u : u);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOnce(url, init) {
  const res = await fetch(url, init);
  const ct = res.headers.get('content-type') || '';
  // Render free-tier wake page is HTML; treat as retryable.
  if (res.ok && ct && !ct.includes('json') && !ct.includes('octet-stream')) {
    const err = new Error('WAKING');
    err.retryable = true;
    throw err;
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    const err = new Error('RETRY');
    err.retryable = true;
    err.res = res;
    throw err;
  }
  return res;
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const url = `${BASE}/api${path}`;
  let res;
  for (let i = 0; i < 4; i++) {
    try {
      res = await fetchOnce(url, { method, headers, body: payload });
      break;
    } catch (e) {
      if (i === 3) {
        throw new Error('Cannot reach the server. Please check your connection and try again.');
      }
      await wait(1200 * (i + 1));
    }
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    localStorage.removeItem('token'); localStorage.removeItem('user'); window.dispatchEvent(new Event('auth:logout'));
  }
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}
