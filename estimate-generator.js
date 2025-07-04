// estimate-generator.js — Post-Session Estimate Generation Engine

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';
import { getVehicleData, getDamageData, getValuationData } from './helper.js';

const vault = window.vaultTexts || {};

let helper = JSON.parse(sessionStorage.getItem('helper')) || {};

// Use standardized data access functions
const vehicleData = getVehicleData();
const damageData = getDamageData();
const valuationData = getValuationData();

// Determine estimate type and draft mode
const estimateType = helper.meta?.estimate_type || 'אובדן_להלכה';
const isDraft = helper.meta?.status === 'draft';

// Vault Placeholder Replacer
function fillVaultTemplate(text, replacements) {
  return text.replace(/%([^%]+)%/g, (match, key) => {
    return replacements[key] !== undefined ? replacements[key] : match;
  });
}

// Build Estimate Text Blocks
function buildEstimateVaultBlocks() {
  const estimateKey = `estimate_${estimateType}`;
  const baseText = vault[estimateKey] || {};

  return {
    legal_basis: fillVaultTemplate(baseText.text || '', getEstimateReplacementMap()),
    title: baseText.title || 'אומדן ראשוני',
    intellectual: vault.intellectual_property || '',
    assessor_intro: vault.assessor_introduction || '',
    assessor_qual: vault.assessor_qualifications || ''
  };
}

// Value Mapping Logic for Estimates (no fees/depreciation)
function getEstimateReplacementMap() {
  // Use expertise calculations as base (no invoice override for estimates)
  const m = helper.expertise?.calculations || {};
  const d = valuationData.depreciation || {};
  
  return {
    "שווי_פיצוי": MathEngine.formatCurrency(m.total_compensation || damageData.summary?.total_damage_amount),
    "אחוז_נזק": `${MathEngine.round(m.damage_percent || damageData.summary?.damage_percentage)}%`,
    "ירידת_ערך": MathEngine.formatCurrency(d.global_amount || 0),
    "אחוז_ירידת_ערך": `${MathEngine.round(d.global_percent || 0)}%`,
    "ימי_מוסך": d.work_days || 0,
    "שווי_שוק": MathEngine.formatCurrency(m.market_value || valuationData.final_price),
    "שווי_מחירון": MathEngine.formatCurrency(m.vehicle_value_gross || valuationData.base_price),
    "קוד_דגם": vehicleData.model_code || 'לא זמין',
    "מוקדי_נזק": helper.damage_sections?.length || 1,
    "שווי_רכב": MathEngine.formatCurrency(valuationData.final_price || 0),
    "שווי_שרידים": MathEngine.formatCurrency(helper.scrap_value || 0)
  };
}

// Render Handlerbar-like Tokens
import { renderHTMLBlock, sanitizeHTML } from "./render-html-block.js";

// Watermark Handling
function applyDraftWatermark(html) {
  if (!isDraft) return html;
  const watermark = '<div style="position:fixed; top:100px; left:100px; transform:rotate(-45deg); font-size:4em; opacity:0.1; z-index:9999;">טיוטה בלבד</div>';
  return watermark + html;
}

// Estimate Title Logic
function getEstimateTitle() {
  const estimateKey = `estimate_${estimateType}`;
  return vault[estimateKey]?.title || 'אומדן ראשוני';
}

// Calculate Summary Total (no fees/depreciation)
function calculateEstimateSummary() {
  const baseDamage = helper.expertise?.calculations?.base_damage || damageData.summary?.total_damage_amount || 0;
  const vatRate = MathEngine.getVatRate(); // Use VAT from math.js (controlled by admin hub)
  const vat = MathEngine.round(baseDamage * vatRate / 100);
  const total = MathEngine.round(baseDamage + vat);
  
  return {
    base_damage: baseDamage,
    vat_rate: vatRate,
    vat: vat,
    total: total,
    title: "סה\"כ תביעה" // Different from expertise summary
  };
}

// Inject Estimate Report
function injectEstimateHTML() {
  const container = document.getElementById("estimate-output");
  if (!container) return;

  if (!helper || !helper.meta) {
    container.innerHTML = `
      <div style="border: 2px solid red; padding: 20px; font-size: 18px; color: red; text-align: center;">
        ⚠️ אין נתונים זמינים להצגת האומדן.<br>
        ודא שהוזן מידע קודם דרך שלב האקספרטיזה או שטעינת הנתונים הצליחה.
      </div>
    `;
    return;
  }

  const htmlTemplate = document.getElementById("estimate-template-html").innerHTML;
  const vaultBlocks = buildEstimateVaultBlocks();
  const summary = calculateEstimateSummary();
  const map = { 
    helper, 
    vault: vaultBlocks, 
    meta: helper.meta, 
    title: getEstimateTitle(),
    summary: summary
  };

  const rendered = renderHTMLBlock(htmlTemplate, map);
  const safeHTML = sanitizeHTML(rendered);
  container.innerHTML = applyDraftWatermark(safeHTML);
}

// Export Estimate
function exportEstimate() {
  const html = document.getElementById("estimate-output").innerHTML;
  const plate = sessionStorage.getItem('plate') || helper.car_details?.plate || 'unknown';
  
  // Update helper with estimate data
  helper.meta.estimate_generated = true;
  helper.meta.estimate_type = estimateType;
  helper.meta.estimate_timestamp = Date.now();
  helper.estimate_summary = calculateEstimateSummary();
  
  sessionStorage.setItem("helper", JSON.stringify(helper));

  sendToWebhook('SUBMIT_ESTIMATE', {
    html,
    meta: helper.meta,
    estimate_type: estimateType,
    plate: plate,
    summary: helper.estimate_summary,
    date: new Date().toISOString()
  }).then(res => {
    alert('האומדן נשלח בהצלחה');
  }).catch(() => {
    alert('שליחה נכשלה');
  });
}

// Print Estimate
function printEstimate() {
  window.print();
}

// Set Estimate Type
function setEstimateType(type) {
  helper.meta.estimate_type = type;
  sessionStorage.setItem("helper", JSON.stringify(helper));
  injectEstimateHTML();
}

// Update Damage Centers (for validation/override)
function updateDamageCenter(index, updates) {
  if (!helper.damage_sections || !helper.damage_sections[index]) return;
  
  Object.assign(helper.damage_sections[index], updates);
  sessionStorage.setItem("helper", JSON.stringify(helper));
  injectEstimateHTML();
}

// Add Additional Notes
function addEstimateNotes(notes) {
  if (!helper.estimate_notes) helper.estimate_notes = [];
  helper.estimate_notes.push({
    text: notes,
    timestamp: Date.now()
  });
  sessionStorage.setItem("helper", JSON.stringify(helper));
}

window.estimateGenerator = {
  inject: injectEstimateHTML,
  export: exportEstimate,
  print: printEstimate,
  setType: setEstimateType,
  updateDamageCenter: updateDamageCenter,
  addNotes: addEstimateNotes,
  getData: () => helper
};

console.log('✅ estimate-generator.js loaded for post-session estimate generation');