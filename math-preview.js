// math-preview.js — Preview math values in draft/estimate UI

function renderMathPreview() {
  const helper = JSON.parse(sessionStorage.getItem("expertise")) || {};
  const m = helper.invoice_uploaded ? helper.invoice_calculations : helper.calculations;
  if (!m) return;

  const map = {
    "אחוז נזק": `${m.damage_percent}%`,
    "שווי פיצוי (ללא מע״מ)": `${m.total_compensation} ₪`,
    "שווי פיצוי (כולל מע״מ)": `${m.compensation_with_vat} ₪`,
    "שווי שוק": `${m.market_value} ₪`,
    "שווי לפי מחירון": `${m.vehicle_value_gross} ₪`,
    "שווי לאחר שומה": `${m.net_value_post_shaveh} ₪`
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
