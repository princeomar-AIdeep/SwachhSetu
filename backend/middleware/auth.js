const jwt = require('jsonwebtoken');
const { User } = require('../models');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: JWT_SECRET must be set in production.'); process.exit(1);
  } else {
    console.warn('⚠️  JWT_SECRET missing — using insecure dev secret. Set JWT_SECRET before deploying.');
  }
}
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const sign = (u) => jwt.sign({ id: u._id }, SECRET, { expiresIn: '7d' });

// Verifies Bearer token and loads the user fresh from DB (so role changes apply immediately).
async function protect(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Please log in.' });
    const { id } = jwt.verify(h.slice(7), SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}
// Backend authorization - never rely on hidden frontend buttons.
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have access to this.' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role,
  state: u.state, city: u.city, serviceArea: u.serviceArea, alias: u.alias, showOnLeaderboard: u.showOnLeaderboard });

module.exports = { protect, requireRole, sign, publicUser };
