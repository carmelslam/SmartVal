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
  const root = document.getElementById('parts-module-root');
  if (root) {
    root.innerHTML = '<div style="padding:40px;text-align:center;font-size:20px;color:#007bff;">מודול חלקים בבניה</div>';
  }
}

document.addEventListener('DOMContentLoaded', renderPartsModule);
document.addEventListener('DOMContentLoaded', renderPartsModule);
