// 📥 INITIAL INPUT MODULE
import { helper, initHelper, saveHelperToStorage } from './helper.js';
import { ROUTER } from './router.js';
import { sendToWebhook } from './webhook.js';

export function initialInput() {
  const container = document.getElementById('app');

  container.innerHTML = `
    <div class="module">
      <h2>פתיחת תיק חדש</h2>
      <label>מספר רכב: <input type="text" id="plate" /></label><br/>
      <label>שם בעל הרכב: <input type="text" id="owner" /></label><br/>
      <label>תאריך בדיקה: <input type="date" id="inspection_date" /></label><br/>
      <label>מקום בדיקה: <input type="text" id="location" /></label><br/>
      <button id="start-case">התחל תיק</button>
    </div>
  `;

  document.getElementById('start-case').onclick = async () => {
    const meta = {
      plate: document.getElementById('plate').value.trim(),
      client_name: document.getElementById('owner').value.trim(),
      inspection_date: document.getElementById('inspection_date').value,
      location: document.getElementById('location').value.trim()
    };

    // Save to both helper and carData for downstream compatibility
    initHelper(meta);
    saveHelperToStorage();
    sessionStorage.setItem('carData', JSON.stringify(meta));

    // 🔁 Trigger webhook centrally
    await sendToWebhook('OPEN_CASE_UI', { plate: meta.plate });

    ROUTER.navigate('car-details');
  };
}

ROUTER.register('initial-input', initialInput);