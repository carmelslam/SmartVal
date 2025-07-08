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

// Enhanced data validation and consistency checks
function validateHelperDataStructure(data) {
  const errors = [];
  
  // Validate required sections
  const requiredSections = ['meta', 'car_details'];
  requiredSections.forEach(section => {
    if (!data[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  });
  
  // Validate meta section
  if (data.meta) {
    if (!data.meta.plate || data.meta.plate.trim() === '') {
      errors.push('Plate number is required in meta section');
    }
    
    if (data.meta.case_id && !/^CASE-/.test(data.meta.case_id)) {
      errors.push('Invalid case_id format');
    }
  }
  
  // Validate car_details section
  if (data.car_details) {
    const carPlate = data.car_details.plate;
    const metaPlate = data.meta?.plate;
    
    if (carPlate && metaPlate && carPlate !== metaPlate) {
      errors.push('Plate number mismatch between meta and car_details');
    }
  }
  
  // Validate damage_sections if present
  if (data.damage_sections) {
    data.damage_sections.forEach((section, index) => {
      if (!section.zone) {
        errors.push(`Damage section ${index + 1} missing zone information`);
      }
    });
  }
  
  return errors;
}

function standardizeHelperData(data) {
  // Create a standardized copy
  const standardized = JSON.parse(JSON.stringify(data));
  
  // Ensure required sections exist
  if (!standardized.meta) standardized.meta = {};
  if (!standardized.car_details) standardized.car_details = {};
  if (!standardized.progress) standardized.progress = {};
  
  // Standardize timestamps
  if (!standardized.meta.created_at) {
    standardized.meta.created_at = new Date().toISOString();
  }
  standardized.meta.updated_at = new Date().toISOString();
  
  // Ensure progress tracking exists
  const progressSections = ['expertise', 'depreciation', 'estimate', 'fees'];
  progressSections.forEach(section => {
    if (!standardized.progress[section]) {
      standardized.progress[section] = {
        completed: false,
        timestamp: null,
        data_size: 0
      };
    }
  });
  
  // Sync plate numbers
  if (standardized.meta.plate && !standardized.car_details.plate) {
    standardized.car_details.plate = standardized.meta.plate;
  } else if (standardized.car_details.plate && !standardized.meta.plate) {
    standardized.meta.plate = standardized.car_details.plate;
  }
  
  // Generate case_id if missing
  if (!standardized.meta.case_id && standardized.meta.plate) {
    standardized.meta.case_id = `CASE-${standardized.meta.plate}-${Date.now()}`;
  }
  
  return standardized;
}

function createDataIntegrityReport(data) {
  const report = {
    timestamp: new Date().toISOString(),
    isValid: true,
    warnings: [],
    errors: [],
    completeness: {},
    recommendations: []
  };
  
  // Check data completeness
  const sections = {
    'Car Details': data.car_details,
    'Damage Sections': data.damage_sections,
    'Depreciation Data': data.depreciation,
    'Estimate Data': data.estimate_data,
    'Fee Data': data.fee_data
  };
  
  Object.entries(sections).forEach(([name, section]) => {
    if (!section) {
      report.completeness[name] = 0;
      report.warnings.push(`${name} section is missing`);
    } else if (Array.isArray(section)) {
      report.completeness[name] = section.length > 0 ? 100 : 0;
      if (section.length === 0) {
        report.warnings.push(`${name} section is empty`);
      }
    } else if (typeof section === 'object') {
      const keys = Object.keys(section);
      const filledKeys = keys.filter(key => section[key] && section[key] !== '');
      report.completeness[name] = keys.length > 0 ? (filledKeys.length / keys.length) * 100 : 0;
      
      if (report.completeness[name] < 50) {
        report.warnings.push(`${name} section is less than 50% complete`);
      }
    }
  });
  
  // Add recommendations
  if (report.completeness['Car Details'] < 100) {
    report.recommendations.push('Complete vehicle information for accurate reporting');
  }
  
  if (report.completeness['Damage Sections'] === 0) {
    report.recommendations.push('Add damage assessment data for proper evaluation');
  }
  
  if (report.warnings.length > 3) {
    report.isValid = false;
    report.errors.push('Too many data integrity issues detected');
  }
  
  return report;
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
    const currentData = sessionStorage.getItem('helper');
    if (currentData) {
      localStorage.setItem('helper_data_backup', currentData);
    }
    
    // Standardize and validate data before storage
    const standardizedHelper = standardizeHelperData(helper);
    const validationErrors = validateHelperDataStructure(standardizedHelper);
    
    if (validationErrors.length > 0) {
      console.warn('Helper data validation warnings:', validationErrors);
      errorHandler.createError('validation', 'medium', 'Helper data has validation issues', {
        errors: validationErrors
      });
    }
    
    // Sanitize data before storage
    const sanitizedHelper = sanitizeHelperData(standardizedHelper);
    
    // Save to both sessionStorage (primary) and localStorage (backup)
    const dataString = JSON.stringify(sanitizedHelper);
    sessionStorage.setItem('helper', dataString);
    localStorage.setItem('helper_data', dataString);
    
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
    // Try sessionStorage first (primary), then localStorage (backup)
    let data = sessionStorage.getItem('helper');
    let dataSource = 'sessionStorage';
    
    if (!data) {
      data = localStorage.getItem('helper_data');
      dataSource = 'localStorage';
    }
    
    if (!data) {
      console.log('No helper data found in storage');
      return false;
    }
    
    const parsedData = JSON.parse(data);
    
    // Validate data structure
    const validationErrors = validateHelperDataStructure(parsedData);
    if (validationErrors.length > 0) {
      console.warn('Loaded helper data has validation issues:', validationErrors);
      errorHandler.createError('validation', 'medium', 'Loaded helper data has validation issues', {
        errors: validationErrors,
        source: dataSource
      });
    }
    
    // Standardize the loaded data
    const standardizedData = standardizeHelperData(parsedData);
    
    // Sanitize data
    const sanitizedData = sanitizeHelperData(standardizedData);
    
    // Update helper object
    Object.assign(helper, sanitizedData);
    
    // If data was loaded from localStorage, save it to sessionStorage for consistency
    if (dataSource === 'localStorage') {
      const dataString = JSON.stringify(sanitizedData);
      sessionStorage.setItem('helper', dataString);
      console.log('Helper data migrated from localStorage to sessionStorage');
    }
    
    // Create data integrity report
    const integrityReport = createDataIntegrityReport(sanitizedData);
    console.log('Helper data integrity report:', integrityReport);
    
    // Security audit
    securityManager.logSecurityEvent('data_loaded', {
      dataSize: data.length,
      source: dataSource,
      validationErrors: validationErrors.length,
      integrityScore: Object.values(integrityReport.completeness).reduce((a, b) => a + b, 0) / Object.keys(integrityReport.completeness).length || 0,
      timestamp: new Date()
    });
    
    return true;
    
  } catch (error) {
    console.error('Failed to load helper data:', error);
    errorHandler.createError('data', 'high', 'Failed to load helper data from storage', {
      originalError: error.message
    });
    return false;
  }
}

// Enhanced helper data management functions
export function validateAndFixHelperData() {
  try {
    const validationErrors = validateHelperDataStructure(helper);
    if (validationErrors.length > 0) {
      console.warn('Helper data validation issues found:', validationErrors);
      
      // Attempt to fix common issues
      const standardizedHelper = standardizeHelperData(helper);
      Object.assign(helper, standardizedHelper);
      
      // Re-validate after fixes
      const newValidationErrors = validateHelperDataStructure(helper);
      if (newValidationErrors.length < validationErrors.length) {
        console.log('Fixed some helper data issues automatically');
        saveHelperToStorage();
      }
      
      return {
        initialErrors: validationErrors,
        fixedErrors: validationErrors.length - newValidationErrors.length,
        remainingErrors: newValidationErrors
      };
    }
    
    return { initialErrors: [], fixedErrors: 0, remainingErrors: [] };
    
  } catch (error) {
    console.error('Error validating helper data:', error);
    return { error: error.message };
  }
}

export function getHelperDataIntegrityReport() {
  try {
    return createDataIntegrityReport(helper);
  } catch (error) {
    console.error('Error creating integrity report:', error);
    return {
      timestamp: new Date().toISOString(),
      isValid: false,
      errors: [error.message],
      warnings: [],
      completeness: {},
      recommendations: ['Fix data integrity issues before proceeding']
    };
  }
}

export function syncHelperDataBetweenStorages() {
  try {
    const sessionData = sessionStorage.getItem('helper');
    const localData = localStorage.getItem('helper_data');
    
    let mostRecentData = null;
    let mostRecentSource = '';
    
    if (sessionData && localData) {
      const sessionObj = JSON.parse(sessionData);
      const localObj = JSON.parse(localData);
      
      const sessionTimestamp = new Date(sessionObj.meta?.updated_at || 0);
      const localTimestamp = new Date(localObj.meta?.updated_at || 0);
      
      if (sessionTimestamp > localTimestamp) {
        mostRecentData = sessionData;
        mostRecentSource = 'sessionStorage';
      } else {
        mostRecentData = localData;
        mostRecentSource = 'localStorage';
      }
    } else if (sessionData) {
      mostRecentData = sessionData;
      mostRecentSource = 'sessionStorage';
    } else if (localData) {
      mostRecentData = localData;
      mostRecentSource = 'localStorage';
    }
    
    if (mostRecentData) {
      // Sync both storages with the most recent data
      sessionStorage.setItem('helper', mostRecentData);
      localStorage.setItem('helper_data', mostRecentData);
      
      console.log(`Helper data synced from ${mostRecentSource}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error syncing helper data:', error);
    return false;
  }
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
