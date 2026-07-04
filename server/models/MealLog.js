const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema(
  {
    food: {
      type: String,
      trim: true,
    },
    quantity: {
      type: String,
    },
    unit: {
      type: String,
    },
    calories: {
      type: Number,
    },
    protein: {
      type: Number,
    },
    carbs: {
      type: Number,
    },
    fats: {
      type: Number,
    },
  },
  { _id: true }
);

const mealLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    },
    items: [mealItemSchema],
    photo: {
      type: String,
    },
    comment: {
      type: String,
      trim: true,
    },
    isOnPlan: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MealLog', mealLogSchema);
