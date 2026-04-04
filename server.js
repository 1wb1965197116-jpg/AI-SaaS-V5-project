import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend/pages')));

// Root route: serves index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// AI Translation endpoint
app.post('/api/ai', async (req, res) => {
    const { prompt, token, targetLang } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dummy');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'user', content: `Translate to ${targetLang}: ${prompt}` }
                ]
            }),
        });

        const data = await response.json();
        res.json({ translation: data.choices[0].message.content });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
