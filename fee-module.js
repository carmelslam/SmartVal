// fee-module.js
import { helper, getFinancialData, syncVehicleData } from './helper.js';
import { MathEngine } from './math.js';
import { updateHelperWithEvents, helperEvents, HelperUtils } from './helper-events.js';

function $(id) {
  return document.getElementById(id);
}

function init() {
  console.log('💰 Fee Module: Initializing with ENHANCED helper integration...');
  
  const meta = helper.meta || {};
  const vehicle = helper.vehicle || {};
  const stakeholders = helper.stakeholders || {};
  const vatRate = window.getHelperVatRate ? window.getHelperVatRate() : (MathEngine.getVatRate ? MathEngine.getVatRate() : (helper.vat || 18));

  // ENHANCED: Use proper helper paths for vehicle and stakeholder data
  const plateValue = vehicle.plate || meta.plate || '...';
  $('pageTitle').innerText = `רכב מס. ${plateValue}`;
  $('caseNumber').innerText = meta.case_number || '';
  
  // Owner data from stakeholders section
  $('ownerName').innerText = stakeholders.owner?.name || meta.owner_name || '';
  $('ownerAddress').innerText = stakeholders.owner?.address || meta.owner_address || '';
  $('ownerPhone').innerText = stakeholders.owner?.phone || meta.owner_phone || '';
  
  // Insurance data from stakeholders section
  $('insuranceCompany').innerText = stakeholders.insurance?.company || meta.insurance_company || '';
  $('insuranceEmail').innerText = stakeholders.insurance?.email || meta.insurance_email || '';
  $('agentName').innerText = stakeholders.insurance?.agent?.name || meta.agent_name || '';
  $('agentPhone').innerText = stakeholders.insurance?.agent?.phone || meta.insurance_agent_phone || '';
  $('agentEmail').innerText = stakeholders.insurance?.agent?.email || meta.insurance_agent_email || '';
  
  $('issueDate').innerText = new Date().toISOString().split('T')[0];
  $('vat_rate').value = vatRate;
  
  // ENHANCED: Auto-populate fee values from helper if available
  if (helper.financials?.fees) {
    const fees = helper.financials.fees;
    if (fees.travel?.total) $('travel_fee').value = fees.travel.total;
    if (fees.photography?.total) $('media_fee').value = fees.photography.total;
    if (fees.office?.total) $('office_fee').value = fees.office.total;
    
    console.log('✅ Auto-populated fee values from helper');
  }
  
  console.log('✅ Fee module initialization completed with enhanced mapping');

  ['travel_fee', 'media_fee', 'office_fee'].forEach(id => {
    $(id).addEventListener('input', calculateFees);
  });
  
  // Listen for VAT updates from admin panel
  window.addEventListener('vatUpdated', (event) => {
    const newVatRate = event.detail.newVatRate;
    $('vat_rate').value = newVatRate;
    calculateFees(); // Recalculate fees with new VAT
    console.log(`Fee module updated with new VAT rate: ${newVatRate}%`);
  });

  $('saveBtn').addEventListener('click', saveFees);
}

function calculateFees() {
  const fees = {
    travel_fee: parseFloat($('travel_fee').value) || 0,
    media_fee: parseFloat($('media_fee').value) || 0,
    office_fee: parseFloat($('office_fee').value) || 0
  };
  const vatRate = parseFloat($('vat_rate').value) || (window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate());

  // Use MathEngine for consistent calculations
  const subtotal = MathEngine.calculateFeesSubtotal(fees);
  const vatAmount = MathEngine.calculateVatAmount(subtotal, vatRate);
  const total = MathEngine.round(subtotal + vatAmount);

  $('total_before_vat').value = subtotal;
  $('vat_amount').value = vatAmount;
  $('total_with_vat').value = total;
}

function saveFees() {
  calculateFees();

  const feesData = {
    case_number: $('caseNumber').innerText,
    issue_date: $('issueDate').innerText,
    contact: {
      owner_name: $('ownerName').innerText,
      owner_address: $('ownerAddress').innerText,
      owner_phone: $('ownerPhone').innerText,
      insurance_company: $('insuranceCompany').innerText,
      insurance_email: $('insuranceEmail').innerText,
      agent_name: $('agentName').innerText,
      insurance_agent_phone: $('agentPhone').innerText,
      insurance_agent_email: $('agentEmail').innerText
    },
    travel_fee: parseFloat($('travel_fee').value) || 0,
    media_fee: parseFloat($('media_fee').value) || 0,
    office_fee: parseFloat($('office_fee').value) || 0,
    total_before_vat: parseFloat($('total_before_vat').value) || 0,
    vat_rate: parseFloat($('vat_rate').value) || 0,
    vat_amount: parseFloat($('vat_amount').value) || 0,
    total_with_vat: parseFloat($('total_with_vat').value) || 0,
    hour_rate: parseFloat($('hour_rate').value) || 0
  };

  // Use event-driven update
  updateHelperWithEvents('fees', feesData, 'fee-module');
  
  showSuccessAndValidation();
}

function showSuccessAndValidation() {
  // Hide the save button and show success section
  $('saveBtn').style.display = 'none';
  $('successSection').style.display = 'block';
  
  // Add validation button functionality
  $('validateBtn').addEventListener('click', function() {
    window.location.href = 'validation-workflow.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
