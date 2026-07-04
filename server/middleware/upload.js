const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

/**
 * Multer disk storage configuration.
 * Files are stored in the `uploads/` directory with unique filenames
 * generated via crypto to prevent collisions and obscure original names.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: <randomHex>-<timestamp>.<ext>
    const uniqueSuffix = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}-${Date.now()}${ext}`);
  },
});

/**
 * File filter — only allow images (jpg, jpeg, png) and PDFs.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Only JPG, JPEG, PNG images and PDF files are allowed'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

/** Upload a single file with field name 'file' */
const uploadSingle = upload.single('file');

/** Upload up to 5 files with field name 'files' */
const uploadMultiple = upload.array('files', 5);

module.exports = { uploadSingle, uploadMultiple };
