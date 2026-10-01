require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { ensureCatalog } = require('./seed');

fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://swachh-setu-two.vercel.app',
];

function allowedOrigins() {
  const extra = String(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extra])];
}

function corsOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  const clean = origin.replace(/\/$/, '');
  const list = allowedOrigins();
  if (list.includes(clean) || /\.vercel\.app$/i.test(clean)) return cb(null, true);
  cb(null, false);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!MONGO_URI) {
  console.error('❌ FATAL: Set MONGO_URI (or MONGODB_URI) in .env or your hosting dashboard.');
  process.exit(1);
}

async function connectDb() {
  const opts = { serverSelectionTimeoutMS: 20000 };
  let last;
  for (let i = 1; i <= 6; i++) {
    try {
      await mongoose.connect(MONGO_URI, opts);
      console.log('✅ MongoDB connected');
      try { await ensureCatalog(); } catch (e) { console.error('Catalog bootstrap:', e.message); }
      return;
    } catch (e) {
      last = e;
      console.error(`❌ MongoDB attempt ${i}/6:`, e.message);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  console.error('❌ MongoDB connection failed:', last?.message);
}

app.get('/', (_q, res) => res.send('SWACHHSETU API running'));
app.get('/health', (_q, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const db = states[mongoose.connection.readyState] || 'unknown';
  res.status(db === 'connected' ? 200 : 503).json({ ok: db === 'connected', db });
});

app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database is connecting. Please try again in a moment.' });
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/pickups', require('./routes/pickups'));
app.use('/api/score', require('./routes/score'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/content'));

app.use((_q, res) => res.status(404).json({ message: 'Not found.' }));
app.use((err, _q, res, _n) => {
  console.error(err);
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB).' : err.message?.startsWith('Only JPG') ? err.message : 'Something went wrong. Please try again.';
  res.status(err.code === 'LIMIT_FILE_SIZE' || err.message?.startsWith('Only JPG') ? 400 : 500).json({ message: msg });
});

const PORT = process.env.PORT || 5000;

async function start() {
  if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API running on port ${PORT}`));
  }
  await connectDb();
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

module.exports = app;
