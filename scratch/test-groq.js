const Groq = require('groq-sdk');
require('dotenv').config({ path: '../server/.env' });

async function main() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: 'Output JSON with key "test" and value "hello"' }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });
    console.log(chatCompletion.choices[0].message.content);
  } catch (err) {
    console.error(err);
  }
}
main();
