const express = require('express');
const User = require('../models/User');
const WeightLog = require('../models/WeightLog');
const Workout = require('../models/Workout');
const DietPlan = require('../models/DietPlan');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ── GET /api/admin/clients ──────────────────────────────────────────────────
// List all clients with optional search by name or phone
router.get('/clients', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const filter = { role: 'client' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clientsRaw, total] = await Promise.all([
      User.find(filter)
        .select('name phone email avatar gender currentWeight subscription rewards.streak rewards.points isPhoneVerified activationKey createdAt isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const Message = require('../models/Message');
    const clients = await Promise.all(
      clientsRaw.map(async (client) => {
        const unreadCount = await Message.countDocuments({
          sender: client._id,
          receiver: req.user._id,
          read: false,
        });
        return { ...client.toObject(), unreadCount };
      })
    );

    res.json({
      success: true,
      data: {
        clients,
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

// ── GET /api/admin/clients/:id ──────────────────────────────────────────────
// Full client detail with recent data
router.get('/clients/:id', async (req, res, next) => {
  try {
    const client = await User.findById(req.params.id).select('-otp');
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Fetch associated data in parallel
    const DailyTask = require('../models/DailyTask');
    const [recentWeightLogs, currentWorkout, currentDiet, recentTasksRecord, payments] = await Promise.all([
      WeightLog.find({ userId: client._id })
        .sort({ date: -1 })
        .limit(10),
      Workout.findOne({
        assignedTo: client._id,
        isActive: true,
      }).sort({ createdAt: -1 }),
      DietPlan.findOne({
        assignedTo: client._id,
        isActive: true,
      }).sort({ createdAt: -1 }),
      DailyTask.findOne({
        userId: client._id,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Payment.find({ userId: client._id })
        .sort({ paidAt: -1, createdAt: -1 })
    ]);

    res.json({
      success: true,
      data: {
        client,
        recentWeightLogs,
        currentWorkout,
        currentDiet,
        recentTasks: recentTasksRecord ? recentTasksRecord.tasks : [],
        payments,
        completionRate: recentTasksRecord && recentTasksRecord.tasks.length > 0
          ? Math.round((recentTasksRecord.tasks.filter(t => t.isCompleted).length / recentTasksRecord.tasks.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/dashboard/stats ──────────────────────────────────────────
// High-level dashboard statistics
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const [totalClients, activeClients, revenueAgg, recentPayments] =
      await Promise.all([
        User.countDocuments({ role: 'client' }),
        User.countDocuments({
          role: 'client',
          'subscription.status': 'active',
        }),
        Payment.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.find({ status: 'paid' })
          .populate('userId', 'name phone')
          .sort({ paidAt: -1 })
          .limit(10),
      ]);

    const totalRevenue =
      revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        totalRevenue,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/admin/clients/:id/plan-pdf ───────────────────────────────────
// Upload a generic PDF plan (workout/diet combined)
router.post('/clients/:id/plan-pdf', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }

    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const fileUrl = req.file.path.startsWith('http')
      ? req.file.path
      : `/uploads/${req.file.filename}`;

    client.planPdf = fileUrl;
    await client.save();
    
    // Read PDF and extract text (Wrapped in try/catch so upload succeeds even if AI fails)
    try {
      let pdfBuffer;
      if (req.file.path.startsWith('http')) {
        const response = await fetch(req.file.path);
        const arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      } else {
        pdfBuffer = fs.readFileSync(req.file.path);
      }
      
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = pdfData.text;

      // Use Groq to parse Diet Plan from text
      if (process.env.GROQ_API_KEY && pdfText && pdfText.trim().length > 0) {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = `You are a fitness data extraction assistant.
Extract the diet plan from the following PDF text.
Output ONLY a valid JSON object matching this exact schema:
{
  "title": "String (e.g. 'Custom Diet Plan')",
  "totalCalories": Number,
  "totalProtein": Number (in grams),
  "totalCarbs": Number (in grams),
  "totalFats": Number (in grams),
  "meals": [
    {
      "name": "String (must be exactly one of: 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout')",
      "time": "String (e.g. '8:00 AM')",
      "items": [
        {
          "food": "String (food name)",
          "quantity": "String (e.g. '200g', '1 cup')",
          "calories": Number,
          "protein": Number,
          "carbs": Number,
          "fats": Number
        }
      ]
    }
  ]
}
If a value is not provided in the text, estimate reasonably or use 0. Do not wrap in markdown or backticks, just output raw JSON.

PDF TEXT:
${pdfText}`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' }
        });

        let aiResponse = chatCompletion.choices[0]?.message?.content || '{}';
        
        // Clean markdown if present
        let text = aiResponse.trim();
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) {
          text = jsonMatch[1].trim();
        }

        try {
          const dietData = JSON.parse(text);
          if (dietData.meals && dietData.meals.length > 0) {
            // Deactivate current active diet plan
            await DietPlan.updateMany({ assignedTo: client._id, isActive: true }, { isActive: false });
            
            const newDietPlan = new DietPlan({
              ...dietData,
              assignedTo: [client._id],
              createdBy: req.user._id,
              isActive: true,
            });
            await newDietPlan.save();
          }
        } catch (err) {
          console.error("Failed to parse AI response for diet plan", text);
        }
      }
    } catch (parseError) {
      console.error("Failed to parse PDF or extract diet plan:", parseError);
    }

    res.json({
      success: true,
      message: 'Plan PDF uploaded and processed successfully',
      data: { planPdf: fileUrl },
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/admin/clients/:id/plan-pdf ─────────────────────────────────
// Remove a client's plan PDF
router.delete('/clients/:id/plan-pdf', async (req, res, next) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.planPdf = null;
    await client.save();

    // Also deactivate the AI generated diet plan
    await DietPlan.updateMany({ assignedTo: client._id, isActive: true }, { isActive: false });

    res.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/admin/clients/:id/status ───────────────────────────────────────
// Toggle client's active status
router.put('/clients/:id/status', async (req, res, next) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const currentStatus = client.isActive !== false;
    client.isActive = req.body.isActive !== undefined ? req.body.isActive : !currentStatus;
    await client.save();

    res.json({
      success: true,
      message: `Client has been ${client.isActive ? 'activated' : 'deactivated'}.`,
      data: { isActive: client.isActive },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/admin/tasks/:taskId/toggle ─────────────────────────────────────
// Toggle task completion status
router.put('/tasks/:taskId/toggle', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const DailyTask = require('../models/DailyTask');
    
    const dailyTask = await DailyTask.findOne({ 'tasks._id': taskId });
    if (!dailyTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = dailyTask.tasks.id(taskId);
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;

    // Recalculate points
    dailyTask.totalPoints = dailyTask.tasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + (t.points || 10), 0);

    const allDone = dailyTask.tasks.every((t) => t.isCompleted);
    dailyTask.allCompleted = allDone;
    if (allDone) {
      dailyTask.totalPoints += 50; // all-tasks bonus
    }

    await dailyTask.save();

    res.json({ success: true, message: 'Task toggled successfully' });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/admin/clients/:id ───────────────────────────────────────────
// Permanently delete a client and all their associated data
router.delete('/clients/:id', async (req, res, next) => {
  try {
    const clientId = req.params.id;

    // Check if client exists
    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Dynamic import to avoid missing models at the top
    const DailyTask = require('../models/DailyTask');
    const LabReport = require('../models/LabReport');
    const MealLog = require('../models/MealLog');
    const Reward = require('../models/Reward');
    const Message = require('../models/Message');

    // Cascade Delete all user data
    await Promise.all([
      WeightLog.deleteMany({ userId: clientId }),
      Workout.updateMany({ assignedTo: clientId }, { $pull: { assignedTo: clientId } }),
      DietPlan.updateMany({ assignedTo: clientId }, { $pull: { assignedTo: clientId } }),
      Payment.deleteMany({ userId: clientId }),
      DailyTask.deleteMany({ userId: clientId }),
      LabReport.deleteMany({ userId: clientId }),
      MealLog.deleteMany({ userId: clientId }),
      Reward.deleteMany({ userId: clientId }),
      Message.deleteMany({ $or: [{ sender: clientId }, { receiver: clientId }] }),
    ]);

    // Finally delete the user
    await User.findByIdAndDelete(clientId);

    res.json({
      success: true,
      message: 'Client and all associated data permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
