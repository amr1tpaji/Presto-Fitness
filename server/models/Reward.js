const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['badge', 'milestone', 'streak'],
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
    },
    pointsAwarded: {
      type: Number,
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
    criteria: {
      criteriaType: {
        type: String, // e.g. "streak", "meals_logged", "workouts_completed"
      },
      threshold: Number, // e.g. 7 (for 7-day streak)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reward', rewardSchema);
