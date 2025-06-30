// fee-module.js
import { helper } from './helper.js';

const ids = [
  'caseNumber', 'ownerName', 'ownerAddress', 'ownerPhone',
  'insuranceCompany', 'insuranceEmail', 'agentName', 'agentPhone', 'agentEmail', 'issueDate',
  'travel_fee', 'media_fee', 'office_fee',
  'total_before_vat', 'vat_rate', 'vat_amount', 'total_with_vat', 'hour_rate'
];

function $(id) {
  return document.getElementById(id);
}

function init() {
  const meta = helper.meta || {};
  const vat = helper.vat || 18;

  $('plateDisplay').innerText = meta.plate || '...';
  $('caseNumber').value = meta.case_number || '';
  $('ownerName').value = meta.owner_name || '';
  $('ownerAddress').value = meta.owner_address || '';
  $('ownerPhone').value = meta.owner_phone || '';
  $('insuranceCompany').value = meta.insurance_company || '';
  $('insuranceEmail').value = meta.insurance_email || '';
  $('agentName').value = meta.agent_name || '';
  $('agentPhone').value = meta.agent_phone || '';
  $('agentEmail').value = meta.agent_email || '';
  $('issueDate').value = new Date().toISOString().split('T')[0];

  $('vat_rate').value = vat;

  ['travel_fee', 'media_fee', 'office_fee'].forEach(id => {
    $(id).addEventListener('input', calculateFees);
  });

  $('saveBtn').addEventListener('click', saveToHelper);
}

function calculateFees() {
  const travel = +$('travel_fee').value || 0;
  const media = +$('media_fee').value || 0;
  const office = +$('office_fee').value || 0;
  const vatRate = +$('vat_rate').value;

  const subtotal = travel + media + office;
  const vatAmount = +(subtotal * vatRate / 100).toFixed(2);
  const total = subtotal + vatAmount;

  $('total_before_vat').value = subtotal;
  $('vat_amount').value = vatAmount;
  $('total_with_vat').value = total;
}

function saveToHelper() {
  calculateFees();
  helper.fee = {
    case_number: $('caseNumber').value,
    issue_date: $('issueDate').value,
    contact: {
      owner_name: $('ownerName').value,
      owner_address: $('ownerAddress').value,
      owner_phone: $('ownerPhone').value,
      insurance_company: $('insuranceCompany').value,
      insurance_email: $('insuranceEmail').value,
      agent_name: $('agentName').value,
      agent_phone: $('agentPhone').value,
      agent_email: $('agentEmail').value
    },
    travel_fee: +$('travel_fee').value || 0,
    media_fee: +$('media_fee').value || 0,
    office_fee: +$('office_fee').value || 0,
    total_before_vat: +$('total_before_vat').value,
    vat_rate: +$('vat_rate').value,
    vat_amount: +$('vat_amount').value,
    total_with_vat: +$('total_with_vat').value,
    hour_rate: +$('hour_rate').value
  };
  alert('נתוני שכר הטרחה נשמרו בהצלחה');
}

document.addEventListener('DOMContentLoaded', init);
