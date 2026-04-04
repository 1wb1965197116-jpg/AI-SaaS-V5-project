# -------------------------------
# AI SaaS V5 Complete Deploy Script + Extension + Auto Install
# -------------------------------

$home=[Environment]::GetFolderPath("MyDocuments")
$root=Join-Path $home "AI-SaaS-V5"
$githubRepoURL="https://github.com/1wb1965197116-jpg/YOUR_REPO_NAME"
$backendURL="https://ai-saas-v5-project.onrender.com"  # <-- Replace with your Render URL

# ---------------- Folders ----------------
$folders=@("$root/backend","$root/frontend/pages","$root/extension")
foreach($f in $folders){
    if(-not(Test-Path $f)){ New-Item -ItemType Directory -Path $f -Force | Out-Null }
}

# ---------------- Backend ----------------
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend/pages')));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '../frontend/pages/index.html')); });
app.get('/health', (req,res)=>res.json({status:'ok'}));

app.post('/api/ai', async (req,res)=>{
    const {prompt, token, targetLang}=req.body;
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dummy');
        const response = await fetch('https://api.openai.com/v1/chat/completions',{
            method:'POST',
            headers:{
                'Authorization':\`Bearer \${process.env.OPENAI_KEY}\`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                model:'gpt-4',
                messages:[{role:'user',content:\`Translate to \${targetLang}: \${prompt}\`}]
            })
        });
        const data = await response.json();
        res.json({translation:data.choices[0].message.content});
    }catch(e){ res.status(500).json({error:e.message}); }
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

# ---------------- Install Backend Dependencies ----------------
Write-Host "⏳ Installing backend dependencies..."
Set-Location "$root/backend"
npm install
Write-Host "✅ Dependencies installed."

# ---------------- Frontend ----------------
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
  const res=await fetch('$backendURL/api/ai',{
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

# ---------------- Extension ----------------
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
            const res = await fetch('$backendURL/api/ai',{
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

            const speakBtn = document.createElement('button');
            speakBtn.textContent='🔊';
            speakBtn.onclick=()=>{ 
                const utter = new SpeechSynthesisUtterance(data.translation);
                speechSynthesis.speak(utter);
            };
            sideBySide.appendChild(document.createElement('br'));
            sideBySide.appendChild(speakBtn);

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
            }catch(e){ alert('Camera access denied or not supported'); }
        };
        document.body.appendChild(btn);
    };
    createCameraBtn();
})();
"@
$extensionJSPath = Join-Path $root "extension/translate.js"
$extensionJS | Out-File -FilePath $extensionJSPath -Encoding UTF8

# manifest.json
$manifestJSON=@"
{
  ""manifest_version"": 3,
  ""name"": ""AI Browser Translator V5"",
  ""version"": ""1.0.0"",
  ""description"": ""On-page AI translation with side-by-side English, dictation, camera OCR, and map directions."",
  ""permissions"": [""activeTab"", ""scripting"", ""storage"", ""tabs"", ""camera""],
  ""host_permissions"": [""<all_urls>""],
  ""action"": { ""default_title"": ""AI Translate"", ""default_icon"": {""16"":""icon16.png"",""48"":""icon48.png"",""128"":""icon128.png""} },
  ""background"": { ""service_worker"": ""background.js"" },
  ""content_scripts"": [ { ""matches"": [""<all_urls>""], ""js"": [""translate.js""], ""run_at"": ""document_idle"" } ],
  ""icons"": { ""16"":""icon16.png"",""48"":""icon48.png"",""128"":""icon128.png"" }
}
"@
$manifestPath = Join-Path $root "extension/manifest.json"
$manifestJSON | Out-File -FilePath $manifestPath -Encoding UTF8

# background.js
$backgroundJS=@"
chrome.runtime.onInstalled.addListener(()=>{ console.log('AI Browser Translator V5 installed'); });
"@
$bgPath = Join-Path $root "extension/background.js"
$backgroundJS | Out-File -FilePath $bgPath -Encoding UTF8

# Create placeholder icons
$iconSizes=@(16,48,128)
foreach($s in $iconSizes){
    $iconPath=Join-Path $root "extension/icon$s.png"
    if(-not(Test-Path $iconPath)){
        $bytes=[System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAA$sAAABgCAYAAAA+Hf6xAAAAHklEQVR42mP8/5+hP6P3nwYGBgYGJggMwMDABzDAAjdCckkAAAAASUVORK5CYII=")
        [System.IO.File]::WriteAllBytes($iconPath,$bytes)
    }
}

# ---------------- Git Setup ----------------
Set-Location $root
git init
git add .
git commit -m "Initial commit: V5 SaaS + Extension + Auto npm install"
git branch -M main
git remote add origin $githubRepoURL

$pushChoice = Read-Host "Push to GitHub now? (y/n)"
if($pushChoice -eq "y"){git push -u origin main}

# Open GitHub in browser
Start-Process $githubRepoURL
Write-Host "✅ Complete setup done. Backend, frontend, and extension ready for Render and Chrome/Edge load!"
