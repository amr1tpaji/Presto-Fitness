const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');

// Configure Cloudinary if keys are provided
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * File filter — only allow images (jpg, jpeg, png) and PDFs.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
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

let storage;

if (useCloudinary) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isPdf = file.mimetype === 'application/pdf';
      const params = {
        folder: 'presto-fitness',
        resource_type: isPdf ? 'raw' : 'image',
      };
      if (isPdf) params.format = 'pdf';
      return params;
    },
  });
} else {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(12).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}-${Date.now()}${ext}`);
    },
  });
}

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

module.exports = { uploadSingle, uploadMultiple, upload };
