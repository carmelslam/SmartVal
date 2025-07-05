// 🧱 HELPER.EXPERTISE.LEVI_REPORT.PARTS.IMAGE COUNT 

import { helper, updateHelper, saveHelperToStorage } from './helper.js';
import { ROUTER } from './router.js';

// ✅ Inject Levi report and parts search into helper (populated externally via Make webhook or browser)
updateHelper('expertise', {
  levi_report: {
    model_code: '',
    full_model: '',
    is_automatic: '',
    features: '',
    report_date: '',
    registration_date: '',
    owner_count: '',
    category: '',
    km: '',
    base_price: '',
    final_price: '',
    adjustments: {
      registration: {
        percent: '',
        value: '',
        total: ''
      },
      km: {
        percent: '',
        value: '',
        total: ''
      },
      ownership: {
        type: '',
        percent: '',
        value: '',
        total: ''
      },
      owner_count: {
        percent: '',
        value: '',
        total: ''
      },
      features: {
        percent: '',
        value: '',
        total: ''
      }
    }
  },
  image_upload: {
    plate: '', // will be filled when car is initialized
    total_uploaded: 0 // accumulates with each upload until session reset
  }
});

export function damageCenters() {
  // This file is foundation logic only — no visual rendering here.
  console.log('🧩 Foundation structures: helper.expertise.levi_report + image_upload');
}

