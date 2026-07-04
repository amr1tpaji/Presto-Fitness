const express = require('express');
const { body, validationResult } = require('express-validator');
const DietPlan = require('../models/DietPlan');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/diets ─────────────────────────────────────────────────────────
// Admin: create a new diet plan
router.post(
  '/',
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Diet plan title is required'),
    body('meals')
      .isArray({ min: 1 })
      .withMessage('At least one meal is required'),
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

      const dietPlan = await DietPlan.create({
        ...req.body,
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'Diet plan created successfully',
        data: { dietPlan },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/diets ──────────────────────────────────────────────────────────
// Admin: all active diet plans · Client: their assigned plans
router.get('/', async (req, res, next) => {
  try {
    let filter = { isActive: true };

    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    const dietPlans = await DietPlan.find(filter)
      .populate('assignedTo', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { dietPlans },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/diets/client/:clientId ─────────────────────────────────────────
router.get('/client/:clientId', async (req, res, next) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== req.params.clientId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const dietPlans = await DietPlan.find({
      assignedTo: req.params.clientId,
      isActive: true,
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { dietPlans },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/diets/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const dietPlan = await DietPlan.findById(req.params.id)
      .populate('assignedTo', 'name phone')
      .populate('createdBy', 'name');

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found',
      });
    }

    // Clients can only view plans assigned to them
    if (
      req.user.role !== 'admin' &&
      !dietPlan.assignedTo.some((u) => u._id.equals(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this diet plan',
      });
    }

    res.json({
      success: true,
      data: { dietPlan },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/diets/:id ─────────────────────────────────────────────────────
router.put('/:id', adminOnly, async (req, res, next) => {
  try {
    const dietPlan = await DietPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name phone')
      .populate('createdBy', 'name');

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found',
      });
    }

    res.json({
      success: true,
      message: 'Diet plan updated successfully',
      data: { dietPlan },
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/diets/:id ───────────────────────────────────────────────────
// Soft delete
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const dietPlan = await DietPlan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found',
      });
    }

    res.json({
      success: true,
      message: 'Diet plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});



module.exports = router;
