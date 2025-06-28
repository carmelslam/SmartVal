// 🧠 Centralized Helper Metadata Store
// Stores all dynamic session data for reports, Make.com exports, and resume-after-reload

import { calculate } from './math.js';

const CAR_DETAILS_TEMPLATE = {
  plate: '',
  owner: '',
  manufacturer: '',
  model: '',
  year: '',
  trim: '',
  chassis: '',
  model_code: '',
  model_type: '',
  ownership_type: '',
  ownership: '',
  km: '',
  market_value: '',
  shaveh_percent: '',
  garageName: '',
  garagePhone: '',
  garageEmail: '',
  agentName: '',
  agentPhone: '',
  agentEmail: '',
  insuranceCompany: '',
  insuranceEmail: '',
  odo: '',
  damageDate: '',
  ownerPhone: '',
  ownerAddress: '',
  damageType: ''
};

export const helper = {
  meta: {
    case_id: '',
    plate: '',
    report_type: 'final',
    report_type_display: 'חוות דעת שמאי פרטית',
    inspection_date: '',
    damage_date: '',
    submission_date: '',
    location: '',
    status: '',
  },

  vehicle: {
    plate_number: '',
    manufacturer: '',
    model: '',
    trim: '',
    model_code: '',
    office_code: '',
    model_version: '',
    year: '',
    km: '',
    fuel_type: '',
    engine_volume: '',
    chassis: '',
    ownership_type: '',
    drive_type: '',
    vehicle_type: '',
    mot_code: '',
    garage_name: '',
    garage_email: '',
    garage_phone: '',
  },

  car_details: { ...CAR_DETAILS_TEMPLATE },

  client: {
    name: '',
    address: '',
    phone_number: '',
    insurance_company: '',
    insurance_email: '',
    insurance_agent: '',
    insurance_agent_email: '',
    insurance_agent_phone: ''
  },

  expertise: {
    damage_type: '',
    description: '',
    summary: {
      legal_disclaimer: '',
      general_assessment: ''
    },
    damage_blocks: [
      // Example structure per block:
      // {
      //   label: '',
      //   center: '',
      //   works: [],
      //   parts: [],
      //   repairs: [],
      //   notes: '',
      //   table: ''
      // }
    ],
    damage_summary: [
      // { label: '', total: '' }
    ],
    damage_sections: [],
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
        registration: { percent: '', value: '', total: '' },
        km: { percent: '', value: '', total: '' },
        ownership: { type: '', percent: '', value: '', total: '' },
        owner_count: { percent: '', value: '', total: '' },
        features: { percent: '', value: '', total: '' }
      }
    },
    depreciation: {
      global_percent: '',
      global_amount: '',
      work_days: '',
      centers: []
    },
    calculations: {
      total_damage: '',
      vehicle_value_gross: '',
      damage_percent: '',
      vehicle_value_base: '',
      market_value: '',
      total_compensation: ''
    }
  },

  parts_search: {
    summary: { total_results: '', recommended: '' },
    results: []
  },

  fees: {
    photo_count: '',
    photos: '',
    office: '',
    travel_count: '',
    travel: '',
    subtotal: '',
    vat_percent: '',
    total: ''
  },

  invoice: {
    garage_name: '',
    garage_email: '',
    garage_phone: '',
    total_parts: '',
    total_works: '',
    total_repairs: '',
    subtotal: '',
    vat: '',
    total: '',
    parts: [],
    works: [],
    repairs: []
  },

  image_upload: {
    plate: '',
    total_uploaded: 0
  },

  assistant_history: [],

  saveAssistantReply(question, answer) {
    this.assistant_history.push({
      question,
      answer,
      timestamp: new Date().toISOString()
    });
  },

};

// Deep merge helper for updateHelper (shallow for objects, not arrays)
function mergeDeep(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

export function updateHelper(section, data) {
  if (!helper[section]) helper[section] = {};
  mergeDeep(helper[section], data);
  saveHelperToStorage();
}

export function saveHelperToStorage() {
  localStorage.setItem('helper_data', JSON.stringify(helper));
}

export function loadHelperFromStorage() {
  const data = localStorage.getItem('helper_data');
  if (data) Object.assign(helper, JSON.parse(data));
  // Ensure car_details object exists with all fields
  helper.car_details = { ...CAR_DETAILS_TEMPLATE, ...(helper.car_details || {}) };
}

export function initHelper(meta = {}) {
  // Reset helper to initial state and set meta fields
  Object.keys(helper).forEach(k => {
    if (typeof helper[k] === 'object' && !Array.isArray(helper[k])) {
      helper[k] = {};
    } else if (Array.isArray(helper[k])) {
      helper[k] = [];
    } else {
      helper[k] = '';
    }
  });
  // Recreate template objects
  helper.car_details = { ...CAR_DETAILS_TEMPLATE };
  helper.meta = { ...helper.meta, ...meta };
  saveHelperToStorage();
}

export function clearHelperFromStorage() {
  localStorage.removeItem('helper_data');
}

export async function sendHelperToMake(taskLabel = 'generic') {
  try {
    const response = await fetch('https://your-webhook-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskLabel, helper })
    });
    console.log('📤 Helper sent to Make.com:', response.status);
  } catch (err) {
    console.error('❌ Failed to send helper to Make.com', err);
  }
}

export function updateCalculations() {
  const baseDamage = parseFloat((helper.expertise.damage_summary || []).reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)) || 0;
  const depreciation = parseFloat(helper.expertise.depreciation?.global_amount) || 0;
  const marketValue = parseFloat(helper.expertise.levi_report?.final_price) || 0;
  const shavehPercent = parseFloat(helper.vehicle?.shaveh_percent) || 0;
  const vatRate = parseFloat(helper.fees?.vat_percent) || 17;

  const fees = {
    photos: parseFloat(helper.fees?.photos) || 0,
    office: parseFloat(helper.fees?.office) || 0,
    transport: parseFloat(helper.fees?.travel) || 0
  };

  const result = calculate({
    baseDamage,
    depreciation,
    fees,
    marketValue,
    shavehPercent,
    vatRate
  });

  helper.expertise.calculations = {
    ...result,
    vehicle_value_base: marketValue,
    total_damage: baseDamage
  };
}


window.addEventListener('DOMContentLoaded', loadHelperFromStorage);
