// 🧠 Centralized Helper System - Enhanced Data Capture Solution
// Handles ALL data flow: Make.com webhooks, manual inputs, multilingual support

console.log('🧠 Loading enhanced helper system...');

// Create minimal but functional helper system
window.helper = window.helper || {
  meta: {
    plate: '',
    case_id: '',
    created_at: new Date().toISOString(),
    last_updated: '',
    last_webhook_update: ''
  },
  vehicle: {
    plate: '',
    manufacturer: '',
    model: '',
    year: '',
    chassis: '',
    km: '',
    engine_volume: '',
    fuel_type: '',
    ownership_type: '',
    trim: '',
    model_type: '',
    office_code: '',
    registration_date: '',
    market_value: 0
  },
  stakeholders: {
    owner: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    garage: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    },
    insurance: {
      company: '',
      email: '',
      policy_number: '',
      claim_number: '',
      agent: {
        name: '',
        phone: '',
        email: ''
      }
    }
  },
  valuation: {
    source: 'levi_yitzhak',
    base_price: 0,
    final_price: 0,
    currency: 'ILS',
    adjustments: {
      registration: { percent: 0, amount: 0, cumulative: 0 },
      mileage: { percent: 0, amount: 0, cumulative: 0 },
      ownership_type: { percent: 0, amount: 0, cumulative: 0 },
      ownership_history: { percent: 0, amount: 0, cumulative: 0 },
      features: { percent: 0, amount: 0, cumulative: 0 }
    }
  },
  damage_assessment: {
    summary: {
      total_damage_amount: 0,
      damage_percentage: 0,
      is_total_loss: false,
      classification: '',
      assessment_notes: ''
    },
    centers: []
  },
  financials: {
    costs: {
      parts_total: 0,
      repairs_total: 0,
      works_total: 0,
      subtotal: 0
    },
    fees: {
      photography: { count: 0, unit_price: 0, total: 0 },
      office: { fixed_fee: 0, percentage: 0, total: 0 },
      travel: { count: 0, unit_price: 0, total: 0 },
      assessment: { hours: 0, hourly_rate: 0, total: 0 },
      subtotal: 0
    },
    taxes: {
      vat_percentage: 18,
      vat_amount: 0
    },
    totals: {
      before_tax: 0,
      after_tax: 0,
      total_compensation: 0,
      salvage_value: 0,
      net_settlement: 0
    }
  },
  documents: {
    images: [],
    invoices: [],
    reports: [],
    photo_count: 0
  },
  levi_data: {
    base_value: 0,
    adjusted_value: 0,
    depreciation_factors: {},
    calculation_notes: ''
  },
  calculations: {
    depreciation: {},
    adjustments: {},
    final_values: {},
    calculation_log: []
  },
  raw_webhook_data: {},
  system: {
    version: '2.0.0-enhanced',
    enhanced_data_capture: true,
    last_updated: new Date().toISOString()
  }
};

// Enhanced processIncomingData function with comprehensive field mapping
window.processIncomingData = async function(data, webhookId = 'unknown') {
  console.log('🔄 ENHANCED: Processing incoming data from webhook:', webhookId);
  console.log('📥 Raw data:', data);
  
  if (!data) {
    console.warn('⚠️ No data received');
    return { success: false, error: 'No data provided' };
  }
  
  try {
    const result = {
      success: true,
      updatedSections: [],
      warnings: [],
      timestamp: new Date().toISOString(),
      webhookId: webhookId,
      helperUpdated: false
    };
    
    // Handle Hebrew text in Body field (from Make.com)
    if (data.Body && typeof data.Body === 'string') {
      console.log('📥 Processing Hebrew text from Body field');
      result.helperUpdated = processHebrewText(data.Body, result);
    }
    
    // Handle array format with Body field
    else if (Array.isArray(data) && data[0] && data[0].Body) {
      console.log('📥 Processing array format with Body field');
      result.helperUpdated = processHebrewText(data[0].Body, result);
    }
    
    // Handle direct object data
    else if (typeof data === 'object' && !data.Body) {
      console.log('📥 Processing direct object data');
      result.helperUpdated = processDirectData(data, result);
    }
    
    // Store raw webhook data for debugging
    window.helper.raw_webhook_data[`${webhookId}_${Date.now()}`] = {
      data: data,
      timestamp: new Date().toISOString(),
      processed: result.helperUpdated
    };
    
    // Update meta information
    window.helper.meta.last_updated = new Date().toISOString();
    window.helper.meta.last_webhook_update = webhookId;
    
    // Save to storage immediately
    saveHelperToAllStorageLocations();
    
    // Force UI refresh with retry
    if (result.helperUpdated) {
      setTimeout(() => populateAllForms(), 100);
      setTimeout(() => populateAllForms(), 500);  // Retry
      setTimeout(() => populateAllForms(), 1000); // Final retry
    }
    
    console.log('✅ ENHANCED: Data processing completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ ENHANCED: Error processing data:', error);
    return {
      success: false,
      error: error.message,
      webhookId: webhookId,
      timestamp: new Date().toISOString()
    };
  }
};

// Process Hebrew text with comprehensive field extraction
function processHebrewText(bodyText, result) {
  console.log('🔍 Extracting data from Hebrew text...');
  let updated = false;
  
  // Enhanced Hebrew patterns with multiple apostrophe variants
  const patterns = [
    // Plate number - multiple variants
    { regex: /(?:פרטי רכב|מס[׳״\']*\s*רכב|מספר רכב|מס רכב)[:\s]*(\d+)/i, field: 'plate', target: ['vehicle.plate', 'meta.plate'] },
    
    // Manufacturer
    { regex: /(?:שם היצרן|יצרן)[:\s]*([^\n\r]+)/i, field: 'manufacturer', target: ['vehicle.manufacturer'] },
    
    // Model
    { regex: /(?:דגם|שם דגם)[:\s]*([^\n\r]+)/i, field: 'model', target: ['vehicle.model'] },
    
    // Year - handle both formats: MM/YYYY or just YYYY
    { regex: /(?:שנת ייצור|שנת יצור|שנה)[:\s]*(?:(\d{2})\/)?(\d{4})/i, field: 'year', target: ['vehicle.year'] },
    
    // Owner
    { regex: /(?:שם בעל הרכב|בעל הרכב|שם בעלים|בעלים)[:\s]*([^\n\r]+)/i, field: 'owner', target: ['stakeholders.owner.name'] },
    
    // Chassis/VIN
    { regex: /(?:מספר שילדה|מספר שלדה|שילדה)[:\s]*([A-Z0-9]+)/i, field: 'chassis', target: ['vehicle.chassis'] },
    
    // Engine volume
    { regex: /(?:נפח מנוע|נפח)[:\s]*(\d+)/i, field: 'engine_volume', target: ['vehicle.engine_volume'] },
    
    // Fuel type
    { regex: /(?:סוג דלק|דלק)[:\s]*([^\n\r]+)/i, field: 'fuel_type', target: ['vehicle.fuel_type'] },
    
    // Ownership type
    { regex: /(?:סוג בעלות|בעלות)[:\s]*([^\n\r]+)/i, field: 'ownership_type', target: ['vehicle.ownership_type'] },
    
    // Mileage with comma removal
    { regex: /(?:מס[׳״\']*\s*ק[״׳\"]מ|קילומטר|ק[״׳\"]מ)[:\s]*([0-9,]+)/i, field: 'km', target: ['vehicle.km'] },
    
    // Model type
    { regex: /(?:סוג הדגם|סוג הרכב)[:\s]*([^\n\r]+)/i, field: 'model_type', target: ['vehicle.model_type'] },
    
    // Trim
    { regex: /(?:רמת גימור|גימור)[:\s]*([^\n\r]+)/i, field: 'trim', target: ['vehicle.trim'] },
    
    // Garage
    { regex: /(?:מוסך)[:\s]*([^\n\r]+)/i, field: 'garage', target: ['stakeholders.garage.name'] },
    
    // Office code
    { regex: /(?:קוד משרד התחבורה|קוד משרד)[:\s]*([0-9-]+)/i, field: 'office_code', target: ['vehicle.office_code'] }
  ];
  
  patterns.forEach(({ regex, field, target }) => {
    const match = bodyText.match(regex);
    if (match) {
      let value = match[1] || match[2] || match[0];
      value = value.trim();
      
      // Clean numeric values
      if (field === 'km') {
        value = value.replace(/,/g, '');
      }
      
      // Handle year - use 4-digit year if available
      if (field === 'year' && match[2]) {
        value = match[2];
      }
      
      // Set values in helper
      target.forEach(path => {
        setNestedValue(window.helper, path, value);
      });
      
      console.log(`✅ Extracted ${field}: ${value}`);
      updated = true;
    }
  });
  
  if (updated) {
    result.updatedSections.push('vehicle', 'meta', 'stakeholders');
  }
  
  return updated;
}

// Process direct object data
function processDirectData(data, result) {
  console.log('🔍 Processing direct object data...');
  let updated = false;
  
  const fieldMappings = {
    // Vehicle fields
    'plate': ['vehicle.plate', 'meta.plate'],
    'license_plate': ['vehicle.plate', 'meta.plate'],
    'manufacturer': ['vehicle.manufacturer'],
    'make': ['vehicle.manufacturer'],
    'model': ['vehicle.model'],
    'year': ['vehicle.year'],
    'chassis': ['vehicle.chassis'],
    'vin': ['vehicle.chassis'],
    'km': ['vehicle.km'],
    'mileage': ['vehicle.km'],
    'engine_volume': ['vehicle.engine_volume'],
    'fuel_type': ['vehicle.fuel_type'],
    'ownership_type': ['vehicle.ownership_type'],
    'trim': ['vehicle.trim'],
    'model_type': ['vehicle.model_type'],
    'office_code': ['vehicle.office_code'],
    
    // Owner fields
    'owner': ['stakeholders.owner.name'],
    'owner_name': ['stakeholders.owner.name'],
    'owner_phone': ['stakeholders.owner.phone'],
    'owner_address': ['stakeholders.owner.address'],
    
    // Garage fields
    'garage_name': ['stakeholders.garage.name'],
    'garage': ['stakeholders.garage.name'],
    
    // Insurance fields
    'insurance_company': ['stakeholders.insurance.company'],
    
    // Valuation fields
    'base_price': ['valuation.base_price'],
    'final_price': ['valuation.final_price'],
    'market_value': ['vehicle.market_value', 'valuation.final_price']
  };
  
  Object.entries(data).forEach(([key, value]) => {
    if (value && value !== '') {
      const targets = fieldMappings[key.toLowerCase()];
      if (targets) {
        targets.forEach(target => {
          setNestedValue(window.helper, target, value);
        });
        console.log(`✅ Mapped ${key}: ${value}`);
        updated = true;
      }
    }
  });
  
  if (updated) {
    result.updatedSections.push('vehicle', 'stakeholders', 'valuation');
  }
  
  return updated;
}

// Helper function to set nested object values
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Save helper to all storage locations for reliability
function saveHelperToAllStorageLocations() {
  try {
    const helperString = JSON.stringify(window.helper);
    const timestamp = new Date().toISOString();
    
    // Primary storage
    sessionStorage.setItem('helper', helperString);
    
    // Backup storage locations
    sessionStorage.setItem('helper_backup', helperString);
    sessionStorage.setItem('helper_timestamp', timestamp);
    
    // Persistent storage
    localStorage.setItem('helper_data', helperString);
    localStorage.setItem('helper_last_save', timestamp);
    
    console.log('✅ Helper saved to all storage locations');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save helper to storage:', error);
    return false;
  }
}

// Populate all forms from helper data
function populateAllForms() {
  console.log('🔄 Populating all forms from helper data');
  
  const fieldMappings = {
    // Basic form fields
    'plate': window.helper.vehicle?.plate || window.helper.meta?.plate,
    'manufacturer': window.helper.vehicle?.manufacturer,
    'model': window.helper.vehicle?.model,
    'year': window.helper.vehicle?.year,
    'owner': window.helper.stakeholders?.owner?.name,
    'chassis': window.helper.vehicle?.chassis,
    'km': window.helper.vehicle?.km,
    'engine_volume': window.helper.vehicle?.engine_volume,
    'fuel_type': window.helper.vehicle?.fuel_type,
    'ownership_type': window.helper.vehicle?.ownership_type,
    'trim': window.helper.vehicle?.trim,
    'model_type': window.helper.vehicle?.model_type,
    'office_code': window.helper.vehicle?.office_code,
    
    // Stakeholder fields
    'owner_phone': window.helper.stakeholders?.owner?.phone,
    'owner_address': window.helper.stakeholders?.owner?.address,
    'garage_name': window.helper.stakeholders?.garage?.name,
    'insurance_company': window.helper.stakeholders?.insurance?.company,
    
    // Valuation fields
    'base_price': window.helper.valuation?.base_price,
    'final_price': window.helper.valuation?.final_price,
    'market_value': window.helper.vehicle?.market_value || window.helper.valuation?.final_price
  };
  
  let populatedCount = 0;
  
  Object.entries(fieldMappings).forEach(([fieldId, value]) => {
    if (value) {
      const element = document.getElementById(fieldId);
      if (element && (!element.value || element.value.trim() === '')) {
        element.value = value;
        
        // Trigger events for compatibility
        const events = ['input', 'change', 'keyup', 'blur'];
        events.forEach(eventType => {
          element.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        populatedCount++;
        console.log(`✅ Populated ${fieldId}: ${value}`);
      }
    }
  });
  
  console.log(`✅ Form population completed: ${populatedCount} fields populated`);
  return populatedCount;
}

// Enhanced functions to replace broken ones
window.updateHelper = function(section, data, sourceModule = null) {
  console.log(`🔄 ENHANCED: Updating helper section '${section}':`, data);
  
  try {
    if (!window.helper[section]) {
      window.helper[section] = {};
    }
    
    if (typeof data === 'object' && data !== null) {
      Object.assign(window.helper[section], data);
    } else {
      window.helper[section] = data;
    }
    
    window.helper.meta.last_updated = new Date().toISOString();
    saveHelperToAllStorageLocations();
    
    console.log(`✅ Helper section '${section}' updated successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to update helper section '${section}':`, error);
    return false;
  }
};

window.saveHelperToStorage = saveHelperToAllStorageLocations;
window.refreshAllModuleForms = populateAllForms;

// Enhanced broadcastHelperUpdate function for system-wide notifications
window.broadcastHelperUpdate = function(updatedSections = [], source = 'unknown') {
  console.log('📡 Broadcasting helper update:', { updatedSections, source });
  
  try {
    // Create custom event with helper data
    const updateEvent = new CustomEvent('helperUpdate', {
      detail: {
        helper: window.helper,
        updatedSections: updatedSections,
        source: source,
        timestamp: new Date().toISOString()
      }
    });
    
    // Dispatch to document
    document.dispatchEvent(updateEvent);
    
    // Update all module forms if functions exist
    if (typeof window.refreshAllModuleForms === 'function') {
      window.refreshAllModuleForms(window.helper);
    }
    
    // Trigger floating screen updates
    triggerFloatingScreenUpdates(updatedSections);
    
    console.log('✅ Helper update broadcasted successfully');
    
  } catch (error) {
    console.error('❌ Error broadcasting helper update:', error);
  }
};

// Enhanced updateHelperAndSession function
window.updateHelperAndSession = function(section, data, sourceModule = null) {
  const success = window.updateHelper(section, data, sourceModule);
  if (success) {
    window.broadcastHelperUpdate([section], sourceModule || "updateHelperAndSession");
  }
  return success;
};

// Helper function to trigger floating screen updates
function triggerFloatingScreenUpdates(updatedSections) {
  console.log('📱 Triggering floating screen updates for sections:', updatedSections);
  
  // Car details floating screen
  if (updatedSections.includes('vehicle') || updatedSections.includes('meta')) {
    if (typeof window.refreshCarData === 'function') {
      window.refreshCarData();
    }
    if (typeof window.showCarDetails === 'function') {
      setTimeout(() => window.showCarDetails(), 500);
    }
  }
  
  // Stakeholder floating screens
  if (updatedSections.includes('stakeholders')) {
    if (typeof window.refreshStakeholderData === 'function') {
      window.refreshStakeholderData();
    }
  }
  
  // Valuation floating screens
  if (updatedSections.includes('valuation')) {
    if (typeof window.refreshValuationData === 'function') {
      window.refreshValuationData();
    }
  }
}

// Auto-save every 30 seconds
setInterval(() => {
  if (window.helper && Object.keys(window.helper).length > 0) {
    saveHelperToAllStorageLocations();
  }
}, 30000);

console.log('✅ ENHANCED HELPER SYSTEM LOADED - Advanced data capture is ready!');
console.log('📊 Helper object initialized:', window.helper);

// Export for testing
if (typeof window !== 'undefined') {
  window.testDataCapture = function() {
    console.log('🧪 Testing data capture with sample data...');
    
    // Test Hebrew data
    processIncomingData({
      Body: 'מס׳ רכב: 5785269\nיצרן: ביואיק\nדגם: LUCERNE\nבעל הרכב: כרמל כיוף'
    }, 'test_hebrew');
    
    // Test direct data
    processIncomingData({
      plate: '1234567',
      manufacturer: 'Toyota',
      model: 'Camry',
      owner: 'Test Owner'
    }, 'test_direct');
    
    console.log('📊 Helper after test:', window.helper);
    populateAllForms();
  };
}

// Helper functions that other files expect
window.getVehicleData = function() {
  return window.helper.vehicle || {};
};

window.getDamageData = function() {
  return window.helper.damage_assessment || {};
};

window.getValuationData = function() {
  return window.helper.valuation || {};
};

window.getFinancialData = function() {
  return window.helper.financials || {};
};

window.syncDamageData = function(damageData) {
  return window.updateHelper('damage_assessment', damageData, 'syncDamageData');
};

// Sync Levi data function for depreciation module
window.syncLeviData = function(leviData) {
  console.log('🔄 Syncing Levi data to helper:', leviData);
  return window.updateHelper('levi_data', leviData, 'syncLeviData');
};

// Update calculations function for modules
window.updateCalculations = function(calculationData) {
  console.log('🧮 Updating calculations in helper:', calculationData);
  return window.updateHelper('calculations', calculationData, 'updateCalculations');
};

// Sync vehicle data function for car details module
window.syncVehicleData = function(vehicleData) {
  console.log('🚗 Syncing vehicle data to helper:', vehicleData);
  return window.updateHelper('vehicle', vehicleData, 'syncVehicleData');
};

// Initialize helper function for initial input module
window.initHelper = function(initialData = {}) {
  console.log('🔧 Initializing helper with data:', initialData);
  if (initialData && Object.keys(initialData).length > 0) {
    Object.keys(initialData).forEach(section => {
      window.updateHelper(section, initialData[section], 'initHelper');
    });
  }
  console.log('✅ Helper initialized successfully');
  return true;
};

// ES6 Module Exports for other files to import
// Use function wrappers to ensure availability
export const updateHelper = (...args) => window.updateHelper?.(...args);
export const updateHelperAndSession = (...args) => window.updateHelperAndSession?.(...args);
export const broadcastHelperUpdate = (...args) => window.broadcastHelperUpdate?.(...args);
export const processIncomingData = (...args) => window.processIncomingData?.(...args);
export const saveHelperToStorage = (...args) => window.saveHelperToStorage?.(...args);
export const refreshAllModuleForms = (...args) => window.refreshAllModuleForms?.(...args);
export const getVehicleData = (...args) => window.getVehicleData?.(...args);
export const getDamageData = (...args) => window.getDamageData?.(...args);
export const getValuationData = (...args) => window.getValuationData?.(...args);
export const getFinancialData = (...args) => window.getFinancialData?.(...args);
export const syncDamageData = (...args) => window.syncDamageData?.(...args);
export const syncLeviData = (...args) => window.syncLeviData?.(...args);
export const updateCalculations = (...args) => window.updateCalculations?.(...args);
export const syncVehicleData = (...args) => window.syncVehicleData?.(...args);
export const initHelper = (...args) => window.initHelper?.(...args);

// Helper object getter
export const helper = typeof window !== 'undefined' ? window.helper : {};