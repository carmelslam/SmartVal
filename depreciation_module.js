// depreciation_module.js - handles depreciation inputs and summary
import { helper, updateHelper, updateCalculations, saveHelperToStorage } from './helper.js';

function $(id) {
  return document.getElementById(id);
}

function init() {
  const meta = helper.meta || {};
  const dep = helper.expertise?.depreciation || {};

  // report type select
  if ($('reportType')) {
    $('reportType').value = meta.report_type_display || $('reportType').value;
    $('reportType').addEventListener('change', () => {
      const sel = $('reportType');
      updateHelper('meta', { report_type_display: sel.value });
      saveAndRefresh();
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

window.generateAdditionalReport = () => {};

document.addEventListener('DOMContentLoaded', init);

