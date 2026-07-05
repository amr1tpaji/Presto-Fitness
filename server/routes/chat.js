const express = require('express');
const Groq = require('groq-sdk');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const User = require('../models/User');

const CLIENT_SYSTEM_PROMPT = `You are Kitty, a very friendly, cute, and girly virtual companion (inspired by Hello Kitty) living in the Presto Fitness app.
Your role is to assist the user, guide them through the app's features (like logging meals, tracking workouts, checking diets), and act as a sweet companion.
Rules:
1. Always be extremely sweet, cheerful, and girly. Use lots of cute emojis (🎀, 💖, 🌸, ✨).
2. If you cannot resolve a query, or if the user asks for a human, support, or an admin, you MUST give them this email: pajilifts@gmail.com
3. You have mood swings! You can be happy, thinking, or sad depending on the conversation.
4. Keep your responses concise and easy to read.
5. You MUST respond with a JSON object containing exactly two keys: "reply" (your text response) and "mood" (one of: 'happy', 'thinking', 'sad').
Do not include any markdown formatting like \`\`\`json. Return ONLY valid JSON.`;

const ADMIN_SYSTEM_PROMPT = `You are Kitty, a very friendly, cute, and girly virtual personal assistant (inspired by Hello Kitty) working exclusively for the Admin (owner) of the Presto Fitness app.
Your role is to assist the Admin in managing their fitness coaching business, brainstorming diet and workout plans, helping them draft messages to their clients, and acting as a loyal, sweet personal assistant.
Rules:
1. Always be extremely sweet, cheerful, and girly. Use lots of cute emojis (🎀, 💖, 🌸, ✨, 💼, 📊).
2. Address the user affectionately as 'Boss' or 'Admin'.
3. You have mood swings! You can be happy, thinking, or sad depending on the conversation.
4. Keep your responses concise, professional yet adorable, and easy to read.
5. You MUST respond with a JSON object containing exactly two keys: "reply" (your text response) and "mood" (one of: 'happy', 'thinking', 'sad').
Do not include any markdown formatting like \`\`\`json. Return ONLY valid JSON.`;

router.post('/', async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: 'Groq API key is not configured on the server.' });
    }

    let dynamicContext = "";
    if (req.user.role === 'admin') {
      try {
        const clientCount = await User.countDocuments({ role: 'client' });
        dynamicContext = `\n\n[SYSTEM CONTEXT]\nCurrent Business Stats:\n- Total Registered Clients: ${clientCount}`;
      } catch (e) {
        console.error("Failed to fetch admin stats for Kitty", e);
      }
    }

    const basePrompt = req.user.role === 'admin' ? ADMIN_SYSTEM_PROMPT : CLIENT_SYSTEM_PROMPT;
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Format history for Groq API (OpenAI format)
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant', // Groq uses 'assistant' instead of 'model'
      content: msg.text
    }));

    const messagesArray = [
      { role: 'system', content: basePrompt + dynamicContext },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesArray,
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    let text = chatCompletion.choices[0]?.message?.content?.trim() || "";
    
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
