const express = require('express');
const { body, param, validationResult } = require('express-validator');
const DailyTask = require('../models/DailyTask');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { checkAndAwardRewards, updateStreak } = require('../services/rewardEngine');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/tasks ─────────────────────────────────────────────────────────
// Admin: create daily tasks for a client
router.post(
  '/',
  adminOnly,
  [
    body('userId').notEmpty().withMessage('Client user ID is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('tasks')
      .isArray({ min: 1 })
      .withMessage('At least one task is required'),
    body('tasks.*.title')
      .trim()
      .notEmpty()
      .withMessage('Task title is required'),
    body('tasks.*.type')
      .isIn(['workout', 'meal', 'water', 'sleep', 'supplement', 'custom'])
      .withMessage('Valid task type is required'),
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

      const { userId, date, tasks } = req.body;

      // Upsert: if tasks already exist for this user+date, replace them
      const taskDate = new Date(date);
      taskDate.setHours(0, 0, 0, 0);

      const dailyTask = await DailyTask.findOneAndUpdate(
        { userId, date: taskDate },
        {
          userId,
          date: taskDate,
          tasks: tasks.map((t) => ({
            ...t,
            isCompleted: false,
            points: t.points || 10,
          })),
          totalPoints: 0,
          allCompleted: false,
        },
        { new: true, upsert: true, runValidators: true }
      );

      res.status(201).json({
        success: true,
        message: 'Daily tasks created successfully',
        data: { dailyTask },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/tasks/today ────────────────────────────────────────────────────
// Client: get today's tasks
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyTask = await DailyTask.findOne({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    res.json({
      success: true,
      data: {
        dailyTask: dailyTask || { tasks: [], totalPoints: 0, allCompleted: false },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/tasks/:taskId/complete ─────────────────────────────────────────
// Client: mark a specific sub-task as complete
router.put('/:taskId/complete', async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Find the daily task document containing this sub-task
    const dailyTask = await DailyTask.findOne({
      userId: req.user._id,
      'tasks._id': taskId,
    });

    if (!dailyTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Find and update the specific sub-task
    const task = dailyTask.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Sub-task not found',
      });
    }

    if (task.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Task already completed',
      });
    }

    task.isCompleted = true;
    task.completedAt = new Date();

    // Recalculate total points
    dailyTask.totalPoints = dailyTask.tasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + (t.points || 10), 0);

    // Check if all tasks are done
    const allDone = dailyTask.tasks.every((t) => t.isCompleted);
    dailyTask.allCompleted = allDone;

    // Award bonus points if all tasks completed
    if (allDone) {
      dailyTask.totalPoints += 50; // all-tasks bonus
    }

    await dailyTask.save();

    // Update user's reward points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'rewards.points': task.points || 10 },
    });

    // If all tasks done, also add the bonus and update streak
    if (allDone) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'rewards.points': 50 },
      });
      await updateStreak(req.user._id);
    }

    // Check for new badge rewards
    const newRewards = await checkAndAwardRewards(req.user._id);

    res.json({
      success: true,
      message: allDone
        ? 'All tasks completed! Bonus points awarded! 🎉'
        : 'Task completed successfully',
      data: {
        dailyTask,
        pointsEarned: (task.points || 10) + (allDone ? 50 : 0),
        newRewards,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tasks/client/:clientId ─────────────────────────────────────────
// Admin: get a client's tasks (recent 30 days)
router.get('/client/:clientId', adminOnly, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await DailyTask.find({
      userId: req.params.clientId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tasks/history ──────────────────────────────────────────────────
// Client: task history with completion stats
router.get('/history', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const tasks = await DailyTask.find({
      userId: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // Calculate completion stats
    const totalDays = tasks.length;
    const completedDays = tasks.filter((t) => t.allCompleted).length;
    const totalTasks = tasks.reduce((sum, t) => sum + t.tasks.length, 0);
    const completedTasks = tasks.reduce(
      (sum, t) => sum + t.tasks.filter((st) => st.isCompleted).length,
      0
    );
    const totalPointsEarned = tasks.reduce(
      (sum, t) => sum + t.totalPoints,
      0
    );

    res.json({
      success: true,
      data: {
        tasks,
        stats: {
          totalDays,
          completedDays,
          completionRate:
            totalDays > 0
              ? Math.round((completedDays / totalDays) * 100)
              : 0,
          totalTasks,
          completedTasks,
          taskCompletionRate:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
          totalPointsEarned,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
