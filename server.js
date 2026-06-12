const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in the .env file.");
}
const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

app.post('/api/generate-script', async (req, res) => {
  const { productUrl, productDetails, scriptStyle } = req.body;

  if (!productDetails && !productUrl) {
    return res.status(400).json({ error: 'Please provide product details or URL.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are a professional e-commerce copywriter and social media content creator specializing in short-form video scripts (TikTok, Instagram Reels, YouTube Shorts).
Your goal is to write highly engaging, high-converting video scripts based on the product details provided.

The script MUST be formatted in JSON with the following structure:
{
  "hook": "An attention-grabbing first 3 seconds statement (Thai)",
  "body": [
    {
      "visual": "Camera direction or visual action cue in English (e.g. Close-up of product)",
      "speech": "What the narrator says in Thai",
      "audio": "Music or sound effect cue in English (e.g. Upbeat music fades in)"
    }
  ],
  "cta": "Call to action urging viewers to click the link or buy now (Thai)"
}

Write the script in the requested style: ${scriptStyle || 'energetic'}.
Write the script in Thai language (ภาษาไทย) but keep JSON keys in English as specified above.
Do not wrap the response in markdown code blocks like \`\`\`json. Return only raw JSON.`;

    const prompt = `Product Details:
${productDetails || ''}
Product Link/Context:
${productUrl || ''}`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const responseText = result.response.text();

    // Clean up response text if Gemini wrapped it in markdown code blocks
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    try {
      const scriptJson = JSON.parse(cleanJson);
      res.json(scriptJson);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text was:", responseText);
      // Fallback: send as raw text if JSON parsing fails
      res.json({
        hook: "ขัดข้องในการแปลงรูปแบบผลลัพธ์ ลองอีกครั้ง",
        body: [{ visual: "Show product", speech: responseText, audio: "[Music fades in]" }],
        cta: "คลิกตะกร้าด่วน!"
      });
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong with Gemini API.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
