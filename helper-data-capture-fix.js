// 🔧 CRITICAL DATA CAPTURE FIXES FOR HELPER SYSTEM
// This file contains the fixes for the data capture issues identified in the system

import { helper, updateHelper, saveHelperToStorage } from './helper.js';
import { 
  processIncomingDataWithMapping, 
  setNestedValue, 
  getNestedValue,
  HEBREW_TO_ENGLISH,
  MAKECOM_TO_HELPER 
} from './field-mapping-dictionary.js';

/**
 * FIXED: Enhanced data processing function that properly captures ALL incoming data
 * This replaces the incomplete processIncomingData function in helper.js
 */
export async function processIncomingDataEnhanced(data, webhookId = 'unknown') {
  console.log('🔧 ENHANCED processIncomingData: Processing data from webhook:', webhookId);
  console.log('📥 RAW WEBHOOK DATA:', JSON.stringify(data, null, 2));
  console.log('📊 Current helper BEFORE processing:', JSON.parse(JSON.stringify(helper)));
  
  try {
    const result = {
      success: true,
      updatedSections: [],
      warnings: [],
      timestamp: new Date().toISOString(),
      webhookId: webhookId,
      dataProcessed: false,
      helperUpdated: false
    };

    if (!data) {
      result.warnings.push('No data received');
      return result;
    }

    // CRITICAL FIX 1: Use field mapping dictionary for ALL incoming data
    console.log('🗺️ STEP 1: Applying comprehensive field mapping...');
    
    try {
      const mappedData = processIncomingDataWithMapping(data, webhookId);
      console.log('📊 Data after field mapping:', mappedData);
      
      if (mappedData && Object.keys(mappedData).length > 0) {
        // Process each mapped section
        Object.entries(mappedData).forEach(([section, sectionData]) => {
          if (sectionData && typeof sectionData === 'object' && Object.keys(sectionData).length > 0) {
            console.log(`📝 Updating helper section '${section}':`, sectionData);
            
            // Ensure helper has the section
            if (!helper[section]) {
              helper[section] = {};
            }
            
            // Deep merge the data
            Object.entries(sectionData).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                helper[section][key] = value;
                console.log(`  ✅ Set helper.${section}.${key} = ${value}`);
              }
            });
            
            result.updatedSections.push(section);
            result.helperUpdated = true;
            console.log(`✅ Successfully updated helper.${section}`);
          }
        });
      }
      
      result.dataProcessed = true;
      
    } catch (mappingError) {
      console.error('❌ Field mapping failed:', mappingError);
      result.warnings.push(`Field mapping failed: ${mappingError.message}`);
    }

    // CRITICAL FIX 2: Handle Hebrew text in Body field with better apostrophe support
    console.log('🔍 STEP 2: Checking for Hebrew text in Body field...');
    
    const hebrewText = extractHebrewText(data);
    if (hebrewText) {
      console.log('📥 Found Hebrew text:', hebrewText);
      
      try {
        const parsedData = parseHebrewTextToObjectEnhanced(hebrewText);
        console.log('📊 Parsed Hebrew data:', parsedData);
        
        if (parsedData && Object.keys(parsedData).length > 0) {
          processCarDetailsDataEnhanced(parsedData, `webhook_${webhookId}_hebrew`);
          result.updatedSections = [...new Set([...result.updatedSections, 'vehicle', 'meta', 'stakeholders'])];
          result.helperUpdated = true;
          console.log('✅ Processed Hebrew car data');
        }
      } catch (error) {
        console.error('❌ Error parsing Hebrew text:', error);
        result.warnings.push(`Hebrew parsing failed: ${error.message}`);
      }
    }

    // CRITICAL FIX 3: Universal data extraction for any format
    console.log('🔍 STEP 3: Attempting universal data extraction...');
    
    try {
      const extractedData = extractDataUniversal(data);
      if (extractedData && Object.keys(extractedData).length > 0) {
        console.log('📊 Universal extraction found data:', extractedData);
        
        // Apply this data to helper using the mapping system
        Object.entries(extractedData).forEach(([key, value]) => {
          if (value && value !== '') {
            const mappedPath = mapFieldToHelperPath(key);
            if (mappedPath) {
              setNestedValue(helper, mappedPath, value);
              console.log(`  ✅ Universal: Set ${mappedPath} = ${value}`);
              result.helperUpdated = true;
            }
          }
        });
        
        result.updatedSections = [...new Set([...result.updatedSections, 'vehicle', 'meta', 'stakeholders'])];
      }
    } catch (extractError) {
      console.error('❌ Universal extraction failed:', extractError);
      result.warnings.push(`Universal extraction failed: ${extractError.message}`);
    }

    // CRITICAL FIX 4: Store raw data for debugging and recovery
    console.log('💾 STEP 4: Storing raw data for recovery...');
    
    if (!helper.raw_webhook_data) {
      helper.raw_webhook_data = {};
    }
    
    helper.raw_webhook_data[`${webhookId}_${Date.now()}`] = {
      data: data,
      timestamp: new Date().toISOString(),
      processed: result.helperUpdated,
      sections_updated: result.updatedSections
    };
    
    result.updatedSections.push('raw_webhook_data');

    // CRITICAL FIX 5: Force save to session storage immediately
    console.log('💾 STEP 5: Force saving to session storage...');
    
    try {
      // Update timestamps
      if (!helper.meta) helper.meta = {};
      helper.meta.last_updated = new Date().toISOString();
      helper.meta.last_webhook_update = webhookId;
      
      // Save to sessionStorage immediately
      const helperString = JSON.stringify(helper);
      sessionStorage.setItem('helper', helperString);
      sessionStorage.setItem('helper_backup', helperString);
      sessionStorage.setItem(`helper_webhook_${webhookId}`, helperString);
      
      console.log('✅ Helper data saved to session storage');
      
      // Also save to localStorage for persistence
      localStorage.setItem('helper_data', helperString);
      localStorage.setItem('helper_last_update', new Date().toISOString());
      
      result.helperUpdated = true;
      
    } catch (saveError) {
      console.error('❌ Error saving to storage:', saveError);
      result.warnings.push(`Storage save failed: ${saveError.message}`);
    }

    // CRITICAL FIX 6: Force UI refresh with retry mechanism
    console.log('🔄 STEP 6: Force refreshing UI forms...');
    
    if (result.helperUpdated) {
      setTimeout(() => forceRefreshAllForms(), 100);
      setTimeout(() => forceRefreshAllForms(), 500);
      setTimeout(() => forceRefreshAllForms(), 1000);
    }

    console.log('📊 FINAL helper AFTER processing:', JSON.parse(JSON.stringify(helper)));
    console.log('✅ Enhanced data processing completed');
    
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced processIncomingData: Critical error:', error);
    return {
      success: false,
      error: error.message,
      updatedSections: [],
      warnings: [error.message],
      timestamp: new Date().toISOString(),
      webhookId: webhookId
    };
  }
}

/**
 * FIXED: Enhanced Hebrew text extraction with better apostrophe handling
 */
function extractHebrewText(data) {
  if (!data) return null;
  
  // Direct Body field
  if (data.Body && typeof data.Body === 'string') {
    return data.Body;
  }
  
  // Array format
  if (Array.isArray(data) && data[0] && data[0].Body && typeof data[0].Body === 'string') {
    return data[0].Body;
  }
  
  // Nested Body search
  const findBody = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'Body' && typeof value === 'string') {
        return value;
      }
      if (typeof value === 'object') {
        const found = findBody(value);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findBody(data);
}

/**
 * FIXED: Enhanced Hebrew text parsing with comprehensive field recognition
 */
function parseHebrewTextToObjectEnhanced(text) {
  const result = {};
  
  if (!text || typeof text !== 'string') {
    return result;
  }
  
  console.log('🔍 Parsing Hebrew text:', text);
  
  // Enhanced Hebrew patterns with multiple apostrophe variants
  const patterns = [
    // Plate number variations
    { regex: /(?:פרטי רכב|מס['\s]*רכב|מספר רכב|מס רכב)[:\s]*(\d+)/i, field: 'plate' },
    
    // Manufacturer
    { regex: /(?:שם היצרן|יצרן)[:\s]*([^\n\r]+)/i, field: 'manufacturer' },
    
    // Model
    { regex: /(?:דגם|שם דגם)[:\s]*([^\n\r]+)/i, field: 'model' },
    
    // Year with multiple formats
    { regex: /(?:שנת ייצור|שנת יצור|שנה)[:\s]*(?:(\d{2})\/)?(\d{4})/i, field: 'year' },
    
    // Owner name
    { regex: /(?:שם בעל הרכב|בעל הרכב|שם בעלים|בעלים)[:\s]*([^\n\r]+)/i, field: 'owner' },
    
    // Chassis/VIN
    { regex: /(?:מספר שילדה|מספר שלדה|שילדה)[:\s]*([A-Z0-9]+)/i, field: 'chassis' },
    
    // Engine volume
    { regex: /(?:נפח מנוע|נפח)[:\s]*(\d+)/i, field: 'engine_volume' },
    
    // Fuel type
    { regex: /(?:סוג דלק|דלק)[:\s]*([^\n\r]+)/i, field: 'fuel_type' },
    
    // Ownership type
    { regex: /(?:סוג בעלות|בעלות)[:\s]*([^\n\r]+)/i, field: 'ownership_type' },
    
    // Mileage
    { regex: /(?:מס['\s]*ק"מ|קילומטר|ק"מ)[:\s]*([0-9,]+)/i, field: 'km' },
    
    // Trim level
    { regex: /(?:רמת גימור|גימור)[:\s]*([^\n\r]+)/i, field: 'trim' },
    
    // Model type
    { regex: /(?:סוג הדגם|סוג הרכב)[:\s]*([^\n\r]+)/i, field: 'model_type' },
    
    // Garage
    { regex: /(?:מוסך)[:\s]*([^\n\r]+)/i, field: 'garage_name' },
    
    // Office code
    { regex: /(?:קוד משרד התחבורה|קוד משרד)[:\s]*([0-9-]+)/i, field: 'office_code' },
    
    // Registration date
    { regex: /(?:עליה לכביש)[:\s]*(\d{2}\/\d{4})/i, field: 'registration_date' },
    
    // Base price
    { regex: /(?:מחיר בסיס|מחיר בסיסי)[:\s]*([0-9,]+)/i, field: 'base_price' },
    
    // Final price
    { regex: /(?:מחיר סופי לרכב|שווי)[:\s]*([0-9,]+)/i, field: 'final_price' }
  ];
  
  // Apply each pattern
  patterns.forEach(({ regex, field }) => {
    const match = text.match(regex);
    if (match) {
      let value = match[1] || match[2] || match[0];
      
      // Clean up the value
      value = value.trim();
      
      // Handle specific field types
      if (field === 'year' && match[2]) {
        value = match[2]; // Use the 4-digit year
      } else if (field === 'km') {
        value = value.replace(/,/g, ''); // Remove commas from numbers
      } else if (field === 'base_price' || field === 'final_price') {
        value = value.replace(/,/g, ''); // Remove commas from prices
      }
      
      result[field] = value;
      console.log(`  ✅ Extracted ${field}: ${value}`);
    }
  });
  
  return result;
}

/**
 * FIXED: Enhanced car details processing that properly maps to helper structure
 */
function processCarDetailsDataEnhanced(carData, sourceModule = 'unknown') {
  console.log('🚗 Enhanced car details processing:', carData);
  
  if (!carData || typeof carData !== 'object') {
    console.warn('⚠️ No car data to process');
    return false;
  }
  
  // Ensure helper sections exist
  if (!helper.vehicle) helper.vehicle = {};
  if (!helper.meta) helper.meta = {};
  if (!helper.stakeholders) helper.stakeholders = {};
  if (!helper.stakeholders.owner) helper.stakeholders.owner = {};
  
  // Map each field to the correct helper location
  const fieldMappings = {
    // Vehicle information
    'plate': 'vehicle.plate',
    'manufacturer': 'vehicle.manufacturer',
    'model': 'vehicle.model',
    'year': 'vehicle.year',
    'chassis': 'vehicle.chassis',
    'engine_volume': 'vehicle.engine_volume',
    'fuel_type': 'vehicle.fuel_type',
    'ownership_type': 'vehicle.ownership_type',
    'km': 'vehicle.km',
    'trim': 'vehicle.trim',
    'model_type': 'vehicle.model_type',
    'registration_date': 'vehicle.registration_date',
    
    // Meta information
    'plate': 'meta.plate', // Duplicate to ensure plate is in meta too
    
    // Owner information
    'owner': 'stakeholders.owner.name',
    
    // Valuation information
    'base_price': 'valuation.base_price',
    'final_price': 'valuation.final_price',
    
    // Garage information
    'garage_name': 'stakeholders.garage.name',
    
    // Administrative
    'office_code': 'vehicle.office_code'
  };
  
  // Apply mappings
  let updated = false;
  Object.entries(carData).forEach(([key, value]) => {
    if (value && value !== '') {
      const mappingPath = fieldMappings[key];
      if (mappingPath) {
        setNestedValue(helper, mappingPath, value);
        console.log(`  ✅ Mapped ${key} → ${mappingPath} = ${value}`);
        updated = true;
      } else {
        // Store in a general section if no mapping found
        if (!helper.unmapped_fields) helper.unmapped_fields = {};
        helper.unmapped_fields[key] = value;
        console.log(`  📝 Stored unmapped field: ${key} = ${value}`);
      }
    }
  });
  
  // Update timestamps
  const now = new Date().toISOString();
  helper.meta.last_car_update = now;
  helper.meta.source_module = sourceModule;
  
  return updated;
}

/**
 * FIXED: Universal data extraction that handles any data format
 */
function extractDataUniversal(data) {
  const extracted = {};
  
  if (!data) return extracted;
  
  // Recursive function to find car-related data
  const findCarData = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' || typeof value === 'number') {
        // Check if this looks like car data
        if (isCarRelatedField(key, value)) {
          extracted[key] = value;
          console.log(`  🔍 Found car field: ${key} = ${value}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        findCarData(value, currentPath);
      }
    });
  };
  
  findCarData(data);
  return extracted;
}

/**
 * Helper function to identify car-related fields
 */
function isCarRelatedField(key, value) {
  const carFields = [
    'plate', 'manufacturer', 'model', 'year', 'owner', 'chassis', 'km', 'mileage',
    'engine_volume', 'fuel_type', 'ownership_type', 'trim', 'garage', 'office_code',
    'base_price', 'final_price', 'registration_date'
  ];
  
  // Check Hebrew equivalents
  const hebrewKeys = Object.keys(HEBREW_TO_ENGLISH);
  
  // Direct key match
  if (carFields.includes(key.toLowerCase())) {
    return true;
  }
  
  // Hebrew key match
  if (hebrewKeys.includes(key)) {
    return true;
  }
  
  // Pattern-based detection
  if (typeof value === 'string') {
    // License plate pattern
    if (/^\d{7,8}$/.test(value) || /^\d{2,3}-\d{3}-\d{2}$/.test(value)) {
      return true;
    }
    
    // Year pattern
    if (/^(19|20)\d{2}$/.test(value)) {
      return true;
    }
    
    // VIN pattern
    if (/^[A-Z0-9]{17}$/.test(value)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Map a field name to its correct helper path
 */
function mapFieldToHelperPath(fieldName) {
  const mapping = {
    'plate': 'vehicle.plate',
    'manufacturer': 'vehicle.manufacturer', 
    'model': 'vehicle.model',
    'year': 'vehicle.year',
    'owner': 'stakeholders.owner.name',
    'chassis': 'vehicle.chassis',
    'km': 'vehicle.km',
    'mileage': 'vehicle.km',
    'engine_volume': 'vehicle.engine_volume',
    'fuel_type': 'vehicle.fuel_type',
    'ownership_type': 'vehicle.ownership_type',
    'trim': 'vehicle.trim',
    'model_type': 'vehicle.model_type',
    'garage_name': 'stakeholders.garage.name',
    'office_code': 'vehicle.office_code',
    'registration_date': 'vehicle.registration_date',
    'base_price': 'valuation.base_price',
    'final_price': 'valuation.final_price'
  };
  
  // Also check Hebrew mappings
  const englishField = HEBREW_TO_ENGLISH[fieldName];
  if (englishField) {
    return mapping[englishField];
  }
  
  return mapping[fieldName];
}

/**
 * FIXED: Force refresh all forms with retry mechanism
 */
function forceRefreshAllForms() {
  console.log('🔄 Force refreshing all forms with current helper data');
  
  try {
    // Method 1: Use existing refreshAllModuleForms if available
    if (typeof window.refreshAllModuleForms === 'function') {
      window.refreshAllModuleForms(helper);
      console.log('✅ Called refreshAllModuleForms');
    }
    
    // Method 2: Direct field population
    populateFormsDirectly();
    
    // Method 3: Broadcast helper update event
    const event = new CustomEvent('helperDataUpdated', {
      detail: {
        helper: helper,
        timestamp: new Date().toISOString(),
        source: 'data-capture-fix'
      }
    });
    document.dispatchEvent(event);
    
    // Method 4: Trigger change events on existing fields
    triggerFieldChangeEvents();
    
  } catch (error) {
    console.error('❌ Error in forceRefreshAllForms:', error);
  }
}

/**
 * Directly populate form fields from helper data
 */
function populateFormsDirectly() {
  console.log('📝 Directly populating form fields from helper');
  
  const fieldMappings = {
    // Basic form field mappings
    'plate': [helper.vehicle?.plate, helper.meta?.plate],
    'manufacturer': [helper.vehicle?.manufacturer],
    'model': [helper.vehicle?.model],
    'year': [helper.vehicle?.year],
    'owner': [helper.stakeholders?.owner?.name],
    'chassis': [helper.vehicle?.chassis],
    'km': [helper.vehicle?.km],
    'engine_volume': [helper.vehicle?.engine_volume],
    'fuel_type': [helper.vehicle?.fuel_type],
    'ownership_type': [helper.vehicle?.ownership_type],
    'trim': [helper.vehicle?.trim]
  };
  
  Object.entries(fieldMappings).forEach(([fieldId, possibleValues]) => {
    const element = document.getElementById(fieldId);
    if (element) {
      // Find the first non-empty value
      const value = possibleValues.find(v => v && v !== '');
      if (value && (!element.value || element.value.trim() === '')) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`  ✅ Populated ${fieldId} = ${value}`);
      }
    }
  });
}

/**
 * Trigger change events on existing field values
 */
function triggerFieldChangeEvents() {
  const fields = ['plate', 'manufacturer', 'model', 'year', 'owner', 'chassis', 'km'];
  
  fields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element && element.value) {
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

// Export the fixed function
export { processIncomingDataEnhanced };

// Replace the global function
if (typeof window !== 'undefined') {
  window.processIncomingDataEnhanced = processIncomingDataEnhanced;
  window.forceRefreshAllForms = forceRefreshAllForms;
  
  console.log('✅ Enhanced data capture functions loaded');
}