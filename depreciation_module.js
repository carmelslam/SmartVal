// depreciation_module.js - handles depreciation inputs and summary
import { helper, updateHelper, updateCalculations, saveHelperToStorage } from './helper.js';

function $(id) {
  return document.getElementById(id);
}

function init() {
  const meta = helper.meta || {};
  const vehicle = helper.vehicle || {};
  const client = helper.client || {};
  const levi = helper.expertise?.levi_report || {};
  const calc = helper.expertise?.calculations || {};
  const dep = helper.expertise?.depreciation || {};

  if ($('pageTitle')) $('pageTitle').innerText = `רכב מס. ${meta.plate || '...'}`;
  if ($('carPlate')) $('carPlate').innerText = meta.plate || vehicle.plate_number || '';
  if ($('carManufacturer')) $('carManufacturer').innerText = vehicle.manufacturer || '';
  if ($('carModel')) $('carModel').innerText = vehicle.model || '';
  if ($('carYear')) $('carYear').innerText = vehicle.year || '';
  if ($('carBasePrice')) $('carBasePrice').innerText = levi.base_price || '';
  if ($('carReportDate')) $('carReportDate').innerText = levi.report_date || '';

  if ($('totalClaim')) $('totalClaim').innerText = calc.total_damage || '';
  if ($('grossPercent')) $('grossPercent').innerText = calc.damage_percent ? `${calc.damage_percent}%` : '';
  if ($('authorizedClaim')) $('authorizedClaim').innerText = calc.total_damage || '';
  if ($('finalMarketValue')) $('finalMarketValue').innerText = levi.final_price || calc.market_value || '';

  if ($('leviPriceList')) {
    const adj = levi.adjustments || {};
    const parts = Object.keys(adj).map(k => {
      const a = adj[k] || {}; return a.percent ? `${k}:${a.percent}%(${a.value})` : '';
    }).filter(Boolean);
    $('leviPriceList').innerText = parts.join(', ');
  }

  if ($('ownerName')) $('ownerName').innerText = client.name || '';
  if ($('ownerAddress')) $('ownerAddress').innerText = client.address || '';
  if ($('ownerPhone')) $('ownerPhone').innerText = client.phone_number || '';
  if ($('insuranceCompany')) $('insuranceCompany').innerText = client.insurance_company || '';
  if ($('insuranceEmail')) $('insuranceEmail').innerText = client.insurance_email || '';
  if ($('insuranceAgent')) $('insuranceAgent').innerText = client.insurance_agent || '';
  if ($('agentPhone')) $('agentPhone').innerText = client.insurance_agent_phone || '';
  if ($('agentEmail')) $('agentEmail').innerText = client.insurance_agent_email || '';

  // report type select
  if ($('reportType')) {
    $('reportType').value = meta.report_type_display || $('reportType').value;
    $('reportType').addEventListener('change', () => {
      const sel = $('reportType');
      updateHelper('meta', { report_type_display: sel.value });
      saveAndRefresh();
      updateSummaryVisibility();
    });
  }

  // company client select
  if ($('isCompanyClient')) {
    $('isCompanyClient').value = helper.client?.is_company_client ? 'yes' : 'no';
    $('isCompanyClient').addEventListener('change', () => {
      updateHelper('client', { is_company_client: $('isCompanyClient').value === 'yes' });
      saveAndRefresh();
    });
  }

  // depreciation bulk table and global percent
  renderDepTable(dep.centers || []);
  $('globalDep1').value = dep.global_percent || '';
  $('globalDep1').addEventListener('input', saveAndRefresh);

  // work days, agreement
  $('workDays').value = dep.work_days || '';
  $('workDays').addEventListener('input', saveAndRefresh);
  $('isAgreement').checked = !!dep.is_agreement;
  $('isAgreement').addEventListener('change', saveAndRefresh);

  // differentials
  $('hasDifferentials').checked = !!dep.has_differentials;
  $('hasDifferentials').addEventListener('change', () => {
    toggleDifferentials();
    saveAndRefresh();
  });
  toggleDifferentials();
  renderDifferentials(dep.differentials || []);

  refreshSummary();
  updateSummaryVisibility();
}

function collectDepCenters() {
  return Array.from(document.querySelectorAll('#depreciationBulkTable .dep-row')).map(row => ({
    part: row.querySelector('.dep-part').value.trim(),
    repair: row.querySelector('.dep-repair').value.trim(),
    percent: parseFloat(row.querySelector('.dep-percent').value) || 0
  }));
}

function renderDepTable(list) {
  const table = $('depreciationBulkTable');
  if (!table) return;
  table.innerHTML = '';
  list.forEach(item => {
    const row = createDepRow(item);
    table.appendChild(row);
  });
}

function createDepRow(data = {}) {
  const div = document.createElement('div');
  div.className = 'form-row dep-row';
  div.innerHTML = `
    <input type="text" class="dep-part" placeholder="החלק הניזוק" value="${data.part || ''}">
    <input type="text" class="dep-repair" placeholder="מהות התיקון" value="${data.repair || ''}">
    <input type="number" class="dep-percent" placeholder="% ירידת ערך" value="${data.percent || ''}">
    <button type="button" class="btn remove">✕</button>
  `;
  div.querySelector('.remove').addEventListener('click', () => {
    div.remove();
    saveAndRefresh();
  });
  ['dep-part','dep-repair','dep-percent'].forEach(cls => {
    div.querySelector('.' + cls).addEventListener('input', saveAndRefresh);
  });
  return div;
}

export function addDepField() {
  const table = $('depreciationBulkTable');
  table.appendChild(createDepRow());
}

function collectDifferentials() {
  return Array.from(document.querySelectorAll('#differentialsTable .diff-row')).map(row => ({
    desc: row.querySelector('.diff-desc').value.trim(),
    amount: parseFloat(row.querySelector('.diff-amount').value) || 0
  }));
}

function renderDifferentials(list) {
  const table = $('differentialsTable');
  if (!table) return;
  table.innerHTML = '';
  list.forEach(item => {
    const row = createDiffRow(item);
    table.appendChild(row);
  });
}

function createDiffRow(data = {}) {
  const div = document.createElement('div');
  div.className = 'form-row diff-row';
  div.innerHTML = `
    <input type="text" class="diff-desc" placeholder="תיאור" value="${data.desc || ''}">
    <input type="number" class="diff-amount" placeholder="ש"ח" value="${data.amount || ''}">
    <button type="button" class="btn remove">✕</button>
  `;
  div.querySelector('.remove').addEventListener('click', () => {
    div.remove();
    saveAndRefresh();
  });
  ['diff-desc','diff-amount'].forEach(cls => {
    div.querySelector('.' + cls).addEventListener('input', saveAndRefresh);
  });
  return div;
}

export function addSummaryRow() {
  const table = $('differentialsTable');
  table.appendChild(createDiffRow());
}

export function toggleSection(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function toggleDifferentials() {
  const table = $('differentialsTable');
  const summary = $('differentialsSummary');
  const show = $('hasDifferentials').checked;
  if (table) table.style.display = show ? 'block' : 'none';
  if (summary) summary.style.display = show ? 'block' : 'none';
}

function updateSummaryVisibility() {
  const type = $('reportType')?.value || 'חוות דעת פרטית';
  const map = {
    'חוות דעת פרטית': 'summaryPrivate',
    'חוות דעת גלובלית': 'summaryGlobal',
    'חוות דעת מכירה מצבו הניזוק': 'summaryDamage',
    'חוות דעת טוטלוסט': 'summaryTotalLoss',
    'חוות דעת אובדן להלכה': 'summaryLegalLoss'
  };
  Object.values(map).forEach(id => {
    const el = $(id); if (el) el.style.display = 'none';
  });
  const active = map[type];
  if (active && $(active)) $(active).style.display = 'block';

  const depSec = $('depreciationSection');
  if (depSec) {
    depSec.style.display = (type === 'חוות דעת טוטלוסט' || type === 'חוות דעת מכירה מצבו הניזוק') ? 'none' : 'block';
  }
}

function saveAndRefresh() {
  updateHelper('expertise', {
    depreciation: {
      centers: collectDepCenters(),
      global_percent: parseFloat($('globalDep1').value) || 0,
      work_days: $('workDays').value || '',
      is_agreement: $('isAgreement').checked,
      has_differentials: $('hasDifferentials').checked,
      differentials: collectDifferentials(),
      global_amount: calculateGlobalAmount()
    }
  });
  if ($('isCompanyClient')) {
    updateHelper('client', { is_company_client: $('isCompanyClient').value === 'yes' });
  }
  saveHelperToStorage();
  updateCalculations();
  refreshSummary();
  updateSummaryVisibility();
}

function calculateGlobalAmount() {
  const marketValue = parseFloat(helper.expertise?.levi_report?.final_price) || 0;
  const percent = parseFloat($('globalDep1').value) || 0;
  return Math.round((marketValue * percent) / 100);
}

function refreshSummary() {
  const calc = helper.expertise?.calculations || {};
  $('sumMarketValue').value = calc.market_value || '';
  $('sumClaim').value = calc.total_damage || '';
  $('depCompensation').value = helper.expertise?.depreciation?.global_amount || '';
  $('sumTotal').value = calc.total_compensation || '';
}

window.addDepField = addDepField;
window.addSummaryRow = addSummaryRow;
window.toggleSection = toggleSection;
window.updateSummaryVisibility = updateSummaryVisibility;

window.generateAdditionalReport = () => {};

document.addEventListener('DOMContentLoaded', init);

