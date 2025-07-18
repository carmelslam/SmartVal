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
  insurance_agent_phone: '',
  insurance_agent_email: '',
  insuranceCompany: '',
  insuranceEmail: '',
  odo: '',
  damageDate: '',
  ownerPhone: '',
  ownerAddress: '',
  damageType: ''
};

// 🧮 GLOBAL CALCULATION INTERFACE FOR ALL MODULES
export const CalculationInterface = {
  // Get calculations from sessionStorage helper
  getCalculations: function() {
    try {
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      return helper.calculations || {};
    } catch (error) {
      console.error('Error getting calculations:', error);
      return {};
    }
  },
  
  // Get key calculation values
  getGrossMarketValue: function() {
    return this.getCalculations().vehicle_value_gross || 0;
  },
  
  getFullMarketValue: function() {
    return this.getCalculations().market_value || this.getCalculations().final_price || 0;
  },
  
  getDamagePercentage: function() {
    return this.getCalculations().damage_percent || 0;
  },
  
  getTotalDamage: function() {
    return this.getCalculations().total_damage || 0;
  },
  
  // Use Math Engine for calculations
  calculateDamagePercentage: function(totalDamage, marketValue) {
    return MathEngine.computeDamagePercentage(totalDamage, marketValue);
  },
  
  calculateWithVAT: function(amount, vatRate = 18) {
    return MathEngine.applyVAT(amount, vatRate);
  },
  
  // Format values for display
  formatCurrency: function(amount) {
    return MathEngine.formatCurrency(amount);
  },
  
  formatPercentage: function(value) {
    return `${MathEngine.round(value)}%`;
  },
  
  // Update calculations in helper
  updateCalculations: function(newCalculations) {
    try {
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      helper.calculations = { ...helper.calculations, ...newCalculations };
      sessionStorage.setItem('helper', JSON.stringify(helper));
      console.log('✅ Calculations updated in helper:', newCalculations);
    } catch (error) {
      console.error('Error updating calculations:', error);
    }
  }
};

// Make Math Engine globally accessible
window.MathEngine = MathEngine;
window.CalculationInterface = CalculationInterface;

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

  estimate_data: {
    type: 'אובדן_להלכה', // Default estimate type
    legal_text: '',
    notes: '',
    calculations: {
      base_damage: 0,
      vat_rate: 18,
      vat_amount: 0,
      total_estimate: 0
    },
    validation: {
      car_details: false,
      damage_sections: false,
      calculations: false,
      legal_text: false,
      overall: false
    },
    completed: false,
    generated_at: '',
    report_url: ''
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


export function createDataIntegrityReport(data) {
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
  
  // Update helper with current VAT rate to ensure consistency
  if (helper.fees && !helper.fees.vat_percent) {
    helper.fees.vat_percent = vatRate;
  }

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
  
  // Ensure calculations section exists at root level too (for backward compatibility)
  if (!helper.calculations) {
    helper.calculations = {};
  }
  
  // Preserve vehicle_value_gross if it exists (from Levi calculations)
  if (helper.calculations.vehicle_value_gross) {
    helper.expertise.calculations.vehicle_value_gross = helper.calculations.vehicle_value_gross;
  }
  
  // Update root level calculations for backward compatibility
  helper.calculations = {
    ...helper.calculations,
    ...result,
    vehicle_value_base: marketValue,
    total_damage: baseDamage,
    market_value: marketValue
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

// Estimate data access and management functions
export function getEstimateData() {
  return helper.estimate_data || {
    type: 'אובדן_להלכה',
    legal_text: '',
    notes: '',
    calculations: {
      base_damage: 0,
      vat_rate: 18,
      vat_amount: 0,
      total_estimate: 0
    },
    validation: {
      car_details: false,
      damage_sections: false,
      calculations: false,
      legal_text: false,
      overall: false
    },
    completed: false,
    generated_at: '',
    report_url: ''
  };
}

export function updateEstimateData(estimateData) {
  try {
    if (!estimateData || typeof estimateData !== 'object') {
      throw new Error('Invalid estimate data provided');
    }
    
    // Merge with existing data
    helper.estimate_data = {
      ...helper.estimate_data,
      ...estimateData,
      updated_at: new Date().toISOString()
    };
    
    // Save to storage
    saveHelperToStorage();
    
    console.log('✅ Estimate data updated in helper');
    return true;
    
  } catch (error) {
    console.error('❌ Error updating estimate data:', error);
    errorHandler.createError('estimate_update', 'medium', error.message);
    return false;
  }
}

export function calculateEstimateTotals() {
  try {
    // Get base damage from expertise or damage sections
    let baseDamage = 0;
    
    if (helper.expertise?.calculations?.base_damage) {
      baseDamage = parseFloat(helper.expertise.calculations.base_damage) || 0;
    } else if (helper.damage_sections && Array.isArray(helper.damage_sections)) {
      baseDamage = helper.damage_sections.reduce((total, section) => {
        const sectionTotal = (section.works_total || 0) + 
                            (section.parts_total || 0) + 
                            (section.repairs_total || 0);
        return total + parseFloat(sectionTotal) || 0;
      }, 0);
    }
    
    // Use VAT rate from math engine for consistency
    const vatRate = MathEngine.getVatRate();
    const vatAmount = Math.round(baseDamage * vatRate / 100);
    const totalEstimate = baseDamage + vatAmount;
    
    // Update estimate data
    const estimateCalculations = {
      base_damage: baseDamage,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_estimate: totalEstimate,
      calculated_at: new Date().toISOString()
    };
    
    updateEstimateData({ calculations: estimateCalculations });
    
    console.log('💰 Estimate calculations updated:', estimateCalculations);
    return estimateCalculations;
    
  } catch (error) {
    console.error('❌ Error calculating estimate totals:', error);
    return {
      base_damage: 0,
      vat_rate: 18,
      vat_amount: 0,
      total_estimate: 0
    };
  }
}

export function validateEstimateCompletion() {
  try {
    const estimateData = getEstimateData();
    const validation = {
      car_details: !!(helper.car_details?.manufacturer && helper.meta?.plate),
      damage_sections: !!(helper.damage_sections && helper.damage_sections.length > 0),
      calculations: !!(estimateData.calculations?.total_estimate > 0),
      legal_text: !!(estimateData.legal_text && estimateData.legal_text.length > 0),
      overall: false
    };
    
    validation.overall = validation.car_details && 
                        validation.damage_sections && 
                        validation.calculations && 
                        validation.legal_text;
    
    // Update validation in helper
    updateEstimateData({ validation, completed: validation.overall });
    
    return validation;
    
  } catch (error) {
    console.error('❌ Error validating estimate completion:', error);
    return {
      car_details: false,
      damage_sections: false,
      calculations: false,
      legal_text: false,
      overall: false
    };
  }
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

// Make updateCalculations globally available for VAT updates
window.updateCalculations = updateCalculations;
