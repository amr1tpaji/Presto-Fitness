const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// ── Rate limiters ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Token helpers ───────────────────────────────────────────────────────────

/**
 * Generate a short-lived access token.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

/**
 * Generate a long-lived refresh token.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

/**
 * Set the refresh token as an httpOnly cookie.
 */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, phone, password, email } = req.body;

      // Check if phone already exists
      const existingUser = await User.findOne({ 
        $or: [{ phone }, { email }] 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this phone number or email already exists',
        });
      }

      // Generate 6-digit Activation Key
      const activationKey = crypto.randomInt(100000, 999999).toString();

      const user = await User.create({
        name,
        phone,
        password,
        email,
        activationKey,
        isPhoneVerified: false,
      });

      // Strip sensitive info from response
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.activationKey;

      res.status(201).json({
        success: true,
        message: 'Account created. Pending admin approval.',
        data: { user: userObj },
      });
    } catch (error) {
      next(error);
    }
  }
);



// ── POST /api/auth/verify-key ───────────────────────────────────────────────
router.post(
  '/verify-key',
  [
    body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
    body('key')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('Key must be 6 digits'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { identifier, key } = req.body;

      const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: 'Account is already activated',
        });
      }

      if (user.activationKey !== key) {
        return res.status(400).json({
          success: false,
          message: 'Invalid access key',
        });
      }

      // Key is valid! Activate the user account
      user.isPhoneVerified = true;
      user.activationKey = undefined;
      await user.save();

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      setRefreshCookie(res, refreshToken);

      const userObj = user.toObject();
      delete userObj.password;

      res.json({
        success: true,
        message: 'Account activated successfully',
        data: { user: userObj, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Phone or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { identifier, password } = req.body;

      // Find user by phone or email, explicitly selecting the password field
      const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
      }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      if (!user.isPhoneVerified) {
        return res.status(403).json({
          success: false,
          message: 'PENDING_APPROVAL',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      setRefreshCookie(res, refreshToken);

      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.otp;

      res.json({
        success: true,
        message: 'Login successful',
        data: { user: userObj, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Rotate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    next(error);
  }
});

const { uploadSingle } = require('../middleware/upload');

// ── PUT /api/auth/profile ───────────────────────────────────────────────────
router.put('/profile', protect, (req, res, next) => {
  uploadSingle(req, res, async (uploadErr) => {
    if (uploadErr) return next(uploadErr);

    try {
      const { name, email, dateOfBirth, gender, height, goalWeight } = req.body;
      
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
      if (gender) updateData.gender = gender;
      if (height) updateData.height = Number(height);
      if (goalWeight) updateData.goalWeight = Number(goalWeight);
      
      if (req.file) {
        updateData.avatar = (req.file.path && req.file.path.startsWith('http')) ? req.file.path : req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -otp');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  });
});

// ── PUT /api/auth/password ──────────────────────────────────────────────────
router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password',
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
