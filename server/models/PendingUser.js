const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 600 seconds = 10 minutes TTL (MongoDB will automatically delete the doc)
  },
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);
