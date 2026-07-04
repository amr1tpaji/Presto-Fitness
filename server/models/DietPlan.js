const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    food: {
      type: String,
      trim: true,
    },
    quantity: {
      type: String, // e.g. "200g", "1 cup"
    },
    unit: {
      type: String,
    },
    calories: {
      type: Number,
    },
    protein: {
      type: Number, // in grams
    },
    carbs: {
      type: Number, // in grams
    },
    fats: {
      type: Number, // in grams
    },
  },
  { _id: true }
);

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'],
    },
    items: [foodItemSchema],
    time: {
      type: String, // e.g. "8:00 AM"
    },
  },
  { _id: true }
);

const dietPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Diet plan title is required'],
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
    meals: [mealSchema],
    totalCalories: {
      type: Number,
    },
    totalProtein: {
      type: Number,
    },
    totalCarbs: {
      type: Number,
    },
    totalFats: {
      type: Number,
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DietPlan', dietPlanSchema);
