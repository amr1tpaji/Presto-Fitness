const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    sets: {
      type: Number,
    },
    reps: {
      type: String, // e.g. "8-12" or "to failure"
    },
    weight: {
      type: String, // e.g. "20kg" or "bodyweight"
    },
    restTime: {
      type: String, // e.g. "60s" or "2min"
    },
    notes: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
  },
  { _id: true }
);

const workoutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Workout title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    exercises: [exerciseSchema],
    day: {
      type: String, // e.g. "Monday", "Day 1", "Push Day"
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Workout', workoutSchema);
