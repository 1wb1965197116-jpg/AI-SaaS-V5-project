let enabled=true;
const toggleBtn=document.createElement('button');
toggleBtn.innerText='AI: ON';
toggleBtn.style='position:fixed;bottom:10px;right:10px;z-index:999999;';
toggleBtn.onclick=()=>{enabled=!enabled; toggleBtn.innerText=enabled?'AI: ON':'AI: OFF';};
document.body.appendChild(toggleBtn);

// Side-by-side container
const container=document.createElement('div');
container.style='position:fixed;top:0;right:0;width:50%;height:100%;background:#fff;overflow:auto;z-index:999998;padding:10px;border-left:2px solid #000;';
document.body.appendChild(container);

async function translatePage(lang='English'){
    if(!enabled){alert('AI OFF'); return;}
    const text=document.body.innerText.slice(0,3000);
    const token=localStorage.getItem('token')||'dummy_token';
    const res=await fetch('https://YOUR_BACKEND/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt:text,token,targetLang:lang})
    });
    const data=await res.json();
    container.innerHTML='<h3>Original</h3><pre>'+text+'</pre><h3>Translation</h3><pre>'+data.translation+'</pre>';
}

// Camera scan simulation
async function scanCamera(){
    const text=prompt('Simulate camera scan text:');
    await translatePage('English');
}

// Dictation
function speakText(txt){
    const synth=window.speechSynthesis;
    const utter=new SpeechSynthesisUtterance(txt);
    synth.speak(utter);
}

// Map directions
function showMap(address){
    const mapWin=window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,'_blank');
}
