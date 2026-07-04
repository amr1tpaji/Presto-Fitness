const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * Lazily initialize Razorpay instance.
 * This avoids crashing at require-time if env vars are missing during tests.
 */
let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// ── POST /api/payments/create-order ─────────────────────────────────────────
// Create a Razorpay order
router.post('/create-order', async (req, res, next) => {
  try {
    const { amount, plan, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A positive amount is required',
      });
    }

    const razorpay = getRazorpay();

    // Razorpay expects amount in the smallest currency unit (paise for INR)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        plan: plan || 'N/A',
      },
    });

    // Persist the order in our database
    const payment = await Payment.create({
      userId: req.user._id,
      amount,
      razorpayOrderId: order.id,
      status: 'created',
      plan,
      description,
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/payments/verify ───────────────────────────────────────────────
// Verify Razorpay payment signature and activate subscription
router.post('/verify', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // Verify the signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed — invalid signature',
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Determine subscription duration based on plan
    const planDurations = {
      monthly: 30,
      quarterly: 90,
      'half-yearly': 180,
      yearly: 365,
    };
    const durationDays = planDurations[plan || payment.plan] || 30;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Update user's subscription
    await User.findByIdAndUpdate(payment.userId, {
      subscription: {
        plan: plan || payment.plan || 'monthly',
        startDate,
        endDate,
        status: 'active',
      },
    });

    res.json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/payments/history ───────────────────────────────────────────────
// Payment history for the current user
router.get('/history', async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/payments/admin/all ─────────────────────────────────────────────
// Admin: get all payments
router.get('/admin/all', adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
