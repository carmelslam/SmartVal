// 🗺️ COMPREHENSIVE FIELD MAPPING DICTIONARY
// Central authority for all field translations: Make.com ↔ Helper ↔ UI Forms
// Fixes the root cause of data flow issues across the entire system

/**
 * MASTER FIELD MAPPING CONFIGURATION
 * This dictionary defines the authoritative mapping between:
 * 1. Make.com webhook response fields
 * 2. Hebrew field names (from Levi OCR and user input)
 * 3. Helper structure (unified schema)
 * 4. UI form field IDs
 */

// ============================================================================
// 1. HEBREW TO ENGLISH TRANSLATION MAP
// ============================================================================
export const HEBREW_TO_ENGLISH = {
  // === Vehicle Identification ===
  'פרטי רכב': 'plate',
  'מס\' רכב': 'plate',
  "מס' רכב": 'plate',         // CRITICAL FIX: Real apostrophe from Make.com  
  'מס׳ רכב': 'plate',         // CRITICAL FIX: Hebrew geresh character
  'מס״ רכב': 'plate',         // CRITICAL FIX: Hebrew gershayim character
  'מספר רכב': 'plate',
  'מס רכב': 'plate',
  'לוחית רישוי': 'plate',
  'מספר לוחית': 'plate',
  
  // === Manufacturer & Model ===
  'שם היצרן': 'manufacturer',
  'יצרן': 'manufacturer',
  'שם רכב': 'manufacturer',
  'חברת יצור': 'manufacturer',
  'דגם': 'model',
  'שם דגם': 'model',
  'דגם רכב': 'model',
  
  // === Vehicle Type & Category ===
  'סוג הדגם': 'model_type',
  'סוג הרכב': 'vehicle_type',
  'סוג רכב': 'vehicle_type',
  'קטגוריה': 'category',
  'רמת גימור': 'trim',
  'גימור': 'trim',
  'גרסה': 'trim',
  
  // === Technical Specifications ===
  'מספר שילדה': 'chassis',
  'מספר שלדה': 'chassis',
  'שילדה': 'chassis',
  'VIN': 'chassis',
  'שנת ייצור': 'year',
  'שנת יצור': 'year',
  'שנה': 'year',
  'שנת רישום': 'registration_date',
  'עליה לכביש': 'registration_date',
  'תאריך רישום': 'registration_date',
  
  // === Engine & Fuel ===
  'נפח מנוע': 'engine_volume',
  'נפח': 'engine_volume',
  'סוג דלק': 'fuel_type',
  'דלק': 'fuel_type',
  'מספר דגם הרכב': 'model_code',
  'קוד דגם': 'model_code',
  'דגם מנוע': 'engine_model',
  'מנוע': 'engine_model',
  'הנעה': 'drive_type',
  'הילוכים': 'transmission',
  'תיבת הילוכים': 'transmission',
  
  // === Ownership & Registration ===
  'שם בעל הרכב': 'owner',
  'בעל הרכב': 'owner',
  'שם בעלים': 'owner',
  'בעלים': 'owner',
  'שם הבעלים': 'owner',
  'סוג בעלות': 'ownership_type',
  'בעלות': 'ownership_type',
  'מספר בעלים': 'owner_count',
  'כמות בעלים': 'owner_count',
  
  // === Location & Administration ===
  'קוד משרד התחבורה': 'office_code',
  'קוד משרד': 'office_code',
  'משרד רישוי': 'office_code',
  'מיקום': 'location',
  'מקום': 'location',
  'מקום בדיקה': 'inspection_location',
  'מקום הבדיקה': 'inspection_location',  // CRITICAL FIX: Hebrew with definite article from Make.com
  'מוסך': 'garage_name',
  'שם מוסך': 'garage_name',
  'מוסך מטפל': 'garage_name',
  
  // === Vehicle Condition & Usage ===
  'קילומטר': 'km',
  'קילומטראז': 'km',
  'ק"מ': 'km',
  'מד האץ': 'km',
  'מד המהירות': 'km',
  'צבע': 'color',
  'מספר דלתות': 'doors',
  'דלתות': 'doors',
  'מאפיינים': 'features',
  'אביזרים': 'features',
  'ציוד נוסף': 'features',
  
  // === Valuation Fields (from Levi OCR) ===
  'מחיר בסיס': 'base_price',
  'מחיר בסיסי': 'base_price',
  'מחיר סופי לרכב': 'final_price',
  'שווי': 'market_value',
  'שווי שוק': 'market_value',
  'מחיר שוק': 'market_value',
  
  // === Adjustment Categories (Levi OCR specific) ===
  'עליה לכביש %': 'registration_percent',
  'ערך כספי עליה לכביש': 'registration_amount',
  'שווי מצטבר עליה לכביש': 'registration_cumulative',
  'מס ק"מ %': 'mileage_percent',
  'מס׳ ק"מ %': 'mileage_percent',
  'מס״ ק״מ %': 'mileage_percent',
  'ערך כספי מס\' ק"מ': 'mileage_amount',
  'ערך כספי מס׳ ק״מ': 'mileage_amount',
  'ערך כספי מס״ ק״מ': 'mileage_amount',
  'שווי מצטבר מס\' ק"מ': 'mileage_cumulative',
  'שווי מצטבר מס׳ ק״מ': 'mileage_cumulative',
  'שווי מצטבר מס״ ק״מ': 'mileage_cumulative',
  'בעלות %': 'ownership_type_percent',
  'ערך כספי בעלות': 'ownership_type_amount',
  'שווי מצטבר בעלות': 'ownership_type_cumulative',
  'מספר בעלים %': 'ownership_history_percent',
  'ערך כספי מס\' בעלים': 'ownership_history_amount',
  'ערך כספי מס׳ בעלים': 'ownership_history_amount',
  'ערך כספי מס״ בעלים': 'ownership_history_amount',
  'שווי מצטבר מס\' בעלים': 'ownership_history_cumulative',
  'שווי מצטבר מס׳ בעלים': 'ownership_history_cumulative',
  'שווי מצטבר מס״ בעלים': 'ownership_history_cumulative',
  'מחיר מאפיינים %': 'features_percent',
  'ערך כספי מאפיינים': 'features_amount',
  'שווי מצטבר מאפיינים': 'features_cumulative',
  
  // === Contact Information ===
  'כתובת': 'address',
  'כתובת בעלים': 'owner_address',
  'טלפון': 'phone',
  'טלפון בעלים': 'owner_phone',
  'אימייל': 'email',
  'דואר אלקטרוני': 'email',
  
  // === Insurance & Damage ===
  'חברת ביטוח': 'insurance_company',
  'ביטוח': 'insurance_company',
  'מספר פוליסה': 'policy_number',
  'פוליסה': 'policy_number',
  'סוכן ביטוח': 'insurance_agent',
  'סוכן': 'insurance_agent',
  'סוג נזק': 'damage_type',
  'נזק': 'damage_type',
  'תאריך נזק': 'damage_date',
  'תאריך בדיקה': 'inspection_date',
  'תאריך הבדיקה': 'inspection_date',  // CRITICAL FIX: Hebrew with definite article from Make.com
  'תאריך': 'timestamp'
};

// ============================================================================
// 2. MAKE.COM WEBHOOK FIELD MAPPING
// ============================================================================
export const MAKECOM_TO_HELPER = {
  // Direct field mappings from Make.com webhook response to helper structure
  
  // === Basic Vehicle Info ===
  'plate': 'vehicle.plate',
  'manufacturer': 'vehicle.manufacturer', 
  'model': 'vehicle.model',
  'year': 'vehicle.year',
  'chassis': 'vehicle.chassis',
  'km': 'vehicle.km',
  'office_code': 'vehicle.office_code',
  'ownership_type': 'vehicle.ownership_type',
  'registration_date': 'vehicle.registration_date',
  'trim': 'vehicle.trim',
  'model_type': 'vehicle.model_type',
  'model_code': 'vehicle.model_code',
  'engine_volume': 'vehicle.engine_volume',
  'fuel_type': 'vehicle.fuel_type',
  'transmission': 'vehicle.transmission',
  'drive_type': 'vehicle.drive_type',
  'features': 'vehicle.features',
  'color': 'vehicle.color',
  'category': 'vehicle.category',
  'condition': 'vehicle.condition',
  'market_value': 'vehicle.market_value',
  
  // === Case Information ===
  'case_id': 'case_info.case_id',
  'damage_date': 'case_info.damage_date',
  'inspection_date': 'case_info.inspection_date',
  'submission_date': 'case_info.submission_date',
  'inspection_location': 'case_info.inspection_location',
  'damage_type': 'case_info.damage_type',
  'status': 'case_info.status',
  
  // === Owner Information ===
  'owner': 'stakeholders.owner.name',
  'owner_name': 'stakeholders.owner.name',
  'ownerPhone': 'stakeholders.owner.phone',
  'owner_phone': 'stakeholders.owner.phone',
  'ownerAddress': 'stakeholders.owner.address',
  'owner_address': 'stakeholders.owner.address',
  'owner_email': 'stakeholders.owner.email',
  
  // === Garage Information ===
  'garage_name': 'stakeholders.garage.name',
  'garageName': 'stakeholders.garage.name',
  'garage_phone': 'stakeholders.garage.phone',
  'garagePhone': 'stakeholders.garage.phone',
  'garage_email': 'stakeholders.garage.email',
  'garageEmail': 'stakeholders.garage.email',
  'garage_address': 'stakeholders.garage.address',
  'garage_contact': 'stakeholders.garage.contact_person',
  
  // === Insurance Information ===
  'insurance_company': 'stakeholders.insurance.company',
  'insuranceCompany': 'stakeholders.insurance.company',
  'insurance_email': 'stakeholders.insurance.email',
  'insuranceEmail': 'stakeholders.insurance.email',
  'policy_number': 'stakeholders.insurance.policy_number',
  'claim_number': 'stakeholders.insurance.claim_number',
  'insurance_agent': 'stakeholders.insurance.agent.name',
  'insurance_agent_phone': 'stakeholders.insurance.agent.phone',
  'insurance_agent_email': 'stakeholders.insurance.agent.email',
  
  // === Valuation Data (from Levi) ===
  'base_price': 'valuation.base_price',
  'final_price': 'valuation.final_price',
  'valuation_date': 'valuation.valuation_date',
  'report_date': 'valuation.report_date',
  
  // === Legacy Fields (backward compatibility) ===
  'plate_number': 'vehicle.plate', // CRITICAL FIX: Map plate_number to plate
  'model_code_number': 'vehicle.model_code',
  'engine_model': 'vehicle.engine_model',
  'drive': 'vehicle.drive_type',
  'ownership': 'vehicle.ownership_type',
  'shaveh_percent': 'vehicle.condition',
  'odo': 'vehicle.km',
  'damageDate': 'case_info.damage_date',
  'damageType': 'case_info.damage_type'
};

// ============================================================================
// 3. UI FORM FIELD MAPPING
// ============================================================================
export const UI_FIELD_TO_HELPER = {
  // Maps UI form field IDs to helper data paths
  
  // === Vehicle Form Fields ===
  'plate': 'vehicle.plate',
  'manufacturer': 'vehicle.manufacturer',
  'model': 'vehicle.model',
  'year': 'vehicle.year',
  'trim': 'vehicle.trim',
  'chassis': 'vehicle.chassis',
  'km': 'vehicle.km',
  'office_code': 'vehicle.office_code',
  'model_type': 'vehicle.model_type',
  'model_code': 'vehicle.model_code',
  'engine_volume': 'vehicle.engine_volume',
  'fuel_type': 'vehicle.fuel_type',
  'transmission': 'vehicle.transmission',
  'drive_type': 'vehicle.drive_type',
  'drive': 'vehicle.drive_type', // Legacy alias
  'ownership_type': 'vehicle.ownership_type',
  'ownership': 'vehicle.ownership_type', // Legacy alias
  'registration_date': 'vehicle.registration_date',
  'features': 'vehicle.features',
  'color': 'vehicle.color',
  'condition': 'vehicle.condition',
  'market_value': 'vehicle.market_value',
  'base_price': 'valuation.base_price',
  'model_code_number': 'vehicle.model_code', // Legacy alias
  'engine_model': 'vehicle.engine_model',
  
  // === Case Information Fields ===
  'case_id': 'case_info.case_id',
  'damage_date': 'case_info.damage_date',
  'inspection_date': 'case_info.inspection_date',
  'submission_date': 'case_info.submission_date',
  'inspection_location': 'case_info.inspection_location',
  'damage_type': 'case_info.damage_type',
  'location': 'case_info.inspection_location', // Legacy alias
  'date': 'case_info.inspection_date', // Legacy alias (open-cases)
  
  // === Owner Fields ===
  'owner': 'stakeholders.owner.name',
  'owner_name': 'stakeholders.owner.name',
  'owner_phone': 'stakeholders.owner.phone',
  'phone': 'stakeholders.owner.phone', // Legacy alias
  'owner_address': 'stakeholders.owner.address',
  'address': 'stakeholders.owner.address', // Legacy alias
  'owner_email': 'stakeholders.owner.email',
  
  // === Garage Fields ===
  'garage': 'stakeholders.garage.name',
  'garage_name': 'stakeholders.garage.name',
  'garage_phone': 'stakeholders.garage.phone',
  'garage_email': 'stakeholders.garage.email',
  'garage_address': 'stakeholders.garage.address',
  'garage_contact': 'stakeholders.garage.contact_person',
  
  // === Insurance Fields ===
  'insurance_company': 'stakeholders.insurance.company',
  'insurance_email': 'stakeholders.insurance.email',
  'policy_number': 'stakeholders.insurance.policy_number',
  'claim_number': 'stakeholders.insurance.claim_number',
  'insurance_agent': 'stakeholders.insurance.agent.name',
  'insurance_agent_phone': 'stakeholders.insurance.agent.phone',
  'insurance_agent_email': 'stakeholders.insurance.agent.email'
};

// ============================================================================
// 4. REVERSE MAPPING: HELPER TO UI FIELDS
// ============================================================================
export const HELPER_TO_UI_FIELD = Object.fromEntries(
  Object.entries(UI_FIELD_TO_HELPER).map(([uiField, helperPath]) => [helperPath, uiField])
);

// ============================================================================
// 5. FIELD VALIDATION RULES
// ============================================================================
export const FIELD_VALIDATION = {
  'plate': {
    required: true,
    pattern: /^[\d\-\u05D0-\u05EA]+$/,
    description: 'License plate number (numbers, Hebrew, dashes)'
  },
  'year': {
    pattern: /^\d{4}$/,
    description: 'Four-digit year (e.g., 2020)'
  },
  'chassis': {
    pattern: /^[A-Z0-9]{17}$/,
    description: '17-character VIN number'
  },
  'km': {
    pattern: /^\d+$/,
    description: 'Numeric mileage value'
  },
  'engine_volume': {
    pattern: /^\d+$/,
    description: 'Engine volume in cc'
  },
  'owner_phone': {
    pattern: /^[\d\-\+\s\(\)]+$/,
    description: 'Valid phone number format'
  },
  'owner_email': {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Valid email address'
  }
};

// ============================================================================
// 6. UTILITY FUNCTIONS
// ============================================================================

/**
 * Translates Hebrew field name to English
 */
export function translateHebrewField(hebrewField) {
  return HEBREW_TO_ENGLISH[hebrewField] || hebrewField;
}

/**
 * Maps Make.com field to helper data path
 */
export function mapMakeComField(field) {
  return MAKECOM_TO_HELPER[field] || field;
}

/**
 * Maps UI field ID to helper data path
 */
export function mapUIField(fieldId) {
  return UI_FIELD_TO_HELPER[fieldId] || fieldId;
}

/**
 * Gets the UI field ID for a helper data path
 */
export function getUIFieldForHelper(helperPath) {
  return HELPER_TO_UI_FIELD[helperPath] || helperPath;
}

/**
 * Sets a nested value in an object using dot notation
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

/**
 * Gets a nested value from an object using dot notation
 */
export function getNestedValue(obj, path, defaultValue = '') {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current || defaultValue;
}

/**
 * Validates a field value according to its validation rules
 */
export function validateField(fieldName, value) {
  const rules = FIELD_VALIDATION[fieldName];
  if (!rules) return { valid: true };
  
  const errors = [];
  
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`${fieldName} is required`);
  }
  
  if (rules.pattern && value && !rules.pattern.test(value)) {
    errors.push(`${fieldName} format invalid: ${rules.description}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * CRITICAL FIX: Process incoming data with proper field mapping
 */
export function processIncomingDataWithMapping(data, source = 'unknown') {
  console.log(`🗺️ Processing incoming data with field mapping from ${source}:`, data);
  
  const mappedData = {};
  
  // Process each field in the incoming data
  Object.entries(data).forEach(([key, value]) => {
    let mappedKey = key;
    
    // Try Hebrew translation first
    if (HEBREW_TO_ENGLISH[key]) {
      mappedKey = HEBREW_TO_ENGLISH[key];
      console.log(`🔤 Hebrew translation: ${key} → ${mappedKey}`);
    }
    
    // Map to helper structure
    const helperPath = MAKECOM_TO_HELPER[mappedKey] || mappedKey;
    
    if (helperPath !== mappedKey) {
      console.log(`🗺️ Field mapping: ${mappedKey} → ${helperPath}`);
    }
    
    // Store the mapped data
    setNestedValue(mappedData, helperPath, value);
  });
  
  console.log('✅ Final mapped data structure:', mappedData);
  return mappedData;
}

/**
 * CRITICAL FIX: Populate UI form fields from helper data
 */
export function populateUIFromHelper(helper, formContainer = document) {
  console.log('🎯 Populating UI fields from helper data...');
  
  let fieldsPopulated = 0;
  
  // Iterate through all known UI field mappings
  Object.entries(UI_FIELD_TO_HELPER).forEach(([fieldId, helperPath]) => {
    const element = formContainer.getElementById ? formContainer.getElementById(fieldId) : formContainer.querySelector(`#${fieldId}`);
    
    if (element) {
      const value = getNestedValue(helper, helperPath);
      if (value && value !== '') {
        if (element.type === 'checkbox') {
          element.checked = Boolean(value);
        } else {
          element.value = value;
        }
        fieldsPopulated++;
        console.log(`  ✅ ${fieldId}: "${value}" (from ${helperPath})`);
      }
    }
  });
  
  console.log(`📊 Populated ${fieldsPopulated} UI fields from helper data`);
  return fieldsPopulated;
}

// ============================================================================
// 7. GLOBAL EXPORTS
// ============================================================================

// Make utility functions globally available
if (typeof window !== 'undefined') {
  window.FieldMapper = {
    translateHebrewField,
    mapMakeComField,
    mapUIField,
    getUIFieldForHelper,
    setNestedValue,
    getNestedValue,
    validateField,
    processIncomingDataWithMapping,
    populateUIFromHelper,
    HEBREW_TO_ENGLISH,
    MAKECOM_TO_HELPER,
    UI_FIELD_TO_HELPER,
    HELPER_TO_UI_FIELD,
    FIELD_VALIDATION
  };
  
  console.log('🗺️ Field Mapping Dictionary loaded successfully');
}