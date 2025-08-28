// final_report.js — Final Report Generation Engine (updated: draft logic = meta.core)

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';
import { getVehicleData, getDamageData, getValuationData, getFinancialData } from './helper.js';
import { vaultLoader } from './vault-loader.js';

const vault = window.vaultTexts || {};
import { sessionEngine } from './session.js';

let helper = sessionEngine.getDataSourceForFinal();

// Use standardized data access functions
const vehicleData = getVehicleData();
const damageData = getDamageData();
const valuationData = getValuationData();
const financialData = getFinancialData();

function buildFeeSummary() {
  // Check if fees_summary already exists in the helper structure
  if (helper.fees?.fees_summary) {
    console.log('✅ Using existing fees_summary from helper.fees:', helper.fees.fees_summary);
    // Map the existing structure to template expectations
    const existing = helper.fees.fees_summary;
    return {
      photography: existing.photography || { total: 0 },
      office: existing.office || { total: 0 }, 
      travel: existing.travel || { total: 0 },
      calculations: {
        subtotal: Math.round(existing.calculations?.fees_subtotal || existing.calculations?.subtotal || 0),
        vat: Math.round(existing.calculations?.vat_amount || existing.calculations?.vat || 0),
        vat_rate: existing.calculations?.vat_rate || existing.calculations?.vat_percent || 18,
        total: Math.round(existing.calculations?.total_with_vat || existing.calculations?.total || 0)
      }
    };
  }
  
  // Try multiple sources for fees data
  const fees = helper.financials?.fees || helper.fees || financialData.fees || {};
  
  console.log('🔍 Fees data sources:', {
    helper_fees: helper.fees,
    helper_financials_fees: helper.financials?.fees,
    financialData_fees: financialData.fees,  
    chosen_fees: fees,
    all_helper: helper
  });
  
  // Check if fees already has the expected structure
  if (fees.photography && fees.office && fees.travel && fees.calculations) {
    console.log('✅ Using existing fees structure:', fees);
    return fees;
  }
  
  // Check if fees has calculations already
  if (fees.calculations) {
    console.log('📊 Found existing calculations:', fees.calculations);
    // Use existing calculations if available
    return {
      photography: fees.photography || { total: 0 },
      office: fees.office || { total: 0 },
      travel: fees.travel || { total: 0 },
      calculations: fees.calculations
    };
  }
  
  // Get VAT rate - default to 18 if not found
  const vatRate = parseFloat(fees.PROTECTED_VAT_RATE) || parseFloat(fees.vat_rate) || 18;
  
  // Parse fee values - looking at the actual data structure
  const photography = parseFloat(fees.photography?.total) || parseFloat(fees.photography) || parseFloat(fees.media_fee) || 0;
  const office = parseFloat(fees.office?.total) || parseFloat(fees.office) || parseFloat(fees.office_fee) || 0;
  const travel = parseFloat(fees.travel?.total) || parseFloat(fees.travel) || parseFloat(fees.travel_fee) || 0;
  
  // If we have the values but no calculations, compute them
  const hasValues = photography > 0 || office > 0 || travel > 0;
  
  if (hasValues) {
    // Calculate subtotal, VAT and total
    const subtotal = photography + office + travel;
    const vat = Math.round(subtotal * (vatRate / 100));
    const total = subtotal + vat;
    
    console.log('✅ Calculated values from fees:', {
      photography, office, travel,
      subtotal, vat, vatRate, total
    });
    
    return {
      photography: { total: Math.round(photography) },
      office: { total: Math.round(office) },
      travel: { total: Math.round(travel) },
      calculations: {
        subtotal: Math.round(subtotal),
        vat: Math.round(vat),
        vat_rate: vatRate,
        total: Math.round(total)
      }
    };
  }
  
  // Default fallback - return zeros
  console.log('⚠️ No fee values found, returning default structure');
  
  return {
    photography: { total: 0 },
    office: { total: 0 },
    travel: { total: 0 },
    calculations: {
      subtotal: 0,
      vat: 0,
      vat_rate: vatRate,
      total: 0
    }
  };
}

// --- Determine Report Type and Draft Mode ---
const reportType = helper.meta?.report_type || 'unknown';

// Check URL parameters for expertise access (should always show draft watermark until finalized)
const urlParams = new URLSearchParams(window.location.search);
const fromExpertise = urlParams.get('from') === 'expertise';
const skipValidation = urlParams.get('skipValidation') === 'true';

// Draft mode: either explicitly set as draft, coming from expertise, or not finalized
const isDraft = helper.meta?.status === 'draft' || fromExpertise || skipValidation || !helper.meta?.finalized;
const isInvoiceOverride = helper.invoice_uploaded === true;

// --- Vault Placeholder Replacer ---
function fillVaultTemplate(text, replacements) {
  return text.replace(/%([^%]+)%/g, (match, key) => {
    return replacements[key] !== undefined ? replacements[key] : match;
  });
}

// --- Build Final Text Blocks ---
function buildVaultBlocks() {
  const baseText = vault[reportType] || {};

  return {
    legal_basis: fillVaultTemplate(baseText.legal_basis || '', getReplacementMap()),
    intellectual: baseText.intellectual_property || '',
    assessor_intro: baseText.assessor_introduction || '',
    assessor_qual: baseText.assessor_qualifications || '',
    legal_summary: fillVaultTemplate(baseText.legal_summary || '', getReplacementMap()),
    legal_declaration: baseText.legal_declaration || '',
    fees_desclaimer: getFeesLegalText(helper)
  };
}

// --- Value Mapping Logic ---
function getReplacementMap() {
  // Use standardized data access consistently
  const m = isInvoiceOverride ? helper.invoice_calculations : financialData.calculations || {};
  const d = isInvoiceOverride ? helper.invoice_depreciation : valuationData.depreciation || {};
  const f = isInvoiceOverride ? helper.invoice_fees : financialData.fees || {};

  return {
    "שווי_פיצוי": MathEngine.formatCurrency(m.total_compensation || financialData.totals?.total_compensation),
    "אחוז_נזק": `${MathEngine.round(m.damage_percent || damageData.summary?.damage_percentage)}%`,
    "ירידת_ערך": MathEngine.formatCurrency(d.global_amount || valuationData.depreciation?.global_amount),
    "אחוז_ירידת_ערך": `${MathEngine.round(d.global_percent || valuationData.depreciation?.global_percentage)}%`,
    "ימי_מוסך": d.work_days || valuationData.depreciation?.work_days_impact || 0,
    "שווי_שוק": MathEngine.formatCurrency(m.market_value || valuationData.final_price),
    "שווי_מחירון": MathEngine.formatCurrency(m.vehicle_value_gross || valuationData.base_price)
  };
}

// --- Handlebars Helpers ---
function setupHandlebarsHelpers() {
  if (typeof Handlebars !== 'undefined') {
    // Money formatter helper
    Handlebars.registerHelper('money', function(value) {
      const num = parseFloat(value) || 0;
      console.log('💰 Money helper called with value:', value, 'converted to:', num);
      return new Handlebars.SafeString(`${num.toLocaleString('he-IL')} ₪`);
    });
    
    // Simple number formatter helper (no currency symbol)
    Handlebars.registerHelper('number', function(value) {
      const num = parseFloat(value) || 0;
      return new Handlebars.SafeString(`${num.toLocaleString('he-IL')}`);
    });
    
    // Percent formatter helper
    Handlebars.registerHelper('percent', function(value) {
      const num = parseFloat(value) || 0;
      return new Handlebars.SafeString(`${num}%`);
    });
    
    // Lookup helper for vault texts
    Handlebars.registerHelper('lookup', function(obj, key, options) {
      return obj && obj[key] ? obj[key] : '';
    });
    
    // Each helper with greater than check
    Handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });
    
    // Equality check helper
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    // Length helper
    Handlebars.registerHelper('length', function(arr) {
      return Array.isArray(arr) ? arr.length : 0;
    });
  }
}

// --- Watermark Handling ---
function applyDraftWatermark(html) {
  if (!isDraft) return html;
  const watermark = '<div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:6rem; color:rgba(220, 38, 38, 0.2); z-index:9999; pointer-events:none; font-weight:bold;">טיוטה בלבד</div>';
  return watermark + html;
}

// --- Report Title Logic ---
function getReportTitle() {
  if (isDraft) return 'טיוטת חוות דעת';
  return vault[reportType]?.title || 'חוות דעת';
}

// --- Legal Text Generation ---
function generateLegalText(helper) {
  // Get legal text from builder first, then fallback to vault (matching estimate pattern)
  const builderLegalText = helper.final_report_legal_text || '';
  
  // If builder has text, use it
  if (builderLegalText) {
    return builderLegalText;
  }
  
  // Use coordinator pattern like estimate report
  const finalReportType = helper.final_report_type || helper.report_type || 'default';
  
  if (window.vaultLoader && typeof window.vaultLoader.loadLegalText === 'function') {
    try {
      const legalTextKey = `final_${finalReportType}`;
      const coordinatedText = window.vaultLoader.loadLegalText(legalTextKey, helper);
      if (coordinatedText) {
        return coordinatedText;
      }
    } catch (error) {
      console.warn('Error loading legal text from vault coordinator:', error);
    }
  }
  
  // Fallback to direct vault access - should be completely dynamic
  const vaultTexts = window.vaultTexts || helper.vault?.legal_texts || {};
  
  const legalText = helper.legal_texts?.[`final_${finalReportType}`] || 
                   helper.legal_texts?.final_default ||
                   vaultTexts[`final_${finalReportType}`]?.text ||
                   vaultTexts.final_default?.text ||
                   '';
  
  // Return only what's in the vault - no hardcoded fallbacks
  return legalText;
}

function getAttachmentsList(helper) {
  // Get attachments from helper (saved from final-report-builder)
  let attachmentsText = helper.final_report_attachments || '**לוטה**\nתצלומי הרכב הניזוק\nחשבוניות תיקון\nערך רכב ממוחשב\nחיפוש חלפים משומשים\nצילום רישיון הרכב\nשכר טרחה';
  
  // Convert plain text to HTML for display
  attachmentsText = attachmentsText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  
  return attachmentsText;
}

function getFeesLegalText(helper) {
  // Direct fallback to the fees disclaimer text from vault file
  const feesDisclaimerText = `שכר שמאי לפי זמן המושקע בתיק (שעת עבודה (placeholder)

הוצאות משרד על פי תחשיב יועץ מס (נסיעות לפי "חשב")

חשבון זה אינו מהווה חשבונית מס.

חשבונית מס תומצא לאחר קבלת התשלום.

פטור מלא מניכוי מס במקור
========================================================================
חוות דעת זו הינה רכושה הבלעדי של "ירון כיוף שמאות", חל איסור מוחלט לבצע בו כל שימוש, באים לא שולם מלוא התמורה וזו נפרעה בפועל בגינו.

חל איסור מוחלט להעתיק, לצלם, למסור או לעשות שימוש בדו"ח זה, או בחלק ממנו למי שאינו מוסמך ורשאי לכך, לרבות באים לא שילם את התמורה כאמור.
========================================================================`;

  return helper.fees_legal_text || feesDisclaimerText;
}

function getAssessorCredentials(helper) {
  // Get assessor credentials from vault - same pattern as legal text
  if (window.vaultLoader && typeof window.vaultLoader.loadLegalText === 'function') {
    try {
      const credentialsText = window.vaultLoader.loadLegalText('assessor_credentials', helper);
      if (credentialsText) {
        return credentialsText;
      }
    } catch (error) {
      console.warn('Error loading assessor credentials from vault coordinator:', error);
    }
  }
  
  // Fallback to direct vault access
  const vaultTexts = window.vaultTexts || helper.vault?.legal_texts || {};
  
  return helper.assessor_credentials || 
         vaultTexts.assessor_credentials?.text || 
         '';
}

// --- Populate Dynamic Content ---
function populateDynamicContent(helper) {
  // Populate dynamic legal text
  const legalTextElement = document.getElementById('dynamic-legal-text');
  if (legalTextElement) {
    const legalText = generateLegalText(helper);
    // Convert newlines to HTML breaks and format
    const formattedLegalText = legalText
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    
    legalTextElement.innerHTML = `
      <strong>הערות:</strong><br>
      ${formattedLegalText}<br><br>
      <strong>הצהרת שמאי:</strong><br>
      ${formattedLegalText}
    `;
  }
  
  // Populate dynamic attachments
  const attachmentsElement = document.getElementById('dynamic-attachments');
  if (attachmentsElement) {
    const attachmentsList = getAttachmentsList(helper);
    attachmentsElement.innerHTML = attachmentsList;
  }
  
  // Populate dynamic fees legal text from vault
  const feesLegalTextElement = document.getElementById('dynamic-fees-legal-text');
  if (feesLegalTextElement) {
    const feesLegalText = getFeesLegalText(helper);
    const formattedFeesLegalText = feesLegalText
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    
    feesLegalTextElement.innerHTML = formattedFeesLegalText;
  }
  
  // Populate dynamic assessor credentials from vault
  const assessorCredentialsElement = document.getElementById('dynamic-assessor-credentials');
  if (assessorCredentialsElement) {
    const assessorCredentials = getAssessorCredentials(helper);
    const formattedAssessorCredentials = assessorCredentials
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    
    assessorCredentialsElement.innerHTML = formattedAssessorCredentials;
  }
}

// --- Comprehensive Field Mapping System ---
function createComprehensiveFieldMapping(rawHelper) {
  const placeholder = "נתונים אלו ימולאו לאחר סיום בניית חוות הדעת";
  
  // DEBUG: Log the actual helper structure
  console.log('🔍 ACTUAL HELPER STRUCTURE:', rawHelper);
  console.log('🔍 Helper keys:', Object.keys(rawHelper));
  console.log('🔍 Centers:', rawHelper.centers);
  console.log('🔍 Levisummary:', rawHelper.levisummary);
  console.log('🔍 Levisummary base_price:', rawHelper.levisummary?.base_price);
  console.log('🔍 Levisummary final_price:', rawHelper.levisummary?.final_price);
  console.log('🔍 Levisummary adjustments:', rawHelper.levisummary?.adjustments);
  console.log('🔍 Car details:', rawHelper.car_details);
  console.log('🔍 Damage assessment:', rawHelper.damage_assessment);
  
  // Define all final report field mappings based on REAL structure
  const fieldMappings = {
    // Meta fields
    'meta.report_type_display': getValue(rawHelper, ['final_report.type', 'meta.report_type', 'report_type'], 'חוות דעת שמאי פרטית'),
    'meta.client_name': getValue(rawHelper, ['stakeholders.owner.name', 'general.owner_name', 'meta.client_name'], placeholder),
    'meta.address': getValue(rawHelper, ['stakeholders.owner.address', 'general.owner_address', 'meta.address'], placeholder),
    'meta.today': getValue(rawHelper, ['meta.today', 'case_info.inspection_date'], new Date().toLocaleDateString('he-IL')),
    'meta.plate': getValue(rawHelper, ['meta.plate', 'vehicle.plate', 'car_details.plate'], placeholder),
    'meta.phone_number': getValue(rawHelper, ['stakeholders.owner.phone', 'general.owner_phone', 'meta.phone_number'], placeholder),
    'meta.inspection_date': getValue(rawHelper, ['case_info.inspection_date', 'meta.inspection_date'], placeholder),
    'meta.incident_date': getValue(rawHelper, ['case_info.incident_date', 'meta.incident_date'], placeholder),
    'meta.damage_date': getValue(rawHelper, ['case_info.damage_date', 'meta.damage_date', 'case_info.incident_date'], placeholder),
    'meta.inspection_location': getValue(rawHelper, ['case_info.inspection_location', 'meta.inspection_location'], placeholder),
    'meta.location': getValue(rawHelper, ['meta.location', 'case_info.location'], placeholder),
    'meta.case_id': getValue(rawHelper, ['case_info.case_id', 'meta.case_id'], placeholder),
    'meta.damage': getValue(rawHelper, ['damage_info.damage_type', 'meta.damage'], placeholder),
    'meta.damage_type': getValue(rawHelper, ['damage_info.damage_type', 'meta.damage_type', 'meta.damage'], placeholder),
    
    // Vehicle fields - prioritize levisummary and car_details
    'helper.vehicle.model': getValue(rawHelper, ['levisummary.full_model', 'car_details.model', 'vehicle.model'], placeholder),
    'helper.vehicle.chassis': getValue(rawHelper, ['car_details.chassis', 'vehicle.chassis'], placeholder),
    'helper.vehicle.year': getValue(rawHelper, ['car_details.year', 'vehicle.year'], placeholder),
    'helper.vehicle.km': getValue(rawHelper, ['car_details.km', 'vehicle.km'], placeholder),
    'helper.vehicle.ownership_type': getValue(rawHelper, ['car_details.ownership_type', 'vehicle.ownership_type'], placeholder),
    'helper.vehicle.manufacturer': getValue(rawHelper, ['car_details.manufacturer', 'vehicle.manufacturer'], placeholder),
    'helper.vehicle.model_code': getValue(rawHelper, ['levisummary.model_code', 'car_details.model_code', 'vehicle.model_code'], placeholder),
    'helper.vehicle.full_description': getValue(rawHelper, ['levisummary.full_description', 'car_details.full_description', 'vehicle.full_description'], placeholder),
    'helper.vehicle.km_reading': getValue(rawHelper, ['car_details.km_reading', 'vehicle.km_reading', 'car_details.km'], placeholder),
    'helper.vehicle.market_value': getValue(rawHelper, ['vehicle.market_value', 'calculations.full_market_value', 'levisummary.final_price'], 0),
    
    // Damage fields - get from centers data
    'helper.damage.description': getValue(rawHelper, ['damage_info.description', 'damage.description'], placeholder),
    
    // Calculations - get from centers and damage_assessment totals (consumers, not feeders)
    'helper.calculations.total_damage': rawHelper.damage_assessment?.totals?.['Total with VAT'] || rawHelper.calculations?.total_damage || 0,
    'helper.calculations.vehicle_value_gross': rawHelper.levisummary?.final_price || rawHelper.levisummary?.['מחיר סופי לרכב'] || rawHelper.valuation?.final_price || 0,
    'helper.calculations.damage_percent': rawHelper.calculations?.damage_percent || '0%',
    'helper.calculations.market_value': rawHelper.levisummary?.final_price || rawHelper.levisummary?.['מחיר סופי לרכב'] || rawHelper.valuation?.final_price || 0,
    'helper.calculations.base_market_value': rawHelper.levisummary?.base_price || rawHelper.levisummary?.['מחיר בסיס'] || rawHelper.valuation?.base_price || 0,
    'helper.calculations.total_compensation': rawHelper.calculations?.total_compensation || 0,
    'helper.calculations.full_market_value': rawHelper.levisummary?.final_price || rawHelper.levisummary?.['מחיר סופי לרכב'] || rawHelper.calculations?.market_value || rawHelper.valuation?.final_price || rawHelper.calculations?.full_market_value || 0,
    
    // Levi/Valuation - PRIMARY SOURCE for all valuation data
    'helper.vehicle_value_base': rawHelper.levisummary?.base_price || rawHelper.levisummary?.['מחיר בסיס'] || rawHelper.valuation?.base_price || 0,
    'helper.levi.adjustments': rawHelper.levisummary?.adjustments || rawHelper.levi_data?.adjustments || [],
    
    // Depreciation
    'helper.depreciation.global_percent': getValue(rawHelper, ['depreciation.global_percent'], '0%'),
    'helper.depreciation.global_amount': getValue(rawHelper, ['depreciation.global_amount'], 0),
    'helper.expertise.depreciation.centers': getValue(rawHelper, ['expertise.depreciation.centers'], []),
    
    // Custom adjustments for market value table - PRIORITIZE LEVI SUMMARY
    'helper.custom_adjustments.full_market_adjustments': rawHelper.levisummary?.adjustments || rawHelper.custom_adjustments?.full_market_adjustments || rawHelper.levi_data?.adjustments || [],
    
    // Dynamic legal text and attachments
    'helper.final_report_legal_text': rawHelper.final_report_legal_text || '',
    'helper.final_report_type': rawHelper.final_report_type || rawHelper.report_type || 'default',
    'helper.final_report_attachments': rawHelper.final_report_attachments || '',
    
    // Additional mappings for commonly missed fields  
    'base_car_price': rawHelper.levisummary?.base_price || rawHelper.valuation?.base_price || 0,
    'damage_location': rawHelper.centers?.[0]?.Location || rawHelper.damage_info?.location || placeholder
  };
  
  console.log('🔍 Field mapping created:', fieldMappings);
  return fieldMappings;
}

function getValue(obj, paths, defaultValue) {
  for (const path of paths) {
    const value = getNestedValue(obj, path);
    if (value !== undefined && value !== null && value !== '') {
      console.log(`✅ Found value for ${path}:`, value);
      return value;
    } else {
      console.log(`❌ No value found for ${path}`);
    }
  }
  console.log(`🔄 Using default value for ${paths.join(', ')}:`, defaultValue);
  return defaultValue;
}

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length; i++) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[keys[i]];
  }
  
  return current;
}

// --- Transform Helper Data for Template ---
function transformHelperDataForTemplate(rawHelper) {
  // Debug centers data mapping
  console.log('🔄 Transforming helper data:', {
    rawHelper_centers: rawHelper.centers,
    rawHelper_damage_assessment_centers: rawHelper.damage_assessment?.centers,
    has_centers: !!(rawHelper.centers && rawHelper.centers.length > 0),
    has_damage_assessment_centers: !!(rawHelper.damage_assessment?.centers && rawHelper.damage_assessment.centers.length > 0)
  });

  // Create comprehensive field mapping
  const fieldMappings = createComprehensiveFieldMapping(rawHelper);

  // Ensure basic structure exists with mapped values
  const transformed = {
    vehicle: {
      model: fieldMappings['helper.vehicle.model'],
      chassis: fieldMappings['helper.vehicle.chassis'],
      year: fieldMappings['helper.vehicle.year'],
      km: fieldMappings['helper.vehicle.km'],
      ownership_type: fieldMappings['helper.vehicle.ownership_type'],
      manufacturer: fieldMappings['helper.vehicle.manufacturer'],
      model_code: fieldMappings['helper.vehicle.model_code'],
      full_description: fieldMappings['helper.vehicle.full_description'],
      km_reading: fieldMappings['helper.vehicle.km_reading'],
      market_value: fieldMappings['helper.vehicle.market_value']
    },
    centers: rawHelper.centers || rawHelper.damage_assessment?.centers || [],
    meta: {
      report_type_display: fieldMappings['meta.report_type_display'],
      client_name: fieldMappings['meta.client_name'],
      address: fieldMappings['meta.address'],
      today: fieldMappings['meta.today'],
      plate: fieldMappings['meta.plate'],
      phone_number: fieldMappings['meta.phone_number'],
      inspection_date: fieldMappings['meta.inspection_date'],
      incident_date: fieldMappings['meta.incident_date'],
      damage_date: fieldMappings['meta.damage_date'],
      inspection_location: fieldMappings['meta.inspection_location'],
      location: fieldMappings['meta.location'],
      case_id: fieldMappings['meta.case_id'],
      damage: fieldMappings['meta.damage'],
      damage_type: fieldMappings['meta.damage_type']
    },
    damage: {
      description: fieldMappings['helper.damage.description']
    },
    calculations: {
      total_damage: fieldMappings['helper.calculations.total_damage'],
      vehicle_value_gross: fieldMappings['helper.calculations.vehicle_value_gross'],
      damage_percent: fieldMappings['helper.calculations.damage_percent'],
      market_value: fieldMappings['helper.calculations.market_value'],
      base_market_value: fieldMappings['helper.calculations.base_market_value'],
      total_compensation: fieldMappings['helper.calculations.total_compensation'],
      full_market_value: fieldMappings['helper.calculations.full_market_value']
    },
    custom_adjustments: {
      full_market_adjustments: fieldMappings['helper.custom_adjustments.full_market_adjustments']
    },
    vehicle_value_base: fieldMappings['helper.vehicle_value_base'],
    levi: {
      adjustments: fieldMappings['helper.levi.adjustments']
    },
    depreciation: {
      global_percent: fieldMappings['helper.depreciation.global_percent'],
      global_amount: fieldMappings['helper.depreciation.global_amount']
    },
    expertise: {
      depreciation: {
        centers: fieldMappings['helper.expertise.depreciation.centers']
      }
    },
    damage_assessment: rawHelper.damage_assessment || {},
    
    // Add fees structure for template compatibility  
    fees: (() => {
      // Preserve original fees structure
      const originalFees = rawHelper.fees || {};
      const feesSummary = buildFeeSummary();
      console.log('🔧 Built fees_summary for helper:', feesSummary);
      console.log('🔍 Original fees data:', originalFees);
      return {
        ...originalFees,
        fees_summary: feesSummary
      };
    })(),
    
    // Dynamic legal text and attachments
    final_report_legal_text: fieldMappings['helper.final_report_legal_text'],
    final_report_type: fieldMappings['helper.final_report_type'],  
    final_report_attachments: fieldMappings['helper.final_report_attachments'],
    
    // Additional fields for complete mapping
    base_car_price: fieldMappings['base_car_price'],
    damage_location: fieldMappings['damage_location']
  };
  
  // Field mapping completed via comprehensive system above
  console.log('✅ Comprehensive field mapping applied:', {
    mappedFields: Object.keys(fieldMappings).length,
    placeholderFields: Object.values(fieldMappings).filter(v => v === "נתונים אלו ימולאו לאחר סיום בניית חוות הדעת").length
  });
  
  return transformed;
  
  if (!transformed.meta.address) {
    transformed.meta.address = rawHelper.stakeholders?.owner?.address || 
                              rawHelper.client?.address || '';
  }
  
  if (!transformed.meta.phone_number) {
    transformed.meta.phone_number = rawHelper.stakeholders?.owner?.phone || 
                                   rawHelper.client?.phone || '';
  }
  
  if (!transformed.meta.plate) {
    transformed.meta.plate = rawHelper.vehicle?.plate || 
                            rawHelper.car_details?.plate || 
                            rawHelper.case_info?.plate || '';
  }
  
  if (!transformed.meta.inspection_date) {
    transformed.meta.inspection_date = rawHelper.case_info?.inspection_date || 
                                      new Date().toLocaleDateString('he-IL');
  }
  
  if (!transformed.meta.location) {
    transformed.meta.location = rawHelper.case_info?.inspection_location || '';
  }
  
  if (!transformed.meta.damage) {
    transformed.meta.damage = rawHelper.case_info?.damage_type || 'תאונתי';
  }
  
  if (!transformed.meta.today) {
    transformed.meta.today = new Date().toLocaleDateString('he-IL');
  }
  
  if (!transformed.meta.case_id) {
    transformed.meta.case_id = rawHelper.case_info?.case_id || 
                              `YC-${transformed.meta.plate}-2025`;
  }
  
  if (!transformed.meta.report_type_display) {
    transformed.meta.report_type_display = 'חוות דעת שמאי פרטית';
  }
  
  // Ensure damage description exists
  if (!transformed.damage.description) {
    transformed.damage.description = 'בבדיקת הרכב הנדון נוכחנו בנזקים תאונתיים הדורשים תיקון על פי הפירוט להלן.';
  }
  
  return transformed;
}

// --- Inject Final Report ---
function injectReportHTML() {
  const container = document.getElementById("report-output");
  if (!container) return;

  // Setup Handlebars helpers
  setupHandlebarsHelpers();

  if (!helper) {
    container.innerHTML = `
      <div style="border: 2px solid red; padding: 20px; font-size: 18px; color: red; text-align: center;">
        ⚠️ אין נתונים זמינים להצגת הדו"ח.<br>
        ודא שהוזן מידע קודם דרך שלב האקספרטיזה או שטעינת הנתונים הצליחה.
      </div>
    `;
    return;
  }

  // Check if we have minimal required data
  if (!helper.vehicle && !helper.centers && !helper.meta && !helper.car_details) {
    container.innerHTML = `
      <div style="border: 2px solid orange; padding: 20px; font-size: 16px; color: orange; text-align: center;">
        📋 נתונים אלו ימולאו לאחר סיום בניית חוות הדעת<br>
        <small>אנא השלם את תהליך האקספרטיזה כדי לראות את הדו"ח המלא</small>
      </div>
    `;
    return;
  }

  try {
    const templateElement = document.getElementById("template-html");
    if (!templateElement) {
      container.innerHTML = '<div style="color: red;">Template not found</div>';
      return;
    }

    const htmlTemplate = templateElement.innerHTML;
    
    // Decode HTML entities that might interfere with Handlebars
    const decodedTemplate = htmlTemplate
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
    
    console.log('🔧 Template debugging:', { 
      originalLength: htmlTemplate.length,
      decodedLength: decodedTemplate.length,
      hasHTMLEntities: htmlTemplate !== decodedTemplate
    });
    
    // Debug line 112 specifically
    const templateLines = decodedTemplate.split('\n');
    if (templateLines.length >= 112) {
      console.log('🐛 Line 112 content:', templateLines[111]); // 0-indexed
      console.log('🐛 Lines 110-115:', templateLines.slice(109, 115));
    }
    
    // Check for remaining HTML entities
    const hasRemainingEntities = /&[a-zA-Z]+;/.test(decodedTemplate);
    if (hasRemainingEntities) {
      console.log('⚠️ Template still contains HTML entities after decoding');
      const matches = decodedTemplate.match(/&[a-zA-Z]+;/g);
      console.log('🔍 Remaining entities:', matches);
    }
    
    // Transform helper data for template compatibility
    const transformedHelper = transformHelperDataForTemplate(helper);
    
    // Build template data
    const vaultBlocks = buildVaultBlocks();
    const feeSummary = buildFeeSummary();
    const templateData = { 
      helper: transformedHelper, 
      vault: vaultBlocks, 
      meta: transformedHelper.meta, 
      title: getReportTitle(), 
      fees: feeSummary 
    };

    console.log('📊 Template data prepared:', templateData);
    console.log('💰 Market value being passed:', transformedHelper.calculations?.market_value);
    console.log('💰 Full market value being passed:', transformedHelper.calculations?.full_market_value);
    console.log('💰 All calculations:', transformedHelper.calculations);
    console.log('💵 Fees structure:', helper.fees);
    console.log('🔧 Raw helper market values:', {
      levi_final: helper.levisummary?.final_price,
      calculations_market: helper.calculations?.market_value,
      calculations_full: helper.calculations?.full_market_value
    });
    console.log('🔍 Centers data structure:', {
      helper_centers: helper.centers,
      centers_length: helper.centers ? helper.centers.length : 'undefined',
      first_center: helper.centers && helper.centers[0] ? helper.centers[0] : 'none'
    });

    // Use Handlebars to compile and render
    if (typeof Handlebars !== 'undefined') {
      try {
        console.log('🔧 Attempting to compile template...');
        const template = Handlebars.compile(decodedTemplate);
        console.log('✅ Template compiled successfully');
        const rendered = template(templateData);
        console.log('✅ Template rendered successfully');
        container.innerHTML = applyDraftWatermark(rendered);
        
        // Generate dynamic damage centers after template rendering
        generateDamageCentersForFinalReport(helper);
        
        // Populate dynamic legal text and attachments
        populateDynamicContent(transformedHelper);
      } catch (compileError) {
        console.error('💥 Handlebars compilation error:', compileError);
        console.error('💥 Error details:', {
          message: compileError.message,
          line: compileError.line,
          column: compileError.column
        });
        
        // Show specific template section around the error
        if (compileError.line) {
          const errorLineIndex = compileError.line - 1;
          const templateLines = decodedTemplate.split('\n');
          const contextStart = Math.max(0, errorLineIndex - 3);
          const contextEnd = Math.min(templateLines.length, errorLineIndex + 4);
          console.error('💥 Template context around error:', templateLines.slice(contextStart, contextEnd));
        }
        
        container.innerHTML = `
          <div style="border: 2px solid red; padding: 20px; text-align: center;">
            ❌ Template compilation error<br>
            <small>${compileError.message}</small>
          </div>
        `;
        return;
      }
    } else {
      // Fallback to simple replacement if Handlebars failed to load
      container.innerHTML = `
        <div style="border: 2px solid red; padding: 20px; text-align: center;">
          ❌ Handlebars library failed to load<br>
          <small>Please refresh the page</small>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error rendering final report:', error);
    console.error('Helper data:', helper);
    container.innerHTML = `
      <div style="border: 2px solid red; padding: 20px; color: red; text-align: center;">
        ❌ שגיאה בהצגת הדו"ח: ${error.message}<br>
        <small>פרטים נוספים בקונסול</small>
      </div>
    `;
  }
}


// --- Export Report ---
async function exportFinalReport() {
  if (sessionEngine.isFinalized()) return alert('הדו"ח כבר ננעל לשינויים.');

  const html = document.getElementById("report-output").innerHTML;

  helper.meta.finalized = true;
  helper.meta.final_type = reportType;
  helper.meta.final_timestamp = Date.now();

  // Use proper helper update function instead of direct sessionStorage
  const { updateHelper } = await import('./helper.js');
  updateHelper(helper);
  
  // Also update sessionStorage directly for immediate effect
  sessionStorage.setItem('helper', JSON.stringify(helper));

  sendToWebhook('SUBMIT_FINAL_REPORT', {
    html,
    meta: helper.meta,
    report_type: reportType,
    date: new Date().toISOString()
  }).then(res => {
    alert('הדו"ח נשלח בהצלחה');
  }).catch(() => {
    alert('שליחה נכשלה');
  });
}

// --- Print Report ---
function printReport() {
  window.print();
}

// --- Real-time Helper Data Binding ---
function startHelperWatcher() {
  // Watch for helper changes in sessionStorage
  let lastHelperData = JSON.stringify(helper);
  
  setInterval(() => {
    try {
      const currentHelper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      const currentHelperString = JSON.stringify(currentHelper);
      
      if (currentHelperString !== lastHelperData) {
        console.log('🔄 Helper data changed, updating final report...');
        helper = currentHelper;
        lastHelperData = currentHelperString;
        injectReportHTML();
      }
    } catch (error) {
      console.warn('Error watching helper data:', error);
    }
  }, 1000); // Check every second
  
  // Also listen for helper update events
  window.addEventListener('helperUpdated', () => {
    console.log('📡 Helper update event received, refreshing final report');
    helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    injectReportHTML();
  });
}

// --- Initialize on page load ---
function initializeFinalReport() {
  // Initialize vault loader first
  vaultLoader.init().then(() => {
    console.log('✅ Final Report: Vault loader initialized');
    
    // Load current helper data
    helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    
    // Start watching for changes
    startHelperWatcher();
    
    // Initial render
    injectReportHTML();
  }).catch(error => {
    console.warn('⚠️ Final Report: Vault loader initialization failed:', error);
    // Continue without vault - use fallback text
    helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    startHelperWatcher();
    injectReportHTML();
  });
}

// --- Dynamic Damage Centers Generation (Same logic as expertise report) ---
function generateDamageCentersForFinalReport(helper) {
  const container = document.querySelector('.damage-centers-container');
  if (!container || !helper.centers || !Array.isArray(helper.centers)) {
    console.warn('No damage centers data found or container missing for final report');
    return;
  }
  
  console.log('🔧 Generating dynamic damage centers for final report:', helper.centers.length);
  
  container.innerHTML = ''; // Clear existing content
  
  helper.centers.forEach((center, index) => {
    const centerHtml = createDamageCenterSectionForFinalReport(center, index);
    container.innerHTML += centerHtml;
  });
  
  console.log('✅ Dynamic damage centers generated successfully');
}

function createDamageCenterSectionForFinalReport(center, index) {
  const centerNumber = center['Damage center Number'] || (index + 1);
  const location = center.Location || 'לא צוין';
  
  return `
    <div class="car-details">
      <div class="car-details-title">מוקד הנזק מספר ${centerNumber} - ${location}</div>
      ${generateWorksTableForFinalReport(center.Works)}
      ${generatePartsTableForFinalReport(center.Parts)}
      ${generateRepairsTableForFinalReport(center.Repairs)}
    </div>
  `;
}

function generateWorksTableForFinalReport(works) {
  if (!works || !works.works || !Array.isArray(works.works) || works.works.length === 0) {
    return '<p style="font-style: italic; color: #666; margin: 15px 0;">אין עבודות מוגדרות</p>';
  }
  
  let tableHtml = `
    <h4>עבודות</h4>
    <table class="car-details-table">
      <thead>
        <tr><th>מס"ד</th><th>סוג עבודה</th><th>עלות משוערת</th><th>תיאור</th></tr>
      </thead>
      <tbody>
  `;
  
  works.works.forEach((work, index) => {
    const rowNum = index + 1;
    const category = work.category || '';
    const comments = work.comments || '';
    const cost = work.cost || 0;
    
    tableHtml += `
      <tr>
        <td>${rowNum}</td>
        <td>${category}</td>
        <td>${cost} ₪</td>
        <td>${comments}</td>
      </tr>
    `;
  });
  
  tableHtml += '</tbody></table>';
  return tableHtml;
}

function generatePartsTableForFinalReport(parts) {
  if (!parts || !parts.parts_required || !Array.isArray(parts.parts_required) || parts.parts_required.length === 0) {
    return '<p style="font-style: italic; color: #666; margin: 15px 0;">אין חלקים מוגדרים</p>';
  }
  
  let tableHtml = `
    <h4>חלקים</h4>
    <table class="car-details-table">
      <thead>
        <tr><th>מס"ד</th><th>שם החלק</th><th>עלות משוערת</th><th>מקור</th><th>תיאור</th></tr>
      </thead>
      <tbody>
  `;
  
  parts.parts_required.forEach((part, index) => {
    const rowNum = index + 1;
    const name = part.name || '';
    const price = part.מחיר || part.price || 0;
    const source = part.source || '';
    const description = part.תיאור || part.description || '';
    
    tableHtml += `
      <tr>
        <td>${rowNum}</td>
        <td>${name}</td>
        <td>${price} ₪</td>
        <td>${source}</td>
        <td>${description}</td>
      </tr>
    `;
  });
  
  tableHtml += '</tbody></table>';
  return tableHtml;
}

function generateRepairsTableForFinalReport(repairs) {
  if (!repairs || !repairs.repairs || !Array.isArray(repairs.repairs) || repairs.repairs.length === 0) {
    return '<p style="font-style: italic; color: #666; margin: 15px 0;">אין תיקונים מוגדרים</p>';
  }
  
  let tableHtml = `
    <h4>תיקונים</h4>
    <table class="car-details-table">
      <thead>
        <tr><th>מס"ד</th><th>שם התיקון</th><th>עלות משוערת</th><th>תיאור עלות</th></tr>
      </thead>
      <tbody>
  `;
  
  repairs.repairs.forEach((repair, index) => {
    const rowNum = index + 1;
    const name = repair.name || '';
    const cost = repair.cost || 0;
    const description = repair.description || '';
    
    tableHtml += `
      <tr>
        <td>${rowNum}</td>
        <td>${name}</td>
        <td>${cost} ₪</td>
        <td>${description}</td>
      </tr>
    `;
  });
  
  tableHtml += '</tbody></table>';
  return tableHtml;
}

window.finalReport = {
  inject: injectReportHTML,
  export: exportFinalReport,
  print: printReport,
  init: initializeFinalReport
};

console.log('✅ final_report.js loaded with session logic, fees, watermark, and vault rendering');
