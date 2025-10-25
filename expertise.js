// expertise.js — Expertise Engine with math.js integration

import { MathEngine } from './math.js';
import { sendToWebhook } from './webhook.js';

// ✅ FIX: helper.js is not an ES6 module, use window object
const { getVehicleData, getDamageData, getValuationData, getFinancialData } = window;

const helper = JSON.parse(sessionStorage.getItem("expertise")) || {
  meta: {},
  contact: {},
  car_details: {},
  damage_sections: [],
  files: [],
  levi_report: {},
  depreciation: {},
  fees: {},
  calculations: {},
  invoice_uploaded: false
};

function updateExpertiseCalculations() {
  // Use standardized data access
  const vehicleData = getVehicleData();
  const damageData = getDamageData();
  const valuationData = getValuationData();
  const financialData = getFinancialData();
  
  const baseDamage = helper.summary?.total_damage || damageData.summary?.total_damage_amount || 0;
  const depreciation = helper.depreciation?.global_amount || valuationData.depreciation?.global_amount || 0;
  const fees = helper.fees || financialData.fees || {};
  const marketValue = helper.car_details?.market_value || vehicleData.market_value || 0;
  const shavehPercent = helper.car_details?.shaveh_percent || 0;
  const vatRate = helper.meta?.vat_rate || financialData.taxes?.vat_percentage || (window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate());

  helper.calculations = MathEngine.calculateAll({
    baseDamage,
    depreciation,
    fees,
    marketValue,
    shavehPercent,
    vatRate
  });
}

function updateInvoiceCalculations() {
  if (!helper.invoice_uploaded) return;

  // Use standardized data access for invoice calculations
  const vehicleData = getVehicleData();
  const financialData = getFinancialData();
  
  const baseDamage = helper.invoice_summary?.total_damage || financialData.costs?.subtotal || 0;
  const depreciation = helper.invoice_depreciation?.global_amount || 0;
  const fees = helper.invoice_fees || financialData.fees || {};
  const marketValue = helper.car_details?.market_value || vehicleData.market_value || 0;
  const shavehPercent = helper.car_details?.shaveh_percent || 0;
  const vatRate = helper.meta?.vat_rate || financialData.taxes?.vat_percentage || (window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate());

  helper.invoice_calculations = MathEngine.calculateAll({
    baseDamage,
    depreciation,
    fees,
    marketValue,
    shavehPercent,
    vatRate
  });
}

function exportExpertise() {
  updateExpertiseCalculations();
  updateInvoiceCalculations();

  sessionStorage.setItem("expertise", JSON.stringify(helper));
  sendToWebhook("EXPERTISE_EXPORT", helper);
}

window.expertiseEngine = {
  data: helper,
  updateField(section, key, value) {
    if (!helper[section]) helper[section] = {};
    helper[section][key] = value;
  },
  addDamageCenter(obj) {
    helper.damage_sections.push(obj);
  },
  addLeviAdjustment(adj) {
    if (!helper.levi_report.adjustments) helper.levi_report.adjustments = [];
    helper.levi_report.adjustments.push(adj);
  },
  attachFile(file) {
    helper.files.push(file);
  },
  updateCosts(costs) {
    helper.fees = costs;
  },
  updateSummary(summary) {
    helper.summary = summary;
  },
  exportExpertise
};

console.log("✅ expertise.js loaded with math.js integration");
