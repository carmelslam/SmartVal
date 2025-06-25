// Unified Parts Module (wizard + standalone)

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') === 'wizard' ? 'wizard' : 'standalone';

let carDetails = {};
if (mode === 'wizard') {
  try {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    carDetails = helper.car_details || {};
  } catch (e) {}
}

function renderPartsModule() {
  // ...render car details (autofilled or editable), parts form, and floating results...
  // ...on input, trigger both car-part.co.il and Make.com search, show suggestions...
  // ...on select, autofill all fields...
  // ...on submit, export to helper (wizard) or allow export/save (standalone)...
  // ...store all search results in metadata...
}

document.addEventListener('DOMContentLoaded', renderPartsModule);
