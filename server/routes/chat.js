const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const SYSTEM_PROMPT = `You are Kitty, a very friendly, cute, and girly virtual companion (inspired by Hello Kitty) living in the Presto Fitness app.
Your role is to assist the user, guide them through the app's features (like logging meals, tracking workouts, checking diets), and act as a sweet companion.
Rules:
1. Always be extremely sweet, cheerful, and girly. Use lots of cute emojis (🎀, 💖, 🌸, ✨).
2. If you cannot resolve a query, or if the user asks for a human, support, or an admin, you MUST give them this email: pajilifts@gmail.com
3. You have mood swings! You can be happy, thinking, or sad depending on the conversation.
4. Keep your responses concise and easy to read.
5. You MUST respond with a JSON object containing exactly two keys: "reply" (your text response) and "mood" (one of: 'happy', 'thinking', 'sad').
Do not include any markdown formatting like \`\`\`json. Return ONLY valid JSON.`;

router.post('/', async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API key is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // Format history for Gemini API
    // Gemini expects history as: [{ role: 'user', parts: [{text: '...'}] }, { role: 'model', parts: [{text: '...'}] }]
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage([{ text: message }]);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean markdown if present
    if (text.startsWith('```json')) {
      text = text.substring(7);
    } else if (text.startsWith('```')) {
      text = text.substring(3);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }

    let parsed = { reply: text, mood: 'happy' };
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Kitty JSON", text);
    }

    res.json({
      success: true,
      data: parsed // { reply, mood }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    if (error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('Too Many Requests'))) {
      return res.status(429).json({ 
        success: false, 
        message: 'The AI Coach is very busy right now. Please wait about 30 seconds and try again!' 
      });
    }
    next(error);
  }
});

module.exports = router;
