// depreciation_module.js - Fixed implementation with proper functionality
import { helper, updateHelper, updateCalculations, saveHelperToStorage, getVehicleData, getDamageData, getValuationData, syncLeviData } from './helper.js';
import { MathEngine } from './math.js';

function $(id) {
  return document.getElementById(id);
}

function init() {
  console.log('Depreciation module initializing...');
  
  // Use standardized data access
  const meta = helper.meta || {};
  const vehicleData = getVehicleData();
  const damageData = getDamageData();
  const valuationData = getValuationData();
  const client = helper.client || {};
  
  // Fallback to legacy paths for compatibility
  const vehicle = vehicleData || helper.vehicle || {};
  const levi = valuationData || helper.expertise?.levi_report || {};
  const calc = helper.expertise?.calculations || {};
  const dep = helper.expertise?.depreciation || {};

  // Populate fixed data
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

  // FIXED: Report type select with proper event handling
  if ($('reportType')) {
    $('reportType').value = meta.report_type_display || 'חוות דעת פרטית';
    $('reportType').addEventListener('change', function() {
      const selectedType = this.value;
      console.log('Report type changed to:', selectedType);
      updateHelper('meta', { report_type_display: selectedType });
      updateSummaryVisibility();
      saveAndRefresh();
    });
  }

  // Company client select
  if ($('isCompanyClient')) {
    $('isCompanyClient').value = helper.client?.is_company_client ? 'yes' : 'no';
    $('isCompanyClient').addEventListener('change', () => {
      updateHelper('client', { is_company_client: $('isCompanyClient').value === 'yes' });
      saveAndRefresh();
    });
  }

  // Depreciation table and global percent with auto-calculation
  renderDepTable(dep.centers || []);
  if ($('globalDep1')) {
    $('globalDep1').value = dep.global_percent || '';
    $('globalDep1').addEventListener('input', () => {
      triggerMathCalculation();
      saveAndRefresh();
    });
  }

  // Work days, agreement
  if ($('workDays')) {
    $('workDays').value = dep.work_days || '';
    $('workDays').addEventListener('input', saveAndRefresh);
  }
  if ($('isAgreement')) {
    $('isAgreement').checked = !!dep.is_agreement;
    $('isAgreement').addEventListener('change', saveAndRefresh);
  }

  // FIXED: Differentials with proper checkbox handling
  if ($('hasDifferentials')) {
    $('hasDifferentials').checked = !!dep.has_differentials;
    $('hasDifferentials').addEventListener('change', function() {
      console.log('Differentials checkbox changed:', this.checked);
      toggleDifferentials();
      saveAndRefresh();
    });
  }
  
  // Initialize differentials display
  toggleDifferentials();
  renderDifferentials(dep.differentials || []);

  // Initial summary setup
  refreshSummary();
  updateSummaryVisibility();
  
  console.log('Depreciation module initialized successfully');
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
  div.className = 'dep-row';
  div.style.display = 'grid';
  div.style.gridTemplateColumns = '1fr 1fr 120px 80px';
  div.style.gap = '14px';
  div.style.marginBottom = '10px';
  div.innerHTML = `
    <div><input type="text" class="dep-part" placeholder="החלק הניזוק" value="${data.part || ''}"></div>
    <div><input type="text" class="dep-repair" placeholder="מהות התיקון" value="${data.repair || ''}"></div>
    <div><input type="number" class="dep-percent" placeholder="%" value="${data.percent || ''}"></div>
    <div><button type="button" class="btn remove" style="background:#dc3545; padding:8px 12px; margin-top:0;">✕</button></div>
  `;
  div.querySelector('.remove').addEventListener('click', () => {
    div.remove();
    saveAndRefresh();
  });
  ['dep-part','dep-repair','dep-percent'].forEach(cls => {
    div.querySelector('.' + cls).addEventListener('input', () => {
      if (cls === 'dep-percent') triggerMathCalculation();
      saveAndRefresh();
    });
  });
  return div;
}

export function addDepField() {
  const table = $('depreciationBulkTable');
  if (table) {
    table.appendChild(createDepRow());
  }
}

function collectDifferentials() {
  return Array.from(document.querySelectorAll('#differentialsRows .diff-row')).map(row => ({
    desc: row.querySelector('.diff-desc').value.trim(),
    amount: parseFloat(row.querySelector('.diff-amount').value) || 0
  }));
}

function renderDifferentials(list) {
  const container = $('differentialsRows');
  if (!container) return;
  container.innerHTML = '';
  list.forEach(item => {
    const row = createDiffRow(item);
    container.appendChild(row);
  });
  updateDifferentialsSummary();
}

function createDiffRow(data = {}) {
  const div = document.createElement('div');
  div.className = 'diff-row';
  div.style.display = 'grid';
  div.style.gridTemplateColumns = '1fr 120px 80px';
  div.style.gap = '14px';
  div.style.marginBottom = '10px';
  div.innerHTML = `
    <div><input type="text" class="diff-desc" placeholder="תיאור הפרש" value="${data.desc || ''}"></div>
    <div><input type="number" class="diff-amount" placeholder="סכום" value="${data.amount || ''}"></div>
    <div><button type="button" class="btn remove" style="background:#dc3545; padding:8px 12px; margin-top:0;">✕</button></div>
  `;
  div.querySelector('.remove').addEventListener('click', () => {
    div.remove();
    saveAndRefresh();
    updateDifferentialsSummary();
  });
  ['diff-desc','diff-amount'].forEach(cls => {
    div.querySelector('.' + cls).addEventListener('input', () => {
      if (cls === 'diff-amount') triggerMathCalculation();
      saveAndRefresh();
      updateDifferentialsSummary();
    });
  });
  return div;
}

function updateDifferentialsSummary() {
  const differentials = collectDifferentials();
  const total = differentials.reduce((sum, diff) => sum + diff.amount, 0);
  
  if ($('totalDifferentials')) {
    $('totalDifferentials').innerText = `₪${total.toLocaleString()}`;
  }
  
  // Calculate final total with differentials
  const baseTotal = parseFloat(helper.expertise?.calculations?.total_compensation || 0);
  const finalTotal = baseTotal + total;
  
  if ($('finalTotalWithDifferentials')) {
    $('finalTotalWithDifferentials').innerText = `₪${finalTotal.toLocaleString()}`;
  }
}

export function addDifferentialRow() {
  const container = $('differentialsRows');
  if (container) {
    container.appendChild(createDiffRow());
  }
}

export function addSummaryRow() {
  // Legacy function for compatibility
  addDifferentialRow();
}

// FIXED: Collapsible section toggle
export function toggleSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    console.log(`Toggled section ${id}: ${isHidden ? 'shown' : 'hidden'}`);
  }
}

// FIXED: Differentials toggle
function toggleDifferentials() {
  const checkbox = $('hasDifferentials');
  const table = $('differentialsTable');
  const summary = $('differentialsSummary');
  
  if (!checkbox) return;
  
  const show = checkbox.checked;
  console.log('Toggling differentials:', show);
  
  if (table) table.style.display = show ? 'block' : 'none';
  if (summary) summary.style.display = show ? 'block' : 'none';
  
  // Add initial row if showing for first time
  if (show && $('differentialsRows') && $('differentialsRows').children.length === 0) {
    addDifferentialRow();
  }
}

// FIXED: Summary visibility with proper mapping
function updateSummaryVisibility() {
  const type = $('reportType')?.value || 'חוות דעת פרטית';
  console.log('Updating summary visibility for type:', type);
  
  const map = {
    'חוות דעת פרטית': 'summaryPrivate',
    'חוות דעת גלובלית': 'summaryGlobal', 
    'חוות דעת מכירה מצבו הניזוק': 'summaryDamage',
    'חוות דעת טוטלוסט': 'summaryTotalLoss',
    'חוות דעת אובדן להלכה': 'summaryLegalLoss'
  };
  
  // Hide all summary blocks
  Object.values(map).forEach(id => {
    const el = $(id); 
    if (el) {
      el.style.display = 'none';
      console.log(`Hidden summary: ${id}`);
    }
  });
  
  // Show active summary
  const active = map[type];
  if (active && $(active)) {
    $(active).style.display = 'block';
    console.log(`Showing summary: ${active}`);
  }

  // Control depreciation section visibility
  const depSec = $('depreciationSection');
  if (depSec) {
    const hideDepreciation = (type === 'חוות דעת טוטלוסט' || type === 'חוות דעת מכירה מצבו הניזוק');
    depSec.style.display = hideDepreciation ? 'none' : 'block';
    console.log(`Depreciation section: ${hideDepreciation ? 'hidden' : 'shown'}`);
  }
}

function saveAndRefresh() {
  const depreciationData = {
    centers: collectDepCenters(),
    global_percent: parseFloat($('globalDep1')?.value || 0),
    work_days: $('workDays')?.value || '',
    is_agreement: $('isAgreement')?.checked || false,
    has_differentials: $('hasDifferentials')?.checked || false,
    differentials: collectDifferentials(),
    global_amount: calculateGlobalAmount()
  };
  
  updateHelper('expertise', { depreciation: depreciationData });
  
  if ($('isCompanyClient')) {
    updateHelper('client', { is_company_client: $('isCompanyClient').value === 'yes' });
  }
  
  saveHelperToStorage();
  updateCalculations();
  refreshSummary();
  updateDifferentialsSummary();
}

function calculateGlobalAmount() {
  const marketValue = parseFloat(helper.expertise?.levi_report?.final_price) || 0;
  const percent = parseFloat($('globalDep1')?.value || 0);
  return Math.round((marketValue * percent) / 100);
}

function refreshSummary() {
  const calc = helper.expertise?.calculations || {};
  const dep = helper.expertise?.depreciation || {};
  
  // Update all summary fields across all report types
  const summaryFields = [
    'sumMarketValue', 'sumMarketValueGlobal', 'sumMarketValueDamage', 
    'sumMarketValueTotal', 'sumMarketValueLegal'
  ];
  summaryFields.forEach(id => {
    if ($(id)) $(id).value = calc.market_value || '';
  });
  
  const claimFields = [
    'sumClaim', 'sumClaimGlobal'
  ];
  claimFields.forEach(id => {
    if ($(id)) $(id).value = calc.total_damage || '';
  });
  
  const depFields = [
    'depCompensation', 'depCompensationGlobal'
  ];
  depFields.forEach(id => {
    if ($(id)) $(id).value = dep.global_amount || '';
  });
  
  const totalFields = [
    'sumTotal', 'sumTotalGlobal', 'afterSaleDamage', 'afterSaleTotal', 'afterSaleLegal'
  ];
  totalFields.forEach(id => {
    if ($(id)) $(id).value = calc.total_compensation || '';
  });
  
  // Specific fields for different report types
  if ($('saleValueDamage')) $('saleValueDamage').value = calc.sale_value_damaged || '';
  if ($('salvageValueTotal')) $('salvageValueTotal').value = calc.salvage_value || '';
  if ($('salvageValueLegal')) $('salvageValueLegal').value = calc.salvage_value || '';
  if ($('storageValueTotal')) $('storageValueTotal').value = calc.storage_value || '';
}

// Global function exports
window.addDepField = addDepField;
window.addDifferentialRow = addDifferentialRow;
window.addSummaryRow = addSummaryRow;
window.toggleSection = toggleSection;
window.updateSummaryVisibility = updateSummaryVisibility;

// Generate report function placeholder
window.generateAdditionalReport = () => {
  console.log('Generating additional report...');
  // This will integrate with final report builder
};

// Math engine integration for auto-calculation
function triggerMathCalculation() {
  try {
    const mathEngine = new MathEngine();
    
    // Get current depreciation values
    const depCenters = collectDepCenters();
    const globalPercent = parseFloat($('globalDep1')?.value || 0);
    const differentials = collectDifferentials();
    
    // Get base values from helper
    const marketValue = parseFloat(helper.expertise?.levi_report?.final_price) || 0;
    const totalDamage = parseFloat(helper.expertise?.calculations?.total_damage) || 0;
    
    // Calculate depreciation compensation
    let totalDepPercent = 0;
    depCenters.forEach(center => {
      totalDepPercent += center.percent;
    });
    totalDepPercent += globalPercent;
    
    const depCompensation = Math.round((marketValue * totalDepPercent) / 100);
    
    // Calculate differentials total
    const differentialsTotal = differentials.reduce((sum, diff) => sum + diff.amount, 0);
    
    // Calculate final compensation
    const totalCompensation = depCompensation + differentialsTotal;
    
    // Update calculations in helper
    updateHelper('expertise', {
      calculations: {
        ...helper.expertise?.calculations,
        depreciation_percent: totalDepPercent,
        depreciation_compensation: depCompensation,
        differentials_total: differentialsTotal,
        total_compensation: totalCompensation
      }
    });
    
    // Refresh summary with new calculations
    refreshSummary();
    updateDifferentialsSummary();
    
    console.log('Math calculation triggered:', {
      depPercent: totalDepPercent,
      depCompensation,
      differentialsTotal,
      totalCompensation
    });
    
  } catch (error) {
    console.error('Math calculation error:', error);
  }
}

document.addEventListener('DOMContentLoaded', init);