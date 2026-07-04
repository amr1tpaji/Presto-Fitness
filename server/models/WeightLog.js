const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    weight: {
      type: Number,
      required: [true, 'Weight value is required'],
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    photo: {
      type: String, // file path to progress photo
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WeightLog', weightLogSchema);
