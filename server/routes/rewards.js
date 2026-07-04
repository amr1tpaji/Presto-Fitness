const express = require('express');
const Reward = require('../models/Reward');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── GET /api/rewards ────────────────────────────────────────────────────────
// Get current user's rewards, badges, streak, and points
router.get('/', async (req, res, next) => {
  try {
    const [user, rewards] = await Promise.all([
      User.findById(req.user._id).select('rewards'),
      Reward.find({ userId: req.user._id }).sort({ awardedAt: -1 }),
    ]);

    res.json({
      success: true,
      data: {
        points: user.rewards?.points || 0,
        streak: user.rewards?.streak || 0,
        longestStreak: user.rewards?.longestStreak || 0,
        badges: user.rewards?.badges || [],
        rewardHistory: rewards,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/rewards/leaderboard ────────────────────────────────────────────
// Top 10 clients by points
router.get('/leaderboard', async (req, res, next) => {
  try {
    const leaderboard = await User.find({ role: 'client' })
      .select('name avatar rewards.points rewards.streak rewards.badges')
      .sort({ 'rewards.points': -1 })
      .limit(10);

    const ranked = leaderboard.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      avatar: user.avatar,
      points: user.rewards?.points || 0,
      streak: user.rewards?.streak || 0,
      badgeCount: user.rewards?.badges?.length || 0,
    }));

    res.json({
      success: true,
      data: { leaderboard: ranked },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/rewards/client/:clientId ───────────────────────────────────────
// Admin: get a client's rewards
router.get('/client/:clientId', adminOnly, async (req, res, next) => {
  try {
    const [user, rewards] = await Promise.all([
      User.findById(req.params.clientId).select('name rewards'),
      Reward.find({ userId: req.params.clientId }).sort({ awardedAt: -1 }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    res.json({
      success: true,
      data: {
        clientName: user.name,
        points: user.rewards?.points || 0,
        streak: user.rewards?.streak || 0,
        longestStreak: user.rewards?.longestStreak || 0,
        badges: user.rewards?.badges || [],
        rewardHistory: rewards,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
