const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Payment = require('./models/Payment');
require('dotenv').config();

connectDB().then(async () => {
  const payments = await Payment.find();
  console.log(JSON.stringify(payments, null, 2));
  process.exit(0);
});
