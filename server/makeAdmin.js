require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const makeAdmin = async () => {
  try {
    const phoneNumber = process.argv[2];
    
    if (!phoneNumber) {
      console.log('❌ Please provide your phone number as an argument.');
      console.log('Example: node makeAdmin.js 1234567890');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      console.log(`❌ Could not find any user with phone number: ${phoneNumber}`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`⚠️ User ${user.name} is already an admin!`);
      process.exit(0);
    }

    await User.findOneAndUpdate(
      { phone: phoneNumber },
      { role: 'admin' }
    );
    console.log(`✅ Success! ${user.name} (${user.phone}) has been promoted to Admin.`);
    console.log(`You can now log out and log back in to access the Admin Dashboard.`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();
