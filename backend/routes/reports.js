const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { Report } = require('../models');
const { protect } = require('../middleware/auth');
const { upload, wrap, genId, coordsFrom } = require('../utils/helpers');
const { verifyReportImage } = require('../utils/ai');

const TYPES = ['Overflowing Bin', 'Garbage on Road', 'Missed Collection', 'Illegal Dumping', 'Other'];

// Create report. userId is taken from the TOKEN (client-sent userId is ignored).
router.post('/', protect, upload.single('photo'), wrap(async (req, res) => {
  const { type, desc, loc } = req.body;
  if (!TYPES.includes(type) || !desc?.trim() || !loc?.trim()) return res.status(400).json({ message: 'Issue type, description and location are required.' });
  let ai;
  if (req.file) {
    // Bug fix: use req.file.mimetype directly (already validated by multer) instead of fragile ext parsing
    ai = await verifyReportImage(fs.readFileSync(req.file.path), req.file.mimetype);
  }
  // AI is preliminary. Uncertain / negative AI => "needs_review", NEVER an automatic penalty or rejection.
  const verification = ai?.available && ai.relevant && !ai.lowConfidence ? 'pending' : (ai?.available ? 'needs_review' : 'pending');
  const r = await Report.create({ complaintId: genId('SWC'), user: req.user._id, type, desc: desc.trim(), loc: loc.trim(),
    coords: coordsFrom(req.body), city: req.user.city, photo: req.file ? `/uploads/${req.file.filename}` : undefined, ai, verification,
    priority: ['Illegal Dumping', 'Overflowing Bin'].includes(type) ? 'HIGH' : 'MEDIUM' });
  res.status(201).json({ complaintId: r.complaintId, status: r.status, ai: r.ai, verification: r.verification });
}));

// My reports only (private).
router.get('/mine', protect, wrap(async (req, res) => {
  res.json(await Report.find({ user: req.user._id }).sort('-createdAt').select('-user').lean());
}));

// Track by ID - only the owner (or staff) can see it.
router.get('/track/:id', protect, wrap(async (req, res) => {
  const r = await Report.findOne({ complaintId: req.params.id.toUpperCase() }).lean();
  if (!r || (String(r.user) !== String(req.user._id) && req.user.role !== 'admin')) return res.status(404).json({ message: 'No complaint found with that ID on your account.' });
  delete r.user; res.json(r);
}));
module.exports = router;
