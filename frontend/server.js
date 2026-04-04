import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Correct frontend path
const frontendPath = path.join(__dirname, 'frontend');

// Serve frontend
app.use(express.static(frontendPath));

// API route
app.post('/api/ai', (req, res) => {
  const { prompt, targetLang } = req.body;
  res.json({ translation: `Translated (${targetLang}): ${prompt}` });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch-all (prevents "Not Found")
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
