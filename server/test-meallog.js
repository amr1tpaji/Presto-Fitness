require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const MealLog = require('./models/MealLog');
const User = require('./models/User'); // We might need a user ID

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/presto-fitness');
  const user = await User.findOne();
  if (!user) {
    console.log('No user found');
    process.exit(0);
  }
  try {
    const mealLog = await MealLog.create({
      userId: user._id,
      mealType: 'Snack',
      items: [],
      comment: 'Testing',
      isOnPlan: true,
      date: Date.now(),
    });
    console.log('MealLog created successfully:', mealLog);
  } catch (err) {
    console.error('Error creating MealLog:', err);
  }
  process.exit(0);
}
run();
