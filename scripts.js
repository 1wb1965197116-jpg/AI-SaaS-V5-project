// ------------------------------
// Auto-detect backend URL
// ------------------------------
const DEFAULT_BACKEND_URL = "https://ai-saas-v5-project.onrender.com";

function getBackendURL() {
  const origin = window.location.origin;

  // If running on backend domain, use relative path
  if (origin.includes("ai-saas-v5-project.onrender.com")) {
    return ""; // same origin
  }

  // Otherwise, use absolute backend URL
  return DEFAULT_BACKEND_URL;
}

const backendURL = getBackendURL();

// ------------------------------
// Language selection
// ------------------------------
const userLangs = {
  guest: ['English', 'Spanish'],
  employee: ['English', 'Spanish', 'French', 'German'],
  admin: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']
};

// Detect user type from URL: ?user=guest|employee|admin
function getUserType() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('user');
  return type && userLangs[type] ? type : 'guest';
}

const detectedType = getUserType();
const langSelect = document.getElementById('lang');
userLangs[detectedType].forEach(lang => {
  const option = document.createElement('option');
  option.value = lang;
  option.innerText = lang;
  langSelect.appendChild(option);
});

// ------------------------------
// Translate button
// ------------------------------
async function translate() {
  const prompt = document.getElementById('prompt').value;
  const lang = document.getElementById('lang').value;

  try {
    const res = await fetch(`${backendURL}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, targetLang: lang })
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const data = await res.json();
    document.getElementById('out').innerText = data.translation;
  } catch (err) {
    document.getElementById('out').innerText = `Error: ${err.message}`;
    console.error(err);
  }
}
