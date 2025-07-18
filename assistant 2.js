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

  const errDiv = document.getElementById('ttsError');
  if (errDiv) errDiv.remove();
}

function showTTSError(message) {
  let errDiv = document.getElementById('ttsError');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.id = 'ttsError';
    errDiv.style.color = 'red';
    errDiv.style.fontSize = '12px';
    errDiv.style.marginTop = '8px';
    responseBox.appendChild(errDiv);
  }
  errDiv.textContent = message;
}

async function speakResponse(text) {
  const apiKey = 'AIzaSyCYMIbBVJsGfOv1pbELD41-Lxe7OwsHd1o';
  const voice = 'he-IL-Wavenet-A';

  try {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'he-IL', name: voice },
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

    if (!res.ok) {
      throw new Error(`TTS request failed: ${res.status}`);
    }

    const data = await res.json();
    if (!data.audioContent) {
      throw new Error('No audio content returned');
    }

    const binary = atob(data.audioContent);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    try {
      await audio.play();
    } catch (err) {
      showTTSError('TTS failed to load. Please check audio settings.');
      throw err;
    } finally {
      audio.addEventListener('ended', () => URL.revokeObjectURL(url));
      audio.addEventListener('error', () => URL.revokeObjectURL(url));
    }
  } catch (error) {
    console.error('TTS playback error:', error);
    showTTSError('TTS failed to load. Please check audio settings.');
  }
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
