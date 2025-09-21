// fee-module.js
import { helper, getFinancialData } from './helper.js';
import { MathEngine } from './math.js';
import { updateHelperWithEvents, helperEvents, HelperUtils } from './helper-events.js';

function $(id) {
  return document.getElementById(id);
}

function formatCaseId(caseId) {
  if (!caseId) return '';
  
  // Remove all existing formatting and extract components
  const cleaned = caseId.replace(/[^0-9YC]/g, '');
  
  // Extract YC prefix, numbers, and year
  const ycMatch = cleaned.match(/YC(\d+)/);
  if (!ycMatch) return caseId; // Return original if doesn't match expected pattern
  
  const numbers = ycMatch[1];
  
  // Extract year (last 4 digits that form a valid year)
  const yearMatch = numbers.match(/(\d{4})$/);
  const currentYear = new Date().getFullYear();
  let year = yearMatch ? yearMatch[1] : currentYear;
  
  // Validate year is reasonable (between 2020-2030)
  if (parseInt(year) < 2020 || parseInt(year) > 2030) {
    year = currentYear;
  }
  
  // Extract the main number (remove year from end)
  let mainNumber = numbers;
  if (yearMatch) {
    mainNumber = numbers.slice(0, -4);
  }
  
  // Pad main number to 8 digits
  mainNumber = mainNumber.padStart(8, '0');
  
  // Format as YC-12345678-year
  const formatted = `YC-${mainNumber}-${year}`;
  
  console.log(`📋 Case ID formatted: "${caseId}" → "${formatted}"`);
  return formatted;
}

function init() {
  console.log('💰 Fee Module: Initializing with CORE helper field integration...');
  
  // Initialize financials section if not exists
  if (!helper.financials) {
    helper.financials = {};
  }
  if (!helper.financials.fees) {
    helper.financials.fees = {
      travel: { total: 0, count: 0, unit_price: 0, distance_km: 0, fuel_cost: 0, tolls: 0, description: '' },
      photography: { total: 0, count: 0, unit_price: 0, equipment_cost: 0, processing_time: 0, description: '' },
      office: { total: 0, fixed_fee: 0, percentage: 0, overhead_cost: 0, administrative_time: 0, description: '' },
      assessment: { hourly_rate: 0, hours: 0, total: 0, description: '', date: '', location: '' },
      additional_fees: [],
      ui_data: {}
    };
  }
  
  // Ensure calculations subsection always exists
  if (!helper.financials.fees.calculations) {
    helper.financials.fees.calculations = {
      fees_subtotal: 0,
      total_before_vat: 0,
      vat_rate: 0,
      vat_amount: 0,
      total_with_vat: 0,
      calculation_timestamp: '',
      calculation_notes: ''
    };
  }
  
  const meta = helper.meta || {};
  const vehicle = helper.vehicle || {};
  const stakeholders = helper.stakeholders || {};
  const case_info = helper.case_info || {};
  const fees = helper.financials.fees;
  const vatRate = window.getHelperVatRate ? window.getHelperVatRate() : (MathEngine.getVatRate ? MathEngine.getVatRate() : (helper.vat || 18));

  // Populate fields from helper data - no direct DOM manipulation
  const plateValue = vehicle.plate || meta.plate || '...';
  $('pageTitle').innerText = `רכב מס. ${plateValue}`;
  
  // Format case ID to ensure proper YC-12345678-year format
  const rawCaseId = case_info.case_id || meta.case_number || '';
  const formattedCaseId = formatCaseId(rawCaseId);
  $('caseNumber').innerText = formattedCaseId;
  
  // Update helper with formatted case ID
  if (formattedCaseId && formattedCaseId !== rawCaseId) {
    if (!helper.case_info) helper.case_info = {};
    helper.case_info.case_id = formattedCaseId;
  }
  $('issueDate').innerText = new Date().toISOString().split('T')[0];
  
  // Owner data from helper
  $('ownerName').innerText = stakeholders.owner?.name || meta.owner_name || '';
  $('ownerAddress').innerText = stakeholders.owner?.address || meta.owner_address || '';
  $('ownerPhone').innerText = stakeholders.owner?.phone || meta.owner_phone || '';
  
  // Insurance data from helper
  $('insuranceCompany').innerText = stakeholders.insurance?.company || meta.insurance_company || '';
  $('insuranceEmail').innerText = stakeholders.insurance?.email || meta.insurance_email || '';
  $('agentName').innerText = stakeholders.insurance?.agent?.name || meta.agent_name || '';
  $('agentPhone').innerText = stakeholders.insurance?.agent?.phone || meta.insurance_agent_phone || '';
  $('agentEmail').innerText = stakeholders.insurance?.agent?.email || meta.insurance_agent_email || '';
  
  // Populate fee fields from helper data
  $('travel_fee').value = fees.travel?.total || 0;
  $('media_fee').value = fees.photography?.total || 0;
  $('office_fee').value = fees.office?.total || 0;
  $('hour_rate').value = fees.assessment?.hourly_rate || 0;
  $('vat_rate').value = vatRate;
  
  console.log('✅ Fee module initialization completed with core helper field mapping');

  ['travel_fee', 'media_fee', 'office_fee', 'hour_rate'].forEach(id => {
    $(id).addEventListener('input', calculateFees);
  });
  
  // Listen for VAT updates from admin panel
  window.addEventListener('vatUpdated', (event) => {
    const newVatRate = event.detail.newVatRate;
    $('vat_rate').value = newVatRate;
    calculateFees();
    console.log(`Fee module updated with new VAT rate: ${newVatRate}%`);
  });

  $('saveBtn').addEventListener('click', saveFees);
  
  // Calculate fees on page load to populate VAT fields
  calculateFees();
  console.log('💰 Initial fee calculation completed on page load');
}

function calculateFees() {
  // Update helper data from form inputs
  const travelFee = parseFloat($('travel_fee').value) || 0;
  const mediaFee = parseFloat($('media_fee').value) || 0;
  const officeFee = parseFloat($('office_fee').value) || 0;
  const hourRate = parseFloat($('hour_rate').value) || 0;
  const vatRate = parseFloat($('vat_rate').value) || (window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate());

  // Write values to helper structure
  helper.financials.fees.travel.total = travelFee;
  helper.financials.fees.photography.total = mediaFee;
  helper.financials.fees.office.total = officeFee;
  helper.financials.fees.assessment.hourly_rate = hourRate;
  
  // Calculate assessment total if hours are defined
  if (helper.financials.fees.assessment.hours > 0) {
    helper.financials.fees.assessment.total = hourRate * helper.financials.fees.assessment.hours;
  }

  const fees = {
    travel_fee: travelFee,
    media_fee: mediaFee,
    office_fee: officeFee
  };

  // Use MathEngine for consistent calculations
  const subtotal = MathEngine.calculateFeesSubtotal(fees);
  const vatAmount = MathEngine.calculateVatAmount(subtotal, vatRate);
  const total = MathEngine.round(subtotal + vatAmount);

  // Ensure calculations subsection exists before setting properties
  if (!helper.financials.fees.calculations) {
    helper.financials.fees.calculations = {
      fees_subtotal: 0,
      total_before_vat: 0,
      vat_rate: 0,
      vat_amount: 0,
      total_with_vat: 0,
      calculation_timestamp: '',
      calculation_notes: ''
    };
  }

  // Update helper calculations subsection with all calculated values
  helper.financials.fees.calculations.fees_subtotal = subtotal;
  helper.financials.fees.calculations.total_before_vat = subtotal;
  helper.financials.fees.calculations.vat_rate = vatRate;
  helper.financials.fees.calculations.vat_amount = vatAmount;
  helper.financials.fees.calculations.total_with_vat = total;
  helper.financials.fees.calculations.calculation_timestamp = new Date().toISOString();

  // Update display fields
  $('total_before_vat').value = subtotal;
  $('vat_amount').value = vatAmount;
  $('total_with_vat').value = total;

  console.log('💰 Fee calculations updated in helper.financials.fees.calculations:', helper.financials.fees.calculations);
}

function saveFees() {
  calculateFees();

  // All fee data is now stored in helper.financials.fees with calculations in subsection
  // Add additional metadata to helper
  if (!helper.meta) helper.meta = {};
  helper.meta.last_fee_update = new Date().toISOString();
  helper.meta.fee_module_completed = true;

  // Add completion notes to calculations subsection
  helper.financials.fees.calculations.calculation_notes = 'Fee module completed successfully';

  // Create summary data object for event system compatibility
  const rawCaseId = helper.case_info?.case_id || helper.meta?.case_number || '';
  const formattedCaseId = formatCaseId(rawCaseId);
  
  const feesData = {
    case_id: formattedCaseId,
    issue_date: new Date().toISOString().split('T')[0],
    fees_summary: helper.financials.fees,
    calculations: helper.financials.fees.calculations,
    completed_by: 'fee-module'
  };

  // Use event-driven update
  updateHelperWithEvents('fees', feesData, 'fee-module');
  
  console.log('💰 Fee data saved to helper.financials.fees:', helper.financials.fees);
  console.log('📊 Calculations saved to helper.financials.fees.calculations:', helper.financials.fees.calculations);
  showSuccessAndValidation();
}

function showSuccessAndValidation() {
  // Keep save button visible, just show success section
  $('successSection').style.display = 'block';
  
  // Change save button text to indicate completion
  $('saveBtn').innerText = 'נשמר ✅';
  $('saveBtn').style.background = '#28a745';
  
  // Add validation button functionality
  $('validateBtn').addEventListener('click', function() {
    window.location.href = 'validation-workflow.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
