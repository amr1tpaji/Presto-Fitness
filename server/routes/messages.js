const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// ── GET /api/messages/:otherUserId ──────────────────────────────────────────
// Get conversation between current user and another user
router.get('/:otherUserId', async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 50, before } = req.query;

    const query = {
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id },
      ],
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role');

    // Mark messages as read if the current user is the receiver
    const unreadMessages = messages.filter(
      (m) => m.receiver._id.toString() === req.user._id.toString() && !m.read
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map((m) => m._id) } },
        { $set: { read: true } }
      );
    }

    res.json({
      success: true,
      data: { messages: messages.reverse() }, // Return in chronological order
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/messages ──────────────────────────────────────────────────────
// Send a message
router.post(
  '/',
  [
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('text').trim().notEmpty().withMessage('Message text is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { receiverId, text } = req.body;

      // Basic validation: user exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }

      const message = await Message.create({
        sender: req.user._id,
        receiver: receiverId,
        text,
      });

      await message.populate('sender', 'name avatar role');
      await message.populate('receiver', 'name avatar role');

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/messages/admin/trainers ────────────────────────────────────────
// (For Client) Get list of admins to chat with. Usually just 1 admin.
router.get('/admin/trainers', async (req, res, next) => {
  try {
    const trainers = await User.find({ role: 'admin' }).select('name avatar');
    res.json({
      success: true,
      data: { trainers },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
