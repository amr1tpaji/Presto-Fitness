const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const SYSTEM_PROMPT = `You are the Presto Fitness AI Assistant, an expert virtual fitness and nutrition coach.
Your role is to help clients with their workout routines, diet plans, exercise form, and general health inquiries.
Rules:
1. Always be encouraging, motivating, and professional.
2. If a user asks a question unrelated to fitness, health, or nutrition (e.g., coding, politics, general trivia), politely decline to answer and steer the conversation back to fitness.
3. Keep your responses concise and easy to read on a mobile device. Use bullet points when necessary.
4. If asked about medical conditions or injuries, always recommend consulting a doctor or physical therapist, while providing only general, safe advice if applicable.
`;

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
      model: 'gemini-1.5-flash',
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
    const text = response.text();

    res.json({
      success: true,
      data: { reply: text }
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
