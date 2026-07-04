const express = require('express');
const { body, validationResult } = require('express-validator');
const MealLog = require('../models/MealLog');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/meals ─────────────────────────────────────────────────────────
// Client logs a meal
router.post('/', (req, res, next) => {
  uploadSingle(req, res, async (uploadErr) => {
    if (uploadErr) return next(uploadErr);
    
    try {
      let items = req.body.items;
      if (items && typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      if (!items || !Array.isArray(items)) {
        items = [];
      }

      const mealLog = await MealLog.create({
        userId: req.user._id,
        mealType: req.body.mealType || 'Snack', // Default if missing
        items: items,
        photo: req.file ? ((req.file.path && req.file.path.startsWith('http')) ? req.file.path : req.file.filename) : undefined,
        comment: req.body.comment,
        isOnPlan: req.body.isOnPlan === 'true' || req.body.isOnPlan === true,
        date: req.body.date || Date.now(),
      });

      res.status(201).json({
        success: true,
        message: 'Meal logged successfully',
        data: { mealLog },
      });
    } catch (error) {
      next(error);
    }
  });
});

// ── GET /api/meals ──────────────────────────────────────────────────────────
// Get meal logs for current user with optional date range filter
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const mealLogs = await MealLog.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: { mealLogs },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/meals/today ────────────────────────────────────────────────────
// Get today's meals for the current user
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mealLogs = await MealLog.find({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    }).sort({ date: 1 });

    // Calculate today's totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    mealLogs.forEach((log) => {
      log.items.forEach((item) => {
        totalCalories += item.calories || 0;
        totalProtein += item.protein || 0;
        totalCarbs += item.carbs || 0;
        totalFats += item.fats || 0;
      });
    });

    res.json({
      success: true,
      data: {
        mealLogs,
        totals: { totalCalories, totalProtein, totalCarbs, totalFats },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/meals/client/:clientId ─────────────────────────────────────────
// Admin: get a client's meal logs
router.get('/client/:clientId', adminOnly, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.params.clientId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const mealLogs = await MealLog.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: { mealLogs },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
