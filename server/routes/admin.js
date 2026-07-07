const express = require('express');
const User = require('../models/User');
const WeightLog = require('../models/WeightLog');
const Workout = require('../models/Workout');
const DietPlan = require('../models/DietPlan');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

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

    const [clientsRaw, total] = await Promise.all([
      User.find(filter)
        .select('name phone email avatar gender currentWeight subscription rewards.streak rewards.points isPhoneVerified activationKey createdAt isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const Message = require('../models/Message');
    const clients = await Promise.all(
      clientsRaw.map(async (client) => {
        const unreadCount = await Message.countDocuments({
          sender: client._id,
          receiver: req.user._id,
          read: false,
        });
        return { ...client.toObject(), unreadCount };
      })
    );

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
    const DailyTask = require('../models/DailyTask');
    const [recentWeightLogs, currentWorkout, currentDiet, recentTasksRecord, payments] = await Promise.all([
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
      DailyTask.findOne({
        userId: client._id,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Payment.find({ userId: client._id })
        .sort({ paidAt: -1, createdAt: -1 })
    ]);

    res.json({
      success: true,
      data: {
        client,
        recentWeightLogs,
        currentWorkout,
        currentDiet,
        recentTasks: recentTasksRecord ? recentTasksRecord.tasks : [],
        payments,
        completionRate: recentTasksRecord && recentTasksRecord.tasks.length > 0
          ? Math.round((recentTasksRecord.tasks.filter(t => t.isCompleted).length / recentTasksRecord.tasks.length) * 100)
          : 0,
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

// ── POST /api/admin/clients/:id/plan-pdf ───────────────────────────────────
// Upload a generic PDF plan (workout/diet combined)
router.post('/clients/:id/plan-pdf', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }

    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const fileUrl = req.file.path.startsWith('http')
      ? req.file.path
      : `/uploads/${req.file.filename}`;

    client.planPdf = fileUrl;
    await client.save();

    res.json({
      success: true,
      message: 'Plan PDF uploaded successfully',
      data: { planPdf: fileUrl },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/admin/clients/:id/status ───────────────────────────────────────
// Toggle client's active status
router.put('/clients/:id/status', async (req, res, next) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const currentStatus = client.isActive !== false;
    client.isActive = req.body.isActive !== undefined ? req.body.isActive : !currentStatus;
    await client.save();

    res.json({
      success: true,
      message: `Client has been ${client.isActive ? 'activated' : 'deactivated'}.`,
      data: { isActive: client.isActive },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/admin/tasks/:taskId/toggle ─────────────────────────────────────
// Toggle task completion status
router.put('/tasks/:taskId/toggle', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const DailyTask = require('../models/DailyTask');
    
    const dailyTask = await DailyTask.findOne({ 'tasks._id': taskId });
    if (!dailyTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = dailyTask.tasks.id(taskId);
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;

    // Recalculate points
    dailyTask.totalPoints = dailyTask.tasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + (t.points || 10), 0);

    const allDone = dailyTask.tasks.every((t) => t.isCompleted);
    dailyTask.allCompleted = allDone;
    if (allDone) {
      dailyTask.totalPoints += 50; // all-tasks bonus
    }

    await dailyTask.save();

    res.json({ success: true, message: 'Task toggled successfully' });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/admin/clients/:id ───────────────────────────────────────────
// Permanently delete a client and all their associated data
router.delete('/clients/:id', async (req, res, next) => {
  try {
    const clientId = req.params.id;

    // Check if client exists
    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Dynamic import to avoid missing models at the top
    const DailyTask = require('../models/DailyTask');
    const LabReport = require('../models/LabReport');
    const MealLog = require('../models/MealLog');
    const Reward = require('../models/Reward');
    const Message = require('../models/Message');

    // Cascade Delete all user data
    await Promise.all([
      WeightLog.deleteMany({ userId: clientId }),
      Workout.updateMany({ assignedTo: clientId }, { $pull: { assignedTo: clientId } }),
      DietPlan.updateMany({ assignedTo: clientId }, { $pull: { assignedTo: clientId } }),
      Payment.deleteMany({ userId: clientId }),
      DailyTask.deleteMany({ userId: clientId }),
      LabReport.deleteMany({ userId: clientId }),
      MealLog.deleteMany({ userId: clientId }),
      Reward.deleteMany({ userId: clientId }),
      Message.deleteMany({ $or: [{ sender: clientId }, { receiver: clientId }] }),
    ]);

    // Finally delete the user
    await User.findByIdAndDelete(clientId);

    res.json({
      success: true,
      message: 'Client and all associated data permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
