const mongoose = require('mongoose');

const kittyConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [{
    role: String,
    text: String,
    mood: String,
    imageUrl: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('KittyConversation', kittyConversationSchema);
