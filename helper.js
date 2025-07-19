// 🧠 Centralized Helper System - Single Source of Truth
// Handles ALL data flow: Make.com, manual inputs, internal browsers, damage centers, parts search, invoices

import { calculate, MathEngine } from './math.js';
import { securityManager } from './security-manager.js';
import { errorHandler } from './error-handler.js';
import { environmentConfig } from './environment-config.js';
import { 
  standardizeHelperData, 
  convertToLegacyFormat, 
  updateHelperWithStandardizedData,
  UNIFIED_SCHEMAS,
  DataFlowStandardizer
} from './data-flow-standardizer.js';
import SystemTracker from './system-tracker.js';


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
  
  // Calculate gross price (car properties only: base + features + registration)
  calculateGrossPrice: function(basePrice, featuresAdjustments = [], registrationAdjustments = []) {
    let total = parseFloat(basePrice) || 0;
    
    // Add car property adjustments only
    featuresAdjustments.forEach(adj => {
      const value = parseFloat(adj.value) || 0;
      total += (adj.type === 'plus') ? value : -value;
    });
    
    registrationAdjustments.forEach(adj => {
      const value = parseFloat(adj.value) || 0;
      total += (adj.type === 'plus') ? value : -value;
    });
    
    return Math.round(total);
  },
  
  // Calculate market price (gross + usage factors: km, ownership, owner count)
  calculateMarketPrice: function(grossPrice, usageAdjustments = []) {
    let total = parseFloat(grossPrice) || 0;
    
    // Add usage-based adjustments
    usageAdjustments.forEach(adj => {
      const value = parseFloat(adj.value) || 0;
      total += (adj.type === 'plus') ? value : -value;
    });
    
    return Math.round(total);
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
  },
  
  // Update gross price calculations (car properties only)
  updateGrossCalculations: function(basePrice, featuresAdjustments, registrationAdjustments) {
    try {
      const grossPrice = this.calculateGrossPrice(basePrice, featuresAdjustments, registrationAdjustments);
      
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      if (!helper.calculations) helper.calculations = {};
      if (!helper.expertise) helper.expertise = {};
      if (!helper.expertise.calculations) helper.expertise.calculations = {};
      
      // Update gross calculations
      helper.calculations.vehicle_value_gross = grossPrice;
      helper.expertise.calculations.vehicle_value_gross = grossPrice;
      helper.calculations.gross_adjustments = {
        features: featuresAdjustments || [],
        registration: registrationAdjustments || []
      };
      
      // Calculate gross damage percentage if damage data exists
      const totalDamage = helper.calculations.total_damage || 0;
      if (totalDamage && grossPrice) {
        const grossDamagePercent = Math.round((totalDamage / grossPrice) * 100);
        helper.calculations.damage_percent_gross = grossDamagePercent;
      }
      
      sessionStorage.setItem('helper', JSON.stringify(helper));
      console.log('✅ Gross calculations updated:', { grossPrice, totalDamage: helper.calculations.total_damage });
      
      return grossPrice;
    } catch (error) {
      console.error('Error updating gross calculations:', error);
      return 0;
    }
  },
  
  // Update market price calculations (gross + usage factors)
  updateMarketCalculations: function(grossPrice, usageAdjustments) {
    try {
      const marketPrice = this.calculateMarketPrice(grossPrice, usageAdjustments);
      
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      if (!helper.calculations) helper.calculations = {};
      if (!helper.expertise) helper.expertise = {};
      if (!helper.expertise.calculations) helper.expertise.calculations = {};
      
      // Update market calculations
      helper.calculations.vehicle_value_market = marketPrice;
      helper.calculations.market_value = marketPrice;
      helper.expertise.calculations.market_value = marketPrice;
      helper.calculations.market_adjustments = {
        mileage: usageAdjustments.filter(adj => adj.category === 'mileage'),
        ownership: usageAdjustments.filter(adj => adj.category === 'ownership'),
        owner_count: usageAdjustments.filter(adj => adj.category === 'owner_count')
      };
      
      // Calculate market damage percentage if damage data exists
      const totalDamage = helper.calculations.total_damage || 0;
      if (totalDamage && marketPrice) {
        const marketDamagePercent = Math.round((totalDamage / marketPrice) * 100);
        helper.calculations.damage_percent = marketDamagePercent;
      }
      
      sessionStorage.setItem('helper', JSON.stringify(helper));
      console.log('✅ Market calculations updated:', { marketPrice, grossPrice });
      
      return marketPrice;
    } catch (error) {
      console.error('Error updating market calculations:', error);
      return 0;
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
      // RAW ADJUSTMENTS (as received from Levi OCR)
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
      vehicle_value_market: '',
      damage_percent: '',
      damage_percent_gross: '',
      vehicle_value_base: '',
      market_value: '',
      total_compensation: '',
      // CATEGORIZED ADJUSTMENTS (processed for builders)
      gross_adjustments: {
        features: [],
        registration: []
      },
      market_adjustments: {
        mileage: [],
        ownership: [],
        owner_count: []
      }
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

// Global flag to prevent recursion
let isUpdatingHelper = false;

export function updateHelper(section, data, sourceModule = null) {
  try {
    SystemTracker.log('updateHelper_called', { section, sourceModule, dataKeys: Object.keys(data) });
    
    // Prevent recursion
    if (isUpdatingHelper) {
      console.warn('🔄 updateHelper: Recursion detected, skipping update to prevent infinite loop');
      SystemTracker.log('updateHelper_recursion_blocked');
      return false;
    }
    
    isUpdatingHelper = true;
    
    // Security validation
    if (!securityManager.validateSession()) {
      errorHandler.createError('authentication', 'high', 'Session expired during data update');
      isUpdatingHelper = false;
      return false;
    }

    // Input sanitization
    const sanitizedData = sanitizeHelperData(data);
    
    // Initialize section if needed
    if (!helper[section]) helper[section] = {};
    
    // Handle different data source types according to specifications
    switch (section) {
      case 'vehicle':
      case 'car_details':
        processCarDetailsData(sanitizedData, sourceModule);
        break;
        
      case 'stakeholders':
      case 'garage':
      case 'insurance':
      case 'client':
        processStakeholderData(section, sanitizedData, sourceModule);
        break;
        
      case 'damage_assessment':
      case 'damage_centers':
      case 'expertise':
        processDamageData(section, sanitizedData, sourceModule);
        break;
        
      case 'valuation':
      case 'levisummary':
      case 'levi_report':
        processValuationData(section, sanitizedData, sourceModule);
        break;
        
      case 'parts_search':
      case 'parts_results':
        processPartsData(section, sanitizedData, sourceModule);
        break;
        
      case 'invoice':
      case 'invoices':
        processInvoiceData(sanitizedData, sourceModule);
        break;
        
      case 'documents':
      case 'images':
        processDocumentData(section, sanitizedData, sourceModule);
        break;
        
      case 'financials':
      case 'fees':
      case 'costs':
        processFinancialData(section, sanitizedData, sourceModule);
        break;
        
      default:
        // Fallback for any other sections
        mergeDeep(helper[section], sanitizedData);
    }
    
    // Auto-standardize after any update
    try {
      const standardizer = new DataFlowStandardizer();
      const standardizedHelper = standardizer.standardizeHelper(helper);
      Object.assign(helper, standardizedHelper);
    } catch (e) {
      errorHandler.createError('data', 'medium', 'Helper standardization failed', { error: e.message });
      console.warn('Data standardization skipped:', e.message);
    }
    
    // Always save to sessionStorage after updates
    saveHelperToStorage();
    
    // Update legacy carData for backward compatibility
    if (['vehicle', 'car_details', 'stakeholders'].includes(section)) {
      updateLegacyCarData();
    }
    
    isUpdatingHelper = false;
    return true;
    
  } catch (error) {
    errorHandler.createError('data', 'high', 'Helper update failed', { section, error: error.message });
    isUpdatingHelper = false;
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
    
    console.log('💾 saveHelperToStorage: About to save helper data');
    console.log('💾 Data size:', dataString.length, 'characters');
    console.log('💾 Helper meta.plate:', sanitizedHelper.meta?.plate);
    console.log('💾 Helper vehicle.manufacturer:', sanitizedHelper.vehicle?.manufacturer);
    
    sessionStorage.setItem('helper', dataString);
    localStorage.setItem('helper_data', dataString);
    
    // CRITICAL FIX: Verify data was actually saved
    const savedData = sessionStorage.getItem('helper');
    if (savedData) {
      console.log('✅ Helper saved to sessionStorage successfully');
      console.log('📊 Saved data includes plate:', JSON.parse(savedData).meta?.plate);
    } else {
      console.error('❌ CRITICAL: Failed to save helper to sessionStorage!');
      throw new Error('Failed to save helper data to storage');
    }
    
    // VERIFICATION: Immediately read back to confirm it was saved
    const verification = sessionStorage.getItem('helper');
    if (verification) {
      const parsed = JSON.parse(verification);
      console.log('✅ VERIFICATION: Data saved successfully to sessionStorage');
      console.log('✅ VERIFICATION: Saved plate:', parsed.meta?.plate);
      console.log('✅ VERIFICATION: Saved manufacturer:', parsed.vehicle?.manufacturer);
    } else {
      console.error('❌ VERIFICATION FAILED: Data not found in sessionStorage after save!');
    }
    
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
    console.log('🚀 loadHelperFromStorage: Starting helper initialization...');
    
    // Check for incoming data from external sources FIRST
    checkForIncomingData();
    
    // Try sessionStorage first (primary), then localStorage (backup)
    let data = sessionStorage.getItem('helper');
    let dataSource = 'sessionStorage';
    
    console.log('🔍 sessionStorage helper data:', data ? 'Found' : 'Not found');
    
    if (!data) {
      data = localStorage.getItem('helper_data');
      dataSource = 'localStorage';
      console.log('🔍 localStorage helper data:', data ? 'Found' : 'Not found');
    }
    
    if (!data) {
      console.log('⚠️ No helper data found in storage - initializing empty helper');
      
      // Initialize empty helper structure
      Object.assign(helper, {
        meta: { plate: '', case_id: '', report_type: 'final' },
        vehicle: {},
        car_details: { ...CAR_DETAILS_TEMPLATE },
        client: {},
        expertise: { damage_blocks: [], levi_report: {}, calculations: {} },
        parts_search: { results: [] },
        fees: {},
        estimate_data: {},
        invoice: {},
        image_upload: { total_uploaded: 0 },
        assistant_history: []
      });
      
      // Save initialized helper
      saveHelperToStorage();
      console.log('✅ Empty helper initialized and saved');
      return true;
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

// Check for incoming data from external sources (Make.com, URL params, etc.)
export function checkForIncomingData() {
  console.log('🔍 Checking for incoming data from external sources...');
  
  try {
    // 1. Check URL parameters for car data
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Combine all URL parameters
    const allParams = { ...Object.fromEntries(urlParams), ...Object.fromEntries(hashParams) };
    
    if (Object.keys(allParams).length > 0) {
      console.log('📋 URL parameters found:', allParams);
      
      // Check for car data patterns
      const carDataFields = ['plate', 'manufacturer', 'model', 'year', 'chassis', 'owner', 'location'];
      const foundCarData = {};
      
      Object.keys(allParams).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (carDataFields.includes(lowerKey) || lowerKey.includes('car_') || lowerKey.includes('vehicle_')) {
          try {
            const value = decodeURIComponent(allParams[key]);
            // Validate that value is not empty and not just whitespace
            if (value && value.trim().length > 0) {
              foundCarData[lowerKey] = value.trim();
            }
          } catch (decodeError) {
            console.warn(`⚠️ Failed to decode URL parameter ${key}:`, decodeError);
          }
        }
      });
      
      if (Object.keys(foundCarData).length > 0) {
        console.log('🚗 Car data detected in URL:', foundCarData);
        
        // CRITICAL DEBUG: Check helper before URL data update
        console.log('🔧 URL PROCESSING: Helper before update:', {
          metaPlate: helper.meta?.plate,
          vehicleManufacturer: helper.vehicle?.manufacturer
        });
        
        // Update helper with URL data
        const carUpdateResult = updateHelper('car_details', foundCarData);
        const vehicleUpdateResult = updateHelper('vehicle', foundCarData);
        
        console.log('🔧 URL PROCESSING: updateHelper results:', {
          carDetails: carUpdateResult,
          vehicle: vehicleUpdateResult
        });
        
        // CRITICAL FIX: Force save after URL data processing
        saveHelperToStorage();
        console.log('💾 URL data saved to helper storage');
        
        // CRITICAL FIX: Broadcast update to all modules
        broadcastHelperUpdate(['car_details', 'vehicle', 'meta'], 'url_params');
        console.log('📡 URL data broadcasted to all modules');
        
        // Check helper after update
        console.log('🔧 URL PROCESSING: Helper after update:', {
          metaPlate: helper.meta?.plate,
          vehicleManufacturer: helper.vehicle?.manufacturer,
          carDetailsPlate: helper.car_details?.plate
        });
        
        if (foundCarData.plate) {
          updateHelper('meta', { plate: foundCarData.plate });
        }
        
        console.log('✅ Helper updated with URL car data');
        
        // Show notification that data was captured
        if (typeof window.showSystemNotification === 'function') {
          window.showSystemNotification('✅ נתוני רכב נקלטו מ-URL בהצלחה', 'success');
        } else {
          console.log('🔔 נתוני רכב נקלטו מ-URL בהצלחה');
        }
        
        // Trigger floating screen updates to show captured data
        broadcastHelperUpdate(['vehicle', 'meta', 'stakeholders'], 'url_params');
        
        // Clear URL parameters to prevent re-processing (with delay for debugging)
        setTimeout(() => {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
            console.log('🧹 URL parameters cleared after processing');
          }
        }, 2000); // 2 second delay to allow debugging
      }
    }
    
    // 2. Check sessionStorage for external car data
    const externalCarData = sessionStorage.getItem('carData');
    if (externalCarData) {
      try {
        const parsedCarData = JSON.parse(externalCarData);
        console.log('🚗 External car data found in sessionStorage:', parsedCarData);
        
        // Process external car data
        const carDetails = {
          plate: parsedCarData.plate,
          owner: parsedCarData.owner,
          location: parsedCarData.location
        };
        
        updateHelper('car_details', carDetails);
        updateHelper('meta', { 
          plate: parsedCarData.plate,
          owner_name: parsedCarData.owner,
          inspection_location: parsedCarData.location,
          inspection_date: parsedCarData.date
        });
        
        console.log('✅ Helper updated with external car data');
        
        // Don't clear this data - it might be needed by other modules
        
      } catch (error) {
        console.error('❌ Error parsing external car data:', error);
      }
    }
    
    // 3. Check for other external data sources
    ['leviData', 'partsData', 'damageData', 'invoiceData'].forEach(dataKey => {
      const externalData = sessionStorage.getItem(dataKey);
      if (externalData) {
        try {
          const parsedData = JSON.parse(externalData);
          console.log(`📊 External ${dataKey} found:`, parsedData);
          
          switch (dataKey) {
            case 'leviData':
              updateHelper('levisummary', parsedData);
              updateHelper('expertise', { levi_report: parsedData });
              break;
            case 'partsData':
              updateHelper('parts_search', { results: parsedData });
              break;
            case 'damageData':
              updateHelper('expertise', { damage_blocks: parsedData });
              updateHelper('damage_centers', parsedData);
              break;
            case 'invoiceData':
              updateHelper('invoice', parsedData);
              break;
          }
          
        } catch (error) {
          console.error(`❌ Error parsing ${dataKey}:`, error);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking for incoming data:', error);
    
    // Specific error reporting for URL parameter issues
    if (error.message.includes('URLSearchParams')) {
      console.error('❌ URL parameter parsing error:', error);
      if (typeof window.showSystemNotification === 'function') {
        window.showSystemNotification('⚠️ שגיאה בקליטת נתונים מ-URL', 'error');
      }
    }
    
    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
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
  const webhookUrl = environmentConfig.getWebhookConfig().final_report;
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskLabel, helper })
    });
    console.log('📤 Helper sent to Make.com:', response.status);
    return response;
  } catch (err) {
    console.error('❌ Failed to send helper to Make.com', err);
    throw err;
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

// CATEGORIZED DATA ACCESS FUNCTIONS FOR BUILDERS
export function getGrossAdjustments() {
  // Get CAR PROPERTIES adjustments (features + registration)
  const calculations = helper.expertise?.calculations || {};
  return {
    features: calculations.gross_adjustments?.features || [],
    registration: calculations.gross_adjustments?.registration || []
  };
}

export function getMarketAdjustments() {
  // Get USAGE FACTORS adjustments (mileage + ownership + owner_count)
  const calculations = helper.expertise?.calculations || {};
  return {
    mileage: calculations.market_adjustments?.mileage || [],
    ownership: calculations.market_adjustments?.ownership || [],
    owner_count: calculations.market_adjustments?.owner_count || []
  };
}

export function getBasePrice() {
  // Get the base price from Levi data
  return parseFloat(helper.expertise?.levi_report?.base_price || helper.levisummary?.base_price || 0);
}

export function getGrossPrice() {
  // Get calculated gross price (base + car properties)
  return parseFloat(helper.expertise?.calculations?.vehicle_value_gross || 0);
}

export function getMarketPrice() {
  // Get calculated market price (gross + usage factors)
  return parseFloat(helper.expertise?.calculations?.vehicle_value_market || helper.expertise?.levi_report?.final_price || 0);
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

// Data synchronization helpers with automatic categorization
export function syncLeviData(leviData) {
  // Update both old and new structures (RAW data preservation)
  updateHelper('levisummary', leviData);
  updateHelper('expertise', { levi_report: leviData });
  
  // CATEGORIZATION LAYER: Process Levi adjustments into gross vs market
  if (leviData.adjustments) {
    const grossAdjustments = {
      features: [],
      registration: []
    };
    
    const marketAdjustments = {
      mileage: [],
      ownership: [],
      owner_count: []
    };
    
    // CAR PROPERTIES → Gross adjustments
    if (leviData.adjustments.features) {
      grossAdjustments.features.push({
        description: 'מאפיינים',
        type: leviData.adjustments.features.value > 0 ? 'plus' : 'minus',
        percent: leviData.adjustments.features.percent || '',
        value: Math.abs(parseFloat(leviData.adjustments.features.value) || 0),
        category: 'features',
        source: 'levi_ocr'
      });
    }
    
    if (leviData.adjustments.registration) {
      grossAdjustments.registration.push({
        description: 'עליה לכביש',
        type: leviData.adjustments.registration.value > 0 ? 'plus' : 'minus',
        percent: leviData.adjustments.registration.percent || '',
        value: Math.abs(parseFloat(leviData.adjustments.registration.value) || 0),
        category: 'registration',
        source: 'levi_ocr'
      });
    }
    
    // USAGE FACTORS → Market adjustments
    if (leviData.adjustments.km) {
      marketAdjustments.mileage.push({
        description: 'מס\' ק"מ',
        type: leviData.adjustments.km.value > 0 ? 'plus' : 'minus',
        percent: leviData.adjustments.km.percent || '',
        value: Math.abs(parseFloat(leviData.adjustments.km.value) || 0),
        category: 'mileage',
        source: 'levi_ocr'
      });
    }
    
    if (leviData.adjustments.ownership) {
      marketAdjustments.ownership.push({
        description: 'סוג בעלות',
        type: leviData.adjustments.ownership.value > 0 ? 'plus' : 'minus',
        percent: leviData.adjustments.ownership.percent || '',
        value: Math.abs(parseFloat(leviData.adjustments.ownership.value) || 0),
        category: 'ownership',
        source: 'levi_ocr'
      });
    }
    
    if (leviData.adjustments.owner_count) {
      marketAdjustments.owner_count.push({
        description: 'מספר בעלים',
        type: leviData.adjustments.owner_count.value > 0 ? 'plus' : 'minus',
        percent: leviData.adjustments.owner_count.percent || '',
        value: Math.abs(parseFloat(leviData.adjustments.owner_count.value) || 0),
        category: 'owner_count',
        source: 'levi_ocr'
      });
    }
    
    // Update categorized adjustments in helper
    updateHelper('expertise', {
      calculations: {
        gross_adjustments: grossAdjustments,
        market_adjustments: marketAdjustments
      }
    });
    
    console.log('✅ Levi data categorized into gross vs market adjustments');
    console.log('🏠 Gross adjustments:', grossAdjustments);
    console.log('🏪 Market adjustments:', marketAdjustments);
  }
  
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

// Make data checking function globally available for testing
window.checkForIncomingData = checkForIncomingData;

// Load debugging tools in development
try {
  import('./data-reception-debugger.js').then(() => {
    console.log('🔍 Data reception debugger loaded');
  }).catch(e => {
    console.log('ℹ️ Data reception debugger not loaded (optional)');
  });
  
  import('./helper-test-suite.js').then(() => {
    console.log('🧪 Helper test suite loaded');
  }).catch(e => {
    console.log('ℹ️ Helper test suite not loaded (optional)');
  });
} catch (e) {
  // Debug tools are optional
}

// ============================================================================
// DATA PROCESSING FUNCTIONS FOR DIFFERENT MODULE TYPES
// ============================================================================

function processCarDetailsData(data, sourceModule) {
  console.log('🔧 processCarDetailsData: Starting with data:', data);
  console.log('🔧 processCarDetailsData: Current helper before update:', {
    meta: helper.meta,
    vehicle: helper.vehicle,
    car_details: helper.car_details
  });
  
  // Handle car data from Make.com, manual input, or internal browsers
  if (!helper.vehicle) helper.vehicle = {};
  if (!helper.meta) helper.meta = {};
  if (!helper.stakeholders) helper.stakeholders = { owner: {} };
  if (!helper.car_details) helper.car_details = {};
  
  // CRITICAL FIX: Handle Hebrew field names from Make.com
  const hebrewToEnglishMap = {
    'מספר_רכב': 'plate',
    'יצרן': 'manufacturer',
    'שם_היצרן': 'manufacturer',
    'דגם': 'model',
    'שנת_יצור': 'year',
    'מספר_שלדה': 'chassis',
    'קילומטרז': 'km',
    'בעל_הרכב': 'owner',
    'טלפון_בעל': 'ownerPhone',
    'כתובת_בעל': 'ownerAddress'
  };
  
  // Translate Hebrew fields to English
  const translatedData = { ...data };
  for (const [hebrewKey, englishKey] of Object.entries(hebrewToEnglishMap)) {
    if (data[hebrewKey] && !data[englishKey]) {
      translatedData[englishKey] = data[hebrewKey];
      console.log(`🔄 Translated ${hebrewKey} → ${englishKey}: ${data[hebrewKey]}`);
    }
  }
  
  // Meta information (essential for floating screens)
  if (translatedData.plate || translatedData.מספר_רכב) {
    const plateValue = translatedData.plate || translatedData.מספר_רכב;
    console.log('🔧 Setting helper.meta.plate to:', plateValue);
    helper.meta.plate = plateValue;
  }
  if (translatedData.location) {
    console.log('🔧 Setting helper.meta.location to:', translatedData.location);
    helper.meta.location = translatedData.location;
  }
  if (translatedData.date) {
    console.log('🔧 Setting helper.meta.damage_date to:', translatedData.date);
    helper.meta.damage_date = translatedData.date;
  }
  
  // Vehicle details according to unified schema
  // FIXED: Use 'plate' instead of 'plate_number' to match UI expectations
  if (translatedData.plate) {
    helper.vehicle.plate = translatedData.plate;
    helper.vehicle.plate_number = translatedData.plate; // Keep for backward compatibility
  }
  if (translatedData.manufacturer) helper.vehicle.manufacturer = translatedData.manufacturer;
  if (translatedData.model) helper.vehicle.model = translatedData.model;
  if (translatedData.year) helper.vehicle.year = translatedData.year;
  if (translatedData.chassis) helper.vehicle.chassis = translatedData.chassis;
  if (translatedData.km) helper.vehicle.km = translatedData.km;
  if (translatedData.engine_volume) helper.vehicle.engine_volume = translatedData.engine_volume;
  if (translatedData.fuel_type) helper.vehicle.fuel_type = translatedData.fuel_type;
  if (translatedData.ownership_type) helper.vehicle.ownership_type = translatedData.ownership_type;
  
  // Owner information - store in multiple formats for compatibility
  if (translatedData.owner) {
    helper.stakeholders.owner.name = translatedData.owner;
    helper.stakeholders.owner_name = translatedData.owner; // Floating screen compatibility
  }
  if (translatedData.ownerPhone) {
    helper.stakeholders.owner.phone = translatedData.ownerPhone;
    helper.stakeholders.owner_phone = translatedData.ownerPhone; // Floating screen compatibility  
  }
  if (translatedData.ownerAddress) {
    helper.stakeholders.owner.address = translatedData.ownerAddress;
    helper.stakeholders.owner_address = translatedData.ownerAddress; // Floating screen compatibility
  }
  
  // Preserve legacy structure for backward compatibility
  mergeDeep(helper.car_details, translatedData);
  
  console.log('🚗 processCarDetailsData: Updated helper with:', {
    meta: helper.meta,
    vehicle: helper.vehicle,
    owner: helper.stakeholders.owner.name,
    car_details: helper.car_details
  });
  
  // CRITICAL DEBUG: Force verify helper object was actually modified
  console.log('🔧 VERIFICATION: helper.meta.plate =', helper.meta.plate);
  console.log('🔧 VERIFICATION: helper.vehicle.manufacturer =', helper.vehicle.manufacturer);
  console.log('🔧 VERIFICATION: helper.vehicle.model =', helper.vehicle.model);
  
  // Also update window.currentCaseData for floating screens compatibility
  window.currentCaseData = {
    meta: helper.meta,
    vehicle: helper.vehicle,
    car_details: helper.car_details,
    stakeholders: helper.stakeholders
  };
  console.log('🔧 Updated window.currentCaseData for floating screen compatibility');
}

function processStakeholderData(section, data, sourceModule) {
  if (!helper.stakeholders) helper.stakeholders = { owner: {}, garage: {}, insurance: { agent: {} } };
  
  if (section === 'garage' || data.garageName || data.garagePhone) {
    helper.stakeholders.garage.name = data.garageName || data.name || helper.stakeholders.garage.name;
    helper.stakeholders.garage.phone = data.garagePhone || data.phone || helper.stakeholders.garage.phone;
    helper.stakeholders.garage.email = data.garageEmail || data.email || helper.stakeholders.garage.email;
  }
  
  if (section === 'insurance' || data.insuranceCompany || data.agentName) {
    helper.stakeholders.insurance.company = data.insuranceCompany || data.company || helper.stakeholders.insurance.company;
    helper.stakeholders.insurance.email = data.insuranceEmail || data.email || helper.stakeholders.insurance.email;
    helper.stakeholders.insurance.agent.name = data.agentName || data.agent_name || helper.stakeholders.insurance.agent.name;
    helper.stakeholders.insurance.agent.phone = data.insurance_agent_phone || data.agent_phone || helper.stakeholders.insurance.agent.phone;
    helper.stakeholders.insurance.agent.email = data.insurance_agent_email || data.agent_email || helper.stakeholders.insurance.agent.email;
  }
  
  if (section === 'client' || data.ownerPhone || data.ownerAddress) {
    helper.stakeholders.owner.phone = data.ownerPhone || data.phone || helper.stakeholders.owner.phone;
    helper.stakeholders.owner.address = data.ownerAddress || data.address || helper.stakeholders.owner.address;
    if (data.damageDate) helper.case_info.damage_date = data.damageDate;
  }
}

function processDamageData(section, data, sourceModule) {
  if (!helper.damage_assessment) helper.damage_assessment = { summary: {}, centers: [] };
  
  if (section === 'damage_centers' || section === 'expertise') {
    if (Array.isArray(data)) {
      helper.damage_assessment.centers = data;
    } else if (data.centers) {
      helper.damage_assessment.centers = data.centers;
    } else if (data.damage_blocks) {
      helper.damage_assessment.centers = data.damage_blocks;
    }
  }
  
  // Preserve legacy expertise structure
  if (!helper.expertise) helper.expertise = {};
  mergeDeep(helper.expertise, data);
}

function processValuationData(section, data, sourceModule) {
  if (!helper.valuation) helper.valuation = { adjustments: {}, calculations: {} };
  
  if (section === 'levisummary' || section === 'levi_report') {
    // Handle Levi OCR data according to specifications
    if (data.base_price) helper.valuation.base_price = parseFloat(data.base_price) || 0;
    if (data.final_price) helper.valuation.final_price = parseFloat(data.final_price) || 0;
    
    // Process adjustments according to unified schema
    if (data.adjustments) {
      Object.keys(data.adjustments).forEach(key => {
        if (!helper.valuation.adjustments[key]) helper.valuation.adjustments[key] = {};
        Object.assign(helper.valuation.adjustments[key], data.adjustments[key]);
      });
    }
  }
  
  // Preserve legacy structure
  if (!helper[section]) helper[section] = {};
  mergeDeep(helper[section], data);
}

function processPartsData(section, data, sourceModule) {
  if (!helper.parts_search) helper.parts_search = { search_history: [], all_results: [], results: [], summary: {} };
  
  if (Array.isArray(data)) {
    // Add to all_results and mark as selected/unselected
    data.forEach(part => {
      const partEntry = {
        ...part,
        search_timestamp: new Date().toISOString(),
        source_module: sourceModule,
        selected: part.selected !== false // Default to selected unless explicitly false
      };
      helper.parts_search.all_results.push(partEntry);
      
      if (partEntry.selected) {
        helper.parts_search.results.push(partEntry);
      }
    });
  } else if (data.results) {
    processPartsData('parts_search', data.results, sourceModule);
  }
  
  // Update summary
  helper.parts_search.summary.total_results = helper.parts_search.all_results.length;
  helper.parts_search.summary.selected_count = helper.parts_search.results.length;
  helper.parts_search.summary.last_search = new Date().toISOString();
}

function processInvoiceData(data, sourceModule) {
  if (!helper.documents) helper.documents = { invoices: [] };
  if (!helper.financials) helper.financials = { costs: {} };
  
  // Store invoice document
  helper.documents.invoices.push({
    ...data,
    processed_date: new Date().toISOString(),
    source_module: sourceModule
  });
  
  // Extract financial data from invoice
  if (data.parts_total) helper.financials.costs.parts_total = parseFloat(data.parts_total) || 0;
  if (data.works_total) helper.financials.costs.works_total = parseFloat(data.works_total) || 0;
  if (data.repairs_total) helper.financials.costs.repairs_total = parseFloat(data.repairs_total) || 0;
  if (data.vat_amount) helper.financials.taxes.vat_amount = parseFloat(data.vat_amount) || 0;
}

function processDocumentData(section, data, sourceModule) {
  if (!helper.documents) helper.documents = { images: [], invoices: [], reports: [], pdfs: [], other_files: [] };
  
  if (section === 'images' && Array.isArray(data)) {
    helper.documents.images.push(...data.map(img => ({
      ...img,
      upload_date: new Date().toISOString(),
      source_module: sourceModule
    })));
  } else if (data.photo_count) {
    // Accumulative photo count
    helper.documents.photo_count = (helper.documents.photo_count || 0) + parseInt(data.photo_count);
  }
}

function processFinancialData(section, data, sourceModule) {
  if (!helper.financials) helper.financials = { costs: {}, fees: {}, taxes: {}, totals: {} };
  
  if (section === 'fees') {
    Object.assign(helper.financials.fees, data);
  } else if (section === 'costs') {
    Object.assign(helper.financials.costs, data);
  } else {
    mergeDeep(helper.financials, data);
  }
  
  // Recalculate totals
  updateCalculations();
}

// Flag to prevent legacy update recursion
let isUpdatingLegacyData = false;

function updateLegacyCarData() {
  // Prevent recursion
  if (isUpdatingLegacyData) {
    console.warn('🔄 updateLegacyCarData: Recursion detected, skipping legacy update');
    return;
  }
  
  isUpdatingLegacyData = true;
  
  try {
    // Update legacy carData in sessionStorage for backward compatibility
    const carData = {
      plate: helper.vehicle?.plate_number || helper.vehicle?.plate || helper.car_details?.plate || '',
      owner: helper.stakeholders?.owner?.name || helper.car_details?.owner || '',
      manufacturer: helper.vehicle?.manufacturer || helper.car_details?.manufacturer || '',
      model: helper.vehicle?.model || helper.car_details?.model || '',
      year: helper.vehicle?.year || helper.car_details?.year || '',
      location: helper.stakeholders?.garage?.name || helper.car_details?.garageName || '',
      date: helper.case_info?.inspection_date || helper.car_details?.damageDate || ''
    };
    
    // Add internal flag to prevent monitor from processing this
    const dataString = JSON.stringify(carData);
    
    // Temporarily mark as internal update
    if (window.dataDebugger) {
      window.dataDebugger._internalUpdate = true;
    }
    
    sessionStorage.setItem('carData', dataString);
    
    // Reset internal flag after brief delay
    setTimeout(() => {
      if (window.dataDebugger) {
        window.dataDebugger._internalUpdate = false;
      }
    }, 100);
    
  } finally {
    isUpdatingLegacyData = false;
  }
}

// ============================================================================
// NEW: ENHANCED WEBHOOK INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Universal data processing function for webhook responses
 * Automatically detects data type and routes to appropriate processors
 */
export async function processIncomingData(data, webhookId = 'unknown') {
  console.log('🔄 processIncomingData: Processing data from webhook:', webhookId, data);
  
  try {
    const result = {
      success: true,
      updatedSections: [],
      warnings: [],
      timestamp: new Date().toISOString(),
      webhookId: webhookId
    };
    
    // Detect and process different data types
    if (isCarData(data)) {
      processCarDetailsData(data, `webhook_${webhookId}`);
      result.updatedSections.push('vehicle', 'meta', 'stakeholders');
      console.log('✅ Processed car data');
    }
    
    if (isStakeholderData(data)) {
      const stakeholderType = detectStakeholderType(data);
      processStakeholderData(stakeholderType, data, `webhook_${webhookId}`);
      result.updatedSections.push('stakeholders');
      console.log('✅ Processed stakeholder data:', stakeholderType);
    }
    
    if (isLeviData(data)) {
      processValuationData('levi_report', data, `webhook_${webhookId}`);
      result.updatedSections.push('valuation', 'levisummary');
      console.log('✅ Processed Levi valuation data');
    }
    
    if (isPartsData(data)) {
      processPartsData('parts_search', data, `webhook_${webhookId}`);
      result.updatedSections.push('parts_search');
      console.log('✅ Processed parts search data');
    }
    
    if (isInvoiceData(data)) {
      processInvoiceData(data, `webhook_${webhookId}`);
      result.updatedSections.push('documents', 'financials');
      console.log('✅ Processed invoice data');
    }
    
    if (isDamageData(data)) {
      processDamageData('damage_centers', data, `webhook_${webhookId}`);
      result.updatedSections.push('damage_assessment', 'expertise');
      console.log('✅ Processed damage assessment data');
    }
    
    if (isDocumentData(data)) {
      processDocumentData('images', data, `webhook_${webhookId}`);
      result.updatedSections.push('documents');
      console.log('✅ Processed document data');
    }
    
    // Save updated helper to storage
    saveHelperToStorage();
    
    // Update legacy data for backward compatibility
    updateLegacyCarData();
    
    console.log('✅ processIncomingData: Successfully processed all data types');
    return result;
    
  } catch (error) {
    console.error('❌ processIncomingData: Error processing data:', error);
    throw error;
  }
}

/**
 * Broadcasting system to notify all modules and floating screens of helper updates
 */
export function broadcastHelperUpdate(updatedSections = [], source = 'unknown') {
  console.log('📡 Broadcasting helper update:', { updatedSections, source });
  
  try {
    // Create custom event with helper data
    const updateEvent = new CustomEvent('helperUpdate', {
      detail: {
        helper: helper,
        updatedSections: updatedSections,
        source: source,
        timestamp: new Date().toISOString()
      }
    });
    
    // Dispatch to document
    document.dispatchEvent(updateEvent);
    
    // Update all module forms if functions exist
    if (typeof window.refreshAllModuleForms === 'function') {
      window.refreshAllModuleForms(helper);
    }
    
    // Trigger floating screen updates
    triggerFloatingScreenUpdates(updatedSections);
    
    // Update builders if they exist
    updateBuildersFromHelper(updatedSections);
    
    console.log('✅ Helper update broadcasted successfully');
    
  } catch (error) {
    console.error('❌ Error broadcasting helper update:', error);
  }
}

/**
 * Trigger floating screen displays based on data type
 */
function triggerFloatingScreenUpdates(updatedSections) {
  console.log('📱 Triggering floating screen updates for sections:', updatedSections);
  
  // Car details floating screen
  if (updatedSections.includes('vehicle') || updatedSections.includes('meta')) {
    console.log('🚗 Auto-showing car details floating screen');
    
    // First refresh the data, then show the screen
    if (typeof window.refreshCarData === 'function') {
      window.refreshCarData();
    }
    
    if (typeof window.showCarDetails === 'function') {
      setTimeout(() => window.showCarDetails(), 100);
    } else if (typeof window.toggleCarDetails === 'function') {
      setTimeout(() => window.toggleCarDetails(), 100);
    }
  }
  
  // Levi floating screen
  if (updatedSections.includes('valuation') || updatedSections.includes('levisummary')) {
    console.log('📊 Auto-showing Levi report floating screen');
    
    // First refresh the data, then show the screen
    if (typeof window.refreshLeviData === 'function') {
      window.refreshLeviData();
    }
    
    if (typeof window.toggleLeviReport === 'function') {
      setTimeout(() => window.toggleLeviReport(), 100);
    }
  }
  
  // Parts floating screen
  if (updatedSections.includes('parts_search')) {
    console.log('🔧 Auto-showing parts search floating screen');
    
    // First refresh the data, then show the screen
    if (typeof window.refreshPartsResults === 'function') {
      window.refreshPartsResults();
    }
    
    if (typeof window.togglePartsSearch === 'function') {
      setTimeout(() => window.togglePartsSearch(), 100);
    }
  }
  
  // Invoice floating screen
  if (updatedSections.includes('documents') || updatedSections.includes('financials')) {
    console.log('📄 Auto-showing invoice floating screen');
    
    // Check if invoice floating screen exists
    if (typeof window.toggleInvoiceDetails === 'function') {
      setTimeout(() => window.toggleInvoiceDetails(), 100);
    }
  }
}

/**
 * Update builders with latest helper data
 */
function updateBuildersFromHelper(updatedSections) {
  console.log('🏗️ Updating builders with helper data for sections:', updatedSections);
  
  // Update estimate builder if exists
  if (typeof window.updateEstimateBuilderFromHelper === 'function') {
    window.updateEstimateBuilderFromHelper(helper);
  }
  
  // Update expertise builder if exists
  if (typeof window.updateExpertiseBuilderFromHelper === 'function') {
    window.updateExpertiseBuilderFromHelper(helper);
  }
  
  // Update damage center wizard if exists
  if (typeof window.updateDamageCentersFromHelper === 'function') {
    window.updateDamageCentersFromHelper(helper);
  }
}

// ============================================================================
// DATA TYPE DETECTION FUNCTIONS
// ============================================================================

function isCarData(data) {
  return !!(data.plate || data.manufacturer || data.model || data.owner || 
           data.car_details || data.vehicle_data || 
           data.יצרן || data.דגם || data.מספר_רכב || // Hebrew field names from Make.com
           (data.שם_היצרן && data.דגם)); // Alternative Hebrew field names
}

function isStakeholderData(data) {
  return !!(data.garageName || data.garagePhone || data.garageEmail ||
           data.insuranceCompany || data.agentName || 
           data.ownerPhone || data.ownerAddress);
}

function isLeviData(data) {
  return !!(data.levi_report || data.levi_data || data.base_price || 
           data.final_price || data.adjustments || data.קוד_דגם ||
           data.מחיר_בסיס || data.מחיר_סופי_לרכב);
}

function isPartsData(data) {
  return !!(data.parts_results || data.search_results || 
           Array.isArray(data.results) || data.part_name || data.parts);
}

function isInvoiceData(data) {
  return !!(data.invoice_number || data.invoice_data || data.מספר_חשבונית ||
           data.garage_name || data.parts_total || data.works_total);
}

function isDamageData(data) {
  return !!(data.damage_centers || data.damage_blocks || data.expertise ||
           data.centers || Array.isArray(data.damages));
}

function isDocumentData(data) {
  return !!(data.images || data.photo_count || data.uploaded_files ||
           Array.isArray(data.files));
}

function detectStakeholderType(data) {
  if (data.garageName || data.garagePhone || data.garageEmail) return 'garage';
  if (data.insuranceCompany || data.agentName) return 'insurance';
  if (data.ownerPhone || data.ownerAddress) return 'client';
  return 'general';
}

// ============================================================================
// MANUAL INPUT OVERRIDE SYSTEM
// ============================================================================

/**
 * Manual Input Override System
 * Ensures manual user input always takes precedence over automatic data
 * Tracks manual modifications and prevents automatic overrides
 */

// Track which fields have been manually modified
let manualOverrides = {
  fields: new Set(), // Set of field keys that have been manually modified
  timestamps: {}, // Timestamp of when each field was manually modified
  sources: {} // Source of manual modification (which module/page)
};

/**
 * Mark a field as manually modified
 * This prevents automatic systems from overriding the user's input
 */
export function markFieldAsManuallyModified(fieldKey, value, source = 'unknown') {
  try {
    console.log(`🔒 Manual override: ${fieldKey} = ${value} (source: ${source})`);
    
    // Add to manual overrides tracking
    manualOverrides.fields.add(fieldKey);
    manualOverrides.timestamps[fieldKey] = new Date().toISOString();
    manualOverrides.sources[fieldKey] = source;
    
    // Update the helper with manual value
    updateHelperField(fieldKey, value, 'manual_input');
    
    // Save manual overrides to sessionStorage for persistence
    sessionStorage.setItem('manualOverrides', JSON.stringify({
      fields: Array.from(manualOverrides.fields),
      timestamps: manualOverrides.timestamps,
      sources: manualOverrides.sources
    }));
    
    // Broadcast that this field is now manually controlled
    broadcastManualOverride(fieldKey, value, source);
    
    console.log(`✅ Field ${fieldKey} marked as manually modified`);
    
  } catch (error) {
    console.error('❌ Error marking field as manually modified:', error);
  }
}

/**
 * Check if a field has been manually modified
 * Returns true if field should not be automatically updated
 */
export function isFieldManuallyModified(fieldKey) {
  return manualOverrides.fields.has(fieldKey);
}

/**
 * Get all manually modified fields
 */
export function getManuallyModifiedFields() {
  return {
    fields: Array.from(manualOverrides.fields),
    timestamps: manualOverrides.timestamps,
    sources: manualOverrides.sources
  };
}

/**
 * Clear manual override for a specific field
 * This allows automatic updates to resume for that field
 */
export function clearManualOverride(fieldKey) {
  console.log(`🔓 Clearing manual override for field: ${fieldKey}`);
  
  manualOverrides.fields.delete(fieldKey);
  delete manualOverrides.timestamps[fieldKey];
  delete manualOverrides.sources[fieldKey];
  
  // Update sessionStorage
  sessionStorage.setItem('manualOverrides', JSON.stringify({
    fields: Array.from(manualOverrides.fields),
    timestamps: manualOverrides.timestamps,
    sources: manualOverrides.sources
  }));
  
  console.log(`✅ Manual override cleared for ${fieldKey}`);
}

/**
 * Reset all manual overrides
 * This allows all automatic updates to resume
 */
export function resetAllManualOverrides() {
  console.log('🔄 Resetting all manual overrides');
  
  manualOverrides = {
    fields: new Set(),
    timestamps: {},
    sources: {}
  };
  
  sessionStorage.removeItem('manualOverrides');
  console.log('✅ All manual overrides reset');
}

/**
 * Load manual overrides from sessionStorage on page load
 */
export function loadManualOverrides() {
  try {
    const stored = sessionStorage.getItem('manualOverrides');
    if (stored) {
      const data = JSON.parse(stored);
      manualOverrides.fields = new Set(data.fields || []);
      manualOverrides.timestamps = data.timestamps || {};
      manualOverrides.sources = data.sources || {};
      
      console.log(`📋 Loaded ${manualOverrides.fields.size} manual overrides from storage`);
    }
  } catch (error) {
    console.error('❌ Error loading manual overrides:', error);
  }
}

/**
 * Broadcast manual override to other modules/screens
 */
function broadcastManualOverride(fieldKey, value, source) {
  try {
    // Broadcast to floating screens
    if (typeof window.broadcastManualOverride === 'function') {
      window.broadcastManualOverride(fieldKey, value, source);
    }
    
    // Trigger helper update broadcast
    broadcastHelperUpdate([getFieldSection(fieldKey)], 'manual_override');
    
  } catch (error) {
    console.error('❌ Error broadcasting manual override:', error);
  }
}

/**
 * Basic helper field update function
 * Updates a specific field in the helper object structure
 */
export function updateHelperField(fieldKey, value, source = 'unknown') {
  try {
    console.log(`🔧 updateHelperField: Updating ${fieldKey} = ${value} (source: ${source})`);
    
    // Get the section where this field belongs
    const section = getFieldSection(fieldKey);
    
    if (!section) {
      console.warn(`⚠️ updateHelperField: No section mapping found for field ${fieldKey}`);
      return false;
    }
    
    // Ensure the section exists in helper
    if (!helper[section]) {
      helper[section] = {};
    }
    
    // Update the field in the appropriate section
    helper[section][fieldKey] = value;
    
    // Also update legacy locations for backward compatibility
    if (['plate', 'manufacturer', 'model', 'year', 'km', 'chassis'].includes(fieldKey)) {
      if (!helper.car_details) helper.car_details = {};
      helper.car_details[fieldKey] = value;
      if (fieldKey === 'plate') {
        if (!helper.vehicle) helper.vehicle = {};
        helper.vehicle.plate_number = value;
      }
    }
    
    // Save to storage
    saveHelperToStorage();
    
    console.log(`✅ updateHelperField: Successfully updated ${fieldKey} in ${section}`);
    return true;
    
  } catch (error) {
    console.error(`❌ updateHelperField: Error updating ${fieldKey}:`, error);
    return false;
  }
}

/**
 * Smart update helper field - respects manual overrides
 * Only updates field if it hasn't been manually modified
 */
export function updateHelperFieldSafe(fieldKey, value, source = 'automatic') {
  // Check if field has been manually modified
  if (isFieldManuallyModified(fieldKey)) {
    console.log(`⏭️ Skipping automatic update for ${fieldKey} - manually modified by ${manualOverrides.sources[fieldKey]}`);
    return false; // Update was blocked
  }
  
  // Field is safe to update automatically
  updateHelperField(fieldKey, value, source);
  console.log(`✅ Automatic update applied to ${fieldKey}`);
  return true; // Update was applied
}

/**
 * Get the section name for a field key
 */
function getFieldSection(fieldKey) {
  const sectionMap = {
    // Meta fields
    plate: 'meta',
    damageDate: 'meta',
    location: 'meta',
    
    // Vehicle fields
    manufacturer: 'vehicle',
    model: 'vehicle',
    year: 'vehicle',
    odo: 'vehicle',
    km: 'vehicle',
    chassis: 'vehicle',
    model_code: 'vehicle',
    fuel_type: 'vehicle',
    engine_volume: 'vehicle',
    ownership_type: 'vehicle',
    market_value: 'vehicle',
    
    // Stakeholder fields
    owner: 'stakeholders',
    ownerPhone: 'stakeholders',
    ownerAddress: 'stakeholders',
    garageName: 'stakeholders',
    garagePhone: 'stakeholders',
    garageEmail: 'stakeholders',
    agentName: 'stakeholders',
    insurance_agent_phone: 'stakeholders',
    insuranceCompany: 'stakeholders',
    
    // Car details (legacy compatibility)
    damageType: 'car_details'
  };
  
  return sectionMap[fieldKey] || 'car_details';
}

// Initialize manual overrides when helper loads
loadManualOverrides();

// ============================================================================
// BRIDGE FUNCTIONS - Legacy System Compatibility
// ============================================================================

/**
 * Bridge function for legacy updateCaseData calls
 * Routes old module calls to new helper system
 */
window.updateCaseData = function(section, data, sourceModule = 'legacy') {
  console.log(`🌉 BRIDGE: updateCaseData(${section}) called from ${sourceModule}`, data);
  SystemTracker.log('bridge_updateCaseData_executed', { section, sourceModule, dataKeys: Object.keys(data) });
  
  try {
    // Route to appropriate helper update function
    switch (section) {
      case 'stakeholders':
      case 'vehicle':
      case 'meta':
      case 'car_details':
        const result = updateHelper(section, data, sourceModule);
        SystemTracker.log('bridge_updateHelper_result', { section, result, helperPlate: helper.meta?.plate });
        if (result) {
          console.log(`✅ BRIDGE: Successfully routed ${section} data to helper`);
          // Trigger module refresh after update
          if (typeof window.refreshAllModuleForms === 'function') {
            window.refreshAllModuleForms();
          }
        }
        return result;
        
      default:
        console.warn(`⚠️ BRIDGE: Unknown section ${section}, routing to general helper update`);
        return updateHelper('general', data, sourceModule);
    }
    
  } catch (error) {
    console.error(`❌ BRIDGE: Error in updateCaseData for ${section}:`, error);
    return false;
  }
};

/**
 * Bridge function for legacy receiveCarData calls  
 * Routes open-cases.html calls to new helper system
 */
window.receiveCarData = async function(data, source = 'make_com') {
  console.log(`🌉 BRIDGE: receiveCarData called from ${source}`, data);
  
  try {
    // Process the incoming data through the new system
    const result = await processIncomingData(data, source);
    
    if (result && result.success) {
      console.log(`✅ BRIDGE: Successfully processed car data through helper system`);
      
      // Broadcast update to all modules and floating screens
      broadcastHelperUpdate(result.updatedSections || ['vehicle', 'meta', 'stakeholders'], source);
      
      // Trigger module refresh
      if (typeof window.refreshAllModuleForms === 'function') {
        window.refreshAllModuleForms();
      }
      
      return true;
    } else {
      console.error(`❌ BRIDGE: Failed to process car data through helper system`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ BRIDGE: Error in receiveCarData:`, error);
    
    // Fallback: try to update helper directly
    try {
      updateHelper('car_details', data, source);
      return true;
    } catch (fallbackError) {
      console.error(`❌ BRIDGE: Fallback also failed:`, fallbackError);
      return false;
    }
  }
};

console.log('🌉 Bridge functions initialized: updateCaseData, receiveCarData');

// ============================================================================
// UNIVERSAL MODULE AUTO-POPULATION FRAMEWORK
// ============================================================================

/**
 * Universal function to populate all module forms from helper data
 * Called whenever helper is updated to sync all UI elements
 */
export function refreshAllModuleForms(helperData = helper) {
  console.log('🔄 refreshAllModuleForms: Updating all module forms with helper data');
  
  try {
    // General Info module fields
    populateGeneralInfoFields(helperData);
    
    // Car details fields (floating screens and forms)
    populateCarDetailsFields(helperData);
    
    // Damage center fields
    populateDamageCenterFields(helperData);
    
    // Parts search fields
    populatePartsFields(helperData);
    
    // Fee module fields
    populateFeeFields(helperData);
    
    // Levi report fields
    populateLeviFields(helperData);
    
    // Invoice fields
    populateInvoiceFields(helperData);
    
    console.log('✅ All module forms updated successfully');
    
  } catch (error) {
    console.error('❌ Error refreshing module forms:', error);
  }
}

/**
 * Populate General Info form fields
 */
function populateGeneralInfoFields(helperData) {
  const fieldMappings = {
    // Basic fields
    'plate': helperData.vehicle?.plate_number || helperData.meta?.plate || '',
    'owner': helperData.stakeholders?.owner?.name || '',
    'ownerPhone': helperData.stakeholders?.owner?.phone || '',
    'ownerAddress': helperData.stakeholders?.owner?.address || '',
    
    // Garage information
    'garageName': helperData.stakeholders?.garage?.name || '',
    'garagePhone': helperData.stakeholders?.garage?.phone || '',
    'garageEmail': helperData.stakeholders?.garage?.email || '',
    
    // Insurance information
    'insuranceCompany': helperData.stakeholders?.insurance?.company || '',
    'insuranceEmail': helperData.stakeholders?.insurance?.email || '',
    'agentName': helperData.stakeholders?.insurance?.agent?.name || '',
    'agentPhone': helperData.stakeholders?.insurance?.agent?.phone || '',
    'agentEmail': helperData.stakeholders?.insurance?.agent?.email || '',
    
    // Case information
    'damageType': helperData.case_info?.damage_type || '',
    'damageDate': helperData.case_info?.damage_date || ''
  };
  
  populateFormFields(fieldMappings, 'general_info');
}

/**
 * Populate Car Details fields in floating screens and forms
 */
function populateCarDetailsFields(helperData) {
  const fieldMappings = {
    'plate': helperData.vehicle?.plate_number || helperData.meta?.plate || '',
    'manufacturer': helperData.vehicle?.manufacturer || '',
    'model': helperData.vehicle?.model || '',
    'year': helperData.vehicle?.year || '',
    'chassis': helperData.vehicle?.chassis || '',
    'km': helperData.vehicle?.km || '',
    'owner': helperData.stakeholders?.owner?.name || '',
    'trim': helperData.vehicle?.trim || '',
    'engine_volume': helperData.vehicle?.engine_volume || '',
    'fuel_type': helperData.vehicle?.fuel_type || '',
    'ownership_type': helperData.vehicle?.ownership_type || ''
  };
  
  populateFormFields(fieldMappings, 'car_details');
}

/**
 * Populate Damage Center fields
 */
function populateDamageCenterFields(helperData) {
  if (helperData.damage_assessment?.centers) {
    // Trigger damage center UI update if function exists
    if (typeof window.updateDamageCentersFromHelper === 'function') {
      window.updateDamageCentersFromHelper(helperData.damage_assessment.centers);
    }
  }
}

/**
 * Populate Parts search fields
 */
function populatePartsFields(helperData) {
  if (helperData.parts_search?.results) {
    // Trigger parts UI update if function exists
    if (typeof window.updatePartsFromHelper === 'function') {
      window.updatePartsFromHelper(helperData.parts_search);
    }
  }
}

/**
 * Populate Fee module fields
 */
function populateFeeFields(helperData) {
  if (helperData.financials?.fees) {
    const fieldMappings = {
      'photo_fee': helperData.financials.fees.photography?.total || '',
      'office_fee': helperData.financials.fees.office?.total || '',
      'travel_fee': helperData.financials.fees.travel?.total || '',
      'assessment_fee': helperData.financials.fees.assessment?.total || '',
      'vat_percentage': helperData.financials.taxes?.vat_percentage || '18'
    };
    
    populateFormFields(fieldMappings, 'fees');
  }
}

/**
 * Populate Levi report fields
 */
function populateLeviFields(helperData) {
  if (helperData.valuation) {
    const fieldMappings = {
      'base_price': helperData.valuation.base_price || '',
      'final_price': helperData.valuation.final_price || '',
      'market_value': helperData.valuation.final_price || helperData.vehicle?.market_value || ''
    };
    
    populateFormFields(fieldMappings, 'levi');
    
    // Update Levi floating screen if function exists
    if (typeof window.updateLeviFloatingFromHelper === 'function') {
      window.updateLeviFloatingFromHelper(helperData.valuation);
    }
  }
}

/**
 * Populate Invoice fields
 */
function populateInvoiceFields(helperData) {
  if (helperData.documents?.invoices?.length > 0) {
    // Trigger invoice UI update if function exists
    if (typeof window.updateInvoiceFromHelper === 'function') {
      window.updateInvoiceFromHelper(helperData.documents.invoices);
    }
  }
}

/**
 * Universal field population helper
 */
function populateFormFields(fieldMappings, moduleType) {
  let populatedCount = 0;
  let skippedCount = 0;
  
  Object.keys(fieldMappings).forEach(fieldId => {
    const value = fieldMappings[fieldId];
    const element = document.getElementById(fieldId);
    
    if (element && value) {
      // ✅ MANUAL OVERRIDE PROTECTION: Check if field has been manually modified
      if (isFieldManuallyModified(fieldId)) {
        console.log(`⏭️ Skipping automatic population for ${fieldId} - manually modified`);
        skippedCount++;
        return;
      }
      
      // Handle different input types
      if (element.type === 'checkbox') {
        element.checked = !!value;
      } else if (element.tagName === 'SELECT') {
        // For select elements, try to find matching option
        const option = Array.from(element.options).find(opt => 
          opt.value === value || opt.textContent === value
        );
        if (option) {
          element.value = option.value;
        }
      } else {
        element.value = value;
      }
      
      // Trigger change event to update any dependent logic
      element.dispatchEvent(new Event('change', { bubbles: true }));
      populatedCount++;
    }
  });
  
  console.log(`✅ Populated ${moduleType} fields: ${populatedCount} updated, ${skippedCount} skipped (manually modified)`);
}

// Make functions globally available
window.refreshAllModuleForms = refreshAllModuleForms;

// ============================================================================
// SYSTEM OPTIMIZATION & VALIDATION
// ============================================================================

/**
 * System Health Check - Monitor helper integrity and performance
 */
export function runSystemHealthCheck() {
  const healthReport = {
    timestamp: new Date().toISOString(),
    helper_status: 'unknown',
    manual_overrides: 0,
    module_integration: 'unknown',
    session_storage: 'unknown',
    broadcasting: 'unknown',
    warnings: [],
    recommendations: []
  };
  
  try {
    // Check helper data structure
    if (helper && typeof helper === 'object') {
      healthReport.helper_status = 'healthy';
      
      // Count manual overrides
      const manualData = getManuallyModifiedFields();
      healthReport.manual_overrides = manualData.fields.length;
      
      // Check for data consistency
      const plates = [
        helper.plate,
        helper.meta?.plate,
        helper.vehicle?.plate_number,
        helper.car_details?.plate
      ].filter(Boolean);
      
      if (new Set(plates).size > 1) {
        healthReport.warnings.push('Multiple different plate numbers found in helper data');
        healthReport.recommendations.push('Standardize plate number storage location');
      }
      
    } else {
      healthReport.helper_status = 'error';
      healthReport.warnings.push('Helper object is not properly initialized');
    }
    
    // Check sessionStorage
    try {
      const storedHelper = sessionStorage.getItem('helper');
      if (storedHelper) {
        const parsed = JSON.parse(storedHelper);
        healthReport.session_storage = 'healthy';
      } else {
        healthReport.session_storage = 'empty';
        healthReport.warnings.push('No helper data found in sessionStorage');
      }
    } catch (error) {
      healthReport.session_storage = 'error';
      healthReport.warnings.push('SessionStorage contains invalid helper JSON');
    }
    
    // Check module integration
    if (typeof window.refreshAllModuleForms === 'function') {
      healthReport.module_integration = 'available';
    } else {
      healthReport.module_integration = 'missing';
      healthReport.warnings.push('Module auto-population function not available');
    }
    
    // Check broadcasting capability
    if (typeof broadcastHelperUpdate === 'function') {
      healthReport.broadcasting = 'available';
    } else {
      healthReport.broadcasting = 'missing';
      healthReport.warnings.push('Helper broadcasting system not available');
    }
    
    // Performance recommendations
    if (healthReport.manual_overrides === 0) {
      healthReport.recommendations.push('No manual overrides detected - system ready for automatic updates');
    } else if (healthReport.manual_overrides > 10) {
      healthReport.recommendations.push('High number of manual overrides - consider reviewing data flow');
    }
    
  } catch (error) {
    healthReport.helper_status = 'error';
    healthReport.warnings.push(`System health check failed: ${error.message}`);
  }
  
  console.log('🔍 System Health Report:', healthReport);
  return healthReport;
}

/**
 * Performance monitoring for helper operations
 */
export function monitorHelperPerformance() {
  const performanceData = {
    helper_size: 0,
    sessionStorage_size: 0,
    last_update: null,
    update_frequency: 0
  };
  
  try {
    // Calculate helper size
    performanceData.helper_size = new Blob([JSON.stringify(helper)]).size;
    
    // Calculate sessionStorage usage
    const helperString = sessionStorage.getItem('helper');
    if (helperString) {
      performanceData.sessionStorage_size = new Blob([helperString]).size;
    }
    
    // Get last update time
    performanceData.last_update = helper.last_updated || null;
    
    console.log('📊 Helper Performance Metrics:', performanceData);
    
    // Performance warnings
    if (performanceData.helper_size > 1000000) { // 1MB
      console.warn('⚠️ Helper object is very large (>1MB). Consider data cleanup.');
    }
    
    if (performanceData.sessionStorage_size > 5000000) { // 5MB
      console.warn('⚠️ SessionStorage usage is high (>5MB). Consider data optimization.');
    }
    
    return performanceData;
    
  } catch (error) {
    console.error('❌ Error monitoring helper performance:', error);
    return performanceData;
  }
}

// Make system monitoring functions globally available
window.runSystemHealthCheck = runSystemHealthCheck;
window.monitorHelperPerformance = monitorHelperPerformance;
