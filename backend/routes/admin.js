const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Report, Pickup, ScoreEvent, Contact, Notification } = require('../models');
const { protect, requireRole } = require('../middleware/auth');
const { wrap } = require('../utils/helpers');
const { award, POINTS, titleFor } = require('../utils/score');

router.use(protect, requireRole('admin')); // EVERYTHING below is admin-only on the backend

router.get('/stats', wrap(async (_q, res) => {
  const count = (s) => Report.countDocuments({ status: s });
  const [total, pending, progress, resolved, byType, hot, pickupsByStatus] = await Promise.all([
    Report.countDocuments(), count('Pending'), count('In Progress'), count('Resolved'),
    Report.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Report.aggregate([{ $group: { _id: '$loc', n: { $sum: 1 }, lat: { $first: '$coords.lat' }, lng: { $first: '$coords.lng' } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
    Pickup.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({ total, pending, progress, resolved, byType, hotspots: hot, pickupsByStatus,
    users: await User.countDocuments({ role: 'citizen' }), collectors: await User.countDocuments({ role: 'collector' }) });
}));

router.get('/reports', wrap(async (req, res) => {
  const q = req.query.status ? { status: req.query.status } : {};
  res.json(await Report.find(q).sort('-createdAt').limit(100).populate('user', 'name email').lean());
}));

// Verify / reject / needs review. Only a verified report awards score. Rejection does NOT penalise by itself.
router.patch('/reports/:id', wrap(async (req, res) => {
  const { status, verification, adminRemark } = req.body;
  const r = await Report.findOne({ complaintId: req.params.id.toUpperCase() });
  if (!r) return res.status(404).json({ message: 'Report not found.' });
  if (status && Report.schema.path('status').enumValues.includes(status)) r.status = status;
  if (verification && Report.schema.path('verification').enumValues.includes(verification)) r.verification = verification;
  if (adminRemark !== undefined) r.adminRemark = String(adminRemark).slice(0, 300);
  await r.save();
  if (r.verification === 'verified') await award({ userId: r.user, points: POINTS.reportVerified, reason: `Report ${r.complaintId} was verified`, kind: 'report', refKey: `report:${r._id}` });
  await Notification.create({ user: r.user, type: 'report', title: `Report ${r.complaintId} updated`, message: `Status: ${r.status}${r.adminRemark ? ' — ' + r.adminRemark : ''}` });
  res.json(r);
}));

router.get('/pickups', wrap(async (_q, res) => res.json(await Pickup.find().sort('-createdAt').limit(100).populate('user', 'name').populate('collector', 'name').lean())));
router.patch('/pickups/:id/assign', wrap(async (req, res) => {
  const c = await User.findOne({ _id: req.body.collectorId, role: 'collector' });
  const p = await Pickup.findOne({ requestId: req.params.id });
  if (!c || !p || ['Completed', 'Cancelled'].includes(p.status)) return res.status(400).json({ message: 'Cannot assign this pickup.' });
  p.collector = c._id; p.status = 'Assigned'; p.history.push({ status: 'Assigned' }); await p.save();
  await Notification.create({ user: c._id, type: 'pickup', title: 'New pickup assigned', message: `${p.requestId} · ${p.address}` });
  res.json({ ok: true });
}));

router.get('/users', wrap(async (_q, res) => {
  const us = await User.find().sort('-createdAt').limit(200).select('name email phone role city swachhScore').lean();
  res.json(us.map((u) => ({ ...u, title: titleFor(u.swachhScore).title })));
}));
router.post('/users', wrap(async (req, res) => { // create collectors/admins (role can't be self-assigned at signup)
  const { name, email, phone, password, role, city, state } = req.body;
  if (!['collector', 'admin'].includes(role) || !name || !email || !phone || (password || '').length < 6) return res.status(400).json({ message: 'Invalid user data.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already exists.' });
  const u = await User.create({ name, email, phone, password: await bcrypt.hash(password, 10), role, city: city || 'Kanpur', state: state || 'Uttar Pradesh' });
  res.status(201).json({ id: u._id });
}));

// Verified penalty -> private notification + awareness popup. Admin must give a reason; nothing automatic.
router.post('/penalty', wrap(async (req, res) => {
  const { userId, points, reason, topic } = req.body;
  const pts = Math.min(50, Math.abs(Number(points) || 0));
  if (!pts || !reason?.trim() || !(await User.exists({ _id: userId }))) return res.status(400).json({ message: 'User, points and reason are required.' });
  await award({ userId, points: -pts, reason: reason.trim().slice(0, 200), kind: 'penalty', topic: topic || 'segregation' });
  res.json({ ok: true });
}));
router.get('/score-events', wrap(async (_q, res) => res.json(await ScoreEvent.find().sort('-createdAt').limit(50).populate('user', 'name').lean())));
router.get('/messages', wrap(async (_q, res) => res.json(await Contact.find().sort('-createdAt').limit(50).lean())));
module.exports = router;
