// 🧠 Centralized Helper System - Single Source of Truth
// Handles ALL data flow: Make.com, manual inputs, internal browsers, damage centers, parts search, invoices

import { calculate, MathEngine } from './math.js';
import { securityManager } from './security-manager.js';
import { errorHandler } from './error-handler.js';
import { 
  standardizeHelperData, 
  convertToLegacyFormat, 
  updateHelperWithStandardizedData,
  UNIFIED_SCHEMAS,
  DataFlowStandardizer
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
    // Prevent recursion
    if (isUpdatingHelper) {
      console.warn('🔄 updateHelper: Recursion detected, skipping update to prevent infinite loop');
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
          foundCarData[lowerKey] = decodeURIComponent(allParams[key]);
        }
      });
      
      if (Object.keys(foundCarData).length > 0) {
        console.log('🚗 Car data detected in URL:', foundCarData);
        
        // Update helper with URL data
        updateHelper('car_details', foundCarData);
        updateHelper('vehicle', foundCarData);
        
        if (foundCarData.plate) {
          updateHelper('meta', { plate: foundCarData.plate });
        }
        
        console.log('✅ Helper updated with URL car data');
        
        // Show notification
        
        // Clear URL parameters to prevent re-processing
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
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
  // Handle car data from Make.com, manual input, or internal browsers
  if (!helper.vehicle) helper.vehicle = {};
  if (!helper.meta) helper.meta = {};
  if (!helper.stakeholders) helper.stakeholders = { owner: {} };
  if (!helper.car_details) helper.car_details = {};
  
  // Meta information (essential for floating screens)
  if (data.plate) helper.meta.plate = data.plate;
  if (data.location) helper.meta.location = data.location;
  if (data.date) helper.meta.damage_date = data.date;
  
  // Vehicle details according to unified schema
  if (data.plate) helper.vehicle.plate_number = data.plate;
  if (data.manufacturer) helper.vehicle.manufacturer = data.manufacturer;
  if (data.model) helper.vehicle.model = data.model;
  if (data.year) helper.vehicle.year = data.year;
  if (data.chassis) helper.vehicle.chassis = data.chassis;
  if (data.km) helper.vehicle.km = data.km;
  if (data.engine_volume) helper.vehicle.engine_volume = data.engine_volume;
  if (data.fuel_type) helper.vehicle.fuel_type = data.fuel_type;
  if (data.ownership_type) helper.vehicle.ownership_type = data.ownership_type;
  
  // Owner information
  if (data.owner) helper.stakeholders.owner.name = data.owner;
  
  // Preserve legacy structure for backward compatibility
  mergeDeep(helper.car_details, data);
  
  console.log('🚗 processCarDetailsData: Updated helper with:', {
    meta: helper.meta,
    vehicle: helper.vehicle,
    owner: helper.stakeholders.owner.name
  });
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
