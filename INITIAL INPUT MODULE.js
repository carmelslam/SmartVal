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
    // CRITICAL FIX: Set flag to prevent simulator contamination
    sessionStorage.setItem('caseOpeningInProgress', 'true');
    console.log('🚩 Case opening in progress - simulator disabled');
    
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

    // CRITICAL FIX: Final cleanup after all processing - INCREASE DELAY
    setTimeout(() => {
      console.log('🧹 FINAL CLEANUP RUNNING: Ensuring correct field separation...');
      console.log('🔍 Helper before cleanup:', window.helper);
      
      if (window.helper && window.helper.case_info) {
        // Force correct case_info structure
        const currentYear = new Date().getFullYear();
        const correctCaseId = `YC-${meta.plate.replace(/[-\\/]/g, '')}-${currentYear}`;
        
        console.log('🔧 Setting case_id to:', correctCaseId);
        window.helper.case_info.case_id = correctCaseId;
        
        // CRITICAL: damage_date must NEVER be set from timestamp or case opening date
        window.helper.case_info.damage_date = '';  // Must be empty until general info page
        
        // CRITICAL: inspection_date gets the case opening date only
        window.helper.case_info.inspection_date = meta.inspection_date || new Date().toISOString().split('T')[0];
        
        window.helper.case_info.report_type = '';
        window.helper.case_info.report_type_display = '';
        
        console.log('🔧 Forced damage_date to empty, inspection_date to:', window.helper.case_info.inspection_date);
        
        console.log('🔧 Cleaning car_details...');
        // Clean car_details of contaminated fields (keep timestamp for version tracking)
        if (window.helper.car_details) {
          delete window.helper.car_details.damage_date;  // Only remove damage_date
          console.log('🧹 Removed damage_date from car_details (kept timestamp for version tracking)');
        }
        
        // Separate garage from location
        if (window.helper.stakeholders && window.helper.stakeholders.garage) {
          // Don't let garage name inherit from location
          if (window.helper.stakeholders.garage.name === meta.location) {
            window.helper.stakeholders.garage.name = '';
            console.log('🔧 Cleared garage name - was same as location');
          }
        }
        
        saveHelperToStorage();
        
        // Clear the case opening flag
        sessionStorage.removeItem('caseOpeningInProgress');
        console.log('🚩 Case opening flag cleared - simulator re-enabled');
        
        console.log('✅ FINAL CLEANUP COMPLETED. Final helper:', window.helper);
        console.log('✅ Case info after cleanup:', window.helper.case_info);
      } else {
        console.error('❌ Helper or case_info not found during cleanup!');
        // Clear flag even if cleanup failed
        sessionStorage.removeItem('caseOpeningInProgress');
      }
    }, 2000); // Wait longer for all async processes to complete

    ROUTER.navigate('car-details');
  };
}

ROUTER.register('initial-input', initialInput);