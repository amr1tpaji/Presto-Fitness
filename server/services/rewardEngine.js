const User = require('../models/User');
const Reward = require('../models/Reward');
const DailyTask = require('../models/DailyTask');
const MealLog = require('../models/MealLog');
const Workout = require('../models/Workout');
const WeightLog = require('../models/WeightLog');

/**
 * Badge definitions.
 * Each entry describes the criteria for earning a badge, the reward type,
 * and the points awarded. The `check` function receives context and returns
 * true if the user qualifies.
 */
const BADGE_DEFINITIONS = [
  // ── Streak Badges ───────────────────────────────────────────────────────
  {
    id: 'streak_7',
    type: 'streak',
    title: '7-Day Warrior',
    description: 'Completed all daily tasks for 7 consecutive days',
    icon: '🔥',
    points: 100,
    criteria: { type: 'streak', threshold: 7 },
    check: (ctx) => ctx.streak >= 7,
  },
  {
    id: 'streak_30',
    type: 'streak',
    title: '30-Day Champion',
    description: 'Completed all daily tasks for 30 consecutive days',
    icon: '💪',
    points: 500,
    criteria: { type: 'streak', threshold: 30 },
    check: (ctx) => ctx.streak >= 30,
  },
  {
    id: 'streak_90',
    type: 'streak',
    title: '90-Day Legend',
    description: 'Completed all daily tasks for 90 consecutive days',
    icon: '🏆',
    points: 1500,
    criteria: { type: 'streak', threshold: 90 },
    check: (ctx) => ctx.streak >= 90,
  },

  // ── Milestone Badges ──────────────────────────────────────────────────
  {
    id: 'first_workout',
    type: 'milestone',
    title: 'First Steps',
    description: 'Completed your first workout',
    icon: '🎯',
    points: 50,
    criteria: { type: 'workouts_completed', threshold: 1 },
    check: (ctx) => ctx.completedWorkoutTasks >= 1,
  },
  {
    id: 'meals_10',
    type: 'milestone',
    title: 'Nutrition Tracker',
    description: 'Logged 10 meals',
    icon: '🥗',
    points: 75,
    criteria: { type: 'meals_logged', threshold: 10 },
    check: (ctx) => ctx.mealsLogged >= 10,
  },
  {
    id: 'tasks_50',
    type: 'milestone',
    title: 'Task Master',
    description: 'Completed 50 daily tasks',
    icon: '✅',
    points: 200,
    criteria: { type: 'tasks_completed', threshold: 50 },
    check: (ctx) => ctx.tasksCompleted >= 50,
  },
  {
    id: 'weight_goal',
    type: 'milestone',
    title: 'Goal Crusher',
    description: 'Reached your target weight',
    icon: '⚖️',
    points: 1000,
    criteria: { type: 'weight_goal', threshold: 1 },
    check: (ctx) => ctx.weightGoalReached,
  },
];

/**
 * Build context data needed by badge checks.
 * Aggregates counts from the database for the given user.
 *
 * @param {string} userId
 * @returns {Promise<object>} Context object with streak, counts, etc.
 */
const buildContext = async (userId) => {
  const user = await User.findById(userId);

  // Count completed workout-type tasks
  const completedWorkoutTasks = await DailyTask.countDocuments({
    userId,
    tasks: { $elemMatch: { type: 'workout', isCompleted: true } },
  });

  // Count logged meals
  const mealsLogged = await MealLog.countDocuments({ userId });

  // Count all completed individual tasks (sum across daily task docs)
  const taskAgg = await DailyTask.aggregate([
    { $match: { userId: user._id } },
    { $unwind: '$tasks' },
    { $match: { 'tasks.isCompleted': true } },
    { $count: 'total' },
  ]);
  const tasksCompleted = taskAgg.length > 0 ? taskAgg[0].total : 0;

  // Check if weight goal is reached
  let weightGoalReached = false;
  if (user.goalWeight && user.currentWeight) {
    // Goal reached if current weight is within 0.5 units of the goal
    weightGoalReached = Math.abs(user.currentWeight - user.goalWeight) <= 0.5;
  }

  return {
    streak: user.rewards?.streak || 0,
    completedWorkoutTasks,
    mealsLogged,
    tasksCompleted,
    weightGoalReached,
  };
};

/**
 * Check if a user qualifies for any new rewards and award them.
 * Skips badges the user has already earned to prevent duplicates.
 *
 * @param {string} userId
 * @returns {Promise<Array>} Newly awarded rewards
 */
const checkAndAwardRewards = async (userId) => {
  const ctx = await buildContext(userId);

  // Get titles of rewards already earned
  const existingRewards = await Reward.find({ userId }).select('title');
  const earnedTitles = new Set(existingRewards.map((r) => r.title));

  const newRewards = [];

  for (const badge of BADGE_DEFINITIONS) {
    // Skip if already earned
    if (earnedTitles.has(badge.title)) continue;

    // Check if user qualifies
    if (badge.check(ctx)) {
      const reward = await Reward.create({
        userId,
        type: badge.type,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        pointsAwarded: badge.points,
        criteria: badge.criteria,
      });

      // Add badge to user's rewards.badges array and increment points
      await User.findByIdAndUpdate(userId, {
        $push: {
          'rewards.badges': {
            name: badge.title,
            icon: badge.icon,
            earnedAt: new Date(),
          },
        },
        $inc: { 'rewards.points': badge.points },
      });

      newRewards.push(reward);
    }
  }

  return newRewards;
};

const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if they completed today's requirements
  const mealsToday = await MealLog.countDocuments({
    userId,
    date: { $gte: today, $lt: tomorrow },
  });
  const weightToday = await WeightLog.countDocuments({
    userId,
    date: { $gte: today, $lt: tomorrow },
  });

  const completedToday = mealsToday > 0 && weightToday > 0;

  if (!completedToday) {
    // Not completed yet, don't update streak
    return { streak: user.rewards?.streak || 0, longestStreak: user.rewards?.longestStreak || 0 };
  }

  const lastActivity = user.rewards?.lastActivityDate;
  if (lastActivity && new Date(lastActivity).toDateString() === today.toDateString()) {
    // Already updated today — keep current streak
    return { streak: user.rewards?.streak || 1, longestStreak: user.rewards?.longestStreak || 1 };
  }

  // They completed it today, let's see if they completed it yesterday
  const mealsYesterday = await MealLog.countDocuments({
    userId,
    date: { $gte: yesterday, $lt: today },
  });
  const weightYesterday = await WeightLog.countDocuments({
    userId,
    date: { $gte: yesterday, $lt: today },
  });

  const completedYesterday = mealsYesterday > 0 && weightYesterday > 0;

  let newStreak;

  if (completedYesterday) {
    // Consecutive day — increment streak
    newStreak = (user.rewards?.streak || 0) + 1;
  } else {
    // Streak broken — reset to 1
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, user.rewards?.longestStreak || 0);

  await User.findByIdAndUpdate(userId, {
    'rewards.streak': newStreak,
    'rewards.longestStreak': longestStreak,
    'rewards.lastActivityDate': today,
  });

  return { streak: newStreak, longestStreak };
};

module.exports = { checkAndAwardRewards, updateStreak };
