// estimate-generator.js — Enhanced Estimate Generation Engine

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';
import { getVehicleData, getDamageData, getValuationData, updateHelper } from './helper.js';
import { loadLegalText } from './vault-loader.js';
import { validateData } from './validation.js';
import { estimateCoordinator } from './estimate-report.js';

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

// Build Estimate Text Blocks using vault loader
async function buildEstimateVaultBlocks() {
  const estimateKey = `estimate_${estimateType}`;
  
  try {
    // Use vault loader for consistent text loading
    const legalText = await loadLegalText(estimateKey);
    const intellectualProperty = await loadLegalText('intellectual_property');
    const assessorIntro = await loadLegalText('assessor_introduction');
    const assessorQual = await loadLegalText('assessor_qualifications');
    
    return {
      legal_basis: fillVaultTemplate(legalText || '', getEstimateReplacementMap()),
      title: vault[estimateKey]?.title || 'אומדן ראשוני',
      intellectual: intellectualProperty || '',
      assessor_intro: assessorIntro || '',
      assessor_qual: assessorQual || ''
    };
  } catch (error) {
    console.error('❌ Error loading vault texts:', error);
    // Fallback to existing vault system
    const baseText = vault[estimateKey] || {};
    return {
      legal_basis: fillVaultTemplate(baseText.text || '', getEstimateReplacementMap()),
      title: baseText.title || 'אומדן ראשוני',
      intellectual: vault.intellectual_property || '',
      assessor_intro: vault.assessor_introduction || '',
      assessor_qual: vault.assessor_qualifications || ''
    };
  }
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

// Inject Estimate Report with enhanced validation and coordination
async function injectEstimateHTML() {
  const container = document.getElementById("estimate-output");
  if (!container) return;

  try {
    // Validate basic data
    const validation = validateData({ 
      helper, 
      required: ['meta', 'car_details'], 
      type: 'estimate' 
    });
    
    if (!validation.valid) {
      container.innerHTML = `
        <div style="border: 2px solid red; padding: 20px; font-size: 18px; color: red; text-align: center;">
          ⚠️ אין נתונים זמינים להצגת האומדן.<br>
          ${validation.errors?.join('<br>') || 'ודא שהוזן מידע קודם דרך שלב האקספרטיזה או שטעינת הנתונים הצליחה.'}
        </div>
      `;
      return;
    }

    // Initialize coordinator if needed
    if (!estimateCoordinator.isReady()) {
      await estimateCoordinator.initialize();
    }

    const htmlTemplate = document.getElementById("estimate-template-html").innerHTML;
    const vaultBlocks = await buildEstimateVaultBlocks();
    const summary = calculateEstimateSummary();
    const coordinatorData = estimateCoordinator.getEstimateData();
    
    const map = { 
      helper, 
      vault: vaultBlocks, 
      meta: helper.meta, 
      title: getEstimateTitle(),
      summary: summary,
      estimate: coordinatorData
    };

    // Use render function if available, otherwise fallback
    let rendered;
    if (typeof renderHTMLBlock === 'function') {
      rendered = renderHTMLBlock(htmlTemplate, map);
    } else {
      // Simple template replacement fallback
      rendered = htmlTemplate.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = getNestedValue(map, path.trim());
        return value !== undefined ? value : match;
      });
    }
    
    // Sanitize if function available
    const safeHTML = typeof sanitizeHTML === 'function' ? sanitizeHTML(rendered) : rendered;
    container.innerHTML = applyDraftWatermark(safeHTML);
    
    console.log('✅ Estimate HTML injected successfully');
    
  } catch (error) {
    console.error('❌ Error injecting estimate HTML:', error);
    container.innerHTML = `
      <div style="border: 2px solid orange; padding: 20px; font-size: 18px; color: orange; text-align: center;">
        ⚠️ שגיאה בטעינת האומדן: ${error.message}<br>
        אנא נסה לרענן את הדף או לחזור לשלב הקודם.
      </div>
    `;
  }
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Export Estimate using coordination system
async function exportEstimate() {
  try {
    // Initialize coordinator if needed
    if (!estimateCoordinator.isReady()) {
      await estimateCoordinator.initialize();
    }
    
    // Validate estimate data
    const validation = estimateCoordinator.validateEstimateData();
    if (!validation.overall) {
      alert('האומדן לא עובר אימות. אנא בדוק את הנתונים ונסה שוב.');
      console.error('❌ Estimate validation failed:', validation);
      return;
    }
    
    // Export data through coordinator
    const exportedData = estimateCoordinator.exportEstimateData();
    
    // Generate report via coordinator
    const response = await estimateCoordinator.generateEstimateReport();
    
    if (response.success) {
      alert('האומדן נוצר ונשלח בהצלחה!');
      
      // Update helper with generation data
      const currentHelper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      currentHelper.meta = currentHelper.meta || {};
      currentHelper.meta.estimate_generated = true;
      currentHelper.meta.estimate_type = estimateType;
      currentHelper.meta.estimate_timestamp = Date.now();
      currentHelper.estimate_summary = calculateEstimateSummary();
      
      // Use helper update function for consistency
      updateHelper(currentHelper);
      
      console.log('✅ Estimate exported successfully');
    } else {
      throw new Error(response.error || 'Failed to generate estimate report');
    }
    
  } catch (error) {
    console.error('❌ Error exporting estimate:', error);
    
    // Fallback to direct webhook
    try {
      const html = document.getElementById("estimate-output").innerHTML;
      const plate = sessionStorage.getItem('plate') || helper.car_details?.plate || 'unknown';
      
      const response = await sendToWebhook('SUBMIT_ESTIMATE', {
        html,
        meta: helper.meta,
        estimate_type: estimateType,
        plate: plate,
        summary: calculateEstimateSummary(),
        date: new Date().toISOString()
      });
      
      if (response.success) {
        alert('האומדן נשלח בהצלחה (גיבוי)');
      } else {
        alert('שליחה נכשלה: ' + (response.error || 'שגיאה לא ידועה'));
      }
    } catch (fallbackError) {
      console.error('❌ Fallback export also failed:', fallbackError);
      alert('שגיאה בשליחת האומדן. אנא נסה שוב או פנה לתמיכה.');
    }
  }
}

// Print Estimate
function printEstimate() {
  window.print();
}

// Set Estimate Type using coordination system
async function setEstimateType(type) {
  try {
    // Validate estimate type
    if (!['אובדן_להלכה', 'טוטלוס'].includes(type)) {
      throw new Error(`Invalid estimate type: ${type}`);
    }
    
    // Initialize coordinator if needed
    if (!estimateCoordinator.isReady()) {
      await estimateCoordinator.initialize();
    }
    
    // Set type through coordinator
    await estimateCoordinator.setEstimateType(type);
    
    // Update local helper
    helper.meta = helper.meta || {};
    helper.meta.estimate_type = type;
    updateHelper(helper);
    
    // Re-inject HTML with new type
    await injectEstimateHTML();
    
    console.log('✅ Estimate type set to:', type);
    
  } catch (error) {
    console.error('❌ Error setting estimate type:', error);
    
    // Fallback to direct update
    helper.meta = helper.meta || {};
    helper.meta.estimate_type = type;
    sessionStorage.setItem("helper", JSON.stringify(helper));
    await injectEstimateHTML();
  }
}

// Update Damage Centers (for validation/override)
function updateDamageCenter(index, updates) {
  if (!helper.damage_sections || !helper.damage_sections[index]) return;
  
  Object.assign(helper.damage_sections[index], updates);
  sessionStorage.setItem("helper", JSON.stringify(helper));
  injectEstimateHTML();
}

// Add Additional Notes using coordination system
async function addEstimateNotes(notes) {
  try {
    // Initialize coordinator if needed
    if (!estimateCoordinator.isReady()) {
      await estimateCoordinator.initialize();
    }
    
    // Add notes through coordinator
    estimateCoordinator.addNotes(notes);
    
    // Also maintain legacy format for compatibility
    if (!helper.estimate_notes) helper.estimate_notes = [];
    helper.estimate_notes.push({
      text: notes,
      timestamp: Date.now()
    });
    
    updateHelper(helper);
    
    console.log('📝 Estimate notes added:', notes);
    
  } catch (error) {
    console.error('❌ Error adding estimate notes:', error);
    
    // Fallback to direct update
    if (!helper.estimate_notes) helper.estimate_notes = [];
    helper.estimate_notes.push({
      text: notes,
      timestamp: Date.now()
    });
    sessionStorage.setItem("helper", JSON.stringify(helper));
  }
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