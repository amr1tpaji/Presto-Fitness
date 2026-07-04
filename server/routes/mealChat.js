const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MealLog = require('../models/MealLog');
const { protect } = require('../middleware/auth');
const { upload, getCloudinaryUrl } = require('../middleware/upload');

const router = express.Router();
router.use(protect);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const logMealTool = {
  functionDeclarations: [
    {
      name: 'log_meal',
      description: 'Logs a user\'s meal to the database with estimated nutritional information. Call this ONLY when you are confident about the food items and their rough quantities. If you are unsure, ask the user clarifying questions first.',
      parameters: {
        type: 'OBJECT',
        properties: {
          items: {
            type: 'ARRAY',
            description: 'List of food items identified',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING', description: 'Name of the food item' },
                quantity: { type: 'STRING', description: 'Quantity (e.g. 1 bowl, 200g)' },
                calories: { type: 'NUMBER', description: 'Estimated calories' },
                protein: { type: 'NUMBER', description: 'Estimated protein in grams' },
                carbs: { type: 'NUMBER', description: 'Estimated carbs in grams' },
                fats: { type: 'NUMBER', description: 'Estimated fats in grams' }
              },
              required: ['name', 'quantity', 'calories', 'protein', 'carbs', 'fats']
            }
          },
          totalCalories: { type: 'NUMBER', description: 'Sum of all item calories' },
          totalProtein: { type: 'NUMBER', description: 'Sum of all item protein' },
          totalCarbs: { type: 'NUMBER', description: 'Sum of all item carbs' },
          totalFats: { type: 'NUMBER', description: 'Sum of all item fats' }
        },
        required: ['items', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFats']
      }
    }
  ]
};

// ── POST /api/meal-chat ─────────────────────────────────────────────────────
router.post(
  '/',
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const message = req.body.message || '';
      let history = [];
      try {
        history = req.body.history ? JSON.parse(req.body.history) : [];
      } catch (e) {
        history = [];
      }
      
      const photoPath = req.file ? getCloudinaryUrl(req.file) : null;
      
      if (!message && !photoPath) {
        return res.status(400).json({ success: false, message: 'Message or photo is required' });
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [logMealTool],
      });

      const chatSession = model.startChat({
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
      });

      let response;
      const parts = [];

      if (message) {
        parts.push({ text: message });
      }

      if (photoPath) {
        // We must fetch the image from Cloudinary to pass it to Gemini as inlineData
        const imgResponse = await fetch(photoPath);
        const buffer = await imgResponse.arrayBuffer();
        parts.push({
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: req.file.mimetype || 'image/jpeg'
          }
        });
        parts.push({ text: 'Please analyze this food photo. If you need more details about portion size, ask me. Otherwise, log it.' });
      }

      const result = await chatSession.sendMessage(parts);
      const call = result.response.functionCalls()?.[0];

      if (call && call.name === 'log_meal') {
        const args = call.args;
        
        // Save to DB
        const mealLog = await MealLog.create({
          userId: req.user._id,
          photo: photoPath || (req.body.existingPhoto || undefined),
          comment: message,
          items: args.items,
          totalCalories: args.totalCalories,
          totalProtein: args.totalProtein,
          totalCarbs: args.totalCarbs,
          totalFats: args.totalFats,
        });

        return res.json({
          success: true,
          data: {
            isFunctionCall: true,
            mealLog,
            text: 'I have successfully logged your meal! 💪'
          }
        });
      } else {
        return res.json({
          success: true,
          data: {
            isFunctionCall: false,
            text: result.response.text(),
            photoPath // return the photo path so the frontend can display it in chat if it was just uploaded
          }
        });
      }

    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

module.exports = router;
