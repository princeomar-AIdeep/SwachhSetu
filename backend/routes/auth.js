const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { protect, sign, publicUser } = require('../middleware/auth');
const { wrap } = require('../utils/helpers');

// Contract kept from the original frontend: register {name,email,phone,password}; login {email,password} -> {token,user}
router.post('/register', wrap(async (req, res) => {
  const { name, email, phone, password, state, city } = req.body;
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !/^\d{10}$/.test(phone || '') || (password || '').length < 6)
    return res.status(400).json({ message: 'Enter a valid name, email, 10-digit phone and a password of 6+ characters.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'This email is already registered.' });
  // role is NEVER taken from the client: public signups are always citizens.
  const u = await User.create({ name: name.trim(), email, phone, password: await bcrypt.hash(password, 10),
    role: 'citizen', state: state || 'Uttar Pradesh', city: city || 'Kanpur' });
  res.status(201).json({ message: 'Registered', user: publicUser(u) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!u || !(await bcrypt.compare(password || '', u.password))) return res.status(401).json({ message: 'Invalid email or password.' });
  res.json({ token: sign(u), user: publicUser(u) });
}));

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

// Privacy controls / profile. Only safe fields are editable.
router.patch('/me', protect, wrap(async (req, res) => {
  const { name, alias, showOnLeaderboard, city, state, serviceArea } = req.body;
  const u = req.user;
  if (name?.trim()) u.name = name.trim();
  if (alias !== undefined) u.alias = String(alias).trim().slice(0, 24);
  if (typeof showOnLeaderboard === 'boolean') u.showOnLeaderboard = showOnLeaderboard;
  if (city) u.city = city; if (state) u.state = state; if (serviceArea !== undefined) u.serviceArea = serviceArea;
  await u.save(); res.json({ user: publicUser(u) });
}));
module.exports = router;
