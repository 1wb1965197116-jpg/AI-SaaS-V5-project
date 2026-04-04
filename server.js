// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());          // Allow cross-origin requests
app.use(express.json());   // Parse JSON bodies

// ------------------------------
// 1️⃣ API route: /api/ai
// ------------------------------
app.post('/api/ai', async (req, res) => {
  const { prompt, targetLang } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not set in environment' });
  }

  async function callOpenAI(model) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: `Translate to ${targetLang}: ${prompt}` }]
      })
    });
    return await response.json();
  }

  try {
    let data;
    try {
      data = await callOpenAI('gpt-4');
    } catch {
      console.warn('GPT-4 failed, falling back to GPT-3.5-turbo');
      data = await callOpenAI('gpt-3.5-turbo');
    }
    const translation = data.choices?.[0]?.message?.content || 'No translation returned';
    res.json({ translation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------
// 2️⃣ Health check
// ------------------------------
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ------------------------------
// 3️⃣ Optional: Serve frontend on /dashboard
// ------------------------------
// Uncomment this section if you want to serve frontend from backend deployment
/*
const frontendPath = path.join(__dirname, 'frontend');
app.use('/dashboard', express.static(frontendPath));
app.get('/dashboard/*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.get('/', (req, res) => res.redirect('/dashboard'));
*/

// ------------------------------
// 4️⃣ Start server
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
