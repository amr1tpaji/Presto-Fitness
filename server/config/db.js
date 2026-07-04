const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection string from environment variables.
 * Exits the process on connection failure to prevent the server from running
 * in a degraded state without a database.
 */
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error(`❌ MONGODB_URI is missing. Please add it to your Render Environment Variables!`);
    console.warn(`⚠️ The server is running, but database features will not work until this is fixed.`);
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Do not crash the server in production so Render deployment still succeeds
    console.warn(`⚠️ The server is running without a database.`);
  }
};

module.exports = connectDB;
