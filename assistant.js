// ⚠️ DEPRECATED: This file is legacy and not used by the system
// The active Nicole implementation is in assistant.html
// This file can be safely removed as it has no references in the codebase
// 
// Assistant logic with mic input, webhook call, TTS playback, and local helper session support

import { SEARCH_MODULE } from './webhook.js';

const form = document.getElementById('assistantForm');
const micBtn = document.getElementById('micBtn');
const plateInput = document.getElementById('plateInput');
const queryInput = document.getElementById('freeQuery');
const responseBox = document.getElementById('agentResponse');

let language = sessionStorage.getItem('language') || 'he';

// Voice Recognition
let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = language === 'he' ? 'he-IL' : 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.addEventListener('click', () => {
    recognition.start();
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    queryInput.value = transcript;
  });
}

// Submit form
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const plate = plateInput.value.trim();
  const query = queryInput.value.trim();
  if (!query) return;

  const payload = { plate, free_query: query, source: 'assistant-ui' };

  try {
    const res = await fetch(SEARCH_MODULE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data?.text) {
      displayResponse(data.text);
      speakResponse(data.text);
      saveToHelper(query, data.text);
    }
  } catch (err) {
    displayResponse('שגיאה בשליחת הבקשה. נסה שוב.');
  }
});

function displayResponse(text) {
  responseBox.style.display = 'block';
  responseBox.textContent = text;
}

function speakResponse(text) {
  const apiKey = 'AIzaSyCYMIbBVJsGfOv1pbELD41-Lxe7OwsHd1o';
  const voice = 'he-IL-Wavenet-A';

  fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'he-IL', name: voice },
      audioConfig: { audioEncoding: 'MP3' }
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.audioContent) {
        const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
        audio.play();
      }
    })
    .catch(console.error);
}

function saveToHelper(question, answer) {
  const stored = sessionStorage.getItem("expertise");
  if (!stored) return;

  const helper = JSON.parse(stored);
  if (!helper.assistant_history) helper.assistant_history = [];

  helper.assistant_history.push({
    question,
    answer,
    timestamp: new Date().toISOString()
  });

  sessionStorage.setItem("expertise", JSON.stringify(helper));
}
