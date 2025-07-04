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
  const fees = helper.fees || {};
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
  // Use standardized data access
  const m = isInvoiceOverride ? helper.invoice_calculations : helper.expertise?.calculations || {};
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

// --- Render Handlerbar-like Tokens ---
import { renderHTMLBlock, sanitizeHTML } from "./render-html-block.js";

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

// --- Inject Final Report ---
function injectReportHTML() {
  const container = document.getElementById("report-output");
  if (!container) return;

  if (!helper || !helper.meta) {
    container.innerHTML = `
      <div style="border: 2px solid red; padding: 20px; font-size: 18px; color: red; text-align: center;">
        ⚠️ אין נתונים זמינים להצגת הדו"ח.<br>
        ודא שהוזן מידע קודם דרך שלב האקספרטיזה או שטעינת הנתונים הצליחה.
      </div>
    `;
    return;
  }

  const htmlTemplate = document.getElementById("template-html").innerHTML;
  const vaultBlocks = buildVaultBlocks();
  const feeSummary = buildFeeSummary();
  const map = { helper, vault: vaultBlocks, meta: helper.meta, title: getReportTitle(), fees: feeSummary };

  const rendered = renderHTMLBlock(htmlTemplate, map);
  const safeHTML = sanitizeHTML(rendered);
  container.innerHTML = applyDraftWatermark(safeHTML);
}


// --- Export Report ---
function exportFinalReport() {
  if (sessionEngine.isFinalized()) return alert('הדו"ח כבר ננעל לשינויים.');

  const html = document.getElementById("report-output").innerHTML;

  helper.meta.finalized = true;
  helper.meta.final_type = reportType;
  helper.meta.final_timestamp = Date.now();

  sessionStorage.setItem("helper", JSON.stringify(helper));

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

window.finalReport = {
  inject: injectReportHTML,
  export: exportFinalReport,
  print: printReport
};

console.log('✅ final_report.js loaded with session logic, fees, watermark, and vault rendering');
