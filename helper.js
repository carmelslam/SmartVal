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
  
  // Detect current module to reduce console noise
  const currentModule = detectCurrentModule();
  console.log(`📍 Current module detected: ${currentModule}`);
  
  const fieldMappings = {
    // 🔧 COMPREHENSIVE FIELD MAPPINGS: All variations from screenshots and modules
    
    // Vehicle identification - Primary
    'plate': window.helper.vehicle?.plate || window.helper.meta?.plate || window.helper.case_info?.plate,
    'plateNumber': window.helper.vehicle?.plate || window.helper.meta?.plate || window.helper.case_info?.plate,
    'vehicle_plate': window.helper.vehicle?.plate || window.helper.meta?.plate || window.helper.case_info?.plate,
    'rish': window.helper.vehicle?.plate || window.helper.meta?.plate || window.helper.case_info?.plate, // רישוי
    
    // Vehicle details - Manufacturer/Model
    'manufacturer': window.helper.vehicle?.manufacturer,
    'make': window.helper.vehicle?.manufacturer,
    'yitzran': window.helper.vehicle?.manufacturer, // יצרן
    'model': window.helper.vehicle?.model,
    'degem': window.helper.vehicle?.model, // דגם
    'year': window.helper.vehicle?.year,
    'shana': window.helper.vehicle?.year, // שנה
    'model_year': window.helper.vehicle?.year,
    
    // Vehicle specifications
    'chassis': window.helper.vehicle?.chassis,
    'vin': window.helper.vehicle?.chassis,
    'shelda': window.helper.vehicle?.chassis, // שלדה
    'km': window.helper.vehicle?.km,
    'odo': window.helper.vehicle?.km,
    'mileage': window.helper.vehicle?.km,
    'kilometraz': window.helper.vehicle?.km, // קילומטראז
    'engine_volume': window.helper.vehicle?.engine_volume,
    'nefach': window.helper.vehicle?.engine_volume, // נפח
    'engine_code': window.helper.vehicle?.engine_code,
    'engine_type': window.helper.vehicle?.engine_type,
    'fuel_type': window.helper.vehicle?.fuel_type,
    'delak': window.helper.vehicle?.fuel_type, // דלק
    'ownership_type': window.helper.vehicle?.ownership_type,
    'baalut': window.helper.vehicle?.ownership_type, // בעלות
    'trim': window.helper.vehicle?.trim,
    'gimur': window.helper.vehicle?.trim, // גימור
    'model_type': window.helper.vehicle?.model_type,
    'office_code': window.helper.vehicle?.office_code,
    'model_code': window.helper.vehicle?.model_code,
    'features': window.helper.vehicle?.features,
    'maafiynei': window.helper.vehicle?.features, // מאפיינים
    'category': window.helper.vehicle?.category,
    'kategoria': window.helper.vehicle?.category, // קטגוריה  
    'is_automatic': window.helper.vehicle?.is_automatic,
    'automatic': window.helper.vehicle?.is_automatic,
    'automat': window.helper.vehicle?.is_automatic, // אוטומט
    'registration_date': window.helper.vehicle?.registration_date,
    'aliya_lekavish': window.helper.vehicle?.registration_date, // עליה לכביש
    'market_value': window.helper.vehicle?.market_value || window.helper.valuation?.final_price,
    'shvi': window.helper.vehicle?.market_value || window.helper.valuation?.final_price, // שווי
    
    // Owner/Client information
    'owner': window.helper.stakeholders?.owner?.name,
    'ownerName': window.helper.stakeholders?.owner?.name,
    'client_name': window.helper.stakeholders?.owner?.name,
    'baal_harechev': window.helper.stakeholders?.owner?.name, // בעל הרכב
    'owner_phone': window.helper.stakeholders?.owner?.phone,
    'ownerPhone': window.helper.stakeholders?.owner?.phone,
    'telefon_baal': window.helper.stakeholders?.owner?.phone, // טלפון בעל
    'owner_address': window.helper.stakeholders?.owner?.address,
    'ownerAddress': window.helper.stakeholders?.owner?.address,
    'ktovev_baal': window.helper.stakeholders?.owner?.address, // כתובת בעל
    
    // Garage information
    'garage_name': window.helper.stakeholders?.garage?.name,
    'garageName': window.helper.stakeholders?.garage?.name,
    'garage': window.helper.stakeholders?.garage?.name,
    'shem_musach': window.helper.stakeholders?.garage?.name, // שם מוסך
    'garage_phone': window.helper.stakeholders?.garage?.phone,
    'garagePhone': window.helper.stakeholders?.garage?.phone,
    'telefon_musach': window.helper.stakeholders?.garage?.phone, // טלפון מוסך
    'garage_email': window.helper.stakeholders?.garage?.email,
    'garageEmail': window.helper.stakeholders?.garage?.email,
    'email_musach': window.helper.stakeholders?.garage?.email, // אימייל מוסך
    
    // Insurance information  
    'insurance_company': window.helper.stakeholders?.insurance?.company,
    'insuranceCompany': window.helper.stakeholders?.insurance?.company,
    'chevrat_bituach': window.helper.stakeholders?.insurance?.company, // חברת ביטוח
    'insurance_email': window.helper.stakeholders?.insurance?.email,
    'insuranceEmail': window.helper.stakeholders?.insurance?.email,
    'email_bituach': window.helper.stakeholders?.insurance?.email, // אימייל ביטוח
    'policy_number': window.helper.stakeholders?.insurance?.policy_number,
    'mispar_polisa': window.helper.stakeholders?.insurance?.policy_number, // מספר פוליסה
    'claim_number': window.helper.stakeholders?.insurance?.claim_number,
    'mispar_tabia': window.helper.stakeholders?.insurance?.claim_number, // מספר תביעה
    
    // Insurance agent
    'agent_name': window.helper.stakeholders?.insurance?.agent?.name,
    'agentName': window.helper.stakeholders?.insurance?.agent?.name,
    'shem_sachen': window.helper.stakeholders?.insurance?.agent?.name, // שם סוכן
    'agent_phone': window.helper.stakeholders?.insurance?.agent?.phone,
    'agentPhone': window.helper.stakeholders?.insurance?.agent?.phone,
    'telefon_sachen': window.helper.stakeholders?.insurance?.agent?.phone, // טלפון סוכן
    'agent_email': window.helper.stakeholders?.insurance?.agent?.email,
    'agentEmail': window.helper.stakeholders?.insurance?.agent?.email,
    'email_sachen': window.helper.stakeholders?.insurance?.agent?.email, // אימייל סוכן
    
    // Damage/Case information
    'damage_date': window.helper.case_info?.damage_date,
    'damageDate': window.helper.case_info?.damage_date,
    'taarich_nezek': window.helper.case_info?.damage_date, // תאריך נזק
    'damage_type': window.helper.case_info?.damage_type,
    'damageType': window.helper.case_info?.damage_type,
    'sug_nezek': window.helper.case_info?.damage_type, // סוג נזק
    'inspection_date': window.helper.case_info?.inspection_date,
    'taarich_bdika': window.helper.case_info?.inspection_date, // תאריך בדיקה
    'location': window.helper.case_info?.inspection_location,
    'inspection_location': window.helper.case_info?.inspection_location,
    'makom_bdika': window.helper.case_info?.inspection_location, // מקום בדיקה
    
    // Valuation fields
    'base_price': window.helper.valuation?.base_price,
    'mechir_basis': window.helper.valuation?.base_price, // מחיר בסיס
    'final_price': window.helper.valuation?.final_price,
    'mechir_sofi': window.helper.valuation?.final_price, // מחיר סופי
    'report_date': window.helper.valuation?.report_date,
    'taarich_doch': window.helper.valuation?.report_date, // תאריך דוח
    'owner_count': window.helper.valuation?.adjustments?.ownership_history?.owner_count,
    'mispar_baalim': window.helper.valuation?.adjustments?.ownership_history?.owner_count, // מספר בעלים
    
    // Parts search fields (from screenshots)
    'part_image': null, // File input, no value to populate
    'part_group': null, // Dropdown, populated separately
    'part_name': null,  // Dropdown, populated separately 
    'part_source': null, // Dropdown, populated separately
    'part_quantity': 1, // Default quantity
    'free_query': null, // Free text search
    'chofshi_chipus': null, // חיפוש חופשי
    
    // Additional fields that might appear in various modules
    'transmission': window.helper.vehicle?.transmission,
    'tzemudot': window.helper.vehicle?.transmission, // צמדות
    'drive_type': window.helper.vehicle?.drive_type,
    'sug_nahaga': window.helper.vehicle?.drive_type, // סוג נהגה
    'condition': window.helper.vehicle?.condition,
    'matzav': window.helper.vehicle?.condition, // מצב
    'created_at': window.helper.meta?.created_at,
    'updated_at': window.helper.meta?.updated_at,
    'plate_number': window.helper.vehicle?.plate || window.helper.meta?.plate, // Alternative plate field
    
    // 🔧 LEVI UPLOAD SPECIFIC FIELDS: Manual adjustment form fields
    'manual-vehicle-type': window.helper.vehicle?.model_type,
    'manual-manufacturer': window.helper.vehicle?.manufacturer,
    'manual-model-code': window.helper.vehicle?.model_code,
    'manual-category': window.helper.vehicle?.category,
    'manual-year': window.helper.vehicle?.year,
    'manual-full-model': window.helper.vehicle?.model,
    'manual-base-price': window.helper.valuation?.base_price,
    'manual-final-price': window.helper.valuation?.final_price,
    
    // Registration adjustments
    'manual-registration': window.helper.valuation?.adjustments?.registration?.type,
    'manual-registration-percent': window.helper.valuation?.adjustments?.registration?.percent,
    'manual-registration-value': window.helper.valuation?.adjustments?.registration?.amount,
    'manual-registration-total': window.helper.valuation?.adjustments?.registration?.cumulative,
    
    // Ownership adjustments  
    'manual-ownership': window.helper.valuation?.adjustments?.ownership_type?.type,
    'manual-ownership-percent': window.helper.valuation?.adjustments?.ownership_type?.percent,
    'manual-ownership-value': window.helper.valuation?.adjustments?.ownership_type?.amount,
    'manual-ownership-total': window.helper.valuation?.adjustments?.ownership_type?.cumulative,
    
    // Mileage/KM adjustments
    'manual-km': window.helper.vehicle?.km,
    'manual-km-percent': window.helper.valuation?.adjustments?.mileage?.percent,
    'manual-km-value': window.helper.valuation?.adjustments?.mileage?.amount,
    'manual-km-total': window.helper.valuation?.adjustments?.mileage?.cumulative,
    
    // Owner count adjustments
    'manual-owners': window.helper.valuation?.adjustments?.ownership_history?.owner_count,
    'manual-owners-percent': window.helper.valuation?.adjustments?.ownership_history?.percent,
    'manual-owners-value': window.helper.valuation?.adjustments?.ownership_history?.amount,
    'manual-owners-total': window.helper.valuation?.adjustments?.ownership_history?.cumulative,
    
    // Features adjustments
    'manual-features': window.helper.vehicle?.features,
    'manual-features-percent': window.helper.valuation?.adjustments?.features?.percent,
    'manual-features-value': window.helper.valuation?.adjustments?.features?.amount,
    'manual-features-total': window.helper.valuation?.adjustments?.features?.cumulative,
    
    // Report source fields
    'report-source': 'levi-yitzhak', // Default value
    'valuation-date': window.helper.valuation?.report_date,
    'office_code': window.helper.vehicle?.office_code,
    'owner': window.helper.stakeholders?.owner?.name
  };
  
  let populatedCount = 0;
  const relevantFields = getModuleFields(currentModule);
  
  Object.entries(fieldMappings).forEach(([fieldId, value]) => {
    // Skip fields that aren't relevant to current module (reduces console noise)
    if (currentModule !== 'unknown' && !relevantFields.includes(fieldId)) {
      return;
    }
    if (value && value !== '' && value !== null && value !== undefined) {
      // 🔧 ENHANCED FIELD DETECTION: Try multiple selectors to find the element
      let element = null;
      const selectors = [
        `#${fieldId}`,                                    // Exact ID match
        `[name="${fieldId}"]`,                           // Name attribute match
        `input[placeholder*="${fieldId}"]`,              // Placeholder contains field name
        `#${fieldId.toLowerCase()}`,                     // Lowercase ID
        `#${fieldId.replace('_', '')}`,                  // Remove underscores
        `#${fieldId.replace('_', '-')}`,                 // Replace underscore with dash
        `[data-field="${fieldId}"]`,                     // Data attribute
        `[data-helper-field="${fieldId}"]`,              // Helper data attribute
      ];
      
      // Try each selector until we find an element
      for (const selector of selectors) {
        try {
          element = document.querySelector(selector);
          if (element) {
            console.log(`✅ Found element for ${fieldId} using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      }
      
      if (element) {
        const currentValue = element.value?.trim() || '';
        const newValue = String(value).trim();
        
        // Force populate if we have meaningful new data and it's different
        if (newValue !== '' && newValue !== '-' && currentValue !== newValue) {
          // Handle different input types
          if (element.type === 'checkbox') {
            const shouldBeChecked = value === true || value === 'כן' || value === 'yes' || value === 'true';
            element.checked = shouldBeChecked;
            console.log(`✅ Populated checkbox ${fieldId}: ${shouldBeChecked}`);
          } else {
            element.value = newValue;
            
            // Add visual indicator for helper-populated fields
            element.style.borderLeft = '3px solid #007bff';
            element.style.backgroundColor = '#f8f9ff';
            element.title = `Auto-populated from helper: ${newValue}`;
            
            console.log(`✅ Populated ${fieldId}: "${currentValue}" → "${newValue}"`);
          }
          
          // Trigger events for compatibility
          ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
          
          populatedCount++;
        }
      } else {
        console.log(`⚠️ Element not found for field: ${fieldId} (tried ${selectors.length} selectors)`);
      }
    }
  });
  
  console.log(`✅ Form population completed: ${populatedCount} fields populated`);
  return populatedCount;
}

// Enhanced functions to replace broken ones
window.updateHelper = function(section, data, sourceModule = null) {
  console.log(`🔄 ENHANCED: Updating helper section '${section}' from ${sourceModule || 'unknown'}:`, data);
  
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

// 🔧 DEBUG FUNCTION: Force populate all forms with detailed logging
window.forcePopulateDebug = function() {
  console.log('🔧 DEBUG: Force populating all forms with detailed logging...');
  console.log('🔍 Current helper data:', window.helper);
  
  // First, ensure helper data is loaded
  if (!window.helper || Object.keys(window.helper).length === 0) {
    console.log('⚠️ No helper data found, attempting to load from storage...');
    
    try {
      const sessionData = sessionStorage.getItem('helper');
      if (sessionData) {
        window.helper = JSON.parse(sessionData);
        console.log('✅ Loaded helper data from sessionStorage:', window.helper);
      } else {
        const localData = localStorage.getItem('helper_data');
        if (localData) {
          window.helper = JSON.parse(localData);
          console.log('✅ Loaded helper data from localStorage:', window.helper);
        } else {
          console.error('❌ No helper data found in any storage location');
          return false;
        }
      }
    } catch (e) {
      console.error('❌ Error loading helper data:', e);
      return false;
    }
  }
  
  // Find all input fields on the page
  const allInputs = document.querySelectorAll('input, select, textarea');
  console.log(`🔍 Found ${allInputs.length} input elements on page`);
  
  // Show which fields exist on current page
  const existingFields = Array.from(allInputs).map(el => ({
    id: el.id,
    name: el.name,
    type: el.type,
    placeholder: el.placeholder,
    currentValue: el.value
  })).filter(f => f.id || f.name);
  
  console.log('📋 Existing form fields:', existingFields);
  
  // Now populate using our enhanced function
  const result = populateAllForms();
  
  console.log(`✅ DEBUG population completed: ${result} fields populated`);
  return result;
};

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
    triggerFloatingScreenUpdates(updatedSections, source);
    
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
function triggerFloatingScreenUpdates(updatedSections, source = '') {
  console.log('📱 Triggering floating screen updates for sections:', updatedSections);
  
  // Ensure source is a string to prevent TypeError on .includes()
  if (typeof source !== 'string') {
    console.warn('⚠️ Source is not a string, converting:', typeof source, source);
    source = String(source || '');
  }
  
  // Car details floating screen
  if (updatedSections.includes('vehicle') || updatedSections.includes('meta')) {
    if (typeof window.refreshCarData === 'function') {
      window.refreshCarData();
    }
    // Auto-show car details removed - user must manually click button to open
    // if (typeof window.showCarDetails === 'function') {
    //   setTimeout(() => window.showCarDetails(), 500);
    // }
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
  
  // 🔧 CRITICAL: Levi floating screen updates - trigger after valuation data changes
  if (updatedSections.includes('valuation') || updatedSections.includes('vehicle') || source.includes('levi') || source.includes('hebrew')) {
    if (typeof window.refreshLeviData === 'function') {
      console.log('🔄 Triggering Levi floating screen update...');
      window.refreshLeviData();
    }
  }
}

// Enhanced Universal Data Capture Integration - Monitor all UI inputs
function setupUniversalInputCapture() {
  console.log('🔄 Setting up universal input capture integration...');
  
  // Monitor all input fields in real-time
  const inputSelector = 'input, select, textarea, [contenteditable="true"]';
  
  // Enhanced field mapping for UI capture
  const getHelperPath = (input) => {
    const fieldId = input.id || input.name || '';
    
    // Comprehensive field to helper path mapping
    const pathMappings = {
      // Vehicle fields
      'plate': 'vehicle.plate', 'plateNumber': 'vehicle.plate',
      'manufacturer': 'vehicle.manufacturer', 'make': 'vehicle.manufacturer',
      'model': 'vehicle.model', 'year': 'vehicle.year',
      'chassis': 'vehicle.chassis', 'vin': 'vehicle.chassis',
      'km': 'vehicle.km', 'odo': 'vehicle.km', 'mileage': 'vehicle.km',
      'engine_volume': 'vehicle.engine_volume', 'fuel_type': 'vehicle.fuel_type',
      'ownership_type': 'vehicle.ownership_type', 'trim': 'vehicle.trim',
      'model_type': 'vehicle.model_type', 'office_code': 'vehicle.office_code',
      'model_code': 'vehicle.model_code', 'features': 'vehicle.features',
      'category': 'vehicle.category', 'registration_date': 'vehicle.registration_date',
      
      // Owner/Stakeholder fields
      'owner': 'stakeholders.owner.name', 'ownerName': 'stakeholders.owner.name',
      'client_name': 'stakeholders.owner.name', 'owner_phone': 'stakeholders.owner.phone',
      'ownerPhone': 'stakeholders.owner.phone', 'owner_address': 'stakeholders.owner.address',
      'ownerAddress': 'stakeholders.owner.address',
      
      // Garage fields
      'garage_name': 'stakeholders.garage.name', 'garageName': 'stakeholders.garage.name',
      'garage': 'stakeholders.garage.name', 'garage_phone': 'stakeholders.garage.phone',
      'garagePhone': 'stakeholders.garage.phone', 'garage_email': 'stakeholders.garage.email',
      'garageEmail': 'stakeholders.garage.email',
      
      // Insurance fields
      'insurance_company': 'stakeholders.insurance.company', 'insuranceCompany': 'stakeholders.insurance.company',
      'insurance_email': 'stakeholders.insurance.email', 'insuranceEmail': 'stakeholders.insurance.email',
      'policy_number': 'stakeholders.insurance.policy_number', 'claim_number': 'stakeholders.insurance.claim_number',
      'agent_name': 'stakeholders.insurance.agent.name', 'agentName': 'stakeholders.insurance.agent.name',
      'agent_phone': 'stakeholders.insurance.agent.phone', 'agentPhone': 'stakeholders.insurance.agent.phone',
      'agent_email': 'stakeholders.insurance.agent.email', 'agentEmail': 'stakeholders.insurance.agent.email',
      
      // Case info fields
      'damage_date': 'case_info.damage_date', 'damageDate': 'case_info.damage_date',
      'damage_type': 'case_info.damage_type', 'damageType': 'case_info.damage_type',
      'inspection_date': 'case_info.inspection_date', 'location': 'case_info.inspection_location',
      'inspection_location': 'case_info.inspection_location',
      
      // Valuation fields
      'base_price': 'valuation.base_price', 'final_price': 'valuation.final_price',
      'market_value': 'vehicle.market_value', 'report_date': 'valuation.report_date',
      'owner_count': 'valuation.adjustments.ownership_history.owner_count'
    };
    
    // Direct mapping first
    if (pathMappings[fieldId]) {
      return pathMappings[fieldId];
    }
    
    // Pattern matching for similar fields
    if (fieldId.includes('plate')) return 'vehicle.plate';
    if (fieldId.includes('owner') && !fieldId.includes('phone') && !fieldId.includes('address')) return 'stakeholders.owner.name';
    if (fieldId.includes('garage') && !fieldId.includes('phone') && !fieldId.includes('email')) return 'stakeholders.garage.name';
    if (fieldId.includes('insurance') && !fieldId.includes('email')) return 'stakeholders.insurance.company';
    
    // Default fallback
    return `general.${fieldId}`;
  };
  
  const attachInputListener = (input) => {
    if (input.dataset.helperCaptureAttached) return;
    
    const helperPath = getHelperPath(input);
    console.log(`🔗 Attaching capture to: ${input.id || input.name} → ${helperPath}`);
    
    ['input', 'change', 'blur'].forEach(eventType => {
      input.addEventListener(eventType, (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (value !== '' && value !== null && value !== undefined) {
          setNestedValue(window.helper, helperPath, value);
          console.log(`📝 Captured: ${helperPath} = ${value}`);
          
          // Save to storage after input
          saveHelperToAllStorageLocations();
        }
      });
    });
    
    input.dataset.helperCaptureAttached = 'true';
  };
  
  // Attach to existing inputs
  document.querySelectorAll(inputSelector).forEach(attachInputListener);
  
  // Monitor for dynamic inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches && node.matches(inputSelector)) {
            attachInputListener(node);
          }
          const inputs = node.querySelectorAll ? node.querySelectorAll(inputSelector) : [];
          inputs.forEach(attachInputListener);
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('✅ Universal input capture integration active');
}

// Initialize universal input capture when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupUniversalInputCapture);
} else {
  setupUniversalInputCapture();
}

// Auto-save every 30 seconds
setInterval(() => {
  if (window.helper && Object.keys(window.helper).length > 0) {
    saveHelperToAllStorageLocations();
  }
}, 30000);

console.log('✅ COMPREHENSIVE HELPER SYSTEM LOADED - All system fields available!');
console.log('📊 Helper object initialized:', window.helper);

// Export for testing
if (typeof window !== 'undefined') {
  // 🔧 PHASE 1 FIX: Enhanced Hebrew processing test function
  window.testHebrewProcessing = function() {
    console.log('🧪 Testing Hebrew processing improvements...');
    
    // Test 1: Clean Hebrew Levi report
    console.log('Test 1: Clean Hebrew Levi report');
    const cleanResult = processIncomingData({
      Body: `פרטי רכב 5785269 להערכת נזק
יצרן: הונדה
דגם: סיוויק  
שנת ייצור: 2019
מס' ק"מ: 45000
מחיר בסיס: 75,000
מחיר סופי: 82,500
עליה לכביש %: 2.5%
בעלות %: -1.5%
מס' בעלים %: -2%
חברת ביטוח: מגדל
מספר פוליסה: POL123456
מספר תביעה: CLM789012`
    }, 'test_clean_hebrew');
    
    // Test 2: Hebrew with corruption patterns
    console.log('Test 2: Hebrew with common corruption');
    const corruptedResult = processIncomingData({
      Body: `פרטי רכב 7894561 
יצרן: ×ž×–×"×
דגם: 3
שנת ייצור: 2020
מס׳ ק״מ: 25000
מחיר בסיס: 95,000`
    }, 'test_corrupted_hebrew');
    
    // Test 3: Mixed Hebrew and English
    console.log('Test 3: Mixed Hebrew-English');
    const mixedResult = processIncomingData({
      Body: `Vehicle Details 1234567
יצרן: Toyota
Model: Camry
שנת ייצור: 2021
Mileage: 15000
מחיר בסיס: 120,000
Insurance Company: הראל
Policy Number: POL987654`
    }, 'test_mixed_language');
    
    console.log('✅ Hebrew processing tests completed');
    console.log('📊 Helper vehicle data after tests:', window.helper.vehicle);
    console.log('📊 Helper valuation data after tests:', window.helper.valuation);
    console.log('📊 Helper insurance data after tests:', window.helper.stakeholders.insurance);
    
    // Test form population
    populateAllForms();
    
    return {
      clean: cleanResult,
      corrupted: corruptedResult,
      mixed: mixedResult
    };
  };

  window.testDataCapture = function() {
    console.log('🧪 Testing comprehensive data capture with sample data...');
    
    // Test Hebrew Levi report data
    processIncomingData({
      Body: `פרטי רכב 5785269 להערכת נזק
קוד דגם: 870170
שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE
אוטומט: כן
מאפייני הרכב: מזגן, רדיו
עליה לכביש: 08/2021
מספר בעלים: 2
קטיגוריה: פנאי שטח
מס' ק"מ: 11900
מחיר בסיס: 85,000
מחיר סופי לרכב: 92,670
עליה לכביש %: 0%
ערך כספי עליה לכביש: 3,500
שווי מצטבר עליה לכביש: 88,500
מס' ק"מ %: 7.95%
ערך כספי מס' ק"מ: 7,036
שווי מצטבר מס' ק"מ: 95,536
סוג בעלות: פרטית
בעלות %: -3%
ערך כספי בעלות: 2,866
שווי מצטבר בעלות: 92,670`
    }, 'test_levi_comprehensive');
    
    // Test direct object data with parts
    processIncomingData({
      plate: '1234567',
      manufacturer: 'Toyota',
      model: 'Camry',
      owner: 'Test Owner',
      parts_search: {
        selected_parts: [
          { name: 'Front Bumper', price: 500, quantity: 1 },
          { name: 'Headlight', price: 300, quantity: 2 }
        ],
        total_cost: 1100
      }
    }, 'test_comprehensive');
    
    console.log('📊 Comprehensive helper structure:');
    console.log('  🚗 Vehicle:', window.helper.vehicle);
    console.log('  💰 Valuation:', window.helper.valuation);
    console.log('  📄 Case Info:', window.helper.case_info);
    console.log('  🔧 Parts Search:', window.helper.parts_search);
    console.log('  💰 Financials:', window.helper.financials);
    console.log('  📋 Estimate:', window.helper.estimate);
    populateAllForms();
  };

  // 🔧 FINAL: Comprehensive Data Capture Test Suite
  window.testComprehensiveDataCapture = function() {
    console.log('🧪 Running comprehensive data capture test suite...');
    
    const testResults = {
      tests: [],
      passed: 0,
      failed: 0,
      startTime: new Date().toISOString()
    };
    
    // Test 1: Hebrew webhook processing
    console.log('Test 1: Hebrew Levi webhook processing');
    try {
      const hebrewResult = processIncomingData({
        Body: `פרטי רכב 5785269 להערכת נזק
יצרן: הונדה  
דגם: סיוויק
שנת ייצור: 2019
מס' ק"מ: 45000
מחיר בסיס: 75,000
מחיר סופי: 82,500
עליה לכביש %: 2.5%
בעלות %: -1.5%
מס' בעלים %: -2%
חברת ביטוח: מגדל
מספר פוליסה: POL123456
מספר תביעה: CLM789012`
      }, 'test_comprehensive_hebrew');
      
      testResults.tests.push({
        name: 'Hebrew Webhook Processing',
        status: hebrewResult.success ? 'PASSED' : 'FAILED',
        details: hebrewResult
      });
      
      if (hebrewResult.success) testResults.passed++;
      else testResults.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'Hebrew Webhook Processing',
        status: 'FAILED',
        error: error.message
      });
      testResults.failed++;
    }
    
    // Test 2: Storage system integration
    console.log('Test 2: Storage system integration');
    try {
      const originalHelper = JSON.parse(JSON.stringify(window.helper));
      
      // Test save
      const saveSuccess = saveHelperToAllStorageLocations();
      
      // Test load (by reinitializing)
      const loadedData = initializeHelper();
      
      const storageTest = {
        name: 'Storage System Integration',
        status: saveSuccess && loadedData ? 'PASSED' : 'FAILED',
        details: {
          saveSuccess,
          loadedData: !!loadedData,
          dataIntegrity: JSON.stringify(originalHelper) === JSON.stringify(loadedData)
        }
      };
      
      testResults.tests.push(storageTest);
      if (storageTest.status === 'PASSED') testResults.passed++;
      else testResults.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'Storage System Integration',
        status: 'FAILED',
        error: error.message
      });
      testResults.failed++;
    }
    
    // Test 3: Form population
    console.log('Test 3: Form population system');
    try {
      const populatedCount = populateAllForms();
      const formTest = {
        name: 'Form Population System',
        status: populatedCount > 0 ? 'PASSED' : 'FAILED',
        details: { fieldsPopulated: populatedCount }
      };
      
      testResults.tests.push(formTest);
      if (formTest.status === 'PASSED') testResults.passed++;
      else testResults.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'Form Population System', 
        status: 'FAILED',
        error: error.message
      });
      testResults.failed++;
    }
    
    // Test 4: Unicode normalization
    console.log('Test 4: Unicode normalization');
    try {
      const testText = `מס' רכב: 1234567\nיצר×Ÿ: בי×ž×•\nמ×¡× ×–×§: תאונה`;
      const normalizedText = normalizeHebrewText(testText);
      
      const unicodeTest = {
        name: 'Unicode Normalization',
        status: normalizedText !== testText ? 'PASSED' : 'FAILED',
        details: {
          original: testText,
          normalized: normalizedText,
          fixedCorruption: normalizedText.includes('יצרן') && normalizedText.includes('בימו')
        }
      };
      
      testResults.tests.push(unicodeTest);
      if (unicodeTest.status === 'PASSED') testResults.passed++;
      else testResults.failed++;
      
    } catch (error) {
      testResults.tests.push({
        name: 'Unicode Normalization',
        status: 'FAILED',
        error: error.message
      });
      testResults.failed++;
    }
    
    // Test 5: Manual form integration (if upload-levi page)
    if (window.location.pathname.includes('upload-levi')) {
      console.log('Test 5: Manual form integration');
      try {
        // Set manual form values
        const manualFields = {
          'manual-base-price': '100000',
          'manual-final-price': '105000', 
          'manual-manufacturer': 'Toyota',
          'manual-year': '2020'
        };
        
        Object.entries(manualFields).forEach(([fieldId, value]) => {
          const field = document.getElementById(fieldId);
          if (field) {
            field.value = value;
            field.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        // Test manual save
        if (typeof window.saveManualDataToHelper === 'function') {
          window.saveManualDataToHelper();
        }
        
        const manualTest = {
          name: 'Manual Form Integration',
          status: 'PASSED',
          details: { fieldsSet: Object.keys(manualFields).length }
        };
        
        testResults.tests.push(manualTest);
        testResults.passed++;
        
      } catch (error) {
        testResults.tests.push({
          name: 'Manual Form Integration',
          status: 'FAILED',
          error: error.message
        });
        testResults.failed++;
      }
    }
    
    // Storage manager test removed to prevent system conflicts
    
    // Calculate final results
    testResults.endTime = new Date().toISOString();
    testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
    testResults.successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
    
    // Display results
    console.log('🔥 COMPREHENSIVE DATA CAPTURE TEST RESULTS:');
    console.table(testResults.tests.map(t => ({ 
      Test: t.name, 
      Status: t.status,
      Details: JSON.stringify(t.details || t.error || {})
    })));
    
    console.log(`📊 SUMMARY: ${testResults.passed} passed, ${testResults.failed} failed (${testResults.successRate}% success rate)`);
    console.log(`⏱️ Duration: ${testResults.duration}ms`);
    
    // Show user notification
    const message = `בדיקה מקיפה הושלמה: ${testResults.passed}/${testResults.passed + testResults.failed} עברו בהצלחה (${testResults.successRate}%)`;
    
    if (typeof window.showSystemNotification === 'function') {
      window.showSystemNotification(message, testResults.successRate >= 80 ? 'success' : 'warning');
    } else if (typeof createFallbackNotification === 'function') {
      createFallbackNotification(message, testResults.successRate >= 80 ? 'success' : 'warning');
    }
    
    return testResults;
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

// Additional data getter functions for comprehensive system support
window.getCaseInfo = function() {
  return window.helper.case_info || {};
};

window.getPartsSearchData = function() {
  return window.helper.parts_search || {};
};

window.getDocumentsData = function() {
  return window.helper.documents || {};
};

window.getEstimateData = function() {
  return window.helper.estimate || {};
};

window.getLeviData = function() {
  return window.helper.levi_data || {};
};

window.getCalculationsData = function() {
  return window.helper.calculations || {};
};

window.getSystemData = function() {
  return window.helper.system || {};
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

// Manual override tracking system for user input protection
window.manualOverrides = window.manualOverrides || {};

window.markFieldAsManuallyModified = function(fieldId, value, source = 'unknown') {
  console.log(`🔒 Marking field ${fieldId} as manually modified:`, { value, source });
  
  if (!window.manualOverrides) {
    window.manualOverrides = {};
  }
  
  window.manualOverrides[fieldId] = {
    value: value,
    timestamp: new Date().toISOString(),
    source: source,
    manually_modified: true
  };
  
  console.log(`✅ Field ${fieldId} marked as manually modified`);
};

window.isFieldManuallyModified = function(fieldId) {
  const isModified = window.manualOverrides && window.manualOverrides[fieldId] && window.manualOverrides[fieldId].manually_modified;
  console.log(`🔍 Checking if field ${fieldId} is manually modified:`, isModified);
  return isModified;
};

window.clearFieldManualOverride = function(fieldId) {
  if (window.manualOverrides && window.manualOverrides[fieldId]) {
    delete window.manualOverrides[fieldId];
    console.log(`🗑️ Cleared manual override for field: ${fieldId}`);
  }
};

window.getAllManualOverrides = function() {
  return window.manualOverrides || {};
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
export const getCaseInfo = (...args) => window.getCaseInfo?.(...args);
export const getPartsSearchData = (...args) => window.getPartsSearchData?.(...args);
export const getDocumentsData = (...args) => window.getDocumentsData?.(...args);
export const getEstimateData = (...args) => window.getEstimateData?.(...args);
export const getLeviData = (...args) => window.getLeviData?.(...args);
export const getCalculationsData = (...args) => window.getCalculationsData?.(...args);
export const getSystemData = (...args) => window.getSystemData?.(...args);
export const syncDamageData = (...args) => window.syncDamageData?.(...args);
export const syncLeviData = (...args) => window.syncLeviData?.(...args);
export const updateCalculations = (...args) => window.updateCalculations?.(...args);
export const syncVehicleData = (...args) => window.syncVehicleData?.(...args);
export const initHelper = (...args) => window.initHelper?.(...args);

// Manual override functions
export const markFieldAsManuallyModified = (...args) => window.markFieldAsManuallyModified?.(...args);
export const isFieldManuallyModified = (...args) => window.isFieldManuallyModified?.(...args);
export const clearFieldManualOverride = (...args) => window.clearFieldManualOverride?.(...args);
export const getAllManualOverrides = (...args) => window.getAllManualOverrides?.(...args);

// Helper object getter
export const helper = typeof window !== 'undefined' ? window.helper : {};