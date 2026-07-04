const multer = require('multer');

/**
 * Global error handler middleware.
 * Normalizes various error types into a consistent JSON response:
 *   { success: false, message: String, errors?: Array }
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // ── Mongoose Validation Error ─────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose Duplicate Key Error ──────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
    errors = [{ field, message: `A record with this ${field} already exists` }];
  }

  // ── Mongoose Cast Error (invalid ObjectId, etc.) ──────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ── Multer Errors ─────────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large — maximum size is 10MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files — maximum is 5';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = err.message || 'Unexpected file field';
        break;
      default:
        message = `File upload error: ${err.message}`;
    }
  }

  // Log full error in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  const response = { success: false, message };
  if (errors) response.errors = errors;

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
