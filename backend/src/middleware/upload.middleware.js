const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const AppError = require('../utils/appError');

const uploadDir = path.resolve(__dirname, '../../uploads/complaints');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed image MIME types and file extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_TO_EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Multer disk storage configuration with secure filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(rawExt)
      ? rawExt
      : MIME_TO_EXT_MAP[mime] || '.jpg';
    const randomHex = crypto.randomBytes(16).toString('hex');
    const secureName = `evidence-${Date.now()}-${randomHex}${safeExt}`;
    cb(null, secureName);
  },
});

// File filter for validation (validates both MIME type and file extension)
const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(
      new AppError(
        `Invalid file format '${file.mimetype}'. Only JPEG, PNG, and WebP images are allowed.`,
        400
      ),
      false
    );
  }

  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `Invalid file extension '${ext}'. Only .jpg, .jpeg, .png, and .webp files are allowed.`,
        400
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

// Middleware supporting 'image', 'evidence', 'proof', or 'photo' field names
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'evidence', maxCount: 1 },
  { name: 'proof', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

const uploadEvidence = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Normalize single file to req.file
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        req.file = req.files.image[0];
      } else if (req.files.evidence && req.files.evidence[0]) {
        req.file = req.files.evidence[0];
      } else if (req.files.proof && req.files.proof[0]) {
        req.file = req.files.proof[0];
      } else if (req.files.photo && req.files.photo[0]) {
        req.file = req.files.photo[0];
      }
    }
    next();
  });
};


module.exports = {
  uploadEvidence,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};

