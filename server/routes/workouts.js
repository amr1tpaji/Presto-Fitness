const express = require('express');
const { body, validationResult } = require('express-validator');
const Workout = require('../models/Workout');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/workouts ──────────────────────────────────────────────────────
// Admin: create a new workout and optionally assign to clients
router.post(
  '/',
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Workout title is required'),
    body('exercises')
      .isArray({ min: 1 })
      .withMessage('At least one exercise is required'),
    body('exercises.*.name')
      .trim()
      .notEmpty()
      .withMessage('Exercise name is required'),
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

      const workout = await Workout.create({
        ...req.body,
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'Workout created successfully',
        data: { workout },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/workouts ───────────────────────────────────────────────────────
// Admin: all active workouts · Client: only their assigned workouts
router.get('/', async (req, res, next) => {
  try {
    let filter = { isActive: true };

    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    const workouts = await Workout.find(filter)
      .populate('assignedTo', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { workouts },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/workouts/client/:clientId ──────────────────────────────────────
// Get workouts assigned to a specific client
router.get('/client/:clientId', async (req, res, next) => {
  try {
    // Only admin or the client themselves can access
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== req.params.clientId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const workouts = await Workout.find({
      assignedTo: req.params.clientId,
      isActive: true,
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { workouts },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/workouts/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate('assignedTo', 'name phone')
      .populate('createdBy', 'name');

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    // Clients can only view workouts assigned to them
    if (
      req.user.role !== 'admin' &&
      !workout.assignedTo.some((u) => u._id.equals(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this workout',
      });
    }

    res.json({
      success: true,
      data: { workout },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/workouts/:id ───────────────────────────────────────────────────
// Admin only
router.put('/:id', adminOnly, async (req, res, next) => {
  try {
    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name phone')
      .populate('createdBy', 'name');

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    res.json({
      success: true,
      message: 'Workout updated successfully',
      data: { workout },
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/workouts/:id ────────────────────────────────────────────────
// Soft delete — sets isActive to false
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    res.json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});



module.exports = router;
