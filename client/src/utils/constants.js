export const APP_NAME = 'Presto Fitness';

export const BIOMARKER_CATEGORIES = [
  {
    category: 'Blood Sugar',
    biomarkers: [
      { name: 'Fasting Blood Sugar', unit: 'mg/dL', min: 70, max: 100 },
      { name: 'HbA1c', unit: '%', min: 4.0, max: 5.6 },
      { name: 'Post Prandial Blood Sugar', unit: 'mg/dL', min: 70, max: 140 },
    ],
  },
  {
    category: 'Lipid Profile',
    biomarkers: [
      { name: 'Total Cholesterol', unit: 'mg/dL', min: 0, max: 200 },
      { name: 'HDL Cholesterol', unit: 'mg/dL', min: 40, max: 60 },
      { name: 'LDL Cholesterol', unit: 'mg/dL', min: 0, max: 100 },
      { name: 'Triglycerides', unit: 'mg/dL', min: 0, max: 150 },
      { name: 'VLDL Cholesterol', unit: 'mg/dL', min: 5, max: 40 },
    ],
  },
  {
    category: 'Liver Function',
    biomarkers: [
      { name: 'SGOT (AST)', unit: 'U/L', min: 5, max: 40 },
      { name: 'SGPT (ALT)', unit: 'U/L', min: 7, max: 56 },
      { name: 'Alkaline Phosphatase', unit: 'U/L', min: 44, max: 147 },
      { name: 'Bilirubin Total', unit: 'mg/dL', min: 0.1, max: 1.2 },
    ],
  },
  {
    category: 'Kidney Function',
    biomarkers: [
      { name: 'Urea', unit: 'mg/dL', min: 7, max: 20 },
      { name: 'Creatinine', unit: 'mg/dL', min: 0.6, max: 1.2 },
      { name: 'Uric Acid', unit: 'mg/dL', min: 3.4, max: 7.0 },
      { name: 'eGFR', unit: 'mL/min', min: 90, max: 120 },
    ],
  },
  {
    category: 'Thyroid',
    biomarkers: [
      { name: 'TSH', unit: 'mIU/L', min: 0.4, max: 4.0 },
      { name: 'T3', unit: 'ng/dL', min: 80, max: 200 },
      { name: 'T4', unit: 'µg/dL', min: 4.5, max: 12.0 },
    ],
  },
  {
    category: 'Vitamins & Minerals',
    biomarkers: [
      { name: 'Vitamin D', unit: 'ng/mL', min: 30, max: 100 },
      { name: 'Vitamin B12', unit: 'pg/mL', min: 200, max: 900 },
      { name: 'Iron', unit: 'µg/dL', min: 60, max: 170 },
      { name: 'Calcium', unit: 'mg/dL', min: 8.5, max: 10.5 },
    ],
  },
  {
    category: 'CBC',
    biomarkers: [
      { name: 'Hemoglobin', unit: 'g/dL', min: 12.0, max: 17.5 },
      { name: 'RBC Count', unit: 'million/µL', min: 4.2, max: 5.9 },
      { name: 'WBC Count', unit: '/µL', min: 4000, max: 11000 },
      { name: 'Platelet Count', unit: '/µL', min: 150000, max: 400000 },
    ],
  },
];

export const TASK_TYPES = [
  { value: 'workout', label: 'Workout', icon: '💪', color: '#58a6ff' },
  { value: 'meal', label: 'Meal', icon: '🍽️', color: '#00d4aa' },
  { value: 'water', label: 'Water', icon: '💧', color: '#58a6ff' },
  { value: 'sleep', label: 'Sleep', icon: '😴', color: '#a371f7' },
  { value: 'supplement', label: 'Supplement', icon: '💊', color: '#d29922' },
  { value: 'custom', label: 'Custom', icon: '⭐', color: '#e6edf3' },
];

export const BADGE_LIST = [
  { id: 'first_workout', name: 'First Workout', icon: '🏋️', description: 'Complete your first workout' },
  { id: 'streak_7', name: '7 Day Streak', icon: '🔥', description: 'Maintain a 7-day streak' },
  { id: 'streak_30', name: '30 Day Streak', icon: '🔥', description: 'Maintain a 30-day streak' },
  { id: 'streak_100', name: '100 Day Streak', icon: '💯', description: 'Maintain a 100-day streak' },
  { id: 'weight_loss_5', name: 'Lost 5kg', icon: '⚖️', description: 'Lost 5kg from starting weight' },
  { id: 'weight_loss_10', name: 'Lost 10kg', icon: '🏆', description: 'Lost 10kg from starting weight' },
  { id: 'meal_logger', name: 'Meal Logger', icon: '📝', description: 'Log meals for 7 days straight' },
  { id: 'hydration_hero', name: 'Hydration Hero', icon: '💧', description: 'Complete water goals for 14 days' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Complete workout before 8 AM' },
  { id: 'perfect_week', name: 'Perfect Week', icon: '⭐', description: 'Complete all tasks for a full week' },
  { id: 'lab_master', name: 'Lab Master', icon: '🔬', description: 'All biomarkers in normal range' },
  { id: 'goal_reached', name: 'Goal Reached', icon: '🎯', description: 'Reach your goal weight' },
];

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
  { value: 'pre_workout', label: 'Pre-Workout', emoji: '⚡' },
  { value: 'post_workout', label: 'Post-Workout', emoji: '💪' },
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#00d4aa' },
  { value: 'intermediate', label: 'Intermediate', color: '#d29922' },
  { value: 'advanced', label: 'Advanced', color: '#f85149' },
];

export const MOTIVATIONAL_MESSAGES = [
  "Let's crush today's goals! 💪",
  "Every rep counts. Keep going! 🔥",
  "Your body is your temple. Treat it well. 🙏",
  "Champions are made when no one is watching. 🏆",
  "Consistency beats perfection. Show up today! ⭐",
  "You're stronger than you think! 💪",
  "Small steps lead to big changes. 🚀",
  "Today is a new opportunity to be great. ✨",
];
