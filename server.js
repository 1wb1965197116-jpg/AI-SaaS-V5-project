import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 10000);
app.disable("x-powered-by");
app.use(express.json({limit:"1mb"}));
app.use(express.static(__dirname));
app.get("/health", (_req,res)=>res.json({ok:true,app:"AI SaaS V5"}));
app.get("/", (_req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.post(["/api/ai","/ai"], async (req,res)=>{
  const prompt=String(req.body?.prompt||"").trim();
  const targetLang=String(req.body?.targetLang||"English").slice(0,80);
  if(!prompt || prompt.length>12000) return res.status(400).json({error:"Enter a prompt under 12,000 characters."});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"AI is not configured. Add OPENAI_API_KEY in Render Environment."});
  try {
    const upstream=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",instructions:"You are a helpful AI assistant. If a target language is specified, translate accurately into that language. Otherwise answer the user's request.",input:targetLang==="English"?prompt:"Translate the following into "+targetLang+":\\n"+prompt})});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok) return res.status(502).json({error:data.error?.message||"AI provider request failed."});
    const answer=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\\n").trim();
    return res.json({translation:answer||"No response returned.",result:answer||"No response returned."});
  } catch(error) { console.error("AI request failed:",error.message); return res.status(502).json({error:"Unable to reach the AI provider."}); }
});
app.listen(port,"0.0.0.0",()=>console.log("AI SaaS V5 listening on "+port));
