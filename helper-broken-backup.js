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
import { 
  processIncomingDataWithMapping, 
  setNestedValue, 
  getNestedValue,
  HEBREW_TO_ENGLISH,
  MAKECOM_TO_HELPER 
} from './field-mapping-dictionary.js';


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

export const helper = window.helper || {};

export function updateHelperAndSession(key, value) {
  helper[key] = value;
  try {
    const toStore = typeof value === 'object' ? JSON.stringify(value) : value;
    sessionStorage.setItem(key, toStore);
  } catch (e) {
    console.error('Failed to store in sessionStorage:', e);
  }
}

export function initializeHelperFromSession(keys) {
  keys.forEach(key => {
    let val = sessionStorage.getItem(key);
    if (val !== null) {
      try {
        helper[key] = JSON.parse(val);
      } catch {
        helper[key] = val;
      }
    }
  });
}

// --- FIX: Ensure only one helper object is exported and used globally ---
const _globalHelper = window.helper || {
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
    plate: '', // CRITICAL FIX: Changed from plate_number to plate for unified schema alignment
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

// --- FIX: Relax sanitization for Hebrew/numeric fields ---
function sanitizeHelperData(data) {
  if (!data || typeof data !== 'object') return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'string') {
      // Only strip script tags and dangerous JS, but do NOT alter encoding or numeric/Hebrew chars
      sanitized[key] = value
        .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags, do not re-encode or decode
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=\s*['"]/gi, '');
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
    
    // Security validation with graceful data queuing (Codex recommendation)
    if (!securityManager.validateSession()) {
      console.log('⏸️ Session invalid - applying update locally and queuing for later');

      // Queue data so it can be re-sent once session is restored
      try {
        const queue = JSON.parse(localStorage.getItem('pendingHelperUpdates') || '[]');
        queue.push({
          timestamp: Date.now(),
          section,
          data,
          sourceModule
        });
        localStorage.setItem('pendingHelperUpdates', JSON.stringify(queue));
        console.log(`📥 Data queued (${queue.length} items pending)`);
      } catch (e) {
        console.error('Failed to queue data:', e);
      }

      errorHandler.createError('authentication', 'medium', 'Session expired - data queued');
      // ⚠️ Do not return – continue updating helper locally so data isn't lost
    }

    // Input sanitization
    const sanitizedData = sanitizeHelperData(data);
    
    // --- FIX: Initialize section as correct type ---
    if (!helper[section]) {
      if (Array.isArray(sanitizedData)) {
        helper[section] = [];
      } else if (typeof sanitizedData === 'object') {
        helper[section] = {};
      } else {
        helper[section] = sanitizedData;
      }
    }

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
    
    // --- FIX: Always save to sessionStorage after updates ---
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
    // HIDDEN DEBUG: Track save operation
    console.log('🐛 DEBUG saveHelperToStorage:', {
      timestamp: new Date().toISOString(),
      helperKeys: Object.keys(helper),
      vehicleData: helper.vehicle,
      metaData: helper.meta,
      stakeholdersData: helper.stakeholders
    });
    
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
    
    // PRIMARY: Save to sessionStorage
    sessionStorage.setItem('helper', dataString);
    
    // BACKUP: Save to localStorage with multiple keys for debugging
    localStorage.setItem('helper_data', dataString);
    localStorage.setItem('helper_backup', dataString);
    localStorage.setItem('helper_timestamp', new Date().toISOString());
    
    // DEBUG: Store simplified version for inspection
    const debugData = {
      plate: sanitizedHelper.meta?.plate || sanitizedHelper.vehicle?.plate,
      manufacturer: sanitizedHelper.vehicle?.manufacturer,
      model: sanitizedHelper.vehicle?.model,
      owner: sanitizedHelper.stakeholders?.owner?.name,
      lastUpdated: new Date().toISOString(),
      sectionsPresent: Object.keys(sanitizedHelper)
    };
    localStorage.setItem('helper_debug', JSON.stringify(debugData, null, 2));
    
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
    checkForIncomingData().catch(console.error);
    
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
      
      // CRITICAL: Make the module helper THE global helper
      window.helper = helper;
      console.log('✅ Empty helper initialized, saved, and set as global window.helper');
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
    
    // CRITICAL: Make the module helper THE global helper (Codex recommendation)
    window.helper = helper;
    console.log('✅ Module helper set as global window.helper');
    
    // Apply any queued updates from when session was invalid
    applyQueuedUpdates();
    
    return true;
    
  } catch (error) {
    console.error('Failed to load helper data:', error);
    errorHandler.createError('data', 'high', 'Failed to load helper data from storage', {
      originalError: error.message
    });
    return false;
  }
}

// ============================================================================
// QUEUED DATA MANAGEMENT (Codex recommendation for graceful session handling)
// ============================================================================

function applyQueuedUpdates() {
  try {
    const queue = JSON.parse(localStorage.getItem('pendingHelperUpdates') || '[]');
    
    if (queue.length === 0) {
      return;
    }
    
    console.log(`📥 Applying ${queue.length} queued updates...`);
    
    // Sort by timestamp to maintain order
    queue.sort((a, b) => a.timestamp - b.timestamp);
    
    // Apply each update
    let applied = 0;
    queue.forEach((item, index) => {
      try {
        console.log(`📝 Applying queued update ${index + 1}/${queue.length}: ${item.section}`);
        
        // Call updateHelper directly without re-checking session
        // We're already authenticated if we got here
        const currentValidation = securityManager.validateSession;
        securityManager.validateSession = () => true; // Temporarily bypass
        
        updateHelper(item.section, item.data, item.sourceModule || 'queued_update');
        
        securityManager.validateSession = currentValidation; // Restore
        applied++;
      } catch (e) {
        console.error(`Failed to apply queued update ${index}:`, e);
      }
    });
    
    // Clear the queue after processing
    localStorage.removeItem('pendingHelperUpdates');
    console.log(`✅ Applied ${applied}/${queue.length} queued updates`);
    
    // Broadcast that queued data was applied
    broadcastHelperUpdate(['queued_data'], 'queue_application');
    
  } catch (error) {
    console.error('Failed to apply queued updates:', error);
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
export async function checkForIncomingData() {
  console.log('🔍 Checking for incoming data from external sources...');
  
  // HIDDEN DEBUG: Track actual data flow
  const debugData = {
    timestamp: new Date().toISOString(),
    sessionStorageKeys: Object.keys(sessionStorage),
    helperExists: !!sessionStorage.getItem('helper'),
    makeCarDataExists: !!sessionStorage.getItem('makeCarData'),
    carDataExists: !!sessionStorage.getItem('carData')
  };
  console.log('🐛 DEBUG checkForIncomingData:', debugData);
  
  try {
    // CRITICAL: First check if we have Make.com response data
    const makeCarData = sessionStorage.getItem('makeCarData');
    if (makeCarData) {
      console.log('🎯 Found Make.com car data in sessionStorage!');
      try {
        const carData = JSON.parse(makeCarData);
        console.log('📊 Make.com data:', carData);
        
        // HIDDEN DEBUG: Track data processing flow
        console.log('🐛 DEBUG Processing makeCarData:', {
          dataKeys: Object.keys(carData),
          plate: carData.plate,
          manufacturer: carData.manufacturer,
          model: carData.model
        });
        
        // Process this data immediately
        const result = await processIncomingData(carData, 'makeCarData');
        console.log('🐛 DEBUG processIncomingData result:', result);
        
        if (result && result.success) {
          console.log('✅ Make.com data processed successfully');
          
          // Clear the makeCarData after processing to avoid reprocessing
          sessionStorage.removeItem('makeCarData');
          
          // HIDDEN DEBUG: Check helper after processing
          console.log('🐛 DEBUG Helper after makeCarData processing:', {
            helperVehicle: helper.vehicle,
            helperMeta: helper.meta,
            helperStakeholders: helper.stakeholders
          });
          
          // Force refresh all forms
          setTimeout(() => {
            if (typeof window.refreshAllModuleForms === 'function') {
              console.log('🐛 DEBUG Calling refreshAllModuleForms after makeCarData');
              window.refreshAllModuleForms();
            }
          }, 100);
          
          return true;
        }
      } catch (error) {
        console.error('Error processing makeCarData:', error);
      }
    }
    
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


window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Helper system initializing on DOMContentLoaded...');
  loadHelperFromStorage();
  
  // CRITICAL: Check for incoming data after loading
  setTimeout(() => {
    console.log('🔍 Checking for incoming data after DOM load...');
    checkForIncomingData().catch(console.error);
  }, 100);
});

// Make updateCalculations globally available
window.updateCalculations = updateCalculations;

// Make data checking function globally available for testing
window.checkForIncomingData = checkForIncomingData;


// ============================================================================
// HEBREW TEXT PARSING FUNCTION
// ============================================================================
function parseHebrewTextToObject(text) {
  console.log('🔤 Parsing Hebrew text with ENHANCED field mapping dictionary...');
  console.log('📝 Raw text received:', text);
  
  const result = {};
  
  // Split by lines and parse each field
  const lines = text.split('\n').filter(line => line.trim());
  
  console.log(`📋 Processing ${lines.length} lines of Hebrew text`);
  
  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    // Try different separators
    let parts = [];
    if (line.includes(':')) {
      parts = line.split(':');
    } else if (line.includes('：')) {
      parts = line.split('：'); // Full-width colon
    } else if (line.includes('-')) {
      parts = line.split('-');
    } else if (line.includes('–')) {
      parts = line.split('–'); // En dash
    }
    
    if (parts.length >= 2) {
      const hebrewKey = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      
      // Skip if value is empty
      if (!value) return;
      
      // ENHANCED: Use the centralized field mapping dictionary
      const englishKey = HEBREW_TO_ENGLISH[hebrewKey];
      if (englishKey) {
        // Don't override if we already have a value for this key
        if (!result[englishKey] || result[englishKey] === '-') {
          result[englishKey] = value;
          console.log(`  ✅ Line ${index + 1}: ${hebrewKey} → ${englishKey}: "${value}"`);
        }
      } else if (value) {
        // Store with Hebrew key if no mapping found in dictionary
        result[hebrewKey] = value;
        console.log(`  ⚠️ Line ${index + 1}: ${hebrewKey}: "${value}" (add to HEBREW_TO_ENGLISH dictionary)`);
      }
    } else if (line.trim()) {
      console.log(`  ❓ Line ${index + 1}: Could not parse: "${line}"`);
    }
  });
  
  // Post-processing: Clean up and validate data
  
  // Extract year from production date if needed
  if (result.year && result.year.includes('/')) {
    const yearParts = result.year.split('/');
    result.year = yearParts[yearParts.length - 1].trim();
    console.log(`  📅 Extracted year from date: ${result.year}`);
  }
  
  // Clean up year to ensure it's 4 digits
  if (result.year && result.year.length === 2) {
    result.year = '20' + result.year;
  }
  
  // Handle special case where first line might be "פרטי רכב: [plate]"
  if (!result.plate && lines[0] && lines[0].includes('פרטי רכב')) {
    const firstLineParts = lines[0].split(':');
    if (firstLineParts.length >= 2) {
      result.plate = firstLineParts[1].trim();
      console.log(`  🚗 Extracted plate from first line: ${result.plate}`);
    }
  }
  
  // Remove any dashes used as empty values
  Object.keys(result).forEach(key => {
    if (result[key] === '-' || result[key] === '–') {
      delete result[key];
    }
  });
  
  console.log('✅ Final parsed Hebrew data:', result);
  console.log(`📊 Total fields parsed: ${Object.keys(result).length}`);
  
  return result;
}

// ============================================================================
// DATA PROCESSING FUNCTIONS FOR DIFFERENT MODULES
// ============================================================================

function processCarDetailsData(data, sourceModule) {
  console.log('🔧 processCarDetailsData: Starting with ENHANCED field mapping system');
  console.log('🔧 Raw incoming data:', data);
  console.log('🔧 Source module:', sourceModule);
  
  // Initialize helper sections if they don't exist
  if (!helper.vehicle) helper.vehicle = {};
  if (!helper.meta) helper.meta = {};
  if (!helper.stakeholders) helper.stakeholders = { owner: {}, garage: {}, insurance: { agent: {} } };
  if (!helper.car_details) helper.car_details = {};
  if (!helper.case_info) helper.case_info = {};
  if (!helper.valuation) helper.valuation = {};
  
  // CRITICAL FIX: Use the new field mapping system
  const mappedData = processIncomingDataWithMapping(data, sourceModule);
  console.log('🗺️ Data after field mapping:', mappedData);
  
  // Apply mapped data to helper structure
  Object.entries(mappedData).forEach(([section, sectionData]) => {
    if (typeof sectionData === 'object' && sectionData !== null) {
      // Merge section data into helper
      if (!helper[section]) helper[section] = {};
      Object.assign(helper[section], sectionData);
      console.log(`  ✅ Updated helper.${section}:`, sectionData);
    } else {
      // Direct field assignment
      if (section === 'plate') {
        // CRITICAL: Ensure plate is stored in all required locations for backward compatibility
        helper.meta.plate = sectionData;
        helper.vehicle.plate = sectionData;
        helper.car_details.plate = sectionData;
        console.log(`  🔧 PLATE mapped to all locations: ${sectionData}`);
      }
    }
  });
  
  // CRITICAL FIX: Remove the old plate_number field to prevent confusion
  if (helper.vehicle.plate_number) {
    delete helper.vehicle.plate_number;
    console.log('  🧹 Cleaned up legacy plate_number field');
  }
  
  // CRITICAL: Maintain backward compatibility by duplicating key data to car_details
  if (helper.vehicle) {
    const vehicleFields = ['plate', 'manufacturer', 'model', 'year', 'chassis', 'km', 'trim', 'model_type', 'ownership_type'];
    vehicleFields.forEach(field => {
      if (helper.vehicle[field]) {
        helper.car_details[field] = helper.vehicle[field];
      }
    });
    console.log('  🔄 Synced vehicle data to car_details for backward compatibility');
  }
  
  // CRITICAL: Clean year format if needed  
  if (helper.vehicle.year && helper.vehicle.year.includes('/')) {
    const yearParts = helper.vehicle.year.split('/');
    helper.vehicle.year = yearParts[yearParts.length - 1].trim();
    helper.car_details.year = helper.vehicle.year;
    console.log(`  📅 Cleaned year format: ${helper.vehicle.year}`);
  }
  
  // CRITICAL: Update legacy sessionStorage for floating popup compatibility
  if (helper.vehicle.plate) {
    const legacyCarData = {
      plate: helper.vehicle.plate,
      manufacturer: helper.vehicle.manufacturer || '',
      model: helper.vehicle.model || '',
      year: helper.vehicle.year || '',
      owner: helper.stakeholders?.owner?.name || '',
      location: helper.case_info?.inspection_location || '',
      ...data // Include original data for compatibility
    };
    sessionStorage.setItem('carData', JSON.stringify(legacyCarData));
    console.log('  💾 Updated legacy carData in sessionStorage');
  }
  
  // Update window.currentCaseData for floating screens compatibility
  window.currentCaseData = {
    meta: helper.meta,
    vehicle: helper.vehicle,
    car_details: helper.car_details,
    stakeholders: helper.stakeholders
  };
  
  console.log('✅ processCarDetailsData completed with ENHANCED field mapping');
}

function processStakeholderData(section, data, sourceModule) {
  if (!helper.stakeholders) helper.stakeholders = { owner: {}, garage: {}, insurance: { agent: {} } };
  
  if (section === 'garage' || data.garageName || data.garagePhone) {  // --- ADD: Always save after update ---
    helper.stakeholders.garage.name = data.garageName || data.name || helper.stakeholders.garage.name;
    helper.stakeholders.garage.phone = data.garagePhone || data.phone || helper.stakeholders.garage.phone;
    helper.stakeholders.garage.email = data.garageEmail || data.email || helper.stakeholders.garage.email;
  } Patch processStakeholderData to always save after update
  ection, data, sourceModule) {
  if (section === 'insurance' || data.insuranceCompany || data.agentName) {= { owner: {}, garage: {}, insurance: { agent: {} } };
    helper.stakeholders.insurance.company = data.insuranceCompany || data.company || helper.stakeholders.insurance.company;
    helper.stakeholders.insurance.email = data.insuranceEmail || data.email || helper.stakeholders.insurance.email;f (section === 'garage' || data.garageName || data.garagePhone) {
    helper.stakeholders.insurance.agent.name = data.agentName || data.agent_name || helper.stakeholders.insurance.agent.name;  helper.stakeholders.garage.name = data.garageName || data.name || helper.stakeholders.garage.name;
    helper.stakeholders.insurance.agent.phone = data.insurance_agent_phone || data.agent_phone || helper.stakeholders.insurance.agent.phone;age.phone = data.garagePhone || data.phone || helper.stakeholders.garage.phone;
    helper.stakeholders.insurance.agent.email = data.insurance_agent_email || data.agent_email || helper.stakeholders.insurance.agent.email;l || data.email || helper.stakeholders.garage.email;
  }
  
  if (section === 'client' || data.ownerPhone || data.ownerAddress) {if (section === 'insurance' || data.insuranceCompany || data.agentName) {
    helper.stakeholders.owner.phone = data.ownerPhone || data.phone || helper.stakeholders.owner.phone;.insurance.company = data.insuranceCompany || data.company || helper.stakeholders.insurance.company;
    helper.stakeholders.owner.address = data.ownerAddress || data.address || helper.stakeholders.owner.address;.insuranceEmail || data.email || helper.stakeholders.insurance.email;
    if (data.damageDate) helper.case_info.damage_date = data.damageDate;a.agentName || data.agent_name || helper.stakeholders.insurance.agent.name;
  } helper.stakeholders.insurance.agent.phone = data.insurance_agent_phone || data.agent_phone || helper.stakeholders.insurance.agent.phone;
}  helper.stakeholders.insurance.agent.email = data.insurance_agent_email || data.agent_email || helper.stakeholders.insurance.agent.email;

function processDamageData(section, data, sourceModule) {
  if (!helper.damage_assessment) helper.damage_assessment = { summary: {}, centers: [] };nerAddress) {
   helper.stakeholders.owner.phone = data.ownerPhone || data.phone || helper.stakeholders.owner.phone;
  if (section === 'damage_centers' || section === 'expertise') {  helper.stakeholders.owner.address = data.ownerAddress || data.address || helper.stakeholders.owner.address;
    if (Array.isArray(data)) { helper.case_info.damage_date = data.damageDate;
      helper.damage_assessment.centers = data;
    } else if (data.centers) {
      helper.damage_assessment.centers = data.centers;/ --- ADD: Always save after update ---
    } else if (data.damage_blocks) {saveHelperToStorage();
      helper.damage_assessment.centers = data.damage_blocks;
    }
  }ways save after update
  data, sourceModule) {
  // Preserve legacy expertise structuref (!helper.damage_assessment) helper.damage_assessment = { summary: {}, centers: [] };
  if (!helper.expertise) helper.expertise = {};
  mergeDeep(helper.expertise, data);damage_centers' || section === 'expertise') {
}
ata;
function processValuationData(section, data, sourceModule) { } else if (data.centers) {
  if (!helper.valuation) helper.valuation = { adjustments: {}, calculations: {} };    helper.damage_assessment.centers = data.centers;
  .damage_blocks) {
  if (section === 'levisummary' || section === 'levi_report') { = data.damage_blocks;
    // Handle Levi OCR data according to specifications
    if (data.base_price) helper.valuation.base_price = parseFloat(data.base_price) || 0;
    if (data.final_price) helper.valuation.final_price = parseFloat(data.final_price) || 0;
    ructure
    // Process adjustments according to unified schemaper.expertise = {};
    if (data.adjustments) {
      Object.keys(data.adjustments).forEach(key => {
        if (!helper.valuation.adjustments[key]) helper.valuation.adjustments[key] = {};
        Object.assign(helper.valuation.adjustments[key], data.adjustments[key]);aveHelperToStorage();
      });
    }
  }r update
}rceModule) {
;
function processPartsData(section, data, sourceModule) {
  if (!helper.parts_search) helper.parts_search = { search_history: [], all_results: [], results: [], summary: {} };f (section === 'levisummary' || section === 'levi_report') {
    // Handle Levi OCR data according to specifications
  if (Array.isArray(data)) { helper.valuation.base_price = parseFloat(data.base_price) || 0;
    // Add to all_results and mark as selected/unselected = parseFloat(data.final_price) || 0;
    data.forEach(part => {
      const partEntry = {ma
        ...part, if (data.adjustments) {
        search_timestamp: new Date().toISOString(),    Object.keys(data.adjustments).forEach(key => {
        source_module: sourceModule,ion.adjustments[key]) helper.valuation.adjustments[key] = {};
        selected: part.selected !== false // Default to selected unless explicitly falseata.adjustments[key]);
      };
      helper.parts_search.all_results.push(partEntry);
      
      if (partEntry.selected) {
        helper.parts_search.results.push(partEntry); update ---
      });
    });
  } else if (data.results) {
    processPartsData('parts_search', data.results, sourceModule);pdate
  }ction processPartsData(section, data, sourceModule) {
  if (!helper.parts_search) helper.parts_search = { search_history: [], all_results: [], results: [], summary: {} };
  // Update summary
  helper.parts_search.summary.total_results = helper.parts_search.all_results.length;
  helper.parts_search.summary.selected_count = helper.parts_search.results.length; // Add to all_results and mark as selected/unselected
  helper.parts_search.summary.last_search = new Date().toISOString();  data.forEach(part => {
}

function processInvoiceData(data, sourceModule) {
  if (!helper.documents) helper.documents = { invoices: [] };     source_module: sourceModule,
  if (!helper.financials) helper.financials = { costs: {} };      selected: part.selected !== false // Default to selected unless explicitly false
  
  // Store invoice documentartEntry);
  helper.documents.invoices.push({
    ...data,
    processed_date: new Date().toISOString(),y);
    source_module: sourceModule
  }); });
  } else if (data.results) {
  // Extract financial data from invoicets_search', data.results, sourceModule);
  if (data.parts_total) helper.financials.costs.parts_total = parseFloat(data.parts_total) || 0;
  if (data.works_total) helper.financials.costs.works_total = parseFloat(data.works_total) || 0;
  if (data.repairs_total) helper.financials.costs.repairs_total = parseFloat(data.repairs_total) || 0;/ Update summary
  if (data.vat_amount) helper.financials.taxes.vat_amount = parseFloat(data.vat_amount) || 0;helper.parts_search.summary.total_results = helper.parts_search.all_results.length;
}mary.selected_count = helper.parts_search.results.length;
oISOString();
function processDocumentData(section, data, sourceModule) {
  if (!helper.documents) helper.documents = { images: [], invoices: [], reports: [], pdfs: [], other_files: [] };
   Patch processInvoiceData to always save after update
  if (section === 'images' && Array.isArray(data)) {sourceModule) {
    helper.documents.images.push(...data.map(img => ({r.documents = { invoices: [] };
      ...img,
      upload_date: new Date().toISOString(),
      source_module: sourceModule/ Store invoice document
    })));helper.documents.invoices.push({
  } else if (data.photo_count) {
    // Accumulative photo count
    helper.documents.photo_count = (helper.documents.photo_count || 0) + parseInt(data.photo_count);
  });
}
data from invoice
function processFinancialData(section, data, sourceModule) {parseFloat(data.parts_total) || 0;
  if (!helper.financials) helper.financials = { costs: {}, fees: {}, taxes: {}, totals: {} };rks_total = parseFloat(data.works_total) || 0;
  f (data.repairs_total) helper.financials.costs.repairs_total = parseFloat(data.repairs_total) || 0;
  if (section === 'fees') {if (data.vat_amount) helper.financials.taxes.vat_amount = parseFloat(data.vat_amount) || 0;
    Object.assign(helper.financials.fees, data);
  } else if (section === 'costs') {
    Object.assign(helper.financials.costs, data);
  } else {
    mergeDeep(helper.financials, data);
  }ays save after update
  
  // Recalculate totalsports: [], pdfs: [], other_files: [] };
  updateCalculations();
}if (section === 'images' && Array.isArray(data)) {
sh(...data.map(img => ({
// Flag to prevent legacy update recursion
let isUpdatingLegacyData = false;

function updateLegacyCarData() { })));
  // Prevent recursion} else if (data.photo_count) {
  if (isUpdatingLegacyData) {
    console.warn('🔄 updateLegacyCarData: Recursion detected, skipping legacy update');nt || 0) + parseInt(data.photo_count);
    return;
  }
  // --- ADD: Always save after update ---
  isUpdatingLegacyData = true;
  
  try {
    // Update legacy carData in sessionStorage for backward compatibilitya to always save after update
    const carData = { data, sourceModule) {
      plate: helper.vehicle?.plate_number || helper.vehicle?.plate || helper.car_details?.plate || '',: {}, fees: {}, taxes: {}, totals: {} };
      owner: helper.stakeholders?.owner?.name || helper.car_details?.owner || '',
      manufacturer: helper.vehicle?.manufacturer || helper.car_details?.manufacturer || '',if (section === 'fees') {
      model: helper.vehicle?.model || helper.car_details?.model || '',data);
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
    t isUpdatingLegacyData = false;
    // Reset internal flag after brief delay
    setTimeout(() => {() {
      if (window.dataDebugger) {
        window.dataDebugger._internalUpdate = false;{
      }Data: Recursion detected, skipping legacy update');
    }, 100);
    
  } finally {
    isUpdatingLegacyData = false;
  }
}
Data in sessionStorage for backward compatibility
// ============================================================================
// NEW: ENHANCED WEBHOOK INTEGRATION FUNCTIONSlate_number || helper.vehicle?.plate || helper.car_details?.plate || '',
// ============================================================================ders?.owner?.name || helper.car_details?.owner || '',
icle?.manufacturer || helper.car_details?.manufacturer || '',
/**| helper.car_details?.model || '',
 * Universal data processing function for webhook responseselper.vehicle?.year || helper.car_details?.year || '',
 * Automatically detects data type and routes to appropriate processorslocation: helper.stakeholders?.garage?.name || helper.car_details?.garageName || '',
 */damageDate || ''
export async function processIncomingData(data, webhookId = 'unknown') {
  console.log('🔄 processIncomingData: Processing data from webhook:', webhookId); 
  console.log('📥 RAW WEBHOOK DATA:', JSON.stringify(data, null, 2));  // Add internal flag to prevent monitor from processing this
  console.log('📊 Current helper BEFORE processing:', JSON.parse(JSON.stringify(helper)));
     
  try {    // Temporarily mark as internal update
    const result = {
      success: true,
      updatedSections: [],  }
      warnings: [],
      timestamp: new Date().toISOString(),
      webhookId: webhookId
    };
     setTimeout(() => {
    // ENHANCED: Always try to store any incoming data, even if detection fails    if (window.dataDebugger) {
    if (data && typeof data === 'object') {
      console.log('💾 FORCE STORING: Attempting to store all incoming data regardless of type detection');
      
      // Try to extract any car-related data
      const potentialCarData = extractCarDataFromAnyFormat(data);
      if (potentialCarData && Object.keys(potentialCarData).length > 0) {
        console.log('🚗 Extracted potential car data:', potentialCarData);
        processCarDetailsData(potentialCarData, `webhook_${webhookId}_forced`);
        result.updatedSections.push('vehicle', 'meta', 'stakeholders');
      }
      
      // Store raw data for debugging=======
      updateHelper('raw_webhook_data', {
        [`${webhookId}_${Date.now()}`]: data**
      }, 'webhook_storage'); * Universal data processing function for webhook responses
      result.updatedSections.push('raw_webhook_data');ate processors
    }
    port async function processIncomingData(data, webhookId = 'unknown') {
    // CRITICAL: Check if data contains Hebrew text in Body fieldook:', webhookId);
    if (data && data.Body && typeof data.Body === 'string' && data.Body.includes('מס\' רכב')) {DATA:', JSON.stringify(data, null, 2));
      console.log('📥 Detected Hebrew car data in Body field');sing:', JSON.parse(JSON.stringify(helper)));
      const parsedData = parseHebrewTextToObject(data.Body);
      processCarDetailsData(parsedData, `webhook_${webhookId}`);
      result.updatedSections.push('vehicle', 'meta', 'stakeholders');
      console.log('✅ Processed Hebrew car data from Body');
    } updatedSections: [],
    // Check for array format with Body field   warnings: [],
    else if (Array.isArray(data) && data[0] && data[0].Body && typeof data[0].Body === 'string') {    timestamp: new Date().toISOString(),
      console.log('📥 Detected array format with Body field');
      const parsedData = parseHebrewTextToObject(data[0].Body);
      processCarDetailsData(parsedData, `webhook_${webhookId}`);
      result.updatedSections.push('vehicle', 'meta', 'stakeholders');   // ENHANCED: Always try to store any incoming data, even if detection fails
      console.log('✅ Processed Hebrew car data from array Body');    if (data && typeof data === 'object') {
    } incoming data regardless of type detection');
    // Standard car data detection - ENHANCED to handle any object with car-like fields
    else if (data && typeof data === 'object' && (isCarData(data) || data.plate || data.owner)) {    // Try to extract any car-related data
      console.log('📥 Detected direct car data object'););
      processCarDetailsData(data, `webhook_${webhookId}`);ata).length > 0) {
      result.updatedSections.push('vehicle', 'meta', 'stakeholders');
      console.log('✅ Processed car data');
    }    result.updatedSections.push('vehicle', 'meta', 'stakeholders');
    
    if (isStakeholderData(data)) {
      const stakeholderType = detectStakeholderType(data);
      processStakeholderData(stakeholderType, data, `webhook_${webhookId}`);
      result.updatedSections.push('stakeholders');
      console.log('✅ Processed stakeholder data:', stakeholderType);
    }
      }
    if (isLeviData(data)) {
      processValuationData('levi_report', data, `webhook_${webhookId}`);dy field
      result.updatedSections.push('valuation', 'levisummary');&& typeof data.Body === 'string' && data.Body.includes('מס\' רכב')) {
      console.log('✅ Processed Levi valuation data');ected Hebrew car data in Body field');
    }edData = parseHebrewTextToObject(data.Body);
    webhookId}`);
    if (isPartsData(data)) {ehicle', 'meta', 'stakeholders');
      processPartsData('parts_search', data, `webhook_${webhookId}`);
      result.updatedSections.push('parts_search');
      console.log('✅ Processed parts search data');
    }se if (Array.isArray(data) && data[0] && data[0].Body && typeof data[0].Body === 'string') {
    array format with Body field');
    if (isInvoiceData(data)) {a[0].Body);
      processInvoiceData(data, `webhook_${webhookId}`);rocessCarDetailsData(parsedData, `webhook_${webhookId}`);
      result.updatedSections.push('documents', 'financials');esult.updatedSections.push('vehicle', 'meta', 'stakeholders');
      console.log('✅ Processed invoice data');ed Hebrew car data from array Body');
    }
     // Standard car data detection - ENHANCED to handle any object with car-like fields
    if (isDamageData(data)) {  else if (data && typeof data === 'object' && (isCarData(data) || data.plate || data.owner)) {
      processDamageData('damage_centers', data, `webhook_${webhookId}`);📥 Detected direct car data object');
      result.updatedSections.push('damage_assessment', 'expertise');
      console.log('✅ Processed damage assessment data');
    }
       }
    if (isDocumentData(data)) {    
      processDocumentData('images', data, `webhook_${webhookId}`);
      result.updatedSections.push('documents');
      console.log('✅ Processed document data');_${webhookId}`);
    }    result.updatedSections.push('stakeholders');
    sed stakeholder data:', stakeholderType);
    // Save updated helper to storage
    saveHelperToStorage();
    
    // Update legacy data for backward compatibilityi_report', data, `webhook_${webhookId}`);
    updateLegacyCarData(); result.updatedSections.push('valuation', 'levisummary');
        console.log('✅ Processed Levi valuation data');
    console.log('📊 Current helper AFTER processing:', JSON.parse(JSON.stringify(helper)));
    console.log('✅ processIncomingData: Successfully processed all data types');
    return result;
    
  } catch (error) {
    console.error('❌ processIncomingData: Error processing data:', error);     console.log('✅ Processed parts search data');
    throw error;    }
  }
}
    processInvoiceData(data, `webhook_${webhookId}`);
/**ncials');
 * Broadcasting system to notify all modules and floating screens of helper updates
 */
export function broadcastHelperUpdate(updatedSections = [], source = 'unknown') {
  console.log('📡 Broadcasting helper update:', { updatedSections, source });
  cessDamageData('damage_centers', data, `webhook_${webhookId}`);
  try {h('damage_assessment', 'expertise');
    // Create custom event with helper datadamage assessment data');
    const updateEvent = new CustomEvent('helperUpdate', {
      detail: { 
        helper: helper,   if (isDocumentData(data)) {
        updatedSections: updatedSections,      processDocumentData('images', data, `webhook_${webhookId}`);
        source: source,
        timestamp: new Date().toISOString()
      }  }
    });
    
    // Dispatch to document
    document.dispatchEvent(updateEvent);
    ate legacy data for backward compatibility
    // Update all module forms if functions exist
    if (typeof window.refreshAllModuleForms === 'function') { 
      window.refreshAllModuleForms(helper);  console.log('📊 Current helper AFTER processing:', JSON.parse(JSON.stringify(helper)));
    }essIncomingData: Successfully processed all data types');
    
    // Trigger floating screen updates to show captured data   
    triggerFloatingScreenUpdates(updatedSections);  } catch (error) {
    Error processing data:', error);
    // Update builders if they exist
    updateBuildersFromHelper(updatedSections);  }
    
    console.log('✅ Helper update broadcasted successfully');
    
  } catch (error) {
    console.error('❌ Error broadcasting manual override:', error);
  }ort function broadcastHelperUpdate(updatedSections = [], source = 'unknown') {
}console.log('📡 Broadcasting helper update:', { updatedSections, source });

/**try {
 * Trigger floating screen displays based on data typeCreate custom event with helper data
 */
function triggerFloatingScreenUpdates(updatedSections) {
  console.log('📱 Triggering floating screen updates for sections:', updatedSections);
  
  // Car details floating screen
  if (updatedSections.includes('vehicle') || updatedSections.includes('meta')) {
    console.log('🚗 Auto-showing car details floating screen');
    
    // First refresh the data, then show the screen
    if (typeof window.refreshCarData === 'function') { Dispatch to document
      window.refreshCarData();document.dispatchEvent(updateEvent);
    }
    st
    if (typeof window.showCarDetails === 'function') {if (typeof window.refreshAllModuleForms === 'function') {
      setTimeout(() => window.showCarDetails(), 100);;
    } else if (typeof window.toggleCarDetails === 'function') {
      setTimeout(() => window.toggleCarDetails(), 100);
    }/ Trigger floating screen updates to show captured data
  }triggerFloatingScreenUpdates(updatedSections);
  
  // Levi floating screen// Update builders if they exist
  if (updatedSections.includes('valuation') || updatedSections.includes('levisummary')) {);
    console.log('📊 Auto-showing Levi report floating screen');
     broadcasted successfully');
    // First refresh the data, then show the screen
    if (typeof window.refreshLeviData === 'function') {ch (error) {
      window.refreshLeviData();error('❌ Error broadcasting manual override:', error);
    }
    
    if (typeof window.toggleLeviReport === 'function') {
      setTimeout(() => window.toggleLeviReport(), 100);
    }* Trigger floating screen displays based on data type
  } */
  
  // Parts floating screenpdates for sections:', updatedSections);
  if (updatedSections.includes('parts_search')) {
    console.log('🔧 Auto-showing parts search floating screen');  // Car details floating screen
    f (updatedSections.includes('vehicle') || updatedSections.includes('meta')) {
    // First refresh the data, then show the screenn');
    if (typeof window.refreshPartsResults === 'function') {
      window.refreshPartsResults(); // First refresh the data, then show the screen
    }
    
    if (typeof window.togglePartsSearch === 'function') {
      setTimeout(() => window.togglePartsSearch(), 100);
    }  if (typeof window.showCarDetails === 'function') {
  }etTimeout(() => window.showCarDetails(), 100);
  f window.toggleCarDetails === 'function') {
  // Invoice floating screen=> window.toggleCarDetails(), 100);
  if (updatedSections.includes('documents') || updatedSections.includes('financials')) {
    console.log('📄 Auto-showing invoice floating screen');
    
    // Check if invoice floating screen exists
    if (typeof window.toggleInvoiceDetails === 'function') {updatedSections.includes('valuation') || updatedSections.includes('levisummary')) {
      setTimeout(() => window.toggleInvoiceDetails(), 100);console.log('📊 Auto-showing Levi report floating screen');
    }
  }e screen
}
window.refreshLeviData();
/**
 * Update builders with latest helper data
 */
function updateBuildersFromHelper(updatedSections) {
  console.log('🏗️ Updating builders with helper data for sections:', updatedSections);
  
  // Update estimate builder if exists
  if (typeof window.updateEstimateBuilderFromHelper === 'function') {arts floating screen
    window.updateEstimateBuilderFromHelper(helper);_search')) {
  }earch floating screen');
  
  // Update expertise builder if existsa, then show the screen
  if (typeof window.updateExpertiseBuilderFromHelper === 'function') {n') {
    window.updateExpertiseBuilderFromHelper(helper); window.refreshPartsResults();
  }}
  
  // Update damage center wizard if exists
  if (typeof window.updateDamageCentersFromHelper === 'function') {
    window.updateDamageCentersFromHelper(helper);
  }
}

// ============================================================================(updatedSections.includes('documents') || updatedSections.includes('financials')) {
// DATA EXTRACTION AND TYPE DETECTION FUNCTIONSting screen');
// ============================================================================

/**
 * Enhanced data extraction that tries to find car data in any format
 */
function extractCarDataFromAnyFormat(data) {
  console.log('🔍 Attempting to extract car data from any format...');
  
  const extracted = {};
  
  // Handle different data structures
  if (Array.isArray(data)) {
    console.log('📋 Processing array data');helper data for sections:', updatedSections);
    data.forEach((item, index) => {
      const itemData = extractCarDataFromAnyFormat(item); Update estimate builder if exists
      Object.assign(extracted, itemData);BuilderFromHelper === 'function') {
    });
  } else if (data && typeof data === 'object') {
    // Check all possible field variations
    const fieldMappings = {
      // Plate number variations(typeof window.updateExpertiseBuilderFromHelper === 'function') {
      plate: ['plate', 'plateNumber', 'plate_number', 'מספר_רכב', 'מס_רכב', 'license_plate'],window.updateExpertiseBuilderFromHelper(helper);
      // Manufacturer variations  
      manufacturer: ['manufacturer', 'make', 'יצרן', 'שם_היצרן', 'חברה'],
      // Model variations
      model: ['model', 'דגם', 'שם_דגם', 'model_name'], 'function') {
      // Year variationsindow.updateDamageCentersFromHelper(helper);
      year: ['year', 'שנת_יצור', 'model_year', 'שנה'],
      // Owner variations
      owner: ['owner', 'owner_name', 'בעלים', 'שם_בעלים'],
      // KM variations=============================
      km: ['km', 'mileage', 'odo', 'קילומטראז', 'מספר_ק_מ'],
      // Chassis variations==========================================================================
      chassis: ['chassis', 'chassis_number', 'מספר_שילדה', 'שילדה']
    };
     in any format
    // Extract fields using all possible variations
    Object.keys(fieldMappings).forEach(standardField => {
      const variations = fieldMappings[standardField];sole.log('🔍 Attempting to extract car data from any format...');
      
      for (const variation of variations) {
        if (data[variation] !== undefined && data[variation] !== null && data[variation] !== '') {
          extracted[standardField] = data[variation];
          console.log(`✅ Found ${standardField}: ${data[variation]} (from field: ${variation})`);
          break; // Use first matchonsole.log('📋 Processing array data');
        }data.forEach((item, index) => {
      }arDataFromAnyFormat(item);
    });
    
    // Also check nested objects{
    Object.keys(data).forEach(key => {/ Check all possible field variations
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {const fieldMappings = {
        const nestedData = extractCarDataFromAnyFormat(data[key]);
        Object.assign(extracted, nestedData);ateNumber', 'plate_number', 'מספר_רכב', 'מס_רכב', 'license_plate'],
      }  // Manufacturer variations  
    }); 'שם_היצרן', 'חברה'],
    
    // Check for Hebrew text that might contain car data  model: ['model', 'דגם', 'שם_דגם', 'model_name'],
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && data[key].includes('מס\' רכב')) {
        console.log('📥 Found Hebrew text with car data, parsing...');iations
        try {  owner: ['owner', 'owner_name', 'בעלים', 'שם_בעלים'],
          const parsedData = parseHebrewTextToObject(data[key]);ons
          Object.assign(extracted, parsedData);
        } catch (e) { variations
          console.warn('Failed to parse Hebrew text:', e);   chassis: ['chassis', 'chassis_number', 'מספר_שילדה', 'שילדה']
        }   };
      }    
    }); // Extract fields using all possible variations
  }
     const variations = fieldMappings[standardField];
  console.log('🎯 Extracted car data:', extracted);
  return extracted;
}      if (data[variation] !== undefined && data[variation] !== null && data[variation] !== '') {
   extracted[standardField] = data[variation];
function isCarData(data) {eld}: ${data[variation]} (from field: ${variation})`);
  return !!(data.plate || data.manufacturer || data.model || data.owner || 
           data.car_details || data.vehicle_data || 
           data.יצרן || data.דגם || data.מספר_רכב || // Hebrew field names from Make.com
           (data.שם_היצרן && data.דגם)); // Alternative Hebrew field names
}

function isStakeholderData(data) {ect.keys(data).forEach(key => {
  return !!(data.garageName || data.garagePhone || data.garageEmail ||f (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
           data.insuranceCompany || data.agentName ||     const nestedData = extractCarDataFromAnyFormat(data[key]);
           data.ownerPhone || data.ownerAddress);cted, nestedData);
}
});
function isLeviData(data) {
  return !!(data.levi_report || data.levi_data || data.base_price || 
           data.final_price || data.adjustments || data.קוד_דגם ||
           data.מחיר_בסיס || data.מחיר_סופי_לרכב); if (typeof data[key] === 'string' && data[key].includes('מס\' רכב')) {
}    console.log('📥 Found Hebrew text with car data, parsing...');

function isPartsData(data) {ct(data[key]);
  return !!(data.parts_results || data.search_results ||       Object.assign(extracted, parsedData);
           Array.isArray(data.results) || data.part_name || data.parts);
} text:', e);
    }
function isInvoiceData(data) {
  return !!(data.invoice_number || data.invoice_data || data.מספר_חשבונית ||});
           data.garage_name || data.parts_total || data.works_total);
}
onsole.log('🎯 Extracted car data:', extracted);
function isDamageData(data) { return extracted;
  return !!(data.damage_centers || data.damage_blocks || data.expertise ||}
           data.centers || Array.isArray(data.damages));
}
eturn !!(data.plate || data.manufacturer || data.model || data.owner || 
function isDocumentData(data) {
  return !!(data.images || data.photo_count || data.uploaded_files ||om
           Array.isArray(data.files));         (data.שם_היצרן && data.דגם)); // Alternative Hebrew field names
}

function detectStakeholderType(data) {
  if (data.garageName || data.garagePhone || data.garageEmail) return 'garage';turn !!(data.garageName || data.garagePhone || data.garageEmail ||
  if (data.insuranceCompany || data.agentName) return 'insurance';|| 
  if (data.ownerPhone || data.ownerAddress) return 'client';
  return 'general';
}
tion isLeviData(data) {
// ============================================================================.base_price || 
// MANUAL INPUT OVERRIDE SYSTEMta.קוד_דגם ||
// ============================================================================

/**
 * Manual Input Override Systemction isPartsData(data) {
 * Ensures manual user input always takes precedence over automatic datareturn !!(data.parts_results || data.search_results || 
 * Tracks manual modifications and prevents automatic overridesdata.results) || data.part_name || data.parts);
 */

// Track which fields have been manually modifiedtion isInvoiceData(data) {
let manualOverrides = {a || data.מספר_חשבונית ||
  fields: new Set(), // Set of field keys that have been manually modified.works_total);
  timestamps: {}, // Timestamp of when each field was manually modified
  sources: {} // Source of manual modification (which module/page)
};tion isDamageData(data) {
 data.expertise ||
/**;
 * Mark a field as manually modified
 * This prevents automatic systems from overriding the user's input
 */nction isDocumentData(data) {
export function markFieldAsManuallyModified(fieldKey, value, source = 'unknown') { data.photo_count || data.uploaded_files ||
  try {
    console.log(`🔒 Manual override: ${fieldKey} = ${value} (source: ${source})`);
    
    // Add to manual overrides tracking
    manualOverrides.fields.add(fieldKey);il) return 'garage';
    manualOverrides.timestamps[fieldKey] = new Date().toISOString();.agentName) return 'insurance';
    manualOverrides.sources[fieldKey] = source;(data.ownerPhone || data.ownerAddress) return 'client';
    turn 'general';
    // Update the helper with manual value
    updateHelperField(fieldKey, value, 'manual_input');
    saveHelperToStorage();==========================================================================
    MANUAL INPUT OVERRIDE SYSTEM
    // Broadcast that this field is now manually controlled ============================================================================
    broadcastManualOverride(fieldKey, value, source);
    
    console.log(`✅ Field ${fieldKey} marked as manually modified`);
    nsures manual user input always takes precedence over automatic data
  } catch (error) {tomatic overrides
    console.error('❌ Error marking field as manually modified:', error);
  }
}ack which fields have been manually modified
 manualOverrides = {
/** fields: new Set(), // Set of field keys that have been manually modified
 * Check if a field has been manually modified  timestamps: {}, // Timestamp of when each field was manually modified
 * Returns true if field should not be automatically updatedources: {} // Source of manual modification (which module/page)
 */
export function isFieldManuallyModified(fieldKey) {
  return manualOverrides.fields.has(fieldKey);
}
 This prevents automatic systems from overriding the user's input
/**
 * Get all manually modified fields 'unknown') {
 */
export function getManuallyModifiedFields() { console.log(`🔒 Manual override: ${fieldKey} = ${value} (source: ${source})`);
  return {  
    fields: Array.from(manualOverrides.fields),
    timestamps: manualOverrides.timestamps,
    sources: manualOverrides.sources).toISOString();
  }; manualOverrides.sources[fieldKey] = source;
}  

/**
 * Clear manual override for a specific field
 * This allows automatic updates to resume for that field // Save manual overrides to sessionStorage for persistence
 */   sessionStorage.setItem('manualOverrides', JSON.stringify({
export function clearManualOverride(fieldKey) {      fields: Array.from(manualOverrides.fields),
  console.log(`🔓 Clearing manual override for field: ${fieldKey}`);
  
  manualOverrides.fields.delete(fieldKey);
  delete manualOverrides.timestamps[fieldKey];    
  delete manualOverrides.sources[fieldKey]; // Broadcast that this field is now manually controlled
  
  // Update sessionStorage 
  sessionStorage.setItem('manualOverrides', JSON.stringify({as manually modified`);
    fields: Array.from(manualOverrides.fields),
    timestamps: manualOverrides.timestamps,} catch (error) {
    sources: manualOverrides.sourcesror marking field as manually modified:', error);
  }));}
  
  console.log(`✅ Manual override cleared for ${fieldKey}`);
}
ly modified
/**ted
 * Reset all manual overrides
 * This allows all automatic updates to resumefunction isFieldManuallyModified(fieldKey) {
 */
export function resetAllManualOverrides() {
  console.log('🔄 Resetting all manual overrides');
  
  manualOverrides = {
    fields: new Set(),
    timestamps: {},
    sources: {}
  };
  errides.timestamps,
  sessionStorage.removeItem('manualOverrides');
  console.log('✅ All manual overrides reset');
}

/**
 * Load manual overrides from sessionStorage on page loadr a specific field
 */
export function loadManualOverrides() {
  try {rt function clearManualOverride(fieldKey) {
    const stored = sessionStorage.getItem('manualOverrides');d: ${fieldKey}`);
    if (stored) {
      const data = JSON.parse(stored);
      manualOverrides.fields = new Set(data.fields || []);te manualOverrides.timestamps[fieldKey];
      manualOverrides.timestamps = data.timestamps || {};
      manualOverrides.sources = data.sources || {};
      
      console.log(`📋 Loaded ${manualOverrides.fields.size} manual overrides from storage`);
    }des.fields),
  } catch (error) {tamps: manualOverrides.timestamps,
    console.error('❌ Error loading manual overrides:', error);rces: manualOverrides.sources
  }
}
 cleared for ${fieldKey}`);
/**
 * Broadcast manual override to other modules/screens
 */
function broadcastManualOverride(fieldKey, value, source) {
  try { allows all automatic updates to resume
    // Broadcast to floating screens
    if (typeof window.broadcastManualOverride === 'function') {rt function resetAllManualOverrides() {
      window.broadcastManualOverride(fieldKey, value, source);
    }
    
    // Trigger helper update broadcast
    broadcastHelperUpdate([getFieldSection(fieldKey)], 'manual_override');s: {},
    
  } catch (error) {
    console.error('❌ Error broadcasting manual override:', error);
  }
}.log('✅ All manual overrides reset');

/**
 * Basic helper field update function
 * Updates a specific field in the helper object structure Load manual overrides from sessionStorage on page load
 */
export function updateHelperField(fieldKey, value, source = 'unknown') {dManualOverrides() {
  try { try {
    console.log(`🔧 updateHelperField: Updating ${fieldKey} = ${value} (source: ${source})`);    const stored = sessionStorage.getItem('manualOverrides');
    
    // Get the section where this field belongs
    const section = getFieldSection(fieldKey);| []);
    
    if (!section) {
      console.warn(`⚠️ updateHelperField: No section mapping found for field ${fieldKey}`);     
      return false;      console.log(`📋 Loaded ${manualOverrides.fields.size} manual overrides from storage`);
    }
    
    // Ensure the section exists in helper error);
    if (!helper[section]) {
      helper[section] = {};
    }
    
    // Update the field in the appropriate section
    helper[section][fieldKey] = value;
    source) {
    // Also update legacy locations for backward compatibility try {
    if (['plate', 'manufacturer', 'model', 'year', 'km', 'chassis'].includes(fieldKey)) {    // Broadcast to floating screens
      if (!helper.car_details) helper.car_details = {};astManualOverride === 'function') {
      helper.car_details[fieldKey] = value;rce);
      if (fieldKey === 'plate') {
        if (!helper.vehicle) helper.vehicle = {};   
        helper.vehicle.plate_number = value;    // Trigger helper update broadcast
      }FieldSection(fieldKey)], 'manual_override');
    }
    
    // Always save after update   console.error('❌ Error broadcasting manual override:', error);
    saveHelperToStorage();  }
    
    console.log(`✅ updateHelperField: Successfully updated ${fieldKey} in ${section}`);
    return true;
    * Basic helper field update function
  } catch (error) { * Updates a specific field in the helper object structure
    console.error(`❌ updateHelperField: Error updating ${fieldKey}:`, error);
    return false;) {
  }
}   console.log(`🔧 updateHelperField: Updating ${fieldKey} = ${value} (source: ${source})`);
    
/**d belongs
 * Smart update helper field - respects manual overrides
 * Only updates field if it hasn't been manually modified
 */
export function updateHelperFieldSafe(fieldKey, value, source = 'automatic') {`⚠️ updateHelperField: No section mapping found for field ${fieldKey}`);
  // Check if field has been manually modified     return false;
  if (isFieldManuallyModified(fieldKey)) {    }
    console.log(`⏭️ Skipping automatic update for ${fieldKey} - manually modified by ${manualOverrides.sources[fieldKey]}`);
    return false; // Update was blockeds in helper
  }
        helper[section] = {};
  // Field is safe to update automatically }
  updateHelperField(fieldKey, value, source);
  console.log(`✅ Automatic update applied to ${fieldKey}`);
  return true; // Update was applied
} 
    // Also update legacy locations for backward compatibility
/**, 'km', 'chassis'].includes(fieldKey)) {
 * --- FIX: getFieldSection covers more field keys, including Hebrew ---etails) helper.car_details = {};
 */
function getFieldSection(fieldKey) {
  const sectionMap = {
    // Meta fields      helper.vehicle.plate_number = value;
    plate: 'meta',      }
    damageDate: 'meta', }
    location: 'meta',
    
    // Vehicle fields saveHelperToStorage();
    manufacturer: 'vehicle',
    model: 'vehicle',sole.log(`✅ updateHelperField: Successfully updated ${fieldKey} in ${section}`);
    year: 'vehicle',
    odo: 'vehicle',
    km: 'vehicle',
    chassis: 'vehicle',rror updating ${fieldKey}:`, error);
    model_code: 'vehicle',
    fuel_type: 'vehicle',
    engine_volume: 'vehicle',
    ownership_type: 'vehicle',
    market_value: 'vehicle',
    mart update helper field - respects manual overrides
    // Stakeholder fields
    owner: 'stakeholders',
    ownerPhone: 'stakeholders',alue, source = 'automatic') {
    ownerAddress: 'stakeholders',d
    garageName: 'stakeholders',)) {
    garagePhone: 'stakeholders',ole.log(`⏭️ Skipping automatic update for ${fieldKey} - manually modified by ${manualOverrides.sources[fieldKey]}`);
    garageEmail: 'stakeholders',return false; // Update was blocked
    agentName: 'stakeholders',
    insurance_agent_phone: 'stakeholders',
    insuranceCompany: 'stakeholders', Field is safe to update automatically
    
    // Car details (legacy compatibility)nsole.log(`✅ Automatic update applied to ${fieldKey}`);
    damageType: 'car_details',pdate was applied
    
    // Hebrew field keys (add more as needed)
    'מספר_רכב': 'meta',**
    'יצרן': 'vehicle', * Get the section name for a field key
    'דגם': 'vehicle',
    'שנת_יצור': 'vehicle',
    'בעלים': 'stakeholders',
    'שם_בעלים': 'stakeholders', // Meta fields
    'קילומטראז': 'vehicle',
    'מספר_שילדה': 'vehicle'
  };   location: 'meta',
      
  return sectionMap[fieldKey] || 'car_details'; // Vehicle fields
}
 model: 'vehicle',
// Initialize manual overrides when helper loads
loadManualOverrides();vehicle',

// ============================================================================
// BRIDGE FUNCTIONS - Legacy System Compatibility
// ============================================================================fuel_type: 'vehicle',
   engine_volume: 'vehicle',
/**    ownership_type: 'vehicle',
 * Bridge function for legacy updateCaseData calls market_value: 'vehicle',
 * Routes old module calls to new helper system
 */
window.updateCaseData = function(section, data, sourceModule = 'legacy') { owner: 'stakeholders',
  console.log(`🌉 BRIDGE: updateCaseData(${section}) called from ${sourceModule}`, data);
  SystemTracker.log('bridge_updateCaseData_executed', { section, sourceModule, dataKeys: Object.keys(data) });
    garageName: 'stakeholders',
  try {
    // Route to appropriate helper update function
    switch (section) {
      case 'stakeholders':  insurance_agent_phone: 'stakeholders',
      case 'vehicle':keholders',
      case 'meta':
      case 'car_details':
        const result = updateHelper(section, data, sourceModule);
        SystemTracker.log('bridge_updateHelper_result', { section, result, helperPlate: helper.meta?.plate });
        if (result) {
          console.log(`✅ BRIDGE: Successfully routed ${section} data to helper`);return sectionMap[fieldKey] || 'car_details';
          // Trigger module refresh after update
          if (typeof window.refreshAllModuleForms === 'function') {
            window.refreshAllModuleForms();// Initialize manual overrides when helper loads
          }dManualOverrides();
        }
        return result;=================================
        BRIDGE FUNCTIONS - Legacy System Compatibility
      default:====================================
        console.warn(`⚠️ BRIDGE: Unknown section ${section}, routing to general helper update`);
        return updateHelper('general', data, sourceModule);*
    }r legacy updateCaseData calls
    alls to new helper system
  } catch (error) {
    console.error(`❌ BRIDGE: Error in updateCaseData for ${section}:`, error);seData = function(section, data, sourceModule = 'legacy') {
    return false;nsole.log(`🌉 BRIDGE: updateCaseData(${section}) called from ${sourceModule}`, data);
  }SystemTracker.log('bridge_updateCaseData_executed', { section, sourceModule, dataKeys: Object.keys(data) });
};

/**   // Route to appropriate helper update function
 * Bridge function for legacy receiveCarData calls      switch (section) {
 * Routes open-cases.html calls to new helper system   case 'stakeholders':
 */
window.receiveCarData = async function(data, source = 'make_com') {   case 'meta':
  console.log(`🌉 BRIDGE: receiveCarData called from ${source}`, data);
   const result = updateHelper(section, data, sourceModule);
  try {tion, result, helperPlate: helper.meta?.plate });
    // Process the incoming data through the new systemt) {
    const result = await processIncomingData(data, source);ssfully routed ${section} data to helper`);
    
    if (result && result.success) {nction') {
      console.log(`✅ BRIDGE: Successfully processed car data through helper system`);
          }
      // Broadcast update to all modules and floating screens
      broadcastHelperUpdate(result.updatedSections || ['vehicle', 'meta', 'stakeholders'], source);   return result;
      
      // Trigger module refresh
      if (typeof window.refreshAllModuleForms === 'function') {     console.warn(`⚠️ BRIDGE: Unknown section ${section}, routing to general helper update`);
        window.refreshAllModuleForms();       return updateHelper('general', data, sourceModule);
      }    }
       
      return true;
    } else { console.error(`❌ BRIDGE: Error in updateCaseData for ${section}:`, error);
      console.error(`❌ BRIDGE: Failed to process car data through helper system`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ BRIDGE: Error in receiveCarData:`, error);idge function for legacy receiveCarData calls  
    outes open-cases.html calls to new helper system
    // Fallback: try to update helper directly
    try {
      updateHelper('car_details', data, source);nsole.log(`🌉 BRIDGE: receiveCarData called from ${source}`, data);
      return true;
    } catch (fallbackError) {
      console.error(`❌ BRIDGE: Fallback also failed:`, fallbackError); // Process the incoming data through the new system
      return false;   const result = await processIncomingData(data, source);
    }    
  } if (result && result.success) {
};ully processed car data through helper system`);

console.log('🌉 Bridge functions initialized: updateCaseData, receiveCarData');   // Broadcast update to all modules and floating screens
, 'stakeholders'], source);
// ============================================================================
// UNIVERSAL MODULE AUTO-POPULATION FRAMEWORK
// ============================================================================  if (typeof window.refreshAllModuleForms === 'function') {

/**
 * Universal function to populate all module forms from helper data  
 * Called whenever helper is updated to sync all UI elements
 */
export function refreshAllModuleForms(helperData = helper) {(`❌ BRIDGE: Failed to process car data through helper system`);
  console.log('🔄 refreshAllModuleForms: Updating all module forms with helper data'); return false;
  }
  // HIDDEN DEBUG: Track what data is available for refresh
  console.log('🐛 DEBUG refreshAllModuleForms:', {
    timestamp: new Date().toISOString(),: Error in receiveCarData:`, error);
    helperDataProvided: !!helperData,
    helperDataKeys: Object.keys(helperData || {}),// Fallback: try to update helper directly
    vehicleData: helperData?.vehicle,
    metaData: helperData?.meta,, source);
    stakeholdersData: helperData?.stakeholders,  return true;
    currentHelper: helper,
    currentPage: window.location.pathname.split('/').pop()
  });
  
  try {
    // General Info module fields
    populateGeneralInfoFields(helperData);
    .log('🌉 Bridge functions initialized: updateCaseData, receiveCarData');
    // Car details fields (floating screens and forms)
    populateCarDetailsFields(helperData);===========================================================================
    TO-POPULATION FRAMEWORK
    // Damage center fields=====================================================
    populateDamageCenterFields(helperData);
    
    // Parts search fieldsction to populate all module forms from helper data
    populatePartsFields(helperData);alled whenever helper is updated to sync all UI elements
    
    // Fee module fields
    populateFeeFields(helperData); refreshAllModuleForms: Updating all module forms with helper data');
    
    // Levi report fields // HIDDEN DEBUG: Track what data is available for refresh
    populateLeviFields(helperData);  console.log('🐛 DEBUG refreshAllModuleForms:', {
     timestamp: new Date().toISOString(),
    // Invoice fields
    populateInvoiceFields(helperData);
     vehicleData: helperData?.vehicle,
    console.log('✅ All module forms updated successfully');
    ,
  } catch (error) {
    console.error('❌ Error refreshing module forms:', error);
  }
}
try {
/**
 * Populate General Info form fields
 */
function populateGeneralInfoFields(helperData) {screens and forms)
  console.log('🔄 populateGeneralInfoFields called with helper data:', helperData);   populateCarDetailsFields(helperData);
      
  // CRITICAL FIX: Check which page we're on and use appropriate mappings // Damage center fields
  const currentPage = window.location.pathname.split('/').pop();ta);
  console.log('📄 Current page:', currentPage); 
  
  // Fields that exist on general_info.html pages(helperData);
  const generalInfoPageMappings = {
    // Fields that actually exist on general_info.htmlfields
    'odo': helperData.vehicle?.km || helperData.car_details?.km || '',elperData);
    'damageDate': helperData.case_info?.damage_date || helperData.meta?.damage_date || '',
    'ownerPhone': helperData.stakeholders?.owner?.phone || helperData.stakeholders?.owner_phone || '',// Levi report fields
    'ownerAddress': helperData.stakeholders?.owner?.address || helperData.stakeholders?.owner_address || '',s(helperData);
    
    // Garage information
    'garageName': helperData.stakeholders?.garage?.name || '',ields(helperData);
    'garagePhone': helperData.stakeholders?.garage?.phone || '',
    'garageEmail': helperData.stakeholders?.garage?.email || '', All module forms updated successfully');
    
    // Insurance information
    'insuranceCompany': helperData.stakeholders?.insurance?.company || '',r refreshing module forms:', error);
    'insuranceEmail': helperData.stakeholders?.insurance?.email || '',
    'agentName': helperData.stakeholders?.insurance?.agent?.name || '',
    'agentPhone': helperData.stakeholders?.insurance?.agent?.phone || '',
    'agentEmail': helperData.stakeholders?.insurance?.agent?.email || '',
    form fields
    // Damage type
    'damageType': helperData.case_info?.damage_type || ''lds(helperData) {
  };InfoFields called with helper data:', helperData);
  
  // Generic mappings for other pages (like floating screens)age we're on and use appropriate mappings
  const genericMappings = {ation.pathname.split('/').pop();
    'plate': helperData.vehicle?.plate || helperData.meta?.plate || helperData.car_details?.plate || '',:', currentPage);
    'owner': helperData.stakeholders?.owner?.name || helperData.stakeholders?.owner_name || helperData.car_details?.owner || '',
    'ownerPhone': helperData.stakeholders?.owner?.phone || helperData.stakeholders?.owner_phone || '',o.html page
    'ownerAddress': helperData.stakeholders?.owner?.address || helperData.stakeholders?.owner_address || '',nst generalInfoPageMappings = {
    'garageName': helperData.stakeholders?.garage?.name || '',ral_info.html
    'garagePhone': helperData.stakeholders?.garage?.phone || '',?.km || helperData.car_details?.km || '',
    'garageEmail': helperData.stakeholders?.garage?.email || '','damageDate': helperData.case_info?.damage_date || helperData.meta?.damage_date || '',
    'insuranceCompany': helperData.stakeholders?.insurance?.company || '',  'ownerPhone': helperData.stakeholders?.owner?.phone || helperData.stakeholders?.owner_phone || '',
    'insuranceEmail': helperData.stakeholders?.insurance?.email || '',ner?.address || helperData.stakeholders?.owner_address || '',
    'agentName': helperData.stakeholders?.insurance?.agent?.name || '',   
    'agentPhone': helperData.stakeholders?.insurance?.agent?.phone || '',    // Garage information
    'agentEmail': helperData.stakeholders?.insurance?.agent?.email || '',e?.name || '',
    'damageType': helperData.case_info?.damage_type || '',perData.stakeholders?.garage?.phone || '',
    'damageDate': helperData.case_info?.damage_date || ''    'garageEmail': helperData.stakeholders?.garage?.email || '',
  };
  
  // Use appropriate mappings based on current page
  const fieldMappings = currentPage === 'general_info.html' ? generalInfoPageMappings : genericMappings;    'insuranceEmail': helperData.stakeholders?.insurance?.email || '',
   'agentName': helperData.stakeholders?.insurance?.agent?.name || '',
  populateFormFields(fieldMappings, 'general_info');ce?.agent?.phone || '',
}rance?.agent?.email || '',
 
/**
 * Populate Car Details fields in floating screens and forms
 */
function populateCarDetailsFields(helperData) {
  console.log('🔄 populateCarDetailsFields called with helper data:', helperData);neric mappings for other pages (like floating screens)
  
  const fieldMappings = {a.vehicle?.plate || helperData.meta?.plate || helperData.car_details?.plate || '',
    'plate': helperData.vehicle?.plate || helperData.meta?.plate || helperData.car_details?.plate || '',akeholders?.owner?.name || helperData.stakeholders?.owner_name || helperData.car_details?.owner || '',
    'manufacturer': helperData.vehicle?.manufacturer || helperData.car_details?.manufacturer || '',perData.stakeholders?.owner?.phone || helperData.stakeholders?.owner_phone || '',
    'model': helperData.vehicle?.model || helperData.car_details?.model || '',: helperData.stakeholders?.owner?.address || helperData.stakeholders?.owner_address || '',
    'year': helperData.vehicle?.year || helperData.car_details?.year || '',ata.stakeholders?.garage?.name || '',
    'chassis': helperData.vehicle?.chassis || helperData.car_details?.chassis || '',
    'km': helperData.vehicle?.km || helperData.car_details?.km || '',
    'owner': helperData.stakeholders?.owner?.name || helperData.stakeholders?.owner_name || helperData.car_details?.owner || '',': helperData.stakeholders?.insurance?.company || '',
    'trim': helperData.vehicle?.trim || '',
    'engine_volume': helperData.vehicle?.engine_volume || '',nce?.agent?.name || '',
    'fuel_type': helperData.vehicle?.fuel_type || '',|| '',
    'ownership_type': helperData.vehicle?.ownership_type || ''insurance?.agent?.email || '',
  };Type': helperData.case_info?.damage_type || '',
  geDate': helperData.case_info?.damage_date || ''
  populateFormFields(fieldMappings, 'car_details');
}
priate mappings based on current page
/**appings;
 * Populate Damage Center fields
 */ulateFormFields(fieldMappings, 'general_info');
function populateDamageCenterFields(helperData) {
  if (helperData.damage_assessment?.centers) {
    // Trigger damage center UI update if function exists
    if (typeof window.updateDamageCentersFromHelper === 'function') {etails fields in floating screens and forms
      window.updateDamageCentersFromHelper(helperData.damage_assessment.centers);
    }nction populateCarDetailsFields(helperData) {
  }  console.log('🔄 populateCarDetailsFields called with helper data:', helperData);
}

/**.meta?.plate || helperData.car_details?.plate || '',
 * Populate Parts search fields 'manufacturer': helperData.vehicle?.manufacturer || helperData.car_details?.manufacturer || '',
 */odel || '',
function populatePartsFields(helperData) { '',
  if (helperData.parts_search?.results) {  'chassis': helperData.vehicle?.chassis || helperData.car_details?.chassis || '',
    // Trigger parts UI update if function exists': helperData.vehicle?.km || helperData.car_details?.km || '',
    if (typeof window.updatePartsFromHelper === 'function') {lperData.stakeholders?.owner_name || helperData.car_details?.owner || '',
      window.updatePartsFromHelper(helperData.parts_search);
    }'engine_volume': helperData.vehicle?.engine_volume || '',
  }?.fuel_type || '',
}

/**
 * Populate Fee module fields
 */
function populateFeeFields(helperData) {
  if (helperData.financials?.fees) {
    const fieldMappings = {
      'photo_fee': helperData.financials.fees.photography?.total || '',
      'office_fee': helperData.financials.fees.office?.total || '',on populateDamageCenterFields(helperData) {
      'travel_fee': helperData.financials.fees.travel?.total || '',amage_assessment?.centers) {
      'assessment_fee': helperData.financials.fees.assessment?.total || '',er damage center UI update if function exists
      'vat_percentage': helperData.financials.taxes?.vat_percentage || '18'
    };DamageCentersFromHelper(helperData.damage_assessment.centers);
    
    populateFormFields(fieldMappings, 'fees');
  }
}

/**
 * Populate Levi report fields
 */
function populateLeviFields(helperData) {arts_search?.results) {
  if (helperData.valuation) {e if function exists
    const fieldMappings = {
      'base_price': helperData.valuation.base_price || '',PartsFromHelper(helperData.parts_search);
      'final_price': helperData.valuation.final_price || '',
      'market_value': helperData.valuation.final_price || helperData.vehicle?.market_value || ''
    };
    
    populateFormFields(fieldMappings, 'levi');
     * Populate Fee module fields
    // Update Levi floating screen if function exists
    if (typeof window.updateLeviFloatingFromHelper === 'function') {
      window.updateLeviFloatingFromHelper(helperData.valuation);
    }    const fieldMappings = {
  }   'photo_fee': helperData.financials.fees.photography?.total || '',
}
 || '',
/**   'assessment_fee': helperData.financials.fees.assessment?.total || '',
 * Populate Invoice fieldscentage || '18'
 */
function populateInvoiceFields(helperData) {  
  if (helperData.documents?.invoices?.length > 0) {
    // Trigger invoice UI update if function exists
    if (typeof window.updateInvoiceFromHelper === 'function') {
      window.updateInvoiceFromHelper(helperData.documents.invoices);
    }
  }
}

/**) {
 * Universal field population helper
 */ 'base_price': helperData.valuation.base_price || '',
function populateFormFields(fieldMappings, moduleType) {    'final_price': helperData.valuation.final_price || '',
  console.log(`🔍 populateFormFields called for ${moduleType} with mappings:`, fieldMappings);market_value': helperData.valuation.final_price || helperData.vehicle?.market_value || ''
  
  // HIDDEN DEBUG: Log current page and available fields
  console.log('🐛 DEBUG populateFormFields:', {populateFormFields(fieldMappings, 'levi');
    currentPage: window.location.pathname.split('/').pop(),
    moduleType: moduleType,ction exists
    availableElements: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({if (typeof window.updateLeviFloatingFromHelper === 'function') {
      id: el.id,tingFromHelper(helperData.valuation);
      type: el.type,
      value: el.value
    })),
    mappingsToApply: Object.keys(fieldMappings).map(key => ({
      fieldId: key,
      value: fieldMappings[key]ds
    }))
  });tion populateInvoiceFields(helperData) {
  s?.invoices?.length > 0) {
  let populatedCount = 0; function exists
  let skippedCount = 0;if (typeof window.updateInvoiceFromHelper === 'function') {
  let notFoundCount = 0;voiceFromHelper(helperData.documents.invoices);
  
  Object.keys(fieldMappings).forEach(fieldId => {
    const value = fieldMappings[fieldId];
    const element = document.getElementById(fieldId);
    
    if (!element) {
      console.log(`⚠️ Element with ID '${fieldId}' not found in DOM`);
      notFoundCount++;unction populateFormFields(fieldMappings, moduleType) {
      return;  console.log(`🔍 populateFormFields called for ${moduleType} with mappings:`, fieldMappings);
    }
    and available fields
    if (element && value) {onsole.log('🐛 DEBUG populateFormFields:', {
      // ✅ MANUAL OVERRIDE PROTECTION: Check if field has been manually modified'/').pop(),
      if (isFieldManuallyModified(fieldId)) {
        console.log(`⏭️ Skipping automatic population for ${fieldId} - manually modified`);  availableElements: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
        skippedCount++;
        return;
      }
        })),
      // Handle different input typesmap(key => ({
      if (element.type === 'checkbox') {
        element.checked = !!value;
      } else if (element.tagName === 'SELECT') {
        // For select elements, try to find matching option
        const option = Array.from(element.options).find(opt => 
          opt.value === value || opt.textContent === value
        );t skippedCount = 0;
        if (option) {
          element.value = option.value;
        }
      } else {
        element.value = value;const element = document.getElementById(fieldId);
      }
      
      // Trigger change event to update any dependent logic
      element.dispatchEvent(new Event('change', { bubbles: true }));
      populatedCount++;
    }
  });
   value) {
  console.log(`✅ Populated ${moduleType} fields: ${populatedCount} updated, ${skippedCount} skipped (manually modified)`); been manually modified
}  if (isFieldManuallyModified(fieldId)) {
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
function populateCarDetailsFields(helperData) {
  console.log('🔄 populateCarDetailsFields called with helper data:', helperData);
  
  const fieldMappings = {
    'plate': helperData.vehicle?.plate || helperData.meta?.plate || helperData.car_details?.plate || '',
    'manufacturer': helperData.vehicle?.manufacturer || helperData.car_details?.manufacturer || '',
    'model': helperData.vehicle?.model || helperData.car_details?.model || '',
    'year': helperData.vehicle?.year || helperData.car_details?.year || '',
    'chassis': helperData.vehicle?.chassis || helperData.car_details?.chassis || '',
    'km': helperData.vehicle?.km || helperData.car_details?.km || '',
    'owner': helperData.stakeholders?.owner?.name || helperData.stakeholders?.owner_name || helperData.car_details?.owner || '',
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
  console.log(`🔍 populateFormFields called for ${moduleType} with mappings:`, fieldMappings);
  
  // HIDDEN DEBUG: Log current page and available fields
  console.log('🐛 DEBUG populateFormFields:', {
    currentPage: window.location.pathname.split('/').pop(),
    moduleType: moduleType,
    availableElements: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      id: el.id,
      type: el.type,
      value: el.value
    })),
    mappingsToApply: Object.keys(fieldMappings).map(key => ({
      fieldId: key,
      value: fieldMappings[key]
    }))
  });
  
  let populatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  
  Object.keys(fieldMappings).forEach(fieldId => {
    const value = fieldMappings[fieldId];
    const element = document.getElementById(fieldId);
    
    if (!element) {
      console.log(`⚠️ Element with ID '${fieldId}' not found in DOM`);
      notFoundCount++;
      return;
    }
    
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
