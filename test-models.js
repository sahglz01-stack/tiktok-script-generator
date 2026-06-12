const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("API Key not found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // We fetch using fetch directly to avoid SDK version limitations
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("=== Available Models for your Key ===");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name.replace("models/", "")}`);
        }
      });
    } else {
      console.log("No models returned:", data);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
