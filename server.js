import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API route
app.post('/api/ai', (req, res) => {
  const { prompt, targetLang } = req.body;
  res.json({ translation: `Translated (${targetLang}): ${prompt}` });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Catch-all to serve index.html for any other frontend route
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Listen on Render-assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
