import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 10000);
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const buckets = new Map();
function aiRateLimit(max = 10, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > max) return res.status(429).json({ error: "Too many AI requests. Please wait and try again." });
    next();
  };
}

app.get("/health", (_req, res) => res.json({ ok: true, app: "AI SaaS V5" }));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post(["/api/ai", "/ai"], aiRateLimit(10), async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const targetLang = typeof req.body?.targetLang === "string" ? req.body.targetLang.trim().slice(0, 80) : "English";
  if (!prompt) return res.status(400).json({ error: "Enter a prompt." });
  if (prompt.length > 12000) return res.status(413).json({ error: "Prompt must be under 12,000 characters." });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI is not configured. Add OPENAI_API_KEY in Render Environment." });

  try {
    const input = targetLang === "English" ? prompt : "Translate the following into " + targetLang + ":\n" + prompt;
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        max_output_tokens: 1800,
        instructions: "You are a helpful AI assistant. If a target language is specified, translate accurately into that language. Otherwise answer the user's request.",
        input
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(502).json({ error: data.error?.message || "AI provider request failed." });
    const answer = (data.output || []).flatMap(item => item.content || [])
      .filter(item => item.type === "output_text").map(item => item.text).join("\n").trim();
    return res.json({ translation: answer || "No response returned.", result: answer || "No response returned." });
  } catch (error) {
    console.error("AI request failed:", error.message);
    return res.status(502).json({ error: "Unable to reach the AI provider." });
  }
});

app.listen(port, "0.0.0.0", () => console.log("AI SaaS V5 listening on " + port));
