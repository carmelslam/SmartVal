// 🧠 Centralized Helper System - Enhanced Data Capture Solution
// Handles ALL data flow: Make.com webhooks, manual inputs, multilingual support

console.log('🧠 Loading enhanced helper system...');

// Removed storage manager to prevent system conflicts

// 🔧 PHASE 2 FIX: Use centralized storage manager for initialization
function initializeHelper() {
  console.log('🔄 Initializing helper - checking for existing data...');
  
  let existingData = null;
  
  try {
    const sessionData = sessionStorage.getItem('helper');
    if (sessionData && sessionData !== '{}') {
      existingData = JSON.parse(sessionData);
      console.log('✅ Found existing helper data in sessionStorage (fallback):', existingData);
    }
  } catch (e) {
    console.warn('⚠️ Could not load from sessionStorage:', e);
  }
  
  // Fallback to localStorage if sessionStorage is empty
  if (!existingData) {
    try {
      const localData = localStorage.getItem('helper_data');
      if (localData && localData !== '{}') {
        existingData = JSON.parse(localData);
        console.log('✅ Found existing helper data in localStorage (fallback):', existingData);
      }
    } catch (e) {
      console.warn('⚠️ Could not load from localStorage:', e);
    }
  }
  
  return existingData;
}

// Load existing data or create default structure
const existingHelper = initializeHelper();

// Create comprehensive helper system with ALL required fields
window.helper = existingHelper || {
  meta: {
    plate: '',
    case_id: 'YC-UNKNOWN-2025',
    created_at: new Date().toISOString(),
    last_updated: '',
    last_webhook_update: ''
  },
  vehicle: {
    plate: '',
    manufacturer: '',
    model: '',
    model_code: '',
    model_type: '',
    trim: '',
    year: '',
    chassis: '',
    engine_volume: '',
    fuel_type: '',
    transmission: '',
    is_automatic: false,
    drive_type: '',
    km: '',
    office_code: '',
    ownership_type: '',
    registration_date: '',
    category: '',
    features: '',
    condition: '',
    market_value: 0,
    created_at: '',
    updated_at: ''
  },
  case_info: {
    case_id: 'YC-UNKNOWN-2025',
    plate: '',
    status: 'active',
    damage_date: '',
    inspection_date: '',
    submission_date: '',
    created_at: '',
    inspection_location: '',
    damage_type: '',
    report_type: 'final',
    report_type_display: 'חוות דעת שמאי פרטית'
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
  valuation: {
    source: 'levi_yitzhak',
    report_date: '',
    valuation_date: '',
    base_price: 0,
    final_price: 0,
    currency: 'ILS',
    market_conditions: '',
    comparable_vehicles: [],
    adjustments: {
      registration: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        date: ''
      },
      mileage: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        km_value: 0
      },
      ownership_type: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        type: ''
      },
      ownership_history: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        owner_count: 0
      },
      features: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        feature_list: []
      },
      market_factors: {
        percent: 0,
        amount: 0,
        reason: ''
      }
    },
    depreciation: {
      global_percentage: 0,
      global_amount: 0,
      work_days_impact: 0,
      total_depreciation: 0
    },
    calculations: {
      gross_price: {
        base: 0,
        features_total: 0,
        registration_total: 0,
        total: 0
      },
      market_price: {
        gross_total: 0,
        mileage_adjustment: 0,
        ownership_type_adjustment: 0,
        ownership_history_adjustment: 0,
        market_factors_adjustment: 0,
        total: 0
      }
    }
  },
  financials: {
    costs: {
      parts_total: 0,
      repairs_total: 0,
      works_total: 0,
      subtotal: 0
    },
    fees: {
      photography: {
        count: 0,
        unit_price: 0,
        total: 0
      },
      office: {
        fixed_fee: 0,
        percentage: 0,
        total: 0
      },
      travel: {
        count: 0,
        unit_price: 0,
        total: 0
      },
      assessment: {
        hours: 0,
        hourly_rate: 0,
        total: 0
      },
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
    },
    calculation_date: '',
    calculation_method: '',
    overrides: []
  },
  parts_search: {
    search_history: [],
    all_results: [],
    selected_parts: [],
    unselected_parts: [],
    summary: {
      total_searches: 0,
      total_results: 0,
      selected_count: 0,
      last_search: ''
    }
  },
  documents: {
    images: [],
    invoices: [],
    reports: [],
    pdfs: [],
    other_files: [],
    photo_count: 0
  },
  estimate: {
    type: '',
    legal_text: '',
    attachments: '',
    report_title: '',
    generated: false,
    generated_date: ''
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
    version: '2.0.0-comprehensive',
    enhanced_data_capture: true,
    last_updated: new Date().toISOString(),
    processing_history: [],
    validation_status: {
      vehicle: false,
      damage: false,
      valuation: false,
      financials: false,
      estimate: false
    },
    integrations: {
      levi_processed: false,
      invoices_processed: false,
      images_uploaded: false,
      estimate_generated: false
    }
  }
};

// 🔧 CRITICAL FIX: If we have existing data, merge it with the default structure
if (existingHelper && typeof existingHelper === 'object') {
  console.log('🔄 Merging existing helper data with default structure...');
  
  // Deep merge function to preserve existing data while ensuring all required fields exist
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        target[key] = source[key];
      }
    }
  }
  
  // Apply the merge
  deepMerge(window.helper, existingHelper);
  console.log('✅ Helper data merged successfully:', window.helper);
  
  // Immediately trigger form population with restored data
  setTimeout(() => {
    console.log('🔄 Auto-populating forms with restored helper data...');
    if (typeof populateAllForms === 'function') {
      populateAllForms();
    }
    
    // Force broadcast update to all listening components
    if (typeof broadcastHelperUpdate === 'function') {
      broadcastHelperUpdate(['vehicle', 'stakeholders', 'case_info', 'valuation'], 'helper_restoration');
    }
  }, 500);
}

// 🔧 CRITICAL: Also watch for DOM changes and ensure forms are populated
if (typeof window !== 'undefined') {
  // Set up immediate population when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        console.log('🔄 DOM loaded - force populating forms...');
        if (window.helper && Object.keys(window.helper).length > 0) {
          populateAllForms();
        }
      }, 1000);
    });
  } else {
    // DOM already ready, populate immediately
    setTimeout(() => {
      console.log('🔄 DOM ready - force populating forms...');
      if (window.helper && Object.keys(window.helper).length > 0) {
        populateAllForms();
      }
    }, 1000);
  }
}

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

// 🔧 PHASE 1 FIX: Hebrew Text Normalization and Corruption Recovery
function normalizeHebrewText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  console.log('🔧 Starting Hebrew text normalization...');
  
  // Step 1: Detect and fix UTF-8 corruption patterns
  let normalizedText = text;
  
  // Common UTF-8 corruption patterns for Hebrew - using safer approach
  const corruptionMap = {};
  
  // Basic corruption patterns - focus on common issues that don't have encoding problems
  const corruptionPatterns = [
    // Safe patterns that work in all encodings
    ['â€™', '\'', 'Right single quotation mark'],
    ['â€œ', '"', 'Left double quotation mark'],
    ['â€', '"', 'Right double quotation mark'],
    ['Ã—', '×', 'Multiplication sign corruption'],
    ['Ã¡', 'á', 'Latin a with acute'],
    ['â€¦', '...', 'Ellipsis'],
    ['â€"', '-', 'Em dash'],
    ['â€"', '--', 'En dash'],
    // Hebrew-specific basic patterns
    ['×', '', 'Remove orphaned multiplication signs'],
    ['â€™', '\'', 'Fix apostrophes in Hebrew text'],
    ['Ã', '', 'Remove Latin prefix artifacts']
  ];
  
  // Build corruption map safely
  corruptionPatterns.forEach(([corrupted, correct, desc]) => {
    try {
      corruptionMap[corrupted] = correct;
    } catch (e) {
      console.warn(`⚠️ Could not add corruption pattern: ${desc}`, e);
    }
  });
  
  // Apply corruption fixes
  let fixedCorruption = false;
  for (const [corrupted, correct] of Object.entries(corruptionMap)) {
    if (normalizedText.includes(corrupted)) {
      normalizedText = normalizedText.replace(new RegExp(corrupted, 'g'), correct);
      console.log(`✅ Fixed UTF-8 corruption: "${corrupted}" → "${correct}"`);
      fixedCorruption = true;
    }
  }
  
  // Step 2: Normalize Unicode characters (NFD -> NFC)
  try {
    normalizedText = normalizedText.normalize('NFC');
  } catch (e) {
    console.warn('⚠️ Unicode normalization failed:', e);
  }
  
  // Step 3: Standardize Hebrew punctuation marks - using safer character codes
  const punctuationMap = {};
  
  // Build punctuation map programmatically to avoid syntax errors
  const punctuationPatterns = [
    // Format: [searchChar, replaceChar, description]
    ['\u2019', '\'', 'Right single quotation mark → Regular apostrophe'],
    ['\u2018', '\'', 'Left single quotation mark → Regular apostrophe'],
    ['\u05F3', '\'', 'Hebrew punctuation geresh → Regular apostrophe'],
    ['\u05F4', '"', 'Hebrew punctuation gershayim → Regular quotation'],
    ['`', '\'', 'Grave accent → Regular apostrophe'],
    ['\u2032', '\'', 'Prime symbol → Regular apostrophe'],
    ['\u2033', '"', 'Double prime → Regular quotation'],
    ['\uFF1A', ':', 'Fullwidth colon → Regular colon'],
    ['\uFF1B', ';', 'Fullwidth semicolon → Regular semicolon'],
    ['\uFF0C', ',', 'Fullwidth comma → Regular comma'],
    ['\u200F', '', 'Right-to-left mark (remove)'],
    ['\u200E', '', 'Left-to-right mark (remove)']
  ];
  
  // Build punctuation map safely
  punctuationPatterns.forEach(([search, replace, desc]) => {
    try {
      punctuationMap[search] = replace;
    } catch (e) {
      console.warn(`⚠️ Could not add punctuation pattern: ${desc}`, e);
    }
  });
  
  let fixedPunctuation = false;
  for (const [nonStandard, standard] of Object.entries(punctuationMap)) {
    if (normalizedText.includes(nonStandard)) {
      normalizedText = normalizedText.replace(new RegExp(escapeRegExp(nonStandard), 'g'), standard);
      console.log(`✅ Normalized punctuation: "${nonStandard}" → "${standard}"`);
      fixedPunctuation = true;
    }
  }
  
  // Step 4: Clean up extra whitespace and normalize spacing
  normalizedText = normalizedText
    .replace(/\s+/g, ' ')           // Multiple spaces → single space
    .replace(/\n\s*\n/g, '\n')      // Multiple newlines → single newline  
    .replace(/^\s+|\s+$/g, '')      // Trim whitespace
    .replace(/:\s+/g, ': ')         // Normalize colon spacing
    .replace(/\s+:/g, ':');         // Remove space before colon
  
  if (fixedCorruption || fixedPunctuation || normalizedText !== text) {
    console.log(`✅ Hebrew normalization completed:`, {
      original_length: text.length,
      normalized_length: normalizedText.length,
      corruption_fixed: fixedCorruption,
      punctuation_fixed: fixedPunctuation
    });
  }
  
  return normalizedText;
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced Hebrew Text Processing with Unicode Normalization and Corruption Detection
function processHebrewText(bodyText, result) {
  console.log('🔍 Extracting data from Hebrew text...');
  let updated = false;
  
  // 🔧 PHASE 1 FIX: Unicode normalization and UTF-8 corruption recovery
  bodyText = normalizeHebrewText(bodyText);
  
  console.log('📝 Processed Hebrew text:', bodyText);
  
  // Enhanced Hebrew patterns with comprehensive field variations and multiple encoding support
  const patterns = [
    // Plate number - multiple variants with better Hebrew support
    { regex: /(?:פרטי רכב|מס[׳״\'"`]*\s*רכב|מספר רכב|מס רכב|מס\'\s*רכב|מספר ציון|מספר זיהוי)[:\s-]*([0-9]{7,8})/i, field: 'plate', target: ['vehicle.plate', 'meta.plate', 'case_info.plate'] },
    
    // Manufacturer - expanded patterns
    { regex: /(?:שם היצרן|יצרן|שם\s*יצרן|יצרן\s*הרכב)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'manufacturer', target: ['vehicle.manufacturer'] },
    
    // Model - expanded patterns
    { regex: /(?:דגם|שם דגם|דגם רכב|דגם\s*הרכב|שם\s*הדגם)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'model', target: ['vehicle.model'] },
    
    // Year - handle multiple formats: MM/YYYY, YYYY, DD/MM/YYYY
    { regex: /(?:שנת ייצור|שנת יצור|שנת\s*ייצור|שנת\s*יצור|שנה|שנת\s*רכישה)[:\s-]*(?:(\d{1,2})\/)?(\d{4})(?:\/(\d{1,2}))?/i, field: 'year', target: ['vehicle.year'] },
    
    // Owner - comprehensive patterns
    { regex: /(?:שם בעל הרכב|בעל הרכב|שם בעלים|בעלים|שם\s*בעל\s*הרכב|בעל\s*הרכב|בעלי\s*הרכב)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'owner', target: ['stakeholders.owner.name'] },
    
    // Chassis/VIN - expanded patterns
    { regex: /(?:מספר שילדה|מספר שלדה|שילדה|מס\'\s*שילדה|מס\s*שילדה|מזהה שילדה|VIN)[:\s-]*([A-Z0-9]{8,})/i, field: 'chassis', target: ['vehicle.chassis'] },
    
    // Engine volume - various patterns
    { regex: /(?:נפח מנוע|נפח|נפח\s*מנוע|נפח\s*המנוע|עוצמת מנוע)[:\s-]*([0-9,]+)/i, field: 'engine_volume', target: ['vehicle.engine_volume'] },
    
    // Fuel type - expanded patterns
    { regex: /(?:סוג דלק|דלק|סוג\s*דלק|סוג\s*הדלק|סוג\s*הדלק|דלק\s*הרכב)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'fuel_type', target: ['vehicle.fuel_type'] },
    
    // Ownership type - multiple variations
    { regex: /(?:סוג בעלות|בעלות|סוג\s*בעלות|סוג\s*הבעלות|רישום|סוג רישום)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'ownership_type', target: ['vehicle.ownership_type'] },
    
    // Mileage - comprehensive patterns with comma support
    { regex: /(?:מס[׳״\'"`]*\s*ק[״׳\"'`]מ|קילומטר|ק[״׳\"'`]מ|מרחק\s*נסיעה|קילומטרים|מס\'\s*ק\"מ|מס\s*ק\"מ)[:\s-]*([0-9,]+)/i, field: 'km', target: ['vehicle.km'] },
    
    // Model type - expanded
    { regex: /(?:סוג הדגם|סוג הרכב|סוג\s*הדגם|סוג\s*רכב|קטגוריה|סיווג)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'model_type', target: ['vehicle.model_type'] },
    
    // Trim/Equipment level
    { regex: /(?:רמת גימור|גימור|רמת\s*גימור|רמת\s*ציוד|ציוד|דרגת\s*ציוד)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'trim', target: ['vehicle.trim'] },
    
    // Garage - expanded patterns
    { regex: /(?:מוסך|בית מלאכה|מוסך\s*מורשה|גרש|מרכז שירות)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'garage', target: ['stakeholders.garage.name'] },
    
    // Office code - MOT registration office
    { regex: /(?:קוד משרד התחבורה|קוד משרד|משרד התחבורה|קוד\s*משרד)[:\s-]*([0-9-]+)/i, field: 'office_code', target: ['vehicle.office_code'] },
    
    // Enhanced Levi-specific patterns with better Hebrew support
    { regex: /(?:קוד דגם|קוד\s*דגם|מזהה\s*דגם)[:\s-]*([0-9]+)/i, field: 'model_code', target: ['vehicle.model_code'] },
    { regex: /(?:שם דגם מלא|דגם מלא|שם\s*דגם\s*מלא|תיאור מלא)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'full_model_name', target: ['vehicle.model'] },
    { regex: /(?:אוטומט|תיבת הילוכים|הילוכים)[:\s-]*(כן|לא|אוטומטית|ידנית)/i, field: 'is_automatic', target: ['vehicle.is_automatic'] },
    { regex: /(?:מאפייני הרכב|מאפיינים|אבזור|ציוד נוסף)[:\s-]*([^\n\r\t]+?)(?:\s*(?:\n|\r|$))/i, field: 'features', target: ['vehicle.features'] },
    { regex: /(?:תאריך הוצאת הדו[״׳\"'`]ח|תאריך דוח|תאריך הערכה)[:\s-]*([0-9\/]+)/i, field: 'report_date', target: ['valuation.report_date'] },
    { regex: /(?:עליה לכביש|רישום|תאריך רישום|רישום ראשון)[:\s-]*([0-9\/]+)/i, field: 'registration_date', target: ['vehicle.registration_date'] },
    { regex: /(?:מספר בעלים|מס[׳״\'"`]*\s*בעלים|כמות בעלים|קודמים)[:\s-]*(\d+)/i, field: 'owner_count', target: ['valuation.adjustments.ownership_history.owner_count'] },
    { regex: /(?:קטיגוריה|קטגוריית רכב|סיווג רכב)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'category', target: ['vehicle.category'] },
    
    // Levi pricing data with enhanced number recognition
    { regex: /(?:מחיר בסיס|מחיר\s*בסיס|ערך בסיס)[:\s-]*([0-9,]+)/i, field: 'base_price', target: ['valuation.base_price'] },
    { regex: /(?:מחיר סופי לרכב|מחיר סופי|ערך סופי|שווי סופי)[:\s-]*([0-9,]+)/i, field: 'final_price', target: ['valuation.final_price'] },
    { regex: /(?:שווי שוק|ערך שוק|מחיר שוק)[:\s-]*([0-9,]+)/i, field: 'market_value', target: ['vehicle.market_value'] },
    
    // Levi adjustment patterns - Registration (enhanced + exact Make.com format)
    { regex: /(?:עליה לכביש\s*%|עליה לכביש\s*אחוז|התאמה עליה לכביש)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'registration_percent', target: ['valuation.adjustments.registration.percent'] },
    { regex: /(?:ערך כספי עליה לכביש|סכום עליה לכביש|התאמה כספית עליה לכביש)[:\s-]*([+-]?[0-9,]+)/i, field: 'registration_amount', target: ['valuation.adjustments.registration.amount'] },
    { regex: /(?:שווי מצטבר עליה לכביש|סך הכל עליה לכביש)[:\s-]*([0-9,]+)/i, field: 'registration_cumulative', target: ['valuation.adjustments.registration.cumulative'] },
    
    // 🔧 EXACT Make.com format for registration (from your example: "עליה לכביש % : 0%")  
    { regex: /עליה\s*לכביש\s*%\s*:\s*([+-]?[0-9.]+)%?/i, field: 'registration_percent', target: ['valuation.adjustments.registration.percent'] },
    { regex: /ערך\s*כספי\s*עליה\s*לכביש\s*:\s*([+-]?[0-9,]+)/i, field: 'registration_amount', target: ['valuation.adjustments.registration.amount'] },
    { regex: /שווי\s*מצטבר\s*עליה\s*לכביש\s*:\s*([0-9,]+)/i, field: 'registration_cumulative', target: ['valuation.adjustments.registration.cumulative'] },
    
    // Levi adjustment patterns - Mileage (enhanced + exact Make.com format)
    { regex: /(?:מס[׳״\'"`]*\s*ק[״׳\"'`]מ\s*%|קילומטראז\s*%|התאמת קילומטראז)[:\s-]*([+-]?[0-9.,]+)%?/i, field: 'mileage_percent', target: ['valuation.adjustments.mileage.percent'] },
    { regex: /(?:ערך כספי מס[׳״\'"`]*\s*ק[״׳\"'`]מ|ערך כספי קילומטראז|התאמה כספית ק\"מ)[:\s-]*([+-]?[0-9,]+)/i, field: 'mileage_amount', target: ['valuation.adjustments.mileage.amount'] },
    { regex: /(?:שווי מצטבר מס[׳״\'"`]*\s*ק[״׳\"'`]מ|סך הכל קילומטראז)[:\s-]*([0-9,]+)/i, field: 'mileage_cumulative', target: ['valuation.adjustments.mileage.cumulative'] },
    
    // 🔧 EXACT Make.com response format patterns (from your example)
    { regex: /מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*%\s*:\s*([+-]?[0-9.,]+)/i, field: 'mileage_percent', target: ['valuation.adjustments.mileage.percent'] },
    { regex: /ערך\s*כספי\s*מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*:\s*([+-]?[0-9,]+)/i, field: 'mileage_amount', target: ['valuation.adjustments.mileage.amount'] },
    { regex: /שווי\s*מצטבר\s*מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*:\s*([0-9,]+)/i, field: 'mileage_cumulative', target: ['valuation.adjustments.mileage.cumulative'] },
    
    // Levi adjustment patterns - Ownership Type (enhanced + exact Make.com format)
    { regex: /(?:סוג בעלות)[:\s-]*(פרטית|חברה|מסחרית|ציבורית)/i, field: 'ownership_value', target: ['valuation.adjustments.ownership_type.type'] },
    { regex: /(?:בעלות\s*%|אחוז בעלות|התאמת בעלות)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'ownership_percent', target: ['valuation.adjustments.ownership_type.percent'] },
    { regex: /(?:ערך כספי בעלות|התאמה כספית בעלות)[:\s-]*([+-]?[0-9,]+)/i, field: 'ownership_amount', target: ['valuation.adjustments.ownership_type.amount'] },
    { regex: /(?:שווי מצטבר בעלות|סך הכל בעלות)[:\s-]*([0-9,]+)/i, field: 'ownership_cumulative', target: ['valuation.adjustments.ownership_type.cumulative'] },
    
    // 🔧 EXACT Make.com format for ownership (from your example: "בעלות % : +7.95%")
    { regex: /בעלות\s*%\s*:\s*([+-]?[0-9.]+)%?/i, field: 'ownership_percent', target: ['valuation.adjustments.ownership_type.percent'] },
    { regex: /ערך\s*כספי\s*בעלות\s*:\s*([+-]?[0-9,]+)/i, field: 'ownership_amount', target: ['valuation.adjustments.ownership_type.amount'] },
    { regex: /שווי\s*מצטבר\s*בעלות\s*:\s*([0-9,]+)/i, field: 'ownership_cumulative', target: ['valuation.adjustments.ownership_type.cumulative'] },
    
    // Levi adjustment patterns - Ownership History (enhanced + exact Make.com format)
    { regex: /(?:מס[׳״\'"`]*\s*בעלים\s*%|מספר בעלים\s*%|התאמת בעלים)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'owners_percent', target: ['valuation.adjustments.ownership_history.percent'] },
    { regex: /(?:ערך כספי מס[׳״\'"`]*\s*בעלים|ערך כספי בעלים קודמים)[:\s-]*([+-]?[0-9,]+)/i, field: 'owners_amount', target: ['valuation.adjustments.ownership_history.amount'] },
    { regex: /(?:שווי מצטבר מס[׳״\'"`]*\s*בעלים|סך הכל בעלים קודמים)[:\s-]*([0-9,]+)/i, field: 'owners_cumulative', target: ['valuation.adjustments.ownership_history.cumulative'] },
    
    // 🔧 EXACT Make.com format for owner count (from your example: "מס' בעלים % : -3%")
    { regex: /מס[׳״\'\"`]*\s*בעלים\s*%\s*:\s*([+-]?[0-9.]+)%?/i, field: 'owners_percent', target: ['valuation.adjustments.ownership_history.percent'] },
    { regex: /ערך\s*כספי\s*מס[׳״\'\"`]*\s*בעלים\s*:\s*([+-]?[0-9,]+)/i, field: 'owners_amount', target: ['valuation.adjustments.ownership_history.amount'] },
    { regex: /שווי\s*מצטבר\s*מס[׳״\'\"`]*\s*בעלים\s*:\s*([0-9,]+)/i, field: 'owners_cumulative', target: ['valuation.adjustments.ownership_history.cumulative'] },
    
    // Levi adjustment patterns - Features (enhanced)
    { regex: /(?:מאפיינים\s*%|אבזור\s*%|התאמת מאפיינים|התאמת אבזור)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'features_percent', target: ['valuation.adjustments.features.percent'] },
    { regex: /(?:ערך כספי מאפיינים|ערך כספי אבזור|התאמה כספית מאפיינים)[:\s-]*([+-]?[0-9,]+)/i, field: 'features_amount', target: ['valuation.adjustments.features.amount'] },
    { regex: /(?:שווי מצטבר מאפיינים|סך הכל מאפיינים)[:\s-]*([0-9,]+)/i, field: 'features_cumulative', target: ['valuation.adjustments.features.cumulative'] },
    
    // Additional important fields for comprehensive capture
    { regex: /(?:תאריך נזק|תאריך\s*הנזק|מועד הנזק)[:\s-]*([0-9\/]+)/i, field: 'damage_date', target: ['case_info.damage_date'] },
    { regex: /(?:סוג נזק|סוג\s*הנזק|תיאור נזק)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'damage_type', target: ['case_info.damage_type'] },
    { regex: /(?:חברת ביטוח|ביטוח|מבטח)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'insurance_company', target: ['stakeholders.insurance.company'] },
    { regex: /(?:מספר פוליסה|פוליסה|מס[׳״\'"`]*\s*פוליסה)[:\s-]*([A-Z0-9-]+)/i, field: 'policy_number', target: ['stakeholders.insurance.policy_number'] },
    { regex: /(?:מספר תביעה|תביעה|מס[׳״\'"`]*\s*תביעה)[:\s-]*([A-Z0-9-]+)/i, field: 'claim_number', target: ['stakeholders.insurance.claim_number'] },
    
    // 🔧 PHASE 1 FIX: Additional missing Hebrew field mappings
    { regex: /(?:מקום בדיקה|מקום\s*בדיקה|מיקום בדיקה)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'inspection_location', target: ['case_info.inspection_location'] },
    { regex: /(?:תאריך בדיקה|תאריך\s*בדיקה|מועד בדיקה)[:\s-]*([0-9\/]+)/i, field: 'inspection_date', target: ['case_info.inspection_date'] },
    { regex: /(?:סוכן ביטוח|שם סוכן|סוכן)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'agent_name', target: ['stakeholders.insurance.agent.name'] },
    { regex: /(?:טלפון סוכן|טלפון\s*סוכן)[:\s-]*([0-9-]+)/i, field: 'agent_phone', target: ['stakeholders.insurance.agent.phone'] },
    { regex: /(?:אימייל סוכן|מייל סוכן)[:\s-]*([^\s]+@[^\s]+)/i, field: 'agent_email', target: ['stakeholders.insurance.agent.email'] },
    { regex: /(?:טלפון בעל הרכב|טלפון בעלים|טלפון\s*בעל)[:\s-]*([0-9-]+)/i, field: 'owner_phone', target: ['stakeholders.owner.phone'] },
    { regex: /(?:כתובת בעל הרכב|כתובת בעלים|כתובת\s*בעל)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'owner_address', target: ['stakeholders.owner.address'] },
    { regex: /(?:טלפון מוסך|טלפון\s*מוסך)[:\s-]*([0-9-]+)/i, field: 'garage_phone', target: ['stakeholders.garage.phone'] },
    { regex: /(?:אימייל מוסך|מייל מוסך)[:\s-]*([^\s]+@[^\s]+)/i, field: 'garage_email', target: ['stakeholders.garage.email'] },
    { regex: /(?:איש קשר מוסך|איש קשר)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'garage_contact', target: ['stakeholders.garage.contact_person'] },
    
    // Enhanced automatic transmission patterns
    { regex: /(?:תיבת הילוכים|הילוכים|גיר)[:\s-]*(אוטומטי|ידני|אוטומט|מקל)/i, field: 'transmission', target: ['vehicle.transmission'] },
    { regex: /(?:דלת|דלתות)[:\s-]*([0-9]+)/i, field: 'doors', target: ['vehicle.doors'] },
    { regex: /(?:צבע|צבע הרכב)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'color', target: ['vehicle.color'] },
    
    // Market conditions and comparisons
    { regex: /(?:תנאי שוק|מצב שוק)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i, field: 'market_conditions', target: ['valuation.market_conditions'] },
    
    // Enhanced phone number patterns for all stakeholders
    { regex: /(?:טלפון)[:\s-]*([0-9]{2,3}[-\s]?[0-9]{7,8})/i, field: 'general_phone', target: ['temp.phone'] }
  ];
  
  patterns.forEach(({ regex, field, target }) => {
    const match = bodyText.match(regex);
    if (match) {
      let value = match[1] || match[2] || match[3] || match[0];
      value = value ? value.trim() : '';
      
      // Skip empty values
      if (!value) return;
      
      // Enhanced value processing based on field type
      if (field === 'km' || field.includes('amount') || field.includes('cumulative') || field.includes('price') || field === 'engine_volume') {
        // Remove commas and spaces from numeric values
        value = value.replace(/[,\s]/g, '');
        // Convert to number if it's a pure number
        if (/^\d+$/.test(value)) {
          value = parseInt(value);
        }
      }
      
      if (field.includes('percent')) {
        // Handle percentage values - remove % symbol and convert to number
        value = value.replace(/%/g, '').trim();
        if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
          value = parseFloat(value);
        }
      }
      
      if (field === 'is_automatic') {
        // Convert Hebrew yes/no or automatic/manual to boolean
        value = value === 'כן' || value === 'אוטומטית' || value.toLowerCase() === 'automatic';
      }
      
      // Handle year - prefer 4-digit year from any capture group
      if (field === 'year') {
        if (match[2] && /^\d{4}$/.test(match[2])) {
          value = parseInt(match[2]);
        } else if (match[1] && /^\d{4}$/.test(match[1])) {
          value = parseInt(match[1]);
        } else if (/^\d{4}$/.test(value)) {
          value = parseInt(value);
        }
      }
      
      // Clean text fields - remove extra whitespace and special characters
      if (typeof value === 'string' && !field.includes('amount') && !field.includes('percent') && !field.includes('price') && field !== 'km') {
        value = value.replace(/\s+/g, ' ').trim();
        // Remove common OCR artifacts
        value = value.replace(/[^\u0590-\u05FF\u200F\u200Ea-zA-Z0-9\s\-\.\/\(\)]/g, '');
      }
      
      // Validate plate numbers (Israeli format: 7-8 digits)
      if (field === 'plate') {
        const plateMatch = value.match(/(\d{7,8})/);
        if (plateMatch) {
          value = plateMatch[1];
        }
      }
      
      // Set values in helper with validation
      target.forEach(path => {
        // Only update if we have a meaningful value
        if (value !== '' && value !== null && value !== undefined) {
          setNestedValue(window.helper, path, value);
        }
      });
      
      console.log(`✅ Extracted ${field}: ${value} (type: ${typeof value})`);
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
    // Vehicle fields - comprehensive mapping
    'plate': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'license_plate': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'מספר_רכב': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'מס_רכב': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'manufacturer': ['vehicle.manufacturer'],
    'make': ['vehicle.manufacturer'],
    'יצרן': ['vehicle.manufacturer'],
    'שם_היצרן': ['vehicle.manufacturer'],
    'model': ['vehicle.model'],
    'דגם': ['vehicle.model'],
    'שם_דגם': ['vehicle.model'],
    'year': ['vehicle.year'],
    'שנת_ייצור': ['vehicle.year'],
    'שנת_יצור': ['vehicle.year'],
    'chassis': ['vehicle.chassis'],
    'vin': ['vehicle.chassis'],
    'מספר_שילדה': ['vehicle.chassis'],
    'שילדה': ['vehicle.chassis'],
    'km': ['vehicle.km'],
    'mileage': ['vehicle.km'],
    'קילומטרים': ['vehicle.km'],
    'קילומטראז': ['vehicle.km'],
    'engine_volume': ['vehicle.engine_volume'],
    'נפח_מנוע': ['vehicle.engine_volume'],
    'fuel_type': ['vehicle.fuel_type'],
    'סוג_דלק': ['vehicle.fuel_type'],
    'דלק': ['vehicle.fuel_type'],
    'ownership_type': ['vehicle.ownership_type'],
    'סוג_בעלות': ['vehicle.ownership_type'],
    'בעלות': ['vehicle.ownership_type'],
    'trim': ['vehicle.trim'],
    'רמת_גימור': ['vehicle.trim'],
    'גימור': ['vehicle.trim'],
    'model_type': ['vehicle.model_type'],
    'סוג_הדגם': ['vehicle.model_type'],
    'office_code': ['vehicle.office_code'],
    'קוד_משרד': ['vehicle.office_code'],
    'model_code': ['vehicle.model_code'],
    'קוד_דגם': ['vehicle.model_code'],
    'features': ['vehicle.features'],
    'מאפיינים': ['vehicle.features'],
    'אבזור': ['vehicle.features'],
    'category': ['vehicle.category'],
    'קטיגוריה': ['vehicle.category'],
    'is_automatic': ['vehicle.is_automatic'],
    'אוטומט': ['vehicle.is_automatic'],
    
    // Owner fields
    'owner': ['stakeholders.owner.name'],
    'owner_name': ['stakeholders.owner.name'],
    'בעלים': ['stakeholders.owner.name'],
    'שם_בעל_הרכב': ['stakeholders.owner.name'],
    'owner_phone': ['stakeholders.owner.phone'],
    'owner_address': ['stakeholders.owner.address'],
    'client_name': ['stakeholders.owner.name'],
    
    // Garage fields
    'garage_name': ['stakeholders.garage.name'],
    'garage': ['stakeholders.garage.name'],
    'מוסך': ['stakeholders.garage.name'],
    'garage_phone': ['stakeholders.garage.phone'],
    'garage_email': ['stakeholders.garage.email'],
    
    // Insurance fields
    'insurance_company': ['stakeholders.insurance.company'],
    'חברת_ביטוח': ['stakeholders.insurance.company'],
    'ביטוח': ['stakeholders.insurance.company'],
    'insurance_email': ['stakeholders.insurance.email'],
    'policy_number': ['stakeholders.insurance.policy_number'],
    'מספר_פוליסה': ['stakeholders.insurance.policy_number'],
    'claim_number': ['stakeholders.insurance.claim_number'],
    'מספר_תביעה': ['stakeholders.insurance.claim_number'],
    'agent_name': ['stakeholders.insurance.agent.name'],
    'agent_phone': ['stakeholders.insurance.agent.phone'],
    'agent_email': ['stakeholders.insurance.agent.email'],
    
    // Case info fields
    'damage_date': ['case_info.damage_date'],
    'תאריך_נזק': ['case_info.damage_date'],
    'damage_type': ['case_info.damage_type'],
    'סוג_נזק': ['case_info.damage_type'],
    'inspection_date': ['case_info.inspection_date'],
    'תאריך_בדיקה': ['case_info.inspection_date'],
    'location': ['case_info.inspection_location'],
    'מקום_בדיקה': ['case_info.inspection_location'],
    
    // Valuation fields
    'base_price': ['valuation.base_price'],
    'מחיר_בסיס': ['valuation.base_price'],
    'final_price': ['valuation.final_price'],
    'מחיר_סופי': ['valuation.final_price'],
    'market_value': ['vehicle.market_value', 'valuation.final_price'],
    'שווי_שוק': ['vehicle.market_value'],
    'report_date': ['valuation.report_date'],
    'תאריך_דוח': ['valuation.report_date'],
    'registration_date': ['vehicle.registration_date'],
    'עליה_לכביש': ['vehicle.registration_date'],
    'owner_count': ['valuation.adjustments.ownership_history.owner_count'],
    'מספר_בעלים': ['valuation.adjustments.ownership_history.owner_count'],
    
    // Adjustment fields
    'registration_percent': ['valuation.adjustments.registration.percent'],
    'registration_amount': ['valuation.adjustments.registration.amount'],
    'mileage_percent': ['valuation.adjustments.mileage.percent'],
    'mileage_amount': ['valuation.adjustments.mileage.amount'],
    'ownership_percent': ['valuation.adjustments.ownership_type.percent'],
    'ownership_amount': ['valuation.adjustments.ownership_type.amount'],
    'owners_percent': ['valuation.adjustments.ownership_history.percent'],
    'owners_amount': ['valuation.adjustments.ownership_history.amount'],
    'features_percent': ['valuation.adjustments.features.percent'],
    'features_amount': ['valuation.adjustments.features.amount']
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

// Deep merge helper for merging objects without overwriting
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const key in source) {
    const srcVal = source[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

// 🔧 PHASE 2 FIX: Use centralized storage manager
// Centralized storage save using the new storage manager
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
    
    console.log('✅ Helper saved to all storage locations (fallback method)');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save helper to storage:', error);
    return false;
  }
}

// Detect current module to optimize field population
function detectCurrentModule() {
  const url = window.location.pathname.toLowerCase();
  const title = document.title.toLowerCase();
  
  if (url.includes('parts') || title.includes('parts')) return 'parts';
  if (url.includes('general') || title.includes('general')) return 'general';
  if (url.includes('levi') || url.includes('upload') || title.includes('levi')) return 'levi';
  if (url.includes('open') || url.includes('cases') || title.includes('cases')) return 'cases';
  if (url.includes('damage') || title.includes('damage')) return 'damage';
  
  // Check for specific form elements
  if (document.querySelector('#part_quantity, #free_query')) return 'parts';
  if (document.querySelector('#odo, #ownerPhone, #garageName')) return 'general';
  if (document.querySelector('#manual-base-price, #manual-final-price')) return 'levi';
  if (document.querySelector('#plate, #owner, #date, #location')) return 'cases';
  
  return 'unknown';
}

// Get relevant fields for current module
function getModuleFields(module) {
  const moduleFieldSets = {
    'parts': ['plate', 'manufacturer', 'model', 'year', 'chassis', 'vin', 'part_quantity', 'free_query', 'part_name', 'part_group'],
    'general': ['plate', 'odo', 'km', 'mileage', 'ownerPhone', 'owner_phone', 'ownerAddress', 'owner_address', 'garageName', 'garage_name', 'garagePhone', 'garage_phone', 'garageEmail', 'garage_email', 'agentName', 'agent_name', 'agentPhone', 'agent_phone', 'damageDate', 'damage_date'],
    'levi': ['manual-base-price', 'manual-final-price', 'manual-registration-percent', 'manual-km', 'plate'],
    'cases': ['plate', 'owner', 'date', 'location'],
    'damage': ['plate', 'damage_type', 'damage_date', 'location', 'inspection_location']
  };
  
  return moduleFieldSets[module] || Object.keys(moduleFieldSets).reduce((all, key) => [...all, ...moduleFieldSets[key]], []);
}

// Populate all forms from helper data
function populateAllForms() {
  console.log('🔄 Populating all forms from helper data');
  
  const currentModule = detectCurrentModule();
  const priorityFields = getModuleFields(currentModule);
  
  let updated = 0;
  
  // Helper data mapping with comprehensive field coverage
  const dataMapping = {
    // Basic vehicle info
    'plate': window.helper.vehicle?.plate || window.helper.meta?.plate,
    'plateNumber': window.helper.vehicle?.plate || window.helper.meta?.plate,
    'manufacturer': window.helper.vehicle?.manufacturer,
    'model': window.helper.vehicle?.model,
    'year': window.helper.vehicle?.year,
    'chassis': window.helper.vehicle?.chassis,
    'vin': window.helper.vehicle?.chassis,
    'km': window.helper.vehicle?.km,
    'odo': window.helper.vehicle?.km,
    'mileage': window.helper.vehicle?.km,
    'engine_volume': window.helper.vehicle?.engine_volume,
    'fuel_type': window.helper.vehicle?.fuel_type,
    'ownership_type': window.helper.vehicle?.ownership_type,
    'trim': window.helper.vehicle?.trim,
    'model_type': window.helper.vehicle?.model_type,
    'office_code': window.helper.vehicle?.office_code,
    'model_code': window.helper.vehicle?.model_code,
    'features': window.helper.vehicle?.features,
    'category': window.helper.vehicle?.category,
    'is_automatic': window.helper.vehicle?.is_automatic,
    
    // Owner info
    'owner': window.helper.stakeholders?.owner?.name,
    'ownerName': window.helper.stakeholders?.owner?.name,
    'client_name': window.helper.stakeholders?.owner?.name,
    'ownerPhone': window.helper.stakeholders?.owner?.phone,
    'owner_phone': window.helper.stakeholders?.owner?.phone,
    'ownerAddress': window.helper.stakeholders?.owner?.address,
    'owner_address': window.helper.stakeholders?.owner?.address,
    'ownerEmail': window.helper.stakeholders?.owner?.email,
    
    // Garage info
    'garage': window.helper.stakeholders?.garage?.name,
    'garageName': window.helper.stakeholders?.garage?.name,
    'garage_name': window.helper.stakeholders?.garage?.name,
    'garagePhone': window.helper.stakeholders?.garage?.phone,
    'garage_phone': window.helper.stakeholders?.garage?.phone,
    'garageEmail': window.helper.stakeholders?.garage?.email,
    'garage_email': window.helper.stakeholders?.garage?.email,
    'garageContact': window.helper.stakeholders?.garage?.contact_person,
    
    // Insurance info
    'insurance': window.helper.stakeholders?.insurance?.company,
    'insuranceCompany': window.helper.stakeholders?.insurance?.company,
    'insurance_company': window.helper.stakeholders?.insurance?.company,
    'agentName': window.helper.stakeholders?.insurance?.agent?.name,
    'agent_name': window.helper.stakeholders?.insurance?.agent?.name,
    'agentPhone': window.helper.stakeholders?.insurance?.agent?.phone,
    'agent_phone': window.helper.stakeholders?.insurance?.agent?.phone,
    'agentEmail': window.helper.stakeholders?.insurance?.agent?.email,
    'agent_email': window.helper.stakeholders?.insurance?.agent?.email,
    'policyNumber': window.helper.stakeholders?.insurance?.policy_number,
    'policy_number': window.helper.stakeholders?.insurance?.policy_number,
    'claimNumber': window.helper.stakeholders?.insurance?.claim_number,
    'claim_number': window.helper.stakeholders?.insurance?.claim_number,
    
    // Case info
    'damageDate': window.helper.case_info?.damage_date,
    'damage_date': window.helper.case_info?.damage_date,
    'damageType': window.helper.case_info?.damage_type,
    'damage_type': window.helper.case_info?.damage_type,
    'inspectionDate': window.helper.case_info?.inspection_date,
    'inspection_date': window.helper.case_info?.inspection_date,
    'location': window.helper.case_info?.inspection_location,
    'inspection_location': window.helper.case_info?.inspection_location,
    'date': window.helper.case_info?.damage_date || window.helper.case_info?.inspection_date,
    
    // Valuation fields
    'base_price': window.helper.valuation?.base_price,
    'final_price': window.helper.valuation?.final_price,
    'market_value': window.helper.vehicle?.market_value || window.helper.valuation?.final_price,
    'report_date': window.helper.valuation?.report_date,
    'registration_date': window.helper.vehicle?.registration_date,
    'owner_count': window.helper.valuation?.adjustments?.ownership_history?.owner_count,
    
    // Manual Levi form fields
    'manual-base-price': window.helper.valuation?.base_price,
    'manual-final-price': window.helper.valuation?.final_price,
    'manual-market-value': window.helper.vehicle?.market_value,
    'manual-km': window.helper.vehicle?.km,
    'manual-registration-percent': window.helper.valuation?.adjustments?.registration?.percent,
    'manual-km-percent': window.helper.valuation?.adjustments?.mileage?.percent,
    'manual-ownership-percent': window.helper.valuation?.adjustments?.ownership_type?.percent,
    'manual-owners-percent': window.helper.valuation?.adjustments?.ownership_history?.percent
  };

  // Populate form fields
  Object.entries(dataMapping).forEach(([fieldId, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const element = document.getElementById(fieldId) || 
                     document.querySelector(`[name="${fieldId}"]`) || 
                     document.querySelector(`input[placeholder*="${fieldId}"]`);
                     
      if (element) {
        const currentValue = element.value?.trim() || '';
        const newValue = String(value).trim();
        
        // Only update if different and meaningful
        if (newValue && newValue !== currentValue && newValue !== '-' && newValue !== 'undefined') {
          if (element.type === 'checkbox') {
            const shouldBeChecked = value === true || value === 'כן' || value === 'yes' || value === 'true';
            element.checked = shouldBeChecked;
          } else {
            element.value = newValue;
          }
          
          // Trigger events
          ['input', 'change', 'blur'].forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
          
          updated++;
          console.log(`✅ Updated ${fieldId}: ${newValue}`);
        }
      }
    }
  });
  
  console.log(`✅ Form population completed: ${updated} fields updated`);
  
  // Update helper timestamp
  window.helper.meta.last_updated = new Date().toISOString();
  saveHelperToAllStorageLocations();
}

// Simple helper update functions
window.updateHelper = function(field, value) {
  if (!window.helper) initializeHelper();

  const fieldMappings = {
    'plate': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'manufacturer': ['vehicle.manufacturer'],
    'model': ['vehicle.model'],
    'year': ['vehicle.year'],
    'owner': ['stakeholders.owner.name'],
    'garage': ['stakeholders.garage.name'],
    'insurance': ['stakeholders.insurance.company']
  };

  const targets = fieldMappings[field] || [field];
  targets.forEach(target => {
    // If value is an object and target refers to a section, merge instead of overwrite
    if (typeof value === 'object' && !Array.isArray(value) && target.split('.').length === 1) {
      const section = target;
      if (!window.helper[section] || typeof window.helper[section] !== 'object') {
        window.helper[section] = {};
      }
      deepMerge(window.helper[section], value);
    } else {
      setNestedValue(window.helper, target, value);
    }
  });

  saveHelperToAllStorageLocations();
  console.log(`Updated ${field}:`, value);
};

window.updateHelperAndSession = function(field, value) {
  updateHelper(field, value);
};

window.broadcastHelperUpdate = function(sections, source) {
  console.log(`Broadcasting helper update: ${sections.join(', ')} (source: ${source})`);
  setTimeout(() => populateAllForms(), 100);
};

// Simple test functions
window.testDataCapture = function() {
  console.log('🧪 Testing basic data capture...');
  console.log('Helper data:', window.helper);
  populateAllForms();
};

// Window-level helper functions
window.getVehicleData = function() {
  return window.helper?.vehicle || {};
};

window.getOwnerData = function() {
  return window.helper?.stakeholders?.owner || {};
};

// Auto-populate on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => populateAllForms(), 500);
  });
} else {
  setTimeout(() => populateAllForms(), 500);
}

console.log('✅ Helper system loaded and ready');

// Export all the functions that other modules need
export const helper = window.helper;
export const updateHelper = window.updateHelper;
export const updateHelperAndSession = window.updateHelperAndSession;
export const broadcastHelperUpdate = window.broadcastHelperUpdate;
export const processIncomingData = window.processIncomingData;
export const testDataCapture = window.testDataCapture;
export const getVehicleData = window.getVehicleData;
export const getOwnerData = window.getOwnerData;

// Additional exports that modules might need
export const saveHelperToStorage = saveHelperToAllStorageLocations;
export { saveHelperToAllStorageLocations };

// Data getter functions
export function getDamageData() {
  return window.helper?.damage_assessment || {};
}

export function getValuationData() {
  return window.helper?.valuation || {};
}

export function getFinancialData() {
  return window.helper?.financials || {};
}

export function syncVehicleData() {
  console.log('Syncing vehicle data...');
  populateAllForms();
}

export function syncDamageData() {
  console.log('Syncing damage data...');
  populateAllForms();
}

export function syncLeviData() {
  console.log('Syncing Levi data...');
  populateAllForms();
}

export function updateCalculations() {
  console.log('Updating calculations...');
  window.helper.meta.last_updated = new Date().toISOString();
  saveHelperToAllStorageLocations();
}

export function initHelper() {
  return initializeHelper();
}

// Missing function: markFieldAsManuallyModified
export function markFieldAsManuallyModified(fieldId, value, origin) {
  console.log(`🔄 Marking field ${fieldId} as manually modified:`, value, `(origin: ${origin})`);
  
  if (!window.helper) {
    initializeHelper();
  }
  
  // Create override record
  const override = {
    fieldId: fieldId,
    value: value,
    origin: origin,
    timestamp: new Date().toISOString(),
    type: 'manual_override'
  };
  
  // Initialize overrides array if it doesn't exist
  if (!window.helper.financials) {
    window.helper.financials = {};
  }
  if (!window.helper.financials.overrides) {
    window.helper.financials.overrides = [];
  }
  
  // Remove any existing override for this field
  window.helper.financials.overrides = window.helper.financials.overrides.filter(
    override => override.fieldId !== fieldId
  );
  
  // Add new override
  window.helper.financials.overrides.push(override);
  
  // Update helper timestamp
  window.helper.meta.last_updated = new Date().toISOString();
  
  // Save to storage
  saveHelperToAllStorageLocations();
  
  console.log(`✅ Field ${fieldId} marked as manually modified`);
}

// Missing function: refreshAllModuleForms
export function refreshAllModuleForms() {
  console.log('🔄 Refreshing all module forms...');
  populateAllForms();
}
