const router = require('express').Router();
const { Pickup, User } = require('../models');
const { protect, requireRole } = require('../middleware/auth');
const { wrap, genId, coordsFrom, num } = require('../utils/helpers');
const { award, POINTS } = require('../utils/score');
const { Notification } = require('../models');

const TYPES = ['Wet Waste', 'Dry Waste', 'E-Waste', 'Hazardous Waste', 'Bulk / Garden Waste'];
const SLOTS = ['Morning (8 AM – 12 PM)', 'Afternoon (12 PM – 4 PM)', 'Evening (4 PM – 7 PM)'];
const note = (user, title, message) => Notification.create({ user, title, message, type: 'pickup' });

// Citizen requests a pickup. Auto-assigns the least-busy collector in the same city (service-area aware).
// ENHANCE: match on serviceArea polygon / distance instead of city only.
router.post('/', protect, wrap(async (req, res) => {
  const { wasteType, date, slot, address, phone, notes } = req.body;
  if (!TYPES.includes(wasteType) || !date || !SLOTS.includes(slot) || !address?.trim() || !/^\d{10}$/.test(phone || ''))
    return res.status(400).json({ message: 'Please fill waste type, date, slot, address and a 10-digit phone.' });
  const p = await Pickup.create({ requestId: genId('SWC-PU'), user: req.user._id, wasteType, date, slot, address: address.trim(),
    phone, notes, coords: coordsFrom(req.body), city: req.user.city, history: [{ status: 'Pending' }] });
  const collectors = await User.find({ role: 'collector', city: req.user.city }).lean();
  if (collectors.length) {
    const loads = await Promise.all(collectors.map(async (c) => ({ c, n: await Pickup.countDocuments({ collector: c._id, status: { $in: ['Assigned', 'Accepted', 'On Route'] } }) })));
    loads.sort((a, b) => a.n - b.n);
    p.collector = loads[0].c._id; p.status = 'Assigned'; p.history.push({ status: 'Assigned' }); await p.save();
    await note(p.collector, 'New pickup assigned', `${p.requestId} · ${p.wasteType} · ${p.address}`);
  }
  res.status(201).json({ requestId: p.requestId, status: p.status });
}));

const shape = (p) => ({ ...p, collector: p.collector ? { name: p.collector.name, phone: p.collector.phone } : undefined });
// Citizen: own pickups (collector contact only exposed to the requesting citizen).
router.get('/mine', protect, wrap(async (req, res) => {
  const list = await Pickup.find({ user: req.user._id }).sort('-createdAt').populate('collector', 'name phone').lean();
  res.json(list.map(shape));
}));

router.post('/:id/cancel', protect, wrap(async (req, res) => {
  const p = await Pickup.findOne({ requestId: req.params.id, user: req.user._id });
  if (!p || !['Pending', 'Assigned'].includes(p.status)) return res.status(400).json({ message: 'This pickup can no longer be cancelled.' });
  p.status = 'Cancelled'; p.history.push({ status: 'Cancelled' }); await p.save(); res.json({ status: p.status });
}));

// Citizen rates a completed pickup -> small collector bonus (validated server side, once).
router.post('/:id/feedback', protect, wrap(async (req, res) => {
  const rating = num(req.body.rating);
  const p = await Pickup.findOne({ requestId: req.params.id, user: req.user._id });
  if (!p || p.status !== 'Completed' || !(rating >= 1 && rating <= 5) || p.rating) return res.status(400).json({ message: 'Feedback is not available for this pickup.' });
  p.rating = rating; await p.save();
  if (rating >= 4 && p.collector) await award({ userId: p.collector, points: POINTS.ratingBonus, reason: `Citizen feedback ${rating}/5 on ${p.requestId}`, kind: 'collector', refKey: `rating:${p._id}` });
  res.json({ ok: true });
}));

// ---- Collector workflow ----
const flow = { accept: ['Assigned', 'Accepted'], start: ['Accepted', 'On Route'], complete: ['On Route', 'Completed'] };
router.get('/assigned', protect, requireRole('collector', 'admin'), wrap(async (req, res) => {
  const q = req.user.role === 'admin' ? {} : { collector: req.user._id };
  res.json(await Pickup.find(q).sort('date').populate('user', 'name').lean()); // citizen name only; phone is on the pickup for contact
}));

router.post('/:id/:action', protect, requireRole('collector'), wrap(async (req, res) => {
  if (!flow[req.params.action]) return res.status(404).json({ message: 'Unknown action.' });
  const [from, to] = flow[req.params.action];
  const p = await Pickup.findOne({ requestId: req.params.id, collector: req.user._id });
  if (!p || p.status !== from) return res.status(400).json({ message: `Pickup must be "${from}" to ${req.params.action}.` });
  p.status = to; p.history.push({ status: to });
  await p.save();
  await note(p.user, `Pickup ${to}`, `${p.requestId} is now ${to.toLowerCase()}.`);
  if (to === 'Completed') { // punctuality bonus if completed on/before the requested date
    const onTime = new Date().toISOString().slice(0, 10) <= p.date;
    await award({ userId: p.user, points: POINTS.pickupCitizen, reason: `Pickup ${p.requestId} completed`, kind: 'pickup', refKey: `pickup:${p._id}:citizen` });
    await award({ userId: p.collector, points: POINTS.pickupCollector + (onTime ? 5 : 0), reason: `Completed ${p.requestId}${onTime ? ' on time' : ''}`, kind: 'collector', refKey: `pickup:${p._id}:collector` });
  }
  res.json({ status: p.status });
}));

// Real GPS from the collector's device. `demo:true` is stored and labelled in UI - never passed off as live.
router.post('/:id/location', protect, requireRole('collector'), wrap(async (req, res) => {
  const p = await Pickup.findOne({ requestId: req.params.id, collector: req.user._id });
  const c = coordsFrom(req.body);
  if (!p || !c || p.status !== 'On Route') return res.status(400).json({ message: 'Location can be shared only while On Route.' });
  p.collectorLocation = { ...c, updatedAt: new Date(), isDemo: !!req.body.demo }; await p.save(); res.json({ ok: true });
}));
module.exports = router;
