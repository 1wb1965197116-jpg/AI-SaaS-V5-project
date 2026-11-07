import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// ------------------------------
// Middleware
// ------------------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ------------------------------
// Health check
// ------------------------------
app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ------------------------------
// AI API Route
// ------------------------------
app.post('/api/ai', async (req, res) => {
  const { prompt, targetLang } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim() || typeof targetLang !== "string" || !targetLang.trim()) return res.status(400).json({ error: "prompt and targetLang are required" });
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Translate to ${targetLang}: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    const translation =
      data.choices?.[0]?.message?.content ||
      "No translation returned";

    res.json({ translation });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------
// Start server
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
