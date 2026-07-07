const express = require('express');
const { body, validationResult } = require('express-validator');
const WeightLog = require('../models/WeightLog');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { updateStreak } = require('../services/rewardEngine');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/weight ────────────────────────────────────────────────────────
// Log a weight entry. Clients log their own; admin can log for a client via body.userId.
router.post(
  '/',
  [
    body('weight')
      .isFloat({ min: 20, max: 500 })
      .withMessage('Weight must be between 20 and 500'),
    body('unit')
      .optional()
      .isIn(['kg', 'lbs'])
      .withMessage('Unit must be kg or lbs'),
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

      // Determine which user the log belongs to
      let userId = req.user._id;
      if (req.body.userId && req.user.role === 'admin') {
        userId = req.body.userId;
      }

      const weightLog = await WeightLog.create({
        userId,
        weight: req.body.weight,
        unit: req.body.unit || 'kg',
        date: req.body.date || Date.now(),
        notes: req.body.notes,
        photo: req.body.photo,
      });

      // Update user's currentWeight
      await User.findByIdAndUpdate(userId, {
        currentWeight: req.body.weight,
      });

      // Update streak if both meal and weight criteria are met for the day
      await updateStreak(userId);

      res.status(201).json({
        success: true,
        message: 'Weight logged successfully',
        data: { weightLog },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/weight ─────────────────────────────────────────────────────────
// Get weight history for the current user
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const weightLogs = await WeightLog.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { weightLogs },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/weight/goal ────────────────────────────────────────────────────
// Update the user's goal weight
router.put(
  '/goal',
  [
    body('goalWeight')
      .isFloat({ min: 20, max: 500 })
      .withMessage('Goal weight must be between 20 and 500'),
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

      await User.findByIdAndUpdate(req.user._id, {
        goalWeight: req.body.goalWeight,
      });

      res.json({
        success: true,
        message: 'Goal weight updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/weight/client/:clientId ────────────────────────────────────────
// Admin: get a client's weight history
router.get('/client/:clientId', adminOnly, async (req, res, next) => {
  try {
    const weightLogs = await WeightLog.find({
      userId: req.params.clientId,
    })
      .sort({ date: -1 })
      .limit(100);

    res.json({
      success: true,
      data: { weightLogs },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
