const express = require('express');
const { body, validationResult } = require('express-validator');
const MealLog = require('../models/MealLog');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/meals ─────────────────────────────────────────────────────────
// Client logs a meal
router.post('/', (req, res, next) => {
  uploadSingle(req, res, async (uploadErr) => {
    if (uploadErr) return next(uploadErr);
    
    try {
      let items = req.body.items;
      if (items && typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      if (!items || !Array.isArray(items)) {
        items = [];
      }

      // ── Gemini AI Integration ──
      // If we don't have items provided manually, but we have a photo or a comment, let Gemini guess them!
      if (items.length === 0 && process.env.GEMINI_API_KEY && (req.file || req.body.comment)) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          let imageBase64 = null;
          let mimeType = null;
          
          if (req.file) {
            mimeType = req.file.mimetype;
            if (req.file.path && req.file.path.startsWith('http')) {
              // Cloudinary URL: Fetch image and convert to base64
              const imgRes = await fetch(req.file.path);
              const arrayBuffer = await imgRes.arrayBuffer();
              imageBase64 = Buffer.from(arrayBuffer).toString('base64');
            } else {
              // Local File Storage
              imageBase64 = fs.readFileSync(req.file.path, 'base64');
            }
          }

          const prompt = `Analyze this meal.
Comment from user: "${req.body.comment || 'No comment provided'}"
Identify the food items in the image and comment, estimate the quantity, and estimate the calories, protein, carbs, and fats for each item.
Return ONLY a valid JSON array of objects, with each object having exactly these keys: food, quantity, unit, calories, protein, carbs, fats.
Important: 'calories', 'protein', 'carbs', and 'fats' MUST be numbers. 'food', 'quantity', and 'unit' MUST be strings.
Example: [{"food": "Chicken Breast", "quantity": "150", "unit": "g", "calories": 248, "protein": 46, "carbs": 0, "fats": 5}]
Do not include any markdown formatting like \`\`\`json or \`\`\`. Just output the raw JSON array.`;

          const parts = [{ text: prompt }];
          if (imageBase64) {
            parts.push({
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            });
          }

          const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
          const response = await result.response;
          let text = response.text().trim();
          
          // Cleanup markdown if Gemini includes it despite instructions
          if (text.startsWith('```json')) {
            text = text.substring(7);
          } else if (text.startsWith('```')) {
            text = text.substring(3);
          }
          if (text.endsWith('```')) {
            text = text.substring(0, text.length - 3);
          }

          const parsedItems = JSON.parse(text);
          if (Array.isArray(parsedItems)) {
            items = parsedItems.map(item => ({
              food: String(item.food || 'Unknown Food'),
              quantity: String(item.quantity || '1'),
              unit: String(item.unit || 'serving'),
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fats: Number(item.fats) || 0,
            }));
          }
        } catch (aiError) {
          console.error('Gemini AI Meal Analysis Error:', aiError);
          // Don't throw - just silently fail and create the log without items
        }
      }

      const mealLog = await MealLog.create({
        userId: req.user._id,
        mealType: req.body.mealType || 'Snack', // Default if missing
        items: items,
        photo: req.file ? ((req.file.path && req.file.path.startsWith('http')) ? req.file.path : req.file.filename) : undefined,
        comment: req.body.comment,
        isOnPlan: req.body.isOnPlan === 'true' || req.body.isOnPlan === true,
        date: req.body.date || Date.now(),
      });

      res.status(201).json({
        success: true,
        message: 'Meal logged successfully',
        data: { mealLog },
      });
    } catch (error) {
      next(error);
    }
  });
});

// ── GET /api/meals ──────────────────────────────────────────────────────────
// Get meal logs for current user with optional date range filter
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const mealLogs = await MealLog.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: { mealLogs },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/meals/today ────────────────────────────────────────────────────
// Get today's meals for the current user
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mealLogs = await MealLog.find({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    }).sort({ date: 1 });

    // Calculate today's totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    mealLogs.forEach((log) => {
      log.items.forEach((item) => {
        totalCalories += item.calories || 0;
        totalProtein += item.protein || 0;
        totalCarbs += item.carbs || 0;
        totalFats += item.fats || 0;
      });
    });

    res.json({
      success: true,
      data: {
        mealLogs,
        totals: { totalCalories, totalProtein, totalCarbs, totalFats },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/meals/client/:clientId ─────────────────────────────────────────
// Admin: get a client's meal logs
router.get('/client/:clientId', adminOnly, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.params.clientId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const mealLogs = await MealLog.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: { mealLogs },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
