// 🧮 DEPRECIATION + FEE DATA CAPTURE MODULE (Foundation Only)
import { helper, updateHelper, saveHelperToStorage } from './helper.js';
import { ROUTER } from './router.js';

// ✅ Initialize depreciation and fee structure in helper
updateHelper('expertise', {
  depreciation_and_fees: {
    depreciation_per_center: {}, // dynamically keyed by damage center title
    global_depreciation_percent: '', // % from UI
    labor_hour_price: '', // שעת עבודה
    work_days: '', // מספר ימי עבודה
    vat_rate: '18', // מע"מ - default, can be overridden from dev panel
    sale_price: '', // מחיר מכירה

    // FEES
    fees: {
      photography: '', // צילומים
      office: '',      // משרד
      travel: ''       // נסיעות
    },

    // Calculated values (populated in Final Report module)
    total_damage_incl_vat: '',       // סה"כ הנזק כולל מע"מ
    market_value_calculation: '',    // חישוב ערך השוק
    gross_damage_percent: '',        // אחוז הנזק הגולמי
    gross_vehicle_value_vat: '',     // ערך הרכב לנזק גולמי כולל מע"מ
    compensation: '',                // פיצוי
    included_in_report_total: ''     // סה"כ נכלל בחוות הדעת
  }
});

export function depreciationCapture() {
  console.log('🧩 Foundation: depreciation + fee structure initialized in helper');
}

ROUTER.register('depreciation-capture', depreciationCapture);

// --- Extended Logic for Fee Entry Screen ---
function populateFields() {
  const carData = JSON.parse(sessionStorage.getItem('carData') || '{}');
  const plate = carData.plate || helper.meta.plate || helper.vehicle?.plate_number || '';
  const caseId = carData.case_id || helper.meta.case_id || '';

  const titleEl = document.getElementById('pageTitle');
  if (titleEl && plate) titleEl.innerText = `רכב מס. ${plate}`;
  const caseEl = document.getElementById('caseId');
  if (caseEl && caseId) caseEl.innerText = caseId;

  const fees = helper.fees || {};
  const mappings = {
    photoCount: 'photo_count',
    photoFee: 'photos',
    officeFee: 'office',
    travelCount: 'travel_count',
    travelFee: 'travel',
    vatRate: 'vat_percent'
  };
  for (const id in mappings) {
    const el = document.getElementById(id);
    if (el) el.value = fees[mappings[id]] || '';
  }

  calculateFees();
}

function calculateFees() {
  const photos = parseFloat(document.getElementById('photoFee')?.value || 0);
  const office = parseFloat(document.getElementById('officeFee')?.value || 0);
  const travel = parseFloat(document.getElementById('travelFee')?.value || 0);
  const vatRate = parseFloat(document.getElementById('vatRate')?.value || 0);

  const subtotal = photos + office + travel;
  const total = subtotal * (1 + vatRate / 100);

  const subtotalEl = document.getElementById('subtotal');
  if (subtotalEl) subtotalEl.value = subtotal.toFixed(2);
  const totalEl = document.getElementById('total');
  if (totalEl) totalEl.value = total.toFixed(2);
}

function saveToHelper() {
  const data = {
    photo_count: document.getElementById('photoCount')?.value || '',
    photos: document.getElementById('photoFee')?.value || '',
    office: document.getElementById('officeFee')?.value || '',
    travel_count: document.getElementById('travelCount')?.value || '',
    travel: document.getElementById('travelFee')?.value || '',
    subtotal: document.getElementById('subtotal')?.value || '',
    vat_percent: document.getElementById('vatRate')?.value || '',
    total: document.getElementById('total')?.value || ''
  };
  updateHelper('fees', data);
  saveHelperToStorage();
  alert('💾 נתוני שכר טרחה נשמרו');
}

document.addEventListener('DOMContentLoaded', () => {
  populateFields();
  ['photoFee','officeFee','travelFee','vatRate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateFees);
  });

  const saveBtn = document.getElementById('submitBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveToHelper);
});

