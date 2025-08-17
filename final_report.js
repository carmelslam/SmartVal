// final_report.js — Final Report Generation Engine (updated: draft logic = meta.core)

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';
import { getVehicleData, getDamageData, getValuationData, getFinancialData } from './helper.js';

const vault = window.vaultTexts || {};
import { sessionEngine } from './session.js';

let helper = sessionEngine.getDataSourceForFinal();

// Use standardized data access functions
const vehicleData = getVehicleData();
const damageData = getDamageData();
const valuationData = getValuationData();
const financialData = getFinancialData();

function buildFeeSummary() {
  const fees = financialData.fees || {};
  const vatRate = parseFloat(fees.vat_rate) || MathEngine.getVatRate();
  
  // Use MathEngine for consistent calculations
  const subtotal = MathEngine.calculateFeesSubtotal(fees);
  const vat = MathEngine.calculateVatAmount(subtotal, vatRate);
  const total = MathEngine.round(subtotal + vat);
  
  return { 
    travel: MathEngine.parseNumber(fees.travel_fee), 
    media: MathEngine.parseNumber(fees.media_fee), 
    office: MathEngine.parseNumber(fees.office_fee), 
    vat_rate: vatRate, 
    vat, 
    subtotal, 
    total 
  };
}

// --- Determine Report Type and Draft Mode ---
const reportType = helper.meta?.report_type || 'unknown';
const isDraft = helper.meta?.status === 'draft';
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
    legal_declaration: baseText.legal_declaration || ''
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
      return new Handlebars.SafeString(`${num.toLocaleString('he-IL')} ₪`);
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
    
    // Length helper
    Handlebars.registerHelper('length', function(arr) {
      return Array.isArray(arr) ? arr.length : 0;
    });
  }
}

// --- Watermark Handling ---
function applyDraftWatermark(html) {
  if (!isDraft) return html;
  const watermark = '<div style="position:fixed; top:100px; left:100px; transform:rotate(-45deg); font-size:4em; opacity:0.1; z-index:9999;">טיוטה בלבד</div>';
  return watermark + html;
}

// --- Report Title Logic ---
function getReportTitle() {
  if (isDraft) return 'טיוטת חוות דעת';
  return vault[reportType]?.title || 'חוות דעת';
}

// --- Transform Helper Data for Template ---
function transformHelperDataForTemplate(rawHelper) {
  // Ensure basic structure exists
  const transformed = {
    vehicle: rawHelper.vehicle || rawHelper.car_details || {},
    centers: rawHelper.centers || rawHelper.damage_assessment?.centers || [],
    meta: rawHelper.meta || {},
    damage: rawHelper.damage || rawHelper.damage_assessment || {},
    calculations: rawHelper.calculations || rawHelper.financials?.calculations || {},
    depreciation: rawHelper.depreciation || rawHelper.valuation?.depreciation || {},
    levi: rawHelper.levi || rawHelper.valuation || {},
    expertise: rawHelper.expertise || {},
    damage_assessment: rawHelper.damage_assessment || {}
  };
  
  // Fill missing meta fields from other sources
  if (!transformed.meta.client_name) {
    transformed.meta.client_name = rawHelper.stakeholders?.owner?.name || 
                                 rawHelper.client?.name || 
                                 rawHelper.car_details?.owner || '';
  }
  
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

    // Use Handlebars to compile and render
    if (typeof Handlebars !== 'undefined') {
      try {
        console.log('🔧 Attempting to compile template...');
        const template = Handlebars.compile(decodedTemplate);
        console.log('✅ Template compiled successfully');
        const rendered = template(templateData);
        console.log('✅ Template rendered successfully');
        container.innerHTML = applyDraftWatermark(rendered);
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
  // Load current helper data
  helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  
  // Start watching for changes
  startHelperWatcher();
  
  // Initial render
  injectReportHTML();
}

window.finalReport = {
  inject: injectReportHTML,
  export: exportFinalReport,
  print: printReport,
  init: initializeFinalReport
};

console.log('✅ final_report.js loaded with session logic, fees, watermark, and vault rendering');
