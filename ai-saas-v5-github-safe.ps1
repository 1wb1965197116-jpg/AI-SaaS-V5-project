# -------------------------------
# AI SaaS V5 Full Deploy Script + Extension + Camera & Maps
# -------------------------------
$home=[Environment]::GetFolderPath("MyDocuments")
$root=Join-Path $home "AI-SaaS-V5"
$githubRepoURL="https://github.com/1wb1965197116-jpg/YOUR_REPO_NAME"

# Create folder structure
$folders=@("$root/backend","$root/frontend/pages","$root/extension")
foreach($f in $folders){
    if(-not(Test-Path $f)){
        New-Item -ItemType Directory -Path $f -Force | Out-Null
    }
}

# --------- Backend Files ---------
$backendServer= @"
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

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Health check
app.get('/health', (req,res)=>res.json({status:'ok'}));

// AI Translation endpoint
app.post('/api/ai', async (req,res)=>{
    const {prompt, token, targetLang}=req.body;
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dummy');
        const response = await fetch('https://api.openai.com/v1/chat/completions',{
            method:'POST',
            headers:{
                'Authorization':`Bearer ${process.env.OPENAI_KEY}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                model:'gpt-4',
                messages:[{role:'user',content:`Translate to ${targetLang}: ${prompt}`}]
            })
        });
        const data = await response.json();
        res.json({translation:data.choices[0].message.content});
    }catch(e){
        res.status(500).json({error:e.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('✅ Backend running on port', PORT));
"@
$backendPath = Join-Path $root "backend/server.js"
$backendServer | Out-File -FilePath $backendPath -Encoding UTF8

$backendPkg= @"
{
  "name": "ai-browser-backend-v5",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'No build needed for backend'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "node-fetch": "^3.3.2"
  }
}
"@
$backendPkgPath = Join-Path $root "backend/package.json"
$backendPkg | Out-File -FilePath $backendPkgPath -Encoding UTF8

# --------- Frontend Files ---------
$frontendHTML=@"
<!DOCTYPE html>
<html>
<head><title>AI SaaS V5 Dashboard</title></head>
<body>
<h2>AI Browser Assistant</h2>
<textarea id='prompt' placeholder='Enter text or URL'></textarea>
<select id='lang'>
<option value='English'>English</option>
<option value='Spanish'>Spanish</option>
<option value='French'>French</option>
<option value='Chinese'>Chinese</option>
</select>
<button onclick='translate()'>Translate</button>
<pre id='out'></pre>
<script src='../extension/translate.js' defer></script>
<script>
async function translate(){
  const prompt=document.getElementById('prompt').value;
  const lang=document.getElementById('lang').value;
  const token=localStorage.getItem('token')||'dummy_token';
  const res=await fetch('/api/ai',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({prompt,token,targetLang:lang})
  });
  const data=await res.json();
  document.getElementById('out').innerText=data.translation;
}
</script>
</body>
</html>
"@
$frontendPath = Join-Path $root "frontend/pages/index.html"
$frontendHTML | Out-File -FilePath $frontendPath -Encoding UTF8

# --------- Extension Files ---------
$extensionJS=@"
(() => {
    let enabled = true;

    const createButton = () => {
        const btn = document.createElement('button');
        btn.textContent = 'AI Translate';
        btn.style.position='fixed';
        btn.style.bottom='20px';
        btn.style.right='20px';
        btn.style.zIndex=9999;
        btn.style.padding='8px';
        btn.style.background='white';
        btn.style.border='1px solid black';
        btn.style.cursor='pointer';
        btn.onclick=()=>{ enabled=!enabled; alert('AI Translate '+(enabled?'ON':'OFF')); };
        document.body.appendChild(btn);
    };
    createButton();

    const translateElement = async (el, lang='English') => {
        if(el.dataset.translated) return;
        el.dataset.translated=true;
        try {
            const res = await fetch('https://ai-saas-v5-project.onrender.com/api/ai',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({prompt:el.innerText,token:'dummy_token',targetLang:lang})
            });
            const data = await res.json();
            const sideBySide = document.createElement('div');
            sideBySide.style.border='1px dashed gray';
            sideBySide.style.margin='2px';
            sideBySide.style.padding='2px';
            sideBySide.innerHTML='<b>Original:</b><br>'+el.innerText+'<br><b>Translation:</b><br>'+data.translation;

            // Dictation button
            const speakBtn = document.createElement('button');
            speakBtn.textContent='🔊';
            speakBtn.onclick=()=>{ 
                const utter = new SpeechSynthesisUtterance(data.translation);
                speechSynthesis.speak(utter);
            };
            sideBySide.appendChild(document.createElement('br'));
            sideBySide.appendChild(speakBtn);

            // Map directions button
            if(el.innerText.match(/\b[A-Z][a-z]+(?:, [A-Z]{2})?\b/)){
                const mapBtn = document.createElement('button');
                mapBtn.textContent='📍 Map';
                mapBtn.onclick=()=>{ window.open('https://www.google.com/maps/search/'+encodeURIComponent(el.innerText),'_blank'); };
                sideBySide.appendChild(mapBtn);
            }

            el.parentNode.insertBefore(sideBySide, el.nextSibling);
        } catch(e){ console.error(e); }
    };

    const observer = new MutationObserver(()=> {
        if(!enabled) return;
        document.querySelectorAll('p,h1,h2,h3,h4,h5,span,div').forEach(el=>{
            translateElement(el,'English');
        });
    });
    observer.observe(document.body,{childList:true,subtree:true});

    // Camera OCR button
    const createCameraBtn = () => {
        const btn = document.createElement('button');
        btn.textContent='📷 Camera OCR';
        btn.style.position='fixed';
        btn.style.bottom='60px';
        btn.style.right='20px';
        btn.style.zIndex=9999;
        btn.style.padding='8px';
        btn.style.background='white';
        btn.style.border='1px solid black';
        btn.style.cursor='pointer';
        btn.onclick= async ()=>{
            try{
                const stream = await navigator.mediaDevices.getUserMedia({video:true});
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                video.style.position='fixed';
                video.style.bottom='120px';
                video.style.right='20px';
                video.style.width='200px';
                video.style.zIndex=9999;
                document.body.appendChild(video);
                alert('Camera active. Capture text using OCR function.');
                // OCR integration can be added here
            }catch(e){ alert('Camera access denied or not supported'); }
        };
        document.body.appendChild(btn);
    };
    createCameraBtn();
})();
"@
$extensionJSPath = Join-Path $root "extension/translate.js"
$extensionJS | Out-File -FilePath $extensionJSPath -Encoding UTF8

# --------- Git Setup ---------
Set-Location $root
git init
git add .
git commit -m "Initial commit: V5 SaaS + Extension + Camera & Maps"
git branch -M main
git remote add origin $githubRepoURL

$pushChoice = Read-Host "Push to GitHub now? (y/n)"
if($pushChoice -eq "y"){git push -u origin main}

# Open GitHub in browser
Start-Process $githubRepoURL
Write-Host "✅ GitHub repository opened in browser"
Write-Host "Setup complete. Backend + frontend + extension with camera + maps ready for Render deployment!"
