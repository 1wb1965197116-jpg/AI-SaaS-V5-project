(() => {
    let enabled = true;

    // ---- Toggle Button ----
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

    // ---- Translate Elements Function ----
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

            // Map directions (if text looks like a place)
            if(el.innerText.match(/\b[A-Z][a-z]+(?:, [A-Z]{2})?\b/)){
                const mapBtn = document.createElement('button');
                mapBtn.textContent='📍 Map';
                mapBtn.onclick=()=>{ window.open('https://www.google.com/maps/search/'+encodeURIComponent(el.innerText),'_blank'); };
                sideBySide.appendChild(mapBtn);
            }

            el.parentNode.insertBefore(sideBySide, el.nextSibling);

        } catch(e){ console.error(e); }
    };

    // ---- Observe Page Changes ----
    const observer = new MutationObserver(()=> {
        if(!enabled) return;
        document.querySelectorAll('p,h1,h2,h3,h4,h5,span,div').forEach(el=>{
            translateElement(el,'English');
        });
    });
    observer.observe(document.body,{childList:true,subtree:true});

    // ---- Camera OCR Translation ----
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
                // OCR logic would integrate an AI API call here
            }catch(e){ alert('Camera access denied or not supported'); }
        };
        document.body.appendChild(btn);
    };
    createCameraBtn();
})();
