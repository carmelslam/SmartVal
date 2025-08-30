// math-preview.js — Preview math values in draft/estimate UI

function renderMathPreview() {
  const helper = JSON.parse(sessionStorage.getItem("helper")) || {};
  const m = helper.invoice_uploaded ? helper.invoice_calculations : helper.calculations;
  if (!m) return;

  // Helper function to safely resolve values that might be Promises
  function safeValue(value) {
    if (value && typeof value === 'object' && typeof value.then === 'function') {
      // This is a Promise - return a placeholder and resolve it
      value.then(resolvedValue => {
        // Re-render when Promise resolves
        setTimeout(renderMathPreview, 10);
      }).catch(error => {
        console.error('Error resolving Promise in math preview:', error);
      });
      return 'טוען...'; // Loading text in Hebrew
    }
    return value || 0;
  }

  const map = {
    "אחוז נזק": `${safeValue(m.damage_percent)}%`,
    "שווי פיצוי (ללא מע״מ)": `${safeValue(m.total_compensation)} ₪`,
    "שווי פיצוי (כולל מע״מ)": `${safeValue(m.compensation_with_vat)} ₪`,
    "שווי שוק": `${safeValue(m.market_value)} ₪`,
    "שווי לפי מחירון": `${safeValue(m.vehicle_value_gross)} ₪`,
    "שווי לאחר שומה": `${safeValue(m.net_value_post_shaveh)} ₪`
  };

  const wrapper = document.getElementById("math-preview");
  if (!wrapper) return;
  wrapper.innerHTML = '<h3>נתוני חישוב:</h3>' +
    '<table style="width:100%; border-collapse: collapse;">' +
    Object.entries(map).map(([label, val]) => `
      <tr>
        <td style="border:1px solid #ccc; padding:6px; font-weight:bold;">${label}</td>
        <td style="border:1px solid #ccc; padding:6px;">${val}</td>
      </tr>
    `).join('') + '</table>';
}

window.mathPreview = {
  show: renderMathPreview
};

document.addEventListener("DOMContentLoaded", renderMathPreview);
