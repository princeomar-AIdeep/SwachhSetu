const router = require('express').Router();
const { User, ScoreEvent, Notification, Awareness } = require('../models');
const { protect } = require('../middleware/auth');
const { wrap } = require('../utils/helpers');
const { titleFor, award, POINTS } = require('../utils/score');

// My score + title + progress + my own history (private).
router.get('/me', protect, wrap(async (req, res) => {
  const t = titleFor(req.user.swachhScore);
  const events = await ScoreEvent.find({ user: req.user._id }).sort('-createdAt').limit(15).select('points reason kind createdAt').lean();
  const rank = (await User.countDocuments({ role: req.user.role, showOnLeaderboard: true, swachhScore: { $gt: req.user.swachhScore } })) + 1;
  res.json({ score: req.user.swachhScore, ...t, rank, events });
}));

// PUBLIC-SAFE leaderboard: rank, alias/first name, score, title. Nothing else - no penalties, email, phone, reports.
router.get('/leaderboard', protect, wrap(async (req, res) => {
  const role = req.query.role === 'collector' ? 'collector' : 'citizen';
  const users = await User.find({ role, showOnLeaderboard: true }).sort('-swachhScore').limit(20).select('name alias swachhScore').lean();
  res.json(users.map((u, i) => ({ rank: i + 1, name: u.alias || u.name.split(' ')[0], score: u.swachhScore, title: titleFor(u.swachhScore).title })));
}));

// Reading an awareness piece earns a tiny, idempotent bonus (validated here, not in the client).
router.post('/awareness-read', protect, wrap(async (req, res) => {
  const slug = String(req.body.slug || '');
  if (!(await Awareness.exists({ slug }))) return res.status(404).json({ message: 'Unknown content.' });
  const ev = await award({ userId: req.user._id, points: POINTS.awarenessRead, reason: 'Learned something new about waste', kind: 'awareness', refKey: `aw:${req.user._id}:${slug}`, notify: false });
  res.json({ awarded: !!ev });
}));

// Notifications (private)
router.get('/notifications', protect, wrap(async (req, res) => {
  res.json(await Notification.find({ user: req.user._id }).sort('-createdAt').limit(30).lean());
}));
router.post('/notifications/read', protect, wrap(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true }); res.json({ ok: true });
}));
module.exports = router;
