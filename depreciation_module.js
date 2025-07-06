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
  if ($('pageTitle')) $('pageTitle').innerText = `תיק מס. ${meta.case_id || meta.plate || '...'}`;
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
      calculateGlobalDepreciationValue();
      triggerMathCalculation();
      saveAndRefresh();
    });
  }
  if ($('globalDepValue')) {
    $('globalDepValue').value = dep.global_amount || '';
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
    percent: parseFloat(row.querySelector('.dep-percent').value) || 0,
    value: parseFloat(row.querySelector('.dep-value').value) || 0
  }));
}

function renderDepTable(list) {
  const table = $('depreciationBulkTable');
  if (!table) return;
  table.innerHTML = '';
  list.forEach(item => {
    const row = createDepRow(item);
    table.appendChild(row);
    // Calculate value if percent is set but value is missing
    if (item.percent && !item.value) {
      calculateDepreciationValue(row);
    }
  });
}

function createDepRow(data = {}) {
  const div = document.createElement('div');
  div.className = 'dep-row';
  div.style.display = 'grid';
  div.style.gridTemplateColumns = '1fr 1fr 120px 120px 80px';
  div.style.gap = '14px';
  div.style.marginBottom = '10px';
  div.innerHTML = `
    <div style="position: relative;">
      <input type="text" class="dep-part" placeholder="החלק הניזוק" value="${data.part || ''}" autocomplete="off">
      <div class="damage-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; max-height: 200px; overflow-y: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
    </div>
    <div><input type="text" class="dep-repair" placeholder="מהות התיקון" value="${data.repair || ''}"></div>
    <div><input type="number" class="dep-percent" placeholder="%" value="${data.percent || ''}"></div>
    <div><input type="number" class="dep-value" placeholder="₪" value="${data.value || ''}" readonly style="background:#f4f6fa;"></div>
    <div><button type="button" class="btn remove" style="background:#dc3545; padding:8px 12px; margin-top:0;">✕</button></div>
  `;
  
  div.querySelector('.remove').addEventListener('click', () => {
    div.remove();
    saveAndRefresh();
  });
  
  // Setup auto-complete for damage part field
  const partInput = div.querySelector('.dep-part');
  const suggestionsDiv = div.querySelector('.damage-suggestions');
  setupDamagePartAutoComplete(partInput, suggestionsDiv);
  
  ['dep-part','dep-repair','dep-percent'].forEach(cls => {
    div.querySelector('.' + cls).addEventListener('input', () => {
      if (cls === 'dep-percent') {
        calculateDepreciationValue(div);
        triggerMathCalculation();
      }
      saveAndRefresh();
    });
  });
  return div;
}

// FIXED: Damage part auto-complete functionality
function setupDamagePartAutoComplete(input, suggestionsDiv) {
  // Common damage center names from system data
  const commonDamageParts = [
    'פגוש קדמי', 'פגוש אחורי', 'דלת קדמית ימין', 'דלת קדמית שמאל',
    'דלת אחורית ימין', 'דלת אחורית שמאל', 'מכסה מנוע', 'מכסה תא מטען',
    'חלון קדמי', 'חלון אחורי', 'מראה צד ימין', 'מראה צד שמאל',
    'פנס קדמי ימין', 'פנס קדמי שמאל', 'פנס אחורי ימין', 'פנס אחורי שמאל',
    'רוח קדמית', 'רוח אחורית', 'גג', 'מדף תחתון', 'רמקול אחורי',
    'קוסלת ימין', 'קוסלת שמאל', 'עמוד A', 'עמוד B', 'עמוד C',
    'משקף דלת', 'ידית דלת', 'זגוגית צד', 'זגוגית משולשת'
  ];

  // Get existing damage centers from helper data
  const existingDamageParts = [];
  try {
    const damageBlocks = helper.expertise?.damage_blocks || [];
    const depreciationCenters = helper.expertise?.depreciation?.centers || [];
    
    damageBlocks.forEach(block => {
      if (block.center && !existingDamageParts.includes(block.center)) {
        existingDamageParts.push(block.center);
      }
    });
    
    depreciationCenters.forEach(center => {
      if (center.part && !existingDamageParts.includes(center.part)) {
        existingDamageParts.push(center.part);
      }
    });
  } catch (error) {
    console.log('Could not load existing damage parts:', error);
  }

  // Combine all suggestions
  const allSuggestions = [...new Set([...existingDamageParts, ...commonDamageParts])];

  input.addEventListener('input', () => {
    const value = input.value.trim();
    if (value.length < 1) {
      suggestionsDiv.style.display = 'none';
      return;
    }

    const filtered = allSuggestions.filter(suggestion => 
      suggestion.includes(value) || value.includes(suggestion.substring(0, 2))
    );

    if (filtered.length === 0) {
      suggestionsDiv.style.display = 'none';
      return;
    }

    suggestionsDiv.innerHTML = filtered.slice(0, 8).map(suggestion => 
      `<div class="suggestion-item" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;">${suggestion}</div>`
    ).join('');

    suggestionsDiv.style.display = 'block';

    // Add click handlers for suggestions
    suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.textContent;
        suggestionsDiv.style.display = 'none';
        saveAndRefresh();
      });
    });
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });
}

// Calculate depreciation value for individual row
function calculateDepreciationValue(row) {
  const percent = parseFloat(row.querySelector('.dep-percent').value) || 0;
  const marketValue = parseFloat(helper.expertise?.levi_report?.final_price) || 0;
  const value = Math.round((marketValue * percent) / 100);
  row.querySelector('.dep-value').value = value;
}

export function addDepField() {
  const table = $('depreciationBulkTable');
  if (table) {
    table.appendChild(createDepRow());
  }
}

function collectDifferentials() {
  return Array.from(document.querySelectorAll('#differentialsRows .diff-row')).map(row => {
    const amount = parseFloat(row.querySelector('.diff-amount').value) || 0;
    const vat = parseFloat(row.querySelector('.diff-vat').value) || 0;
    const total = parseFloat(row.querySelector('.diff-total').value) || 0;
    
    // Get description from either dropdown selection or manual input
    const selectElement = row.querySelector('.diff-desc-select');
    const textInput = row.querySelector('.diff-desc');
    let description = '';
    
    if (selectElement && selectElement.value && selectElement.value !== 'custom') {
      // Use dropdown selection text
      description = selectElement.options[selectElement.selectedIndex].text;
    } else {
      // Use manual input
      description = textInput.value.trim();
    }
    
    return {
      desc: description,
      amount: amount,
      vat: vat,
      total_with_vat: total,
      invoiceItemId: row.dataset.invoiceItemId || null
    };
  });
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
  div.style.gridTemplateColumns = '1fr 120px 120px 120px 80px';
  div.style.gap = '14px';
  div.style.marginBottom = '10px';
  
  // Get VAT rate from system configuration (default 18%)
  const vatRate = (typeof MathEngine !== 'undefined' && MathEngine.getVatRate) ? 
                  MathEngine.getVatRate() / 100 : 0.18;
  const vat = data.vat || Math.round((data.amount || 0) * vatRate);
  const totalWithVat = data.total_with_vat || Math.round((data.amount || 0) * (1 + vatRate));
  
  // Create invoice items dropdown
  const invoiceItems = getInvoiceItemsForDropdown();
  const optionsHtml = invoiceItems.map(item => 
    `<option value="${item.id}" ${data.invoiceItemId === item.id ? 'selected' : ''}>${item.description}</option>`
  ).join('');
  
  div.innerHTML = `
    <div>
      <select class="diff-desc-select" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
        <option value="">בחר פריט מהחשבונית...</option>
        ${optionsHtml}
        <option value="custom">הזנה ידנית</option>
      </select>
      <input type="text" class="diff-desc" placeholder="תיאור הפרש" value="${data.desc || ''}" style="width:100%; margin-top:5px; display:${data.desc && !data.invoiceItemId ? 'block' : 'none'};">
    </div>
    <div><input type="number" class="diff-amount" placeholder="סכום" value="${data.amount || ''}" readonly style="background:#f4f6fa;"></div>
    <div><input type="number" class="diff-vat" placeholder="מע&quot;מ" value="${vat}" readonly style="background:#f4f6fa;"></div>
    <div><input type="number" class="diff-total" placeholder="סה&quot;כ" value="${totalWithVat}" readonly style="background:#f4f6fa;"></div>
    <div><button type="button" class="btn remove" style="background:#dc3545; padding:8px 12px; margin-top:0;">✕</button></div>
  `;
  
  // Setup event listeners
  setupDifferentialRowEvents(div);
  
  return div;
}

// NEW: Get invoice items for dropdown
function getInvoiceItemsForDropdown() {
  const items = [];
  
  try {
    let helper = {};
    
    // Try to get data from sessionStorage helper
    try {
      const storedHelper = sessionStorage.getItem('helper');
      if (storedHelper) {
        helper = JSON.parse(storedHelper);
      }
    } catch (parseError) {
      console.warn('Could not parse helper from sessionStorage:', parseError);
    }
    
    // Fallback to global helper variable
    if (Object.keys(helper).length === 0 && typeof window.helper !== 'undefined') {
      helper = window.helper;
    }
    
    // Get invoice data
    const invoice = helper.invoice || {};
    const documentsInvoices = helper.documents?.invoices || [];
    
    // Add main invoice items
    if (invoice.parts && Array.isArray(invoice.parts)) {
      invoice.parts.forEach((part, index) => {
        if (part.name && part.price) {
          items.push({
            id: `part_${index}`,
            description: `חלק: ${part.name} - ${part.description || ''}`,
            amount: parseFloat(part.price) || 0,
            type: 'part'
          });
        }
      });
    }
    
    if (invoice.works && Array.isArray(invoice.works)) {
      invoice.works.forEach((work, index) => {
        if (work.type && work.cost) {
          items.push({
            id: `work_${index}`,
            description: `עבודה: ${work.type} - ${work.description || ''}`,
            amount: parseFloat(work.cost) || 0,
            type: 'work'
          });
        }
      });
    }
    
    if (invoice.repairs && Array.isArray(invoice.repairs)) {
      invoice.repairs.forEach((repair, index) => {
        if (repair.name && repair.cost) {
          items.push({
            id: `repair_${index}`,
            description: `תיקון: ${repair.name} - ${repair.description || ''}`,
            amount: parseFloat(repair.cost) || 0,
            type: 'repair'
          });
        }
      });
    }
    
    // Add document invoices items
    documentsInvoices.forEach((docInvoice, docIndex) => {
      if (typeof docInvoice === 'object') {
        Object.keys(docInvoice).forEach(key => {
          const value = docInvoice[key];
          if (typeof value === 'number' && value > 0) {
            items.push({
              id: `doc_${docIndex}_${key}`,
              description: `חשבונית ${docIndex + 1}: ${key}`,
              amount: value,
              type: 'document'
            });
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error loading invoice items:', error);
  }
  
  return items;
}

// NEW: Setup differential row events
function setupDifferentialRowEvents(div) {
  const selectElement = div.querySelector('.diff-desc-select');
  const textInput = div.querySelector('.diff-desc');
  const amountInput = div.querySelector('.diff-amount');
  const vatInput = div.querySelector('.diff-vat');
  const totalInput = div.querySelector('.diff-total');
  
  // Handle dropdown selection
  selectElement.addEventListener('change', function() {
    const selectedValue = this.value;
    
    if (selectedValue === 'custom') {
      // Show manual input
      textInput.style.display = 'block';
      amountInput.style.background = '#fff';
      amountInput.removeAttribute('readonly');
      amountInput.value = '';
      vatInput.value = '';
      totalInput.value = '';
      textInput.focus();
    } else if (selectedValue === '') {
      // No selection
      textInput.style.display = 'none';
      amountInput.style.background = '#f4f6fa';
      amountInput.setAttribute('readonly', 'true');
      amountInput.value = '';
      vatInput.value = '';
      totalInput.value = '';
    } else {
      // Invoice item selected
      const invoiceItems = getInvoiceItemsForDropdown();
      const selectedItem = invoiceItems.find(item => item.id === selectedValue);
      
      if (selectedItem) {
        textInput.style.display = 'none';
        textInput.value = selectedItem.description;
        
        // Auto-populate amount, VAT, and total
        const amount = selectedItem.amount;
        const vatRate = (typeof MathEngine !== 'undefined' && MathEngine.getVatRate) ? 
                        MathEngine.getVatRate() / 100 : 0.18;
        const vat = Math.round(amount * vatRate);
        const total = Math.round(amount + vat);
        
        amountInput.value = amount;
        vatInput.value = vat;
        totalInput.value = total;
        
        // Save the selection
        div.dataset.invoiceItemId = selectedValue;
        saveAndRefresh();
        updateDifferentialsSummary();
      }
    }
  });
  
  // Handle manual amount input (only when custom is selected)
  amountInput.addEventListener('input', function() {
    if (selectElement.value === 'custom') {
      const amount = parseFloat(this.value) || 0;
      const vatRate = (typeof MathEngine !== 'undefined' && MathEngine.getVatRate) ? 
                      MathEngine.getVatRate() / 100 : 0.18;
      const vat = Math.round(amount * vatRate);
      const total = Math.round(amount + vat);
      vatInput.value = vat;
      totalInput.value = total;
      triggerMathCalculation();
      saveAndRefresh();
      updateDifferentialsSummary();
    }
  });
  
  // Handle manual description input
  textInput.addEventListener('input', () => {
    saveAndRefresh();
  });
  
  // Handle row removal
  div.querySelector('.remove').addEventListener('click', () => {
    div.remove();
    saveAndRefresh();
    updateDifferentialsSummary();
  });
}

function updateDifferentialsSummary() {
  const differentials = collectDifferentials();
  const totalAmount = differentials.reduce((sum, diff) => sum + diff.amount, 0);
  const totalVAT = differentials.reduce((sum, diff) => sum + diff.vat, 0);
  const totalWithVAT = differentials.reduce((sum, diff) => sum + diff.total_with_vat, 0);
  
  if ($('totalDifferentials')) {
    $('totalDifferentials').innerText = `₪${totalAmount.toLocaleString()}`;
  }
  
  if ($('totalVAT')) {
    $('totalVAT').innerText = `₪${totalVAT.toLocaleString()}`;
  }
  
  if ($('totalDifferentialsWithVAT')) {
    $('totalDifferentialsWithVAT').innerText = `₪${totalWithVAT.toLocaleString()}`;
  }
  
  // Update final subtotals in all summary sections
  updateFinalSubtotals();
}

// NEW: Update final subtotals after differentials
function updateFinalSubtotals() {
  const differentials = collectDifferentials();
  const totalWithVAT = differentials.reduce((sum, diff) => sum + diff.total_with_vat, 0);
  
  // Define mapping of base subtotal fields to final subtotal fields
  const subtotalMappings = [
    { baseId: 'sumTotal', finalId: 'sumTotalFinal' },
    { baseId: 'sumTotalGlobal', finalId: 'sumTotalFinalGlobal' },
    { baseId: 'afterSaleDamage', finalId: 'afterSaleDamageFinal' },
    { baseId: 'afterSaleTotal', finalId: 'afterSaleTotalFinal' },
    { baseId: 'afterSaleLegal', finalId: 'afterSaleLegalFinal' }
  ];
  
  subtotalMappings.forEach(mapping => {
    const baseField = $(mapping.baseId);
    const finalField = $(mapping.finalId);
    
    if (baseField && finalField) {
      const baseValue = parseFloat(baseField.value.replace(/[^\d.-]/g, '')) || 0;
      const finalValue = baseValue - totalWithVAT; // Subtract differentials from base subtotal
      
      finalField.value = `₪${Math.max(0, finalValue).toLocaleString()}`;
      
      // Add visual indication if final is different from base
      if (finalValue !== baseValue) {
        finalField.style.color = finalValue < baseValue ? '#dc3545' : '#28a745';
      }
    }
  });
  
  console.log(`Final subtotals updated. Differentials total: ₪${totalWithVAT.toLocaleString()}`);
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

// FIXED: Custom summary field functionality
export function addCustomSummaryField(summaryType) {
  const gridMapping = {
    'summaryPrivate': 'sumAdditionsGrid',
    'summaryGlobal': 'sumAdditionsGridGlobal', 
    'summaryDamage': 'sumAdditionsGridDamage',
    'summaryTotalLoss': 'sumAdditionsGridTotalLoss',
    'summaryLegalLoss': 'sumAdditionsGridLegalLoss'
  };
  
  const gridId = gridMapping[summaryType];
  const grid = document.getElementById(gridId);
  
  if (!grid) {
    console.warn('Grid not found for summary type:', summaryType);
    return;
  }
  
  const row = document.createElement('div');
  row.className = 'custom-summary-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1fr 1fr 80px';
  row.style.gap = '10px';
  row.style.marginBottom = '10px';
  
  row.innerHTML = `
    <div>
      <input type="text" class="custom-field-name" placeholder="שם השדה" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc;">
    </div>
    <div>
      <input type="text" class="custom-field-value" placeholder="ערך" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc;">
    </div>
    <div>
      <button type="button" class="btn remove" style="background:#dc3545; padding:8px 12px; margin-top:0; font-size: 14px;">✕</button>
    </div>
  `;
  
  // Add event listeners
  row.querySelector('.remove').addEventListener('click', () => {
    row.remove();
    saveAndRefresh();
  });
  
  row.querySelector('.custom-field-name').addEventListener('input', saveAndRefresh);
  row.querySelector('.custom-field-value').addEventListener('input', saveAndRefresh);
  
  grid.appendChild(row);
  console.log(`Added custom field to ${summaryType}`);
}

function collectCustomSummaryFields(summaryType) {
  const gridMapping = {
    'summaryPrivate': 'sumAdditionsGrid',
    'summaryGlobal': 'sumAdditionsGridGlobal', 
    'summaryDamage': 'sumAdditionsGridDamage',
    'summaryTotalLoss': 'sumAdditionsGridTotalLoss',
    'summaryLegalLoss': 'sumAdditionsGridLegalLoss'
  };
  
  const gridId = gridMapping[summaryType];
  const grid = document.getElementById(gridId);
  
  if (!grid) return [];
  
  return Array.from(grid.querySelectorAll('.custom-summary-row')).map(row => ({
    name: row.querySelector('.custom-field-name').value.trim(),
    value: row.querySelector('.custom-field-value').value.trim()
  })).filter(field => field.name || field.value);
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
  
  // Show/hide final subtotal fields in all summary sections
  const finalSubtotalFields = [
    'sumTotalAfterDifferentials-private',
    'sumTotalAfterDifferentials-global', 
    'sumTotalAfterDifferentials-damage',
    'sumTotalAfterDifferentials-totalLoss',
    'sumTotalAfterDifferentials-legalLoss'
  ];
  
  finalSubtotalFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.style.display = show ? 'block' : 'none';
    }
  });
  
  // Add initial row if showing for first time
  if (show && $('differentialsRows') && $('differentialsRows').children.length === 0) {
    addDifferentialRow();
  }
  
  // Update calculations if showing
  if (show) {
    updateFinalSubtotals();
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
    global_amount: calculateGlobalAmount(),
    custom_summary_fields: {
      private: collectCustomSummaryFields('summaryPrivate'),
      global: collectCustomSummaryFields('summaryGlobal'),
      damage: collectCustomSummaryFields('summaryDamage'),
      totalLoss: collectCustomSummaryFields('summaryTotalLoss'),
      legalLoss: collectCustomSummaryFields('summaryLegalLoss')
    }
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

// Calculate and update global depreciation value field
function calculateGlobalDepreciationValue() {
  const marketValue = parseFloat(helper.expertise?.levi_report?.final_price) || 0;
  const percent = parseFloat($('globalDep1')?.value || 0);
  const value = Math.round((marketValue * percent) / 100);
  if ($('globalDepValue')) {
    $('globalDepValue').value = value;
  }
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

// FIXED: Floating screen toggle function
export function toggleFloatingScreen(screenType) {
  console.log('Toggling floating screen:', screenType);
  
  const screens = {
    leviReport: () => {
      if (window.toggleLeviReport) {
        window.toggleLeviReport();
      } else {
        console.log('Levi report floating screen not available');
      }
    },
    carDetails: () => {
      if (window.toggleCarDetails) {
        window.toggleCarDetails();
      } else {
        console.log('Car details floating screen not available');
      }
    },
    invoiceDetails: () => {
      if (window.toggleInvoiceDetails) {
        window.toggleInvoiceDetails();
      } else {
        console.log('Invoice details floating screen not available');
      }
    },
    internalBrowser: () => {
      if (window.showBrowserMenu) {
        showBrowserMenuUnderToggle();
      } else {
        console.log('Internal browser not available');
      }
    }
  };
  
  if (screens[screenType]) {
    screens[screenType]();
  } else {
    console.warn('Unknown screen type:', screenType);
  }
}

// FIXED: Custom browser menu positioned under floating toggle
function showBrowserMenuUnderToggle() {
  const menu = document.createElement('div');
  menu.style.cssText = `
    position: fixed;
    top: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: sans-serif;
    direction: rtl;
    min-width: 280px;
  `;
  
  menu.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 15px; color: #2c3e50; font-size: 16px;">בחר אתר לפתיחה:</div>
    <button onclick="window.openInternalBrowser('car-part.co.il'); this.parentElement.remove();" style="width: 100%; padding: 12px; margin-bottom: 8px; border: none; background: #28a745; color: white; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500;">
      🔧 Car Part - חלקי רכב
    </button>
    <button onclick="window.openInternalBrowser('portal.levi-itzhak.co.il'); this.parentElement.remove();" style="width: 100%; padding: 12px; margin-bottom: 8px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500;">
      📊 פורטל לוי יצחק
    </button>
    <button onclick="this.parentElement.remove();" style="width: 100%; padding: 10px; border: 1px solid #ccc; background: white; color: #666; border-radius: 6px; cursor: pointer; font-size: 14px;">
      ביטול
    </button>
  `;
  
  document.body.appendChild(menu);
  
  // Remove menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function removeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', removeMenu);
      }
    });
  }, 100);
}

// Global function exports
window.addDepField = addDepField;
window.addDifferentialRow = addDifferentialRow;
window.addSummaryRow = addSummaryRow;
window.addCustomSummaryField = addCustomSummaryField;
window.toggleSection = toggleSection;
window.updateSummaryVisibility = updateSummaryVisibility;
window.toggleFloatingScreen = toggleFloatingScreen;

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
    
    // Calculate differentials total (with VAT)
    const differentialsTotal = differentials.reduce((sum, diff) => sum + diff.total_with_vat, 0);
    
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