require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // allow frontend (other port) to show /uploads images
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'https://swachh-setu-two.vercel.app/').split(',') }));
app.use(express.json({ limit: '100kb' }));
// ENHANCE: uploads are public-by-URL (random names). For stricter privacy serve via an authenticated route.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((e) => console.error('❌ MongoDB connection error:', e.message));

app.get('/', (_q, res) => res.send('SWACHHSETU API running'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/pickups', require('./routes/pickups'));
app.use('/api/score', require('./routes/score'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/content'));

// Friendly errors - never leak stack traces to users.
app.use((_q, res) => res.status(404).json({ message: 'Not found.' }));
app.use((err, _q, res, _n) => {
  console.error(err);
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB).' : err.message?.startsWith('Only JPG') ? err.message : 'Something went wrong. Please try again.';
  res.status(err.code === 'LIMIT_FILE_SIZE' || err.message?.startsWith('Only JPG') ? 400 : 500).json({ message: msg });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API on https://swachh-setu-two.vercel.app/:${PORT}`));
