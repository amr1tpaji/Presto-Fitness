const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MealLog = require('../models/MealLog');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

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
      
      const photoPath = req.file ? ((req.file.path && req.file.path.startsWith('http')) ? req.file.path : req.file.filename) : null;
      
      if (!message && !photoPath) {
        return res.status(400).json({ success: false, message: 'Message or photo is required' });
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [logMealTool],
        systemInstruction: `You are a strict fitness and nutrition AI assistant. 
When a user uploads a food photo or describes a meal without explicitly stating the exact quantities or portion sizes (e.g., "I ate this", "a bowl of rice", "chicken"), YOU MUST NOT call the log_meal function immediately. 
Instead, you MUST reply with a friendly question asking for the exact quantity or portion size (e.g. "How many grams was the chicken?", "Was it a small or large bowl?"). 
Only call the log_meal function when you are reasonably confident about the exact quantities.`
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

      if (req.file || req.body.existingPhoto) {
        let imageBase64 = null;
        let mimeType = req.file ? req.file.mimetype : 'image/jpeg';
        
        const targetPath = req.file ? req.file.path : req.body.existingPhoto;
        const fs = require('fs');
        const path = require('path');
        let fetchedBase64 = null;
        
        if (targetPath.startsWith('http')) {
          try {
            const imgResponse = await fetch(targetPath);
            if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`);
            const buffer = await imgResponse.arrayBuffer();
            fetchedBase64 = Buffer.from(buffer).toString('base64');
          } catch (fetchErr) {
            console.error('Fetch failed for image URL, falling back to local disk:', fetchErr);
            const parts = targetPath.split('/');
            const filename = parts[parts.length - 1];
            const localFilePath = path.join(__dirname, '../uploads', filename);
            try {
              fetchedBase64 = fs.readFileSync(localFilePath, 'base64');
            } catch (fsErr) {
              throw new Error('Failed to read image from URL and local storage');
            }
          }
        } else {
          let localFilePath = path.isAbsolute(targetPath) 
            ? targetPath 
            : path.join(__dirname, '../uploads', path.basename(targetPath));
          try {
            fetchedBase64 = fs.readFileSync(localFilePath, 'base64');
          } catch (fsErr) {
            throw new Error('Failed to read image file from server storage');
          }
        }
        
        imageBase64 = fetchedBase64;

        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        });
        parts.push({ text: 'I am eating this. Please analyze it.' });
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
      console.error('MealChat Error:', error);
      if (error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('Too Many Requests'))) {
        return res.status(429).json({ 
          success: false, 
          message: 'The AI is processing too many requests right now. Please wait about 30 seconds and try again!' 
        });
      }
      next(error);
    }
  }
);

module.exports = router;
