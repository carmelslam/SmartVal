// final_report.js — Final Report Generation Engine (updated: draft logic = meta.core)

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';

const vault = window.vaultTexts || {};
import { sessionEngine } from './session.js';

let helper = sessionEngine.getDataSourceForFinal();

function buildFeeSummary() {
  const fees = helper.fees || {};
  const travel = parseFloat(fees.travel_fee) || 0;
  const media = parseFloat(fees.media_fee) || 0;
  const office = parseFloat(fees.office_fee) || 0;
  const vatRate = parseFloat(fees.vat_rate) || helper.vat || 18;
  const subtotal = MathEngine.round(travel + media + office);
  const vat = MathEngine.round(subtotal * vatRate / 100);
  const total = MathEngine.round(subtotal + vat);
  return { travel, media, office, vat_rate: vatRate, vat, subtotal, total };
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
  const m = isInvoiceOverride ? helper.invoice_calculations : helper.expertise?.calculations || {};
  const d = isInvoiceOverride ? helper.invoice_depreciation : helper.expertise?.depreciation || {};
  const f = isInvoiceOverride ? helper.invoice_fees : helper.fees || {};

  return {
    "שווי_פיצוי": MathEngine.formatCurrency(m.total_compensation),
    "אחוז_נזק": `${MathEngine.round(m.damage_percent)}%`,
    "ירידת_ערך": MathEngine.formatCurrency(d.global_amount),
    "אחוז_ירידת_ערך": `${MathEngine.round(d.global_percent)}%`,
    "ימי_מוסך": d.work_days || 0,
    "שווי_שוק": MathEngine.formatCurrency(m.market_value),
    "שווי_מחירון": MathEngine.formatCurrency(m.vehicle_value_gross)
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
