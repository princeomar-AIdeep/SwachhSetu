// All Mongoose models. Field names of User/Report match the original frontend contract
// (user.id/name/email/role, report type/desc/loc/photo, complaintId).
const mongoose = require('mongoose');
const { Schema } = mongoose;
const geo = { lat: Number, lng: Number };

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['citizen', 'collector', 'admin'], default: 'citizen' },
  // Location hierarchy: state -> city -> service area (kept generic, Kanpur is just seeded data)
  state: { type: String, default: 'Uttar Pradesh' },
  city: { type: String, default: 'Kanpur' },
  serviceArea: { type: String, default: '' },
  // Privacy: leaderboard only ever shows alias + score + title.
  alias: { type: String, default: '' },
  showOnLeaderboard: { type: Boolean, default: true },
  swachhScore: { type: Number, default: 0 }, // ONLY modified via utils/score.js
}, { timestamps: true }));

const Report = mongoose.model('Report', new Schema({
  complaintId: { type: String, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: String, desc: String, loc: String, coords: geo, city: String,
  photo: String, // /uploads/<file>
  ai: { // assistive only - never proof. See utils/ai.js
    available: Boolean, relevant: Boolean, confidence: Number, label: String, note: String,
  },
  status: { type: String, enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  verification: { type: String, enum: ['pending', 'verified', 'rejected', 'needs_review'], default: 'pending' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  adminRemark: String,
}, { timestamps: true }));

const Pickup = mongoose.model('Pickup', new Schema({
  requestId: { type: String, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  collector: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  wasteType: String, date: String, slot: String, address: String, phone: String, notes: String,
  coords: geo, city: String,
  status: { type: String, enum: ['Pending', 'Assigned', 'Accepted', 'On Route', 'Completed', 'Cancelled'], default: 'Pending' },
  collectorLocation: { lat: Number, lng: Number, updatedAt: Date, isDemo: Boolean },
  history: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
  rating: Number,
}, { timestamps: true }));

const ScoreEvent = mongoose.model('ScoreEvent', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  points: Number, reason: String,
  kind: String, // pickup | report | awareness | collector | penalty | adjustment
  refKey: { type: String, index: true }, // idempotency key e.g. "pickup:<id>:citizen"
  topic: String, // awareness slug recommended after a penalty
}, { timestamps: true }));

const Notification = mongoose.model('Notification', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  title: String, message: String,
  type: { type: String, default: 'info' }, // info | score | penalty | pickup | report
  awarenessSlug: String, // drives the private "Learn More" popup
  read: { type: Boolean, default: false },
}, { timestamps: true }));

const WasteCategory = mongoose.model('WasteCategory', new Schema({
  slug: { type: String, unique: true }, name: String, hindi: String, color: String, bin: String,
  description: String, examples: [String], image: String, steps: [String], order: Number,
}));

const WasteItem = mongoose.model('WasteItem', new Schema({
  name: String, keywords: [String], category: String, // WasteCategory.slug
  biodegradable: Boolean, recyclable: Boolean,
  handling: String, composting: String, mistakes: String, safety: String, environment: String,
}));

const Awareness = mongoose.model('Awareness', new Schema({
  kind: { type: String, enum: ['fact', 'campaign', 'section', 'rule', 'tip'] },
  slug: { type: String, index: true }, title: String, body: String, image: String,
  objective: String, sourceName: String, sourceUrl: String, order: { type: Number, default: 0 },
}));

const ServiceArea = mongoose.model('ServiceArea', new Schema({
  state: String, city: String, areas: [String], center: geo, active: { type: Boolean, default: true },
}));

const Contact = mongoose.model('Contact', new Schema({
  name: String, email: String, message: String, handled: { type: Boolean, default: false },
}, { timestamps: true }));

module.exports = { User, Report, Pickup, ScoreEvent, Notification, WasteCategory, WasteItem, Awareness, ServiceArea, Contact };
