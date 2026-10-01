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
const genId = (prefix) => `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}${Math.floor(Math.random() * 10)}`;
const num = (v) => (v === undefined || v === '' || isNaN(Number(v)) ? undefined : Number(v));
const coordsFrom = (b) => (num(b.lat) !== undefined && num(b.lng) !== undefined ? { lat: num(b.lat), lng: num(b.lng) } : undefined);
module.exports = { upload, memUpload, wrap, genId, coordsFrom };
