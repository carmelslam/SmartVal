// 🧠 Centralized Helper Metadata Store
// Stores all dynamic session data for reports, Make.com exports, and resume-after-reload

import { calculate, MathEngine } from './math.js';
import { securityManager } from './security-manager.js';
import { errorHandler } from './error-handler.js';
import { 
  standardizeHelperData, 
  convertToLegacyFormat, 
  updateHelperWithStandardizedData,
  UNIFIED_SCHEMAS
} from './data-flow-standardizer.js';

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

function sanitizeHelperData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    const value = data[key];
    
    if (typeof value === 'string') {
      // Remove potential XSS vectors
      sanitized[key] = value
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=\s*['"]/gi, '')
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeHelperData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function updateHelper(section, data) {
  try {
    // Security validation
    if (!securityManager.validateSession()) {
      errorHandler.createError('authentication', 'high', 'Session expired during data update');
      return false;
    }

    // Input sanitization
    const sanitizedData = sanitizeHelperData(data);
    
    if (!helper[section]) helper[section] = {};
    mergeDeep(helper[section], sanitizedData);
    
    // Auto-standardize critical data updates
    if (['vehicle', 'car_details', 'meta', 'expertise', 'levisummary'].includes(section)) {
      try {
        const standardizedData = standardizeHelperData(helper);
        updateHelperWithStandardizedData(helper, standardizedData);
      } catch (e) {
        errorHandler.createError('data', 'medium', 'Data standardization failed', { error: e.message });
        console.warn('Data standardization skipped:', e.message);
      }
    }
    
    // Security audit log
    securityManager.logSecurityEvent('data_update', {
      section,
      dataKeys: Object.keys(sanitizedData),
      timestamp: new Date()
    });
    
    saveHelperToStorage();
    return true;
  } catch (error) {
    errorHandler.createError('system', 'high', 'Helper update failed', { 
      section, 
      error: error.message,
      stack: error.stack 
    });
    return false;
  }
}

export function saveHelperToStorage() {
  try {
    // Create backup before saving
    const currentData = localStorage.getItem('helper_data');
    if (currentData) {
      localStorage.setItem('helper_data_backup', currentData);
    }
    
    // Sanitize data before storage
    const sanitizedHelper = sanitizeHelperData(helper);
    localStorage.setItem('helper_data', JSON.stringify(sanitizedHelper));
    
    // Security audit
    securityManager.logSecurityEvent('data_saved', {
      dataSize: JSON.stringify(sanitizedHelper).length,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    errorHandler.createError('system', 'high', 'Failed to save data to storage', {
      error: error.message,
      stack: error.stack
    });
    
    // Try to restore from backup
    try {
      const backup = localStorage.getItem('helper_data_backup');
      if (backup) {
        localStorage.setItem('helper_data', backup);
        errorHandler.createError('system', 'medium', 'Restored from backup after save failure');
      }
    } catch (restoreError) {
      errorHandler.createError('system', 'critical', 'Failed to restore from backup', {
        error: restoreError.message
      });
    }
    
    return false;
  }
}

export function loadHelperFromStorage() {
  try {
    const data = localStorage.getItem('helper_data');
    if (data) {
      const parsedData = JSON.parse(data);
      const sanitizedData = sanitizeHelperData(parsedData);
      Object.assign(helper, sanitizedData);
      
      // Security audit
      securityManager.logSecurityEvent('data_loaded', {
        dataSize: data.length,
        timestamp: new Date()
      });
    }
    
    // Ensure car_details object exists with all fields
    helper.car_details = { ...CAR_DETAILS_TEMPLATE, ...(helper.car_details || {}) };
    
    return true;
  } catch (error) {
    errorHandler.createError('system', 'high', 'Failed to load data from storage', {
      error: error.message,
      stack: error.stack
    });
    
    // Try to restore from backup
    try {
      const backup = localStorage.getItem('helper_data_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        const sanitizedBackup = sanitizeHelperData(parsedBackup);
        Object.assign(helper, sanitizedBackup);
        helper.car_details = { ...CAR_DETAILS_TEMPLATE, ...(helper.car_details || {}) };
        errorHandler.createError('system', 'medium', 'Restored from backup after load failure');
        return true;
      }
    } catch (restoreError) {
      errorHandler.createError('system', 'critical', 'Failed to restore from backup during load', {
        error: restoreError.message
      });
    }
    
    // Initialize with template if all else fails
    helper.car_details = { ...CAR_DETAILS_TEMPLATE };
    return false;
  }
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
  const marketValue = parseFloat(helper.expertise.levi_report?.final_price) || parseFloat(helper.levisummary?.final_price) || 0;
  const shavehPercent = parseFloat(helper.vehicle?.shaveh_percent) || 0;
  const vatRate = parseFloat(helper.fees?.vat_percent) || MathEngine.getVatRate();

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

// ============================================================================
// DATA STANDARDIZATION FUNCTIONS
// ============================================================================

export function standardizeAllData() {
  try {
    const standardizedData = standardizeHelperData(helper);
    updateHelperWithStandardizedData(helper, standardizedData);
    saveHelperToStorage();
    return standardizedData;
  } catch (error) {
    console.error('Data standardization failed:', error);
    throw error;
  }
}

export function getStandardizedData() {
  try {
    return standardizeHelperData(helper);
  } catch (error) {
    console.error('Failed to get standardized data:', error);
    return null;
  }
}

export function validateHelperData() {
  try {
    const standardizedData = standardizeHelperData(helper);
    return {
      isValid: true,
      standardizedData,
      errors: [],
      warnings: []
    };
  } catch (error) {
    return {
      isValid: false,
      standardizedData: null,
      errors: [error.message],
      warnings: []
    };
  }
}

// Unified data access functions
export function getVehicleData() {
  const standardized = getStandardizedData();
  return standardized ? standardized.vehicle : helper.vehicle || helper.car_details || {};
}

export function getDamageData() {
  const standardized = getStandardizedData();
  return standardized ? standardized.damage_assessment : {
    centers: helper.expertise?.damage_blocks || helper.damage_centers || []
  };
}

export function getValuationData() {
  const standardized = getStandardizedData();
  return standardized ? standardized.valuation : {
    base_price: helper.levisummary?.base_price || helper.expertise?.levi_report?.base_price || 0,
    final_price: helper.levisummary?.final_price || helper.expertise?.levi_report?.final_price || 0
  };
}

export function getFinancialData() {
  const standardized = getStandardizedData();
  return standardized ? standardized.financials : helper.invoice || {};
}

// Data synchronization helpers
export function syncLeviData(leviData) {
  // Update both old and new structures
  updateHelper('levisummary', leviData);
  updateHelper('expertise', { levi_report: leviData });
  
  // Ensure vehicle valuation is updated
  if (leviData.final_price) {
    updateHelper('vehicle', { market_value: leviData.final_price });
  }
}

export function syncDamageData(damageData) {
  // Update both damage_blocks and damage_centers
  if (damageData.centers) {
    updateHelper('expertise', { damage_blocks: damageData.centers });
    updateHelper('damage_centers', damageData.centers);
  }
}

export function syncVehicleData(vehicleData) {
  // Update all vehicle-related structures
  updateHelper('vehicle', vehicleData);
  updateHelper('car_details', vehicleData);
  
  // Update meta with key vehicle info
  if (vehicleData.plate) {
    updateHelper('meta', { plate: vehicleData.plate });
  }
}


window.addEventListener('DOMContentLoaded', loadHelperFromStorage);
