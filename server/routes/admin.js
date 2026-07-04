const express = require('express');
const User = require('../models/User');
const WeightLog = require('../models/WeightLog');
const Workout = require('../models/Workout');
const DietPlan = require('../models/DietPlan');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ── GET /api/admin/clients ──────────────────────────────────────────────────
// List all clients with optional search by name or phone
router.get('/clients', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const filter = { role: 'client' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      User.find(filter)
        .select('name phone email avatar gender currentWeight subscription rewards.streak')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/clients/:id ──────────────────────────────────────────────
// Full client detail with recent data
router.get('/clients/:id', async (req, res, next) => {
  try {
    const client = await User.findById(req.params.id).select('-otp');
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Fetch associated data in parallel
    const [recentWeightLogs, currentWorkout, currentDiet] = await Promise.all([
      WeightLog.find({ userId: client._id })
        .sort({ date: -1 })
        .limit(10),
      Workout.findOne({
        assignedTo: client._id,
        isActive: true,
      }).sort({ createdAt: -1 }),
      DietPlan.findOne({
        assignedTo: client._id,
        isActive: true,
      }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      data: {
        client,
        recentWeightLogs,
        currentWorkout,
        currentDiet,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/dashboard/stats ──────────────────────────────────────────
// High-level dashboard statistics
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const [totalClients, activeClients, revenueAgg, recentPayments] =
      await Promise.all([
        User.countDocuments({ role: 'client' }),
        User.countDocuments({
          role: 'client',
          'subscription.status': 'active',
        }),
        Payment.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.find({ status: 'paid' })
          .populate('userId', 'name phone')
          .sort({ paidAt: -1 })
          .limit(10),
      ]);

    const totalRevenue =
      revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        totalRevenue,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
