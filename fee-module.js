// fee-module.js
import { helper } from './helper.js';
import { MathEngine } from './math.js';

function $(id) {
  return document.getElementById(id);
}

function init() {
  const meta = helper.meta || {};
  const vatRate = MathEngine.getVatRate ? MathEngine.getVatRate() : (helper.vat || 18);

  $('pageTitle').innerText = `רכב מס. ${meta.plate || '...'}`;
  $('caseNumber').innerText = meta.case_number || '';
  $('ownerName').innerText = meta.owner_name || '';
  $('ownerAddress').innerText = meta.owner_address || '';
  $('ownerPhone').innerText = meta.owner_phone || '';
  $('insuranceCompany').innerText = meta.insurance_company || '';
  $('insuranceEmail').innerText = meta.insurance_email || '';
  $('agentName').innerText = meta.agent_name || '';
  $('agentPhone').innerText = meta.agent_phone || '';
  $('agentEmail').innerText = meta.agent_email || '';
  $('issueDate').innerText = new Date().toISOString().split('T')[0];
  $('vat_rate').value = vatRate;

  ['travel_fee', 'media_fee', 'office_fee'].forEach(id => {
    $(id).addEventListener('input', calculateFees);
  });

  $('saveBtn').addEventListener('click', saveFees);
}

function calculateFees() {
  const travel = parseFloat($('travel_fee').value) || 0;
  const media = parseFloat($('media_fee').value) || 0;
  const office = parseFloat($('office_fee').value) || 0;
  const vatRate = parseFloat($('vat_rate').value) || 18;

  const subtotal = MathEngine.round(travel + media + office);
  const vatAmount = MathEngine.round(subtotal * vatRate / 100);
  const total = MathEngine.round(subtotal + vatAmount);

  $('total_before_vat').value = subtotal;
  $('vat_amount').value = vatAmount;
  $('total_with_vat').value = total;
}

function saveFees() {
  calculateFees();

  helper.fees = {
    case_number: $('caseNumber').innerText,
    issue_date: $('issueDate').innerText,
    contact: {
      owner_name: $('ownerName').innerText,
      owner_address: $('ownerAddress').innerText,
      owner_phone: $('ownerPhone').innerText,
      insurance_company: $('insuranceCompany').innerText,
      insurance_email: $('insuranceEmail').innerText,
      agent_name: $('agentName').innerText,
      agent_phone: $('agentPhone').innerText,
      agent_email: $('agentEmail').innerText
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

  alert('נתוני שכר הטרחה נשמרו בהצלחה');
}

document.addEventListener('DOMContentLoaded', init);
