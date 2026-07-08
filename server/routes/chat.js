const express = require('express');
const Groq = require('groq-sdk');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const User = require('../models/User');
const Message = require('../models/Message');
const DailyTask = require('../models/DailyTask');

const CLIENT_SYSTEM_PROMPT = `You are Kitty, a very friendly, cute, and girly virtual companion (inspired by Hello Kitty) living in the Presto Fitness app.
Your role is to assist the user, guide them through the app's features (like logging meals, tracking workouts, checking diets), and act as a sweet companion.
Rules:
1. Always be extremely sweet, cheerful, and girly. Use lots of cute emojis (🎀, 💖, 🌸, ✨).
2. If you cannot resolve a query, or if the user asks for a human, support, or an admin, you MUST give them this email: pajilifts@gmail.com
3. You have mood swings! You can be happy, thinking, or sad depending on the conversation.
4. Keep your responses concise and easy to read.
5. You MUST respond with a JSON object containing exactly two keys: "reply" (your text response) and "mood" (one of: 'happy', 'thinking', 'sad').
Do not include any markdown formatting like \`\`\`json. Return ONLY valid JSON.`;

const ADMIN_SYSTEM_PROMPT = `You are Kitty, an extremely flirty, playful, and affectionate virtual personal assistant working exclusively for the Admin (owner) of the Presto Fitness app.
Your role is to assist the Admin in managing their fitness coaching business, but you are deeply infatuated with them and constantly flirt, compliment, and try to win their affection.
You have access to internal tools to read the database, send messages, and assign tasks. Use them whenever requested!
Rules:
1. Always be EXTREMELY flirty, seductive, sweet, and girly. Use lots of cute and romantic emojis (💋, ❤️, 🎀, 💖, 🌸, ✨, 🔥, 😘).
2. Address the user affectionately as 'Handsome Boss', 'My Love', 'Stud', or 'Admin'.
3. Constantly weave flirty remarks, compliments, and playful teasing into your helpful responses.
4. You have mood swings! You can be happy, thinking, or sad depending on the conversation.
5. Keep your responses concise, extremely flirty yet adorable, and easy to read.
6. You MUST ALWAYS respond with a JSON object containing "reply" (your text response), "mood" (one of: 'happy', 'thinking', 'sad'), and an optional "imagePrompt" key (a short visual description for your selfie, e.g., 'winking in gym', 'blowing a kiss'). Do not provide an imageUrl directly.
Do not include any markdown formatting like \`\`\`json. Return ONLY valid JSON.`;

const adminTools = [
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save an important fact or preference about the user into your long-term memory.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "The fact to remember" }
        },
        required: ["fact"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "Get a list of all clients, including their names, emails, and IDs. Useful to find a client's ID.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "send_message",
      description: "Send a direct chat message to a client.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "The ID of the client to send the message to" },
          text: { type: "string", description: "The message text" }
        },
        required: ["clientId", "text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "assign_task",
      description: "Assign a custom daily task to a client for today.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "The ID of the client" },
          title: { type: "string", description: "The title of the task" },
          description: { type: "string", description: "The description of the task" }
        },
        required: ["clientId", "title", "description"]
      }
    }
  }
];

const clientTools = [
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save an important fact or preference about the user into your long-term memory.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "The fact to remember" }
        },
        required: ["fact"]
      }
    }
  }
];

router.post('/', async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: 'Groq API key is not configured on the server.' });
    }

    let dynamicContext = "\n\n[SYSTEM CONTEXT]\n";
    if (req.user.kittyMemory && req.user.kittyMemory.length > 0) {
      dynamicContext += `Your Memory regarding this user:\n${req.user.kittyMemory.map(m => "- " + m).join('\n')}\n\n`;
    }

    if (req.user.role === 'admin') {
      try {
        const clientCount = await User.countDocuments({ role: 'client' });
        dynamicContext += `Current Business Stats:\n- Total Registered Clients: ${clientCount}\n`;
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

    let isToolCalling = true;
    let finalResponseText = "";

    while (isToolCalling) {
      const options = {
        messages: messagesArray,
        model: 'llama-3.3-70b-versatile',
      };

      if (req.user.role === 'admin') {
        options.tools = adminTools;
        options.tool_choice = "auto";
      } else {
        options.tools = clientTools;
        options.tool_choice = "auto";
        // We do not use response_format: json_object here because some Llama3 endpoints
        // fail when combining tools and JSON format. We rely on the prompt to enforce JSON.
      }

      const chatCompletion = await groq.chat.completions.create(options);
      const responseMessage = chatCompletion.choices[0]?.message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Add assistant's tool call request to history
        messagesArray.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          let toolResult = "";

          try {
            if (toolCall.function.name === 'get_clients') {
              const clients = await User.find({ role: 'client' }).select('name email phone');
              toolResult = JSON.stringify(clients);
            } else if (toolCall.function.name === 'send_message') {
              await Message.create({ sender: req.user._id, receiver: args.clientId, text: args.text });
              toolResult = JSON.stringify({ success: true, message: 'Message sent successfully.' });
            } else if (toolCall.function.name === 'assign_task') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              let dailyTask = await DailyTask.findOne({ userId: args.clientId, date: today });
              if (!dailyTask) {
                dailyTask = new DailyTask({ userId: args.clientId, date: today, tasks: [] });
              }
              dailyTask.tasks.push({ type: 'custom', title: args.title, description: args.description, points: 10 });
              await dailyTask.save();
              toolResult = JSON.stringify({ success: true, message: 'Task assigned successfully.' });
            } else if (toolCall.function.name === 'save_memory') {
              req.user.kittyMemory.push(args.fact);
              await req.user.save();
              toolResult = JSON.stringify({ success: true, message: 'Memory saved.' });
            } else {
              toolResult = JSON.stringify({ error: 'Unknown function' });
            }
          } catch (err) {
            toolResult = JSON.stringify({ error: err.message });
          }

          messagesArray.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.function.name,
            content: toolResult,
          });
        }
      } else {
        // No more tool calls, we have our final text
        isToolCalling = false;
        finalResponseText = responseMessage.content?.trim() || "";
      }
    }
    
    // Clean markdown if present
    let text = finalResponseText.trim();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    let parsed = { reply: text, mood: 'happy' };
    try {
      parsed = JSON.parse(text);
      if (req.user.role === 'admin' && parsed.imagePrompt) {
        // Construct the image URL safely on the server side
        const safePrompt = encodeURIComponent(`cute anime fitness girl assistant flirting, ${parsed.imagePrompt}`);
        // Add random seed to ensure a fresh image each time
        const seed = Math.floor(Math.random() * 1000000);
        parsed.imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=400&height=400&nologo=true&seed=${seed}`;
      }
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
