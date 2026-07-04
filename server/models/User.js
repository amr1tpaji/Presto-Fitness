const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required for verification'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // exclude from queries by default
    },
    role: {
      type: String,
      enum: ['client', 'admin'],
      default: 'client',
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    avatar: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    height: {
      type: Number, // in cm
    },
    currentWeight: {
      type: Number, // in kg
    },
    goalWeight: {
      type: Number, // in kg
    },
    subscription: {
      plan: String,
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
      },
    },
    activationKey: {
      type: String,
    },
    rewards: {
      points: { type: Number, default: 0 },
      badges: [
        {
          name: String,
          icon: String,
          earnedAt: { type: Date, default: Date.now },
        },
      ],
      streak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActivityDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: hash password only when it has been modified.
 * Uses bcryptjs with a cost factor of 12 for strong hashing.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidatePassword - The plaintext password to verify
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
