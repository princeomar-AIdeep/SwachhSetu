const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Image upload: disk storage, images only, 5MB. ENHANCE: move to S3/Cloudinary for production.
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_r, f, cb) => cb(null, crypto.randomBytes(10).toString('hex') + path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => (/^image\/(jpeg|png|webp)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG or WEBP images are allowed.'))) });
// memory variant for WasteWise identify (image is analysed and discarded, never stored)
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => (/^image\/(jpeg|png|webp)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG or WEBP images are allowed.'))) });

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Bug fix: use crypto.randomBytes for collision-safe IDs (Math.random had only ~90k values/year)
const genId = (prefix) => `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const num = (v) => (v === undefined || v === '' || isNaN(Number(v)) ? undefined : Number(v));
const coordsFrom = (b) => (num(b.lat) !== undefined && num(b.lng) !== undefined ? { lat: num(b.lat), lng: num(b.lng) } : undefined);
// Bug fix: `num` was missing from exports, causing TypeError in pickups feedback route
module.exports = { upload, memUpload, wrap, genId, coordsFrom, num };
