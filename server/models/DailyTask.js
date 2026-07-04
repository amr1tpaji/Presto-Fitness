const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['workout', 'meal', 'water', 'sleep', 'supplement', 'custom'],
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    points: {
      type: Number,
      default: 10,
    },
  },
  { _id: true }
);

const dailyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    tasks: [taskItemSchema],
    totalPoints: {
      type: Number,
      default: 0,
    },
    allCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookup of a user's tasks on a specific date
dailyTaskSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
