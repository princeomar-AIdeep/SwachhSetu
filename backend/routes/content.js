// Public + WasteWise + Awareness content. All data comes from MongoDB (seeded by seed.js).
const router = require('express').Router();
const { WasteCategory, WasteItem, Awareness, ServiceArea, Contact, User, Report, Pickup } = require('../models');
const { protect } = require('../middleware/auth');
const { memUpload, wrap } = require('../utils/helpers');
const { identifyWaste } = require('../utils/ai');

const { TITLES } = require('../utils/score');
router.get('/score/titles', (_q, res) => res.json(TITLES)); // public: title ladder comes from the backend engine
router.get('/locations', wrap(async (_q, res) => res.json(await ServiceArea.find({ active: true }).lean())));

router.get('/public/stats', wrap(async (_q, res) => { // real counts, nothing invented
  const [citizens, reports, pickups, resolved] = await Promise.all([User.countDocuments({ role: 'citizen' }), Report.countDocuments(), Pickup.countDocuments({ status: 'Completed' }), Report.countDocuments({ status: 'Resolved' })]);
  res.json({ citizens, reports, pickups, resolved });
}));

router.post('/contact', wrap(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !message?.trim()) return res.status(400).json({ message: 'Please enter your name, a valid email and a message.' });
  await Contact.create({ name: name.trim(), email, message: message.trim().slice(0, 1000) }); res.status(201).json({ ok: true });
}));

router.get('/awareness', wrap(async (_q, res) => res.json(await Awareness.find().sort('order').lean())));
router.get('/wastewise/categories', wrap(async (_q, res) => res.json(await WasteCategory.find().sort('order').lean())));

router.get('/wastewise/mistakes', wrap(async (_q, res) => res.json(await WasteItem.find({ mistakes: { $exists: true, $ne: '' } }).select('name mistakes category').limit(12).lean())));

// Manual search (works with no AI key).
router.get('/wastewise/search', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 40);
  if (q.length < 2) return res.json([]);
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  res.json(await WasteItem.find({ $or: [{ name: rx }, { keywords: rx }] }).limit(12).lean());
}));

// AI identification: image analysed in memory and discarded. Low confidence is surfaced, never hidden.
router.post('/wastewise/identify', protect, memUpload.single('photo'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please choose a photo.' });
  const ai = await identifyWaste(req.file.buffer, req.file.mimetype);
  if (!ai.available) return res.json({ available: false });
  const category = ai.category ? await WasteCategory.findOne({ slug: ai.category }).lean() : null;
  const guide = ai.item ? await WasteItem.findOne({ $or: [{ name: new RegExp(ai.item.split(' ').pop(), 'i') }, { keywords: ai.item.toLowerCase() }] }).lean() : null;
  res.json({ ...ai, categoryInfo: category, guide });
}));
module.exports = router;
