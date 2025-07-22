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

    // CRITICAL FIX: Final cleanup after all processing
    setTimeout(() => {
      console.log('🧹 Final cleanup: Ensuring correct field separation...');
      if (window.helper && window.helper.case_info) {
        // Force correct case_info structure
        const currentYear = new Date().getFullYear();
        window.helper.case_info.case_id = `YC-${meta.plate}-${currentYear}`;
        window.helper.case_info.damage_date = '';  // Must be empty
        window.helper.case_info.inspection_date = meta.inspection_date || new Date().toISOString().split('T')[0];
        window.helper.case_info.report_type = '';
        window.helper.case_info.report_type_display = '';
        
        // Clean car_details of contaminated fields
        if (window.helper.car_details) {
          delete window.helper.car_details.damage_date;
          delete window.helper.car_details.timestamp;
          delete window.helper.car_details.processing_timestamp;
        }
        
        // Separate garage from location
        if (window.helper.stakeholders && window.helper.stakeholders.garage) {
          // Don't let garage name inherit from location
          if (window.helper.stakeholders.garage.name === meta.location) {
            window.helper.stakeholders.garage.name = '';
          }
        }
        
        saveHelperToStorage();
        console.log('✅ Final cleanup completed:', window.helper.case_info);
      }
    }, 500); // Wait for all async processes to complete

    ROUTER.navigate('car-details');
  };
}

ROUTER.register('initial-input', initialInput);