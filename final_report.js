// final_report.js — Final Report Generation Engine (updated: draft logic = meta.core)

console.log('🚀 FINAL_REPORT.JS STARTING TO LOAD...');

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';
import { getVehicleData, getDamageData, getValuationData, getFinancialData } from './helper.js';
import { vaultLoader } from './vault-loader.js';

const vault = window.vaultTexts || {};
import { sessionEngine } from './session.js';

// Try to use sessionEngine, fallback to direct access
let helper;
try {
  helper = sessionEngine.getDataSourceForFinal();
  console.log('✅ Got helper from sessionEngine:', Object.keys(helper));
} catch (error) {
  console.log('⚠️ SessionEngine failed, using direct sessionStorage:', error);
  helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
}

// Use helper data directly to avoid import issues
const vehicleData = helper.vehicle || {};
const damageData = helper.damage_assessment || {};
const valuationData = helper.levisummary || {};
const financialData = helper.fees || {};

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
    fees_desclaimer: getFeesLegalText(helper),
    assessor_credentials: getAssessorCredentials(helper)
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
    // FORENSIC DEBUG HELPER: Capture template context
    Handlebars.registerHelper('debugCenters', function() {
      console.log('🔍 HANDLEBARS CONTEXT DEBUG - CENTERS:');
      console.log('  this.helper:', !!this.helper);
      console.log('  this.helper.centers:', this.helper?.centers);
      console.log('  this.helper.centers length:', this.helper?.centers?.length);
      console.log('  this.helper.damage_assessment:', !!this.helper?.damage_assessment);
      console.log('  Full context keys:', Object.keys(this));
      return '';
    });

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
    
    // Add helper for index + 1
    Handlebars.registerHelper('add', function(a, b) {
      return a + b;
    });
    
    // DEBUG: Helper to log data in template
    Handlebars.registerHelper('debug', function(context) {
      console.log('🔍 TEMPLATE DEBUG:', context);
      return '';
    });
    
    // JSON stringify helper for debugging
    Handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });
    
    // Custom helper to iterate over object properties (for damage_centers_summary)
    Handlebars.registerHelper('eachProperty', function(context, options) {
      let ret = '';
      if (context && typeof context === 'object') {
        for (let key in context) {
          if (context.hasOwnProperty(key)) {
            ret += options.fn({
              key: key,
              value: context[key],
              ...context[key]
            });
          }
        }
      }
      return ret;
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
  // Get legal text from helper.final_report (validated data)
  const legalText = helper.final_report?.legal_text || '';
  
  return legalText;
}

function getAttachmentsList(helper) {
  // Get attachments from helper.final_report (validated data)
  let attachmentsText = helper.final_report?.attachments || '';
  
  // Convert plain text to HTML for display
  attachmentsText = attachmentsText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  
  return attachmentsText;
}

function getFeesLegalText(helper) {
  // Get hourly rate from helper data structure
  const hourlyRate = helper.fees?.fees_summary?.assessment?.hourly_rate || 
                    helper.assessment?.hourly_rate || 
                    helper.hourly_rate || 
                    '120';
  
  // Try to get from vault loader first
  if (window.vaultLoader && typeof window.vaultLoader.getText === 'function') {
    try {
      const vaultText = window.vaultLoader.getText('fees_desclaimer', 'text');
      if (vaultText) {
        return vaultText
          .replace('(placeholder)', `${hourlyRate} ש"ח`)
          .replace(/={72,}/g, '<div class="legal-separator"></div>');
      }
    } catch (error) {
      console.warn('Error loading fees text from vault loader:', error);
    }
  }
  
  // Try direct vault access  
  const vaultTexts = window.vaultTexts || helper.vault?.legal_texts || {};
  const vaultText = vaultTexts.fees_desclaimer?.text;
  
  if (vaultText) {
    return vaultText
      .replace('(placeholder)', `${hourlyRate} ש"ח`)
      .replace(/={72,}/g, '<div class="legal-separator"></div>');
  }
  
  return helper.fees_legal_text || '';
}

function getAssessorCredentials(helper) {
  // Try to get from vault loader first
  if (window.vaultLoader && typeof window.vaultLoader.getText === 'function') {
    try {
      const vaultText = window.vaultLoader.getText('assessor_credentials', 'text');
      if (vaultText) {
        return vaultText;
      }
    } catch (error) {
      console.warn('Error loading assessor credentials from vault loader:', error);
    }
  }
  
  // Try direct vault access  
  const vaultTexts = window.vaultTexts || helper.vault?.legal_texts || {};
  const vaultText = vaultTexts.assessor_credentials?.text;
  
  if (vaultText) {
    return vaultText;
  }
  
  return helper.assessor_credentials || '';
}

// --- Populate Dynamic Content ---
function populateDynamicContent(helper) {
  // Format legal text and attachments for proper display
  const legalTextElement = document.getElementById('dynamic-legal-text');
  if (legalTextElement && legalTextElement.textContent) {
    // Format legal text with proper HTML structure
    let formattedText = legalTextElement.textContent
      .replace(/מטרת מסמך זה - ([^:]+):/g, '<strong>מטרת מסמך זה - $1:</strong><br>')
      .replace(/הצהרת שמאי:/g, '<br><strong>הצהרת שמאי:</strong><br>')
      .replace(/(\d+\.\s)/g, '<br>$1')
      .replace(/\n/g, '<br>')
      .replace(/---/g, '<br><hr style="border: 1px solid #ccc; margin: 10px 0;"><br>');
    
    legalTextElement.innerHTML = formattedText;
  }
  
  const attachmentsElement = document.getElementById('dynamic-attachments');
  if (attachmentsElement && attachmentsElement.textContent) {
    // Format attachments as clean list
    let attachmentsList = attachmentsElement.textContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>'))
      .map(line => `• ${line}`)
      .join('<br>');
    
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
  
  // Enhanced helper structure debugging
  console.log('� Starting comprehensive field mapping...');
  
  // Normalize centers data first
  let normalizedCenters = [];
  if (rawHelper.centers && rawHelper.centers.length > 0) {
    normalizedCenters = rawHelper.centers;
  } else if (rawHelper.damage_assessment?.centers && rawHelper.damage_assessment.centers.length > 0) {
    normalizedCenters = rawHelper.damage_assessment.centers;
  }
  
  // DEBUG: Log critical data structures
  console.log('🔍 Critical Data Structures:', {
    centers_count: normalizedCenters.length,
    has_vehicle_data: !!(rawHelper.car_details || rawHelper.vehicle || rawHelper.levisummary),
    has_client_data: !!(rawHelper.stakeholders?.owner?.name || rawHelper.case_info?.client_name),
    has_case_id: !!rawHelper.case_info?.case_id,
    damage_assessment: !!rawHelper.damage_assessment
  });
  
  // Define all final report field mappings based on ACTUAL helper structure
  const fieldMappings = {
    // Meta fields - use case_info and stakeholders as primary sources
    'meta.report_type_display': getValue(rawHelper, ['final_report_type', 'report_type'], 'חוות דעת שמאי פרטית'),
    'meta.client_name': getValue(rawHelper, ['stakeholders.owner.name', 'case_info.client_name', 'meta.client_name'], placeholder),
    'meta.address': getValue(rawHelper, ['stakeholders.owner.address', 'case_info.address', 'meta.address'], placeholder),
    'meta.today': getValue(rawHelper, ['case_info.inspection_date', 'meta.today'], new Date().toLocaleDateString('he-IL')),
    'meta.plate': getValue(rawHelper, ['car_details.plate', 'vehicle.plate', 'meta.plate'], placeholder),
    'meta.phone_number': getValue(rawHelper, ['stakeholders.owner.phone', 'case_info.phone_number', 'meta.phone_number'], placeholder),
    'meta.inspection_date': getValue(rawHelper, ['case_info.inspection_date', 'meta.inspection_date'], placeholder),
    'meta.incident_date': getValue(rawHelper, ['case_info.incident_date', 'case_info.damage_date', 'meta.incident_date'], placeholder),
    'meta.damage_date': getValue(rawHelper, ['case_info.damage_date', 'case_info.incident_date', 'meta.damage_date'], placeholder),
    'meta.inspection_location': getValue(rawHelper, ['case_info.inspection_location', 'meta.inspection_location'], placeholder),
    'meta.location': getValue(rawHelper, ['case_info.inspection_location', 'case_info.location', 'meta.location'], placeholder),
    'meta.case_id': getValue(rawHelper, ['case_info.case_id', 'meta.case_id'], placeholder),
    'meta.damage': getValue(rawHelper, ['case_info.damage_type', 'damage_info.damage_type', 'meta.damage'], placeholder),
    'meta.damage_type': getValue(rawHelper, ['case_info.damage_type', 'damage_info.damage_type', 'meta.damage_type'], placeholder),
    
    // Vehicle fields - prioritize car_details, then levisummary, then vehicle
    'helper.vehicle.model': getValue(rawHelper, ['car_details.model', 'vehicle.model', 'levisummary.model'], placeholder),
    'helper.vehicle.chassis': getValue(rawHelper, ['car_details.chassis', 'vehicle.chassis'], placeholder),
    'helper.vehicle.year': getValue(rawHelper, ['car_details.year', 'vehicle.year'], placeholder),
    'helper.vehicle.km': getValue(rawHelper, ['car_details.km', 'vehicle.km', 'car_details.km_reading'], placeholder),
    'helper.vehicle.ownership_type': getValue(rawHelper, ['car_details.ownership_type', 'vehicle.ownership_type'], placeholder),
    'helper.vehicle.manufacturer': getValue(rawHelper, ['car_details.manufacturer', 'vehicle.manufacturer'], placeholder),
    'helper.vehicle.model_code': getValue(rawHelper, ['car_details.model_code', 'vehicle.model_code', 'levisummary.model_code'], placeholder),
    'helper.vehicle.full_description': getValue(rawHelper, ['car_details.full_description', 'levisummary.full_description', 'vehicle.full_description'], placeholder),
    'helper.vehicle.km_reading': getValue(rawHelper, ['car_details.km_reading', 'car_details.km', 'vehicle.km_reading'], placeholder),
    'helper.vehicle.market_value': getValue(rawHelper, ['levisummary.final_price', 'calculations.market_value', 'vehicle.market_value'], 0),
    
    // Damage fields - get from damage_info and case_info
    'helper.damage.description': getValue(rawHelper, ['damage_info.description', 'case_info.damage_description', 'damage.description'], placeholder),
    
    // Calculations - FIXED: Use direct property access instead of nested paths
    'helper.calculations.total_damage': rawHelper.damage_assessment?.totals?.['Total with VAT'] || rawHelper.calculations?.total_damage || 0,
    'helper.calculations.vehicle_value_gross': rawHelper.levisummary?.final_price || rawHelper.calculations?.vehicle_value_gross || 0,
    'helper.calculations.damage_percent': rawHelper.calculations?.damage_percent || '0%',
    'helper.calculations.market_value': rawHelper.levisummary?.final_price || rawHelper.calculations?.market_value || 0,
    'helper.calculations.base_market_value': rawHelper.levisummary?.base_price || rawHelper.calculations?.base_market_value || 0,
    'helper.calculations.total_compensation': rawHelper.calculations?.total_compensation || 0,
    'helper.calculations.full_market_value': rawHelper.levisummary?.final_price || rawHelper.calculations?.full_market_value || 0,
    
    // Levi/Valuation - PRIMARY SOURCE for all valuation data
    'helper.vehicle_value_base': rawHelper.levisummary?.base_price || rawHelper.valuation?.base_price || 0,
    'helper.levi.adjustments': rawHelper.levisummary?.adjustments || rawHelper.levi_data?.adjustments || [],
    
    // Depreciation - FIXED: Direct property access
    'helper.depreciation.global_percent': rawHelper.depreciation?.global_percent || '0%',
    'helper.depreciation.global_amount': rawHelper.depreciation?.global_amount || 0,
    'helper.depreciation.bulk_items': rawHelper.depreciation?.bulk_items || [],
    
    // Custom adjustments for market value table - Use levisummary as primary source
    'helper.custom_adjustments.full_market_adjustments': rawHelper.levisummary?.adjustments || rawHelper.custom_adjustments?.full_market_adjustments || [],
    
    // Dynamic legal text and attachments
    'helper.final_report_legal_text': rawHelper.final_report_legal_text || '',
    'helper.final_report_type': rawHelper.final_report_type || rawHelper.report_type || 'default',
    'helper.final_report_attachments': rawHelper.final_report_attachments || '',
    
    // Additional mappings for commonly missed fields  
    'base_car_price': rawHelper.levisummary?.base_price || rawHelper.valuation?.base_price || 0,
    'damage_location': rawHelper.centers?.[0]?.Location || rawHelper.damage_assessment?.centers?.[0]?.Location || placeholder
  };
  
  console.log('✅ Field mapping created with', Object.keys(fieldMappings).length, 'mappings');
  console.log('🔍 Sample mappings:', {
    client_name: fieldMappings['meta.client_name'],
    vehicle_model: fieldMappings['helper.vehicle.model'],
    market_value: fieldMappings['helper.calculations.market_value'],
    total_damage: fieldMappings['helper.calculations.total_damage']
  });
  
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

// Register Handlebars helpers for flexible data access
function registerHandlebarsHelpers() {
  if (typeof Handlebars !== 'undefined') {
    // Helper to get center data from any valid source
    Handlebars.registerHelper('getCenters', function(helper) {
      return helper.damage_assessment?.centers || helper.centers || [];
    });

    // Helper to get center total
    Handlebars.registerHelper('getCenterTotal', function(helper, centerNumber) {
      const key = `Damage center ${centerNumber}`;
      return helper.damage_assessment?.damage_centers_summary?.[key]?.['Total with VAT'] || 0;
    });

    // Helper to get center works
    Handlebars.registerHelper('getCenterWorks', function(center) {
      return center.Works?.works || [];
    });

    // Helper to get center parts
    Handlebars.registerHelper('getCenterParts', function(center) {
      return center.Parts?.parts_required || [];
    });

    // Helper to get center repairs
    Handlebars.registerHelper('getCenterRepairs', function(center) {
      return center.Repairs?.repairs || [];
    });
  }
}

// --- Transform Helper Data for Template ---
function transformHelperDataForTemplate(rawHelper) {
  console.log('🔥 TRANSFORMATION ENTRY: transformHelperDataForTemplate() called');
  console.log('🔍 RAW HELPER STRUCTURE:', Object.keys(rawHelper));
  
  // Register helpers for template
  registerHandlebarsHelpers();
  
  // AGGRESSIVE FIX: Always use damage_centers_summary to create centers
  let centersSource = [];
  let totalDamageSource = rawHelper.damage_assessment?.totals?.['Total with VAT'] || 0;
  
  if (rawHelper.damage_assessment?.damage_centers_summary) {
    console.log('🔧 AGGRESSIVE FIX: Creating centers from damage_centers_summary');
    const summaryKeys = Object.keys(rawHelper.damage_assessment.damage_centers_summary);
    centersSource = summaryKeys.map((key, index) => {
      const centerNumber = key.replace('Damage center ', '') || (index + 1);
      return {
        "Damage center Number": centerNumber,
        "Location": `מוקד נזק ${centerNumber}`,
        "Description": `תיאור מוקד נזק ${centerNumber}`
      };
    });
    console.log('✅ FORCED centers creation:', centersSource.length);
  } else {
    console.log('❌ NO damage_centers_summary found');
  }
  
  // DEBUG: Critical data source analysis for "חלוקה למוקדים" section
  console.log('🎯 DATA SOURCES FOR "חלוקה למוקדים":', {
    centers_count: centersSource.length,
    centers_source: centersSource.length > 0 ? 'found' : 'empty',
    total_damage: totalDamageSource,
    damage_assessment_exists: !!rawHelper.damage_assessment,
    damage_centers_summary_exists: !!rawHelper.damage_assessment?.damage_centers_summary,
    damage_centers_summary_keys: Object.keys(rawHelper.damage_assessment?.damage_centers_summary || {}),
    damage_totals_exists: !!rawHelper.damage_assessment?.totals,
    damage_totals_total_with_vat: rawHelper.damage_assessment?.totals?.["Total with VAT"]
  });
  
  console.log('🔍 DETAILED DAMAGE CENTERS SUMMARY STRUCTURE:', rawHelper.damage_assessment?.damage_centers_summary);

  // Create comprehensive field mapping
  const fieldMappings = createComprehensiveFieldMapping(rawHelper);

  // CRITICAL FIX: Convert damage_centers_summary object to centers array like working sections
  const centersArray = [];
  if (rawHelper.damage_assessment?.damage_centers_summary) {
    for (const [centerKey, centerData] of Object.entries(rawHelper.damage_assessment.damage_centers_summary)) {
      centersArray.push({
        key: centerKey,
        centerNumber: centerKey.replace('Damage center ', ''),
        totalWithVat: centerData["Total with VAT"] || 0,
        totalWithoutVat: centerData["Total without VAT"] || 0,
        works: centerData["Works"] || 0,
        parts: centerData["Parts"] || 0,
        repairs: centerData["Repairs"] || 0,
        location: `מוקד נזק ${centerKey.replace('Damage center ', '')}`
      });
    }
  }
  
  console.log('✅ Converted object to centers array:', centersArray);
  
  // Transform helper data to template-compatible structure
  const transformed = {
    // Pass through the original helper but ADD the centers array
    helper: {
      ...rawHelper,
      centers: centersArray  // Replace empty centers with proper array
    },
    
    // Add transformed data as additional properties
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
      market_value: fieldMappings['helper.vehicle.market_value'],
      plate: fieldMappings['meta.plate']
    },
    
    // Centers - CRITICAL: Fixed centers structure with Summary object (Opus fix)
    centers: centersSource.map((center, index) => {
      const centerNumber = center["Damage center Number"] || center.number || (index + 1);
      const centerKey = `Damage center ${centerNumber}`;
      
      // Get totals from damage_centers_summary as originally intended
      const summaryData = rawHelper.damage_assessment?.damage_centers_summary?.[centerKey];
      const totalWithVat = summaryData?.["Total with VAT"] || 0;
      const totalWithoutVat = summaryData?.["Total without VAT"] || 0;
      const worksTotal = summaryData?.["Works"] || 0;
      const partsTotal = summaryData?.["Parts"] || 0;
      const repairsTotal = summaryData?.["Repairs"] || 0;
      
      console.log(`🔧 Processing center ${centerNumber} with Summary structure:`, {
        centerKey,
        summaryData,
        totalWithVat
      });
      
      return {
        ...center,
        "Damage center Number": centerNumber,
        Location: center.Location || 'לא צוין',
        Description: center.Description || '',
        Works: center.Works || { works: [] },
        Parts: center.Parts || { parts_required: [] },
        Repairs: center.Repairs || { repairs: [] },
        // CRITICAL FIX: Add Summary object structure that template expects
        Summary: {
          "Total with VAT": totalWithVat,
          "Total without VAT": totalWithoutVat,
          "Works": worksTotal,
          "Parts": partsTotal,
          "Repairs": repairsTotal
        }
      };
    }),
    // Meta information - CRITICAL for report headers
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
    valuation: {
      base_price: rawHelper.levisummary?.base_price || rawHelper.valuation?.base_price || 0,
      adjustments: {
        features: rawHelper.levisummary?.adjustments?.[0] || {},
        registration: rawHelper.levisummary?.adjustments?.[1] || {}
      }
    },
    depreciation: {
      global_percent: fieldMappings['helper.depreciation.global_percent'],
      global_amount: fieldMappings['helper.depreciation.global_amount'],
      bulk_items: rawHelper.depreciation?.bulk_items || []
    },
    expertise: {
      depreciation: {
        centers: fieldMappings['helper.expertise.depreciation.centers']
      }
    },
    // CRITICAL: FIXED - Direct pass-through without fallback corruption
    damage_assessment: rawHelper.damage_assessment,
    
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
    damage_location: fieldMappings['damage_location'],
    
    // Add damage_centers_summary for template access
    damage_centers_summary: rawHelper.damage_assessment?.damage_centers_summary || {}
  };
  
  // VALIDATION: Enhanced logging for "חלוקה למוקדים" section
  console.log('🎯 FINAL VALIDATION FOR "חלוקה למוקדים" SECTION:');
  console.log('📊 Centers Array:', transformed.centers?.map((c, i) => ({
    index: i,
    centerNumber: c["Damage center Number"],
    location: c.Location,
    totalWithVat: c.total_with_vat,
    hasRequiredFields: !!(c["Damage center Number"] && c.Location && (c.total_with_vat !== undefined))
  })));
  
  console.log('💰 Damage Assessment Totals:', {
    exists: !!transformed.damage_assessment?.totals,
    totalWithVAT: transformed.damage_assessment?.totals?.["Total with VAT"],
    fullTotalsObject: transformed.damage_assessment?.totals
  });
  
  console.log('🔍 Raw Source Data Check:', {
    rawDamageAssessment: !!rawHelper.damage_assessment,
    rawCenters: rawHelper.centers?.length || 0,
    rawDamageAssessmentCenters: rawHelper.damage_assessment?.centers?.length || 0,
    rawDamageCentersSummary: Object.keys(rawHelper.damage_assessment?.damage_centers_summary || {}),
    rawTotals: rawHelper.damage_assessment?.totals
  });

  console.log('✅ Helper data transformation completed:', {
    mappedFields: Object.keys(fieldMappings).length,
    centersCount: transformed.centers?.length || 0,
    centersWithValidTotals: transformed.centers?.filter(c => c.total_with_vat > 0).length || 0,
    hasValidCenters: transformed.centers && transformed.centers.length > 0,
    damageAssessmentTotalExists: !!transformed.damage_assessment?.totals?.["Total with VAT"],
    clientName: transformed.meta?.client_name,
    vehicleModel: transformed.vehicle?.model
  });

  // VALIDATION: Check for missing critical data
  const missingCriticalData = [];
  if (!transformed.meta?.client_name || transformed.meta.client_name.includes('נתונים אלו ימולאו')) {
    missingCriticalData.push('client_name');
  }
  if (!transformed.meta?.case_id || transformed.meta.case_id.includes('נתונים אלו ימולאו')) {
    missingCriticalData.push('case_id');
  }
  if (!transformed.vehicle?.model || transformed.vehicle.model.includes('נתונים אלו ימולאו')) {
    missingCriticalData.push('vehicle_model');
  }
  if (!transformed.centers || transformed.centers.length === 0) {
    missingCriticalData.push('damage_centers');
  }

  if (missingCriticalData.length > 0) {
    console.warn('⚠️ Missing critical data for template:', missingCriticalData);
  }
  
  // FINAL SAFETY CHECK: Ensure centers exist
  if (!transformed.centers || transformed.centers.length === 0) {
    console.log('🚨 FINAL CHECK: Centers still empty, attempting last resort fix');
    if (rawHelper.damage_assessment?.centers?.length > 0) {
      transformed.centers = rawHelper.damage_assessment.centers.map((center, index) => {
        const centerNumber = center["Damage center Number"] || center.number || (index + 1);
        const centerKey = `Damage center ${centerNumber}`;
        const summaryData = rawHelper.damage_assessment?.damage_centers_summary?.[centerKey] || {};
        
        return {
          ...center,
          "Damage center Number": centerNumber,
          Location: center.Location || center.location || 'לא צוין',
          Summary: {
            "Total with VAT": summaryData["Total with VAT"] || 0,
            "Total without VAT": summaryData["Total without VAT"] || 0,
            "Works": summaryData["Works"] || 0,
            "Parts": summaryData["Parts"] || 0,
            "Repairs": summaryData["Repairs"] || 0
          }
        };
      });
      console.log('✅ Centers restored from damage_assessment:', transformed.centers.length);
    }
  }
  
  console.log('🏁 FINAL TRANSFORMED CENTERS:', transformed.centers);
  
  return transformed;
}

// --- Data Validation Function ---
function validateHelperDataForTemplate(helper) {
  console.log('🔍 Validating helper data for template...', helper);
  
  const missingFields = [];
  const warnings = [];
  const critical = [];
  
  // Check for critical data sections with detailed logging
  if (!helper.car_details && !helper.vehicle && !helper.levisummary) {
    critical.push('נתוני רכב');
    console.log('❌ Missing vehicle data:', {
      car_details: !!helper.car_details,
      vehicle: !!helper.vehicle,
      levisummary: !!helper.levisummary
    });
  }
  
  if (!helper.stakeholders?.owner?.name && !helper.case_info?.client_name) {
    critical.push('שם לקוח');
    console.log('❌ Missing client name:', {
      stakeholder_name: helper.stakeholders?.owner?.name,
      case_info_name: helper.case_info?.client_name
    });
  }
  
  if (!helper.case_info?.case_id) {
    critical.push('מספר תיק');
  }
  
  // Enhanced centers data validation
  let centersData = null;
  if (helper.centers && helper.centers.length > 0) {
    centersData = helper.centers;
  } else if (helper.damage_assessment?.centers && helper.damage_assessment.centers.length > 0) {
    centersData = helper.damage_assessment.centers;
  }
  
  const hasCenters = !!centersData;
  console.log('🔍 Centers validation:', {
    helper_centers: helper.centers?.length || 0,
    damage_assessment_centers: helper.damage_assessment?.centers?.length || 0,
    centersFound: hasCenters
  });
  
  if (!hasCenters) {
    warnings.push('מוקדי נזק');
  }
  
  // Check financial data
  if (!helper.levisummary?.final_price && !helper.calculations?.market_value) {
    warnings.push('שווי רכב');
  }
  
  // Determine validation result
  let isValid = true;
  let severity = 'warning';
  let message = 'הדוח מוכן להצגה';
  let details = '';
  
  if (missingFields.length > 0) {
    isValid = false;
    severity = 'error';
    message = 'חסרים נתונים קריטיים להצגת הדוח';
    details = 'אנא השלם את הנתונים החסרים דרך המערכת';
  } else if (warnings.length > 0) {
    // Allow with warnings but show them
    message = 'הדוח יוצג עם נתונים חלקיים';
    details = `חסרים נתונים לא קריטיים: ${warnings.join(', ')}`;
  }
  
  console.log('✅ Validation completed:', {
    isValid,
    severity,
    missingFields,
    warnings,
    message
  });
  
  return {
    isValid,
    severity,
    message,
    details,
    missingFields,
    warnings
  };
}

// --- Inject Final Report ---
function injectReportHTML() {
  console.log('🔥 ENTRY POINT: injectReportHTML() called');
  const container = document.getElementById("report-output");
  if (!container) {
    console.log('❌ FATAL: No report-output container found');
    return;
  }

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

  // ENHANCED: Comprehensive data validation
  const validationResult = validateHelperDataForTemplate(helper);
  if (!validationResult.isValid) {
    container.innerHTML = `
      <div style="border: 2px solid ${validationResult.severity === 'error' ? 'red' : 'orange'}; padding: 20px; font-size: 16px; color: ${validationResult.severity === 'error' ? 'red' : 'orange'}; text-align: center;">
        ${validationResult.severity === 'error' ? '❌' : '⚠️'} ${validationResult.message}<br>
        <small>${validationResult.details}</small>
        ${validationResult.missingFields.length > 0 ? `<br><br><strong>חסרים:</strong> ${validationResult.missingFields.join(', ')}` : ''}
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
    
    // 🚨 CRITICAL DEBUG: Log what's actually being passed to template
    console.log('🚨 TEMPLATE DATA DEBUG:');
    console.log('transformedHelper.damage_assessment:', transformedHelper.damage_assessment);
    console.log('damage_centers_summary keys:', Object.keys(transformedHelper.damage_assessment?.damage_centers_summary || {}));
    console.log('damage_centers_summary content:', transformedHelper.damage_assessment?.damage_centers_summary);
    console.log('totals:', transformedHelper.damage_assessment?.totals);
    
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
    console.log('🎯 FINAL CENTERS BEING PASSED TO TEMPLATE:', transformedHelper.centers);
    console.log('🎯 EACH CENTER STRUCTURE:', transformedHelper.centers?.map((c, i) => ({
      index: i,
      centerNumber: c["Damage center Number"],
      location: c.Location,
      totalWithVat: c.total_with_vat,
      allKeys: Object.keys(c)
    })));
    
    // CRITICAL FIX: Ensure centers is properly set in templateData
    if (!transformedHelper.centers || transformedHelper.centers.length === 0) {
      console.log('⚠️ WARNING: transformedHelper.centers is empty!');
      // Try alternative sources
      if (helper.damage_assessment?.centers?.length > 0) {
        console.log('🔧 Using damage_assessment.centers as fallback');
        transformedHelper.centers = helper.damage_assessment.centers;
      } else if (helper.centers?.length > 0) {
        console.log('🔧 Using helper.centers directly');
        transformedHelper.centers = helper.centers;
      } else {
        console.log('🚨 ERROR: No centers found anywhere!');
      }
    }
    console.log('🎯 DAMAGE ASSESSMENT TOTALS:', templateData.helper.damage_assessment?.totals);
    
    // CRITICAL DEBUG: Verify template data structure right before render
    console.log('🚨 TEMPLATE DEBUG - RIGHT BEFORE RENDER:');
    console.log('templateData.helper.centers EXISTS:', !!templateData.helper.centers);
    console.log('templateData.helper.centers LENGTH:', templateData.helper.centers?.length || 0);
    console.log('templateData.helper.centers CONTENT:', templateData.helper.centers);
    
    // Force ensure centers exist in template data
    if (!templateData.helper.centers || templateData.helper.centers.length === 0) {
      console.log('🔧 EMERGENCY: Adding centers to templateData');
      if (transformedHelper.centers?.length > 0) {
        templateData.helper.centers = transformedHelper.centers;
        console.log('✅ Centers added to templateData:', templateData.helper.centers.length);
      }
    }

    // Use Handlebars to compile and render
    if (typeof Handlebars !== 'undefined') {
      try {
        console.log('🔧 Attempting to compile template with data:', templateData);
        const template = Handlebars.compile(decodedTemplate);
        console.log('✅ Template compiled successfully');
        
        // Ensure helper data is fully available to template
        const renderData = {
          ...templateData,
          helper: window.helper || sessionStorage.getItem('helper')
        };
        
        console.log('🔧 Rendering template with data:', renderData);
        const rendered = template(renderData);
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
  
  // Add page break before each damage center (except the first one)
  const pageBreakBefore = index > 0 ? '<div style="page-break-before: always;"></div>' : '';
  
  return `
    ${pageBreakBefore}
    <div class="car-details" style="page-break-inside: avoid;">
      <div class="car-details-title">מוקד הנזק מספר ${centerNumber} - ${location}</div>
      ${generateWorksTableForFinalReport(center.Works)}
      ${generatePartsTableForFinalReport(center.Parts)}
      ${generateRepairsTableForFinalReport(center.Repairs)}
      ${generateDamageCenterSummaryTable(center)}
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
    const rawPrice = part.מחיר || part.price || 0;
    // Check if price already contains currency symbol
    const price = String(rawPrice).includes('₪') ? rawPrice : `${rawPrice} ₪`;
    const source = part.source || '';
    const description = part.תיאור || part.description || '';
    
    tableHtml += `
      <tr>
        <td>${rowNum}</td>
        <td>${name}</td>
        <td>${price}</td>
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

function generateDamageCenterSummaryTable(center) {
  // Get totals from damage_assessment.damage_centers_summary.bulk for this specific damage center
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  const centerNumber = center['Damage center Number'] || (center.index + 1);
  const centerKey = `Damage center ${centerNumber}`;
  
  // Get VAT rate from calculations.vat_rate
  const vatRate = helper.calculations?.vat_rate || 18;
  
  // Look for the center data in damage_assessment.damage_centers_summary.bulk
  const bulkData = helper.damage_assessment?.damage_centers_summary?.bulk?.[centerKey];
  
  let worksTotal = 0;
  let partsTotal = 0;
  let repairsTotal = 0;
  let subtotal = 0;
  let vatAmount = 0;
  let totalWithVat = 0;
  
  if (bulkData) {
    // Use the calculated totals from damage_assessment
    worksTotal = parseFloat(bulkData.Works) || 0;
    partsTotal = parseFloat(bulkData.Parts) || 0;
    repairsTotal = parseFloat(bulkData.Repairs) || 0;
    subtotal = parseFloat(bulkData['Total without VAT']) || 0;
    totalWithVat = parseFloat(bulkData['Total with VAT']) || 0;
    vatAmount = totalWithVat - subtotal;
  } else {
    // Fallback to manual calculation if bulk data not found
    console.warn(`No bulk data found for ${centerKey}, using manual calculation`);
    
    // Sum works costs
    if (center.Works && center.Works.works && Array.isArray(center.Works.works)) {
      worksTotal = center.Works.works.reduce((sum, work) => {
        return sum + (parseFloat(work.cost) || 0);
      }, 0);
    }
    
    // Sum parts costs
    if (center.Parts && center.Parts.parts_required && Array.isArray(center.Parts.parts_required)) {
      partsTotal = center.Parts.parts_required.reduce((sum, part) => {
        // Extract numeric value from price string that might contain currency symbols
        const priceStr = String(part.מחיר || part.price || 0);
        const numericPrice = parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 0;
        return sum + numericPrice;
      }, 0);
    }
    
    // Sum repairs costs
    if (center.Repairs && center.Repairs.repairs && Array.isArray(center.Repairs.repairs)) {
      repairsTotal = center.Repairs.repairs.reduce((sum, repair) => {
        return sum + (parseFloat(repair.cost) || 0);
      }, 0);
    }
    
    // Calculate subtotal and VAT
    subtotal = worksTotal + partsTotal + repairsTotal;
    vatAmount = Math.round(subtotal * (vatRate / 100));
    totalWithVat = subtotal + vatAmount;
  }
  
  const location = center.Location || 'לא צוין';
  
  return `
    <div style="margin-top: 20px; page-break-inside: avoid;">
      <h4>סיכום מוקד נזק מספר ${centerNumber} - ${location}</h4>
      <table class="car-details-table summary-table" style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <thead style="background-color: #f8f9fa;">
          <tr>
            <th style="text-align: right; padding: 8px; border: 1px solid #dee2e6;">פריט</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #dee2e6;">עלות</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;">סך הכל עבודות</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">₪ ${worksTotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;">סך הכל חלקים</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">₪ ${partsTotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;">סך הכל תיקונים</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">₪ ${repairsTotal.toLocaleString()}</td>
          </tr>
          <tr style="border-top: 2px solid #007bff;">
            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">סך הכל חלקים,עבודות ותיקונים</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">₪ ${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dee2e6;">מע"מ ${vatRate}%</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">₪ ${vatAmount.toLocaleString()}</td>
          </tr>
          <tr style="background-color: #e3f2fd; font-weight: bold;">
            <td style="padding: 8px; border: 1px solid #dee2e6;">סך הכל כולל מע"מ</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">₪ ${totalWithVat.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

window.finalReport = {
  inject: injectReportHTML,
  export: exportFinalReport,
  print: printReport,
  init: initializeFinalReport
};

console.log('✅ final_report.js loaded with session logic, fees, watermark, and vault rendering');

// DEBUG: Check if we can see the helper data immediately
console.log('🎯 IMMEDIATE HELPER CHECK:', window.helper);
console.log('🎯 SESSION STORAGE HELPER:', JSON.parse(sessionStorage.getItem('helper') || '{}'));

// Initialize immediately 
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 final_report.js DOMContentLoaded - initializing...');
  initializeFinalReport();
});

// Also try immediate initialization if DOM is already loaded
if (document.readyState === 'loading') {
  console.log('📄 DOM still loading, waiting for DOMContentLoaded');
} else {
  console.log('📄 DOM already loaded, initializing immediately');
  setTimeout(() => initializeFinalReport(), 100);
}
