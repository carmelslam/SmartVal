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