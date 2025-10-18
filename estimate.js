// estimate.js — Complete Estimate Report Engine

import { calculate } from './math.js';
import { sendToWebhook } from './webhook.js';
import { 
  updateHelper, 
  getVehicleData, 
  getDamageData, 
  getValuationData,
  syncDamageData
} from './helper.js';
import { validateRequiredFields } from './validation.js';

const EstimateEngine = {
  helper: {},
  estimateType: 'estimate_אובדן_להלכה', // Default estimate type
  isPostSession: false,

  init() {
    // Check URL parameters for different modes and access types
    const urlParams = new URLSearchParams(window.location.search);
    this.isPostSession = urlParams.get('mode') === 'post-session';
    
    // ✅ FIX: Check if validation should be skipped (coming from expertise)
    const skipValidation = urlParams.get('skipValidation') === 'true';
    const fromExpertise = urlParams.get('from') === 'expertise';

    if (this.isPostSession) {
      // For post-session mode, redirect to estimate-builder.html
      window.location.href = 'estimator-builder.html?mode=post-session';
      return;
    }

    // Regular session-based estimate mode
    const raw = sessionStorage.getItem('helper');
    if (!raw) return alert('❌ No base data found (helper missing)');
    this.helper = JSON.parse(raw);

    // ✅ FIX: Skip validation if coming from expertise or explicitly bypassed
    if (!skipValidation && !fromExpertise) {
      // Validate required data exists only for normal workflow
      if (!this.validateBaseData()) {
        alert('❌ חסרים נתונים בסיסיים לצורך יצירת אומדן');
        return;
      }
    } else {
      console.log('✅ Estimate validation skipped - accessed from expertise or skipValidation=true');
    }

    // If already estimated, load modified view
    if (this.helper.meta?.report_stage === 'estimate') {
      this.loadEstimateSnapshot();
    }

    this.bindUI();
    this.loadEstimateInterface();
  },

  validateBaseData() {
    const required = ['car_details.plate', 'car_details.manufacturer', 'car_details.model'];
    return validateRequiredFields(this.helper, required);
  },

  bindUI() {
    // Main action buttons
    document.getElementById('save-estimate')?.addEventListener('click', () => this.save());
    document.getElementById('generate-estimate')?.addEventListener('click', () => this.generateReport());
    document.getElementById('preview-estimate')?.addEventListener('click', () => this.previewReport());
    
    // Estimate type selection
    document.getElementById('estimate-type')?.addEventListener('change', (e) => {
      this.estimateType = e.target.value;
      this.updateLegalText();
    });

    // Dynamic form handling for damage centers
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-damage-center')) this.addDamageCenter();
      if (e.target.matches('.remove-damage-center')) this.removeDamageCenter(e.target.dataset.centerId);
      if (e.target.matches('.add-part-row')) this.addPartRow(e.target.dataset.centerId);
      if (e.target.matches('.add-repair-row')) this.addRepairRow(e.target.dataset.centerId);
    });
    
    // Listen for VAT updates from admin panel
    window.addEventListener('vatUpdated', (event) => {
      const newVatRate = event.detail.newVatRate;
      const vatField = document.getElementById('vat-percent');
      if (vatField) {
        vatField.value = newVatRate;
        console.log(`Estimate module updated with new VAT rate: ${newVatRate}%`);
      }
    });

    // ✅ SESSION 44 FIX: Listen for helper updates from wizard
    window.addEventListener('helperUpdated', (event) => {
      console.log('📢 SESSION 44: Received helperUpdated event from wizard, refreshing estimate data...');
      this.refreshFromStorage();
    });

    // Auto-save on input changes
    document.addEventListener('input', (e) => {
      if (e.target.matches('.estimate-field')) {
        this.autoSave();
      }
    });
  },

  // ✅ SESSION 44 FIX: Refresh data from sessionStorage
  refreshFromStorage() {
    const raw = sessionStorage.getItem('helper');
    if (!raw) {
      console.error('❌ SESSION 44: Cannot refresh - helper missing from sessionStorage');
      return;
    }
    
    this.helper = JSON.parse(raw);
    console.log('✅ SESSION 44: Refreshed helper from sessionStorage');
    console.log('✅ SESSION 44: damage_centers count:', this.helper.damage_centers?.length || 0);
    
    // Re-render entire interface with fresh data
    this.loadEstimateInterface();
    console.log('✅ SESSION 44: Re-rendered estimate interface with updated data');
  },

  loadEstimateInterface() {
    this.renderVehicleInfo();
    this.renderDamageCenters();
    this.renderFeesSection();
    this.renderDepreciationSection();
    this.renderEstimateTypeSelector();
    this.updateLegalText();
    this.calculateTotals();
  },

  renderVehicleInfo() {
    const vehicleContainer = document.getElementById('vehicle-info');
    if (!vehicleContainer) return;

    const car = this.helper.car_details || {};
    vehicleContainer.innerHTML = `
      <div class="section">
        <h3>פרטי הרכב</h3>
        <div class="row">
          <div class="field">
            <label>מספר רישוי:</label>
            <input type="text" id="plate" value="${car.plate || ''}" class="estimate-field" readonly>
          </div>
          <div class="field">
            <label>יצרן:</label>
            <input type="text" id="manufacturer" value="${car.manufacturer || ''}" class="estimate-field">
          </div>
          <div class="field">
            <label>דגם:</label>
            <input type="text" id="model" value="${car.model || ''}" class="estimate-field">
          </div>
          <div class="field">
            <label>שנה:</label>
            <input type="number" id="year" value="${car.year || ''}" class="estimate-field">
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>ערך הרכב (לוי יצחק):</label>
            <input type="number" id="vehicle-value" value="${this.helper.levisummary?.base_price || ''}" class="estimate-field">
          </div>
          <div class="field">
            <label>תאריך הנזק:</label>
            <input type="date" id="damage-date" value="${this.helper.general_info?.damage_date || ''}" class="estimate-field">
          </div>
        </div>
      </div>
    `;
  },

  renderDamageCenters() {
    const centersContainer = document.getElementById('damage-centers');
    if (!centersContainer) return;

    const centers = this.helper.damage_centers || [];
    let html = '<div class="section"><h3>מוקדי נזק</h3>';

    centers.forEach((center, index) => {
      html += this.renderSingleDamageCenter(center, index);
    });

    html += `
      <button type="button" class="add-damage-center btn btn-secondary">הוסף מוקד נזק</button>
      </div>
    `;

    centersContainer.innerHTML = html;
  },

  renderSingleDamageCenter(center, index) {
    const parts = center.parts || [];
    const repairs = center.repairs || [];
    
    let html = `
      <div class="damage-center" data-center-id="${index}">
        <div class="center-header">
          <h4>מוקד נזק ${index + 1}</h4>
          <button type="button" class="remove-damage-center" data-center-id="${index}">הסר</button>
        </div>
        <div class="row">
          <div class="field">
            <label>מיקום הנזק:</label>
            <input type="text" value="${center.location || ''}" name="location_${index}" class="estimate-field">
          </div>
          <div class="field">
            <label>תיאור הנזק:</label>
            <textarea name="description_${index}" class="estimate-field">${center.description || ''}</textarea>
          </div>
        </div>
        
        <div class="parts-section">
          <h5>חלקים</h5>
          <table class="parts-table">
            <thead>
              <tr><th>שם החלק</th><th>תיאור</th><th>מחיר</th><th>מקור</th><th>פעולות</th></tr>
            </thead>
            <tbody>
    `;

    parts.forEach((part, partIndex) => {
      html += `
        <tr>
          <td><input type="text" value="${part.name || ''}" name="part_name_${index}_${partIndex}" class="estimate-field"></td>
          <td><input type="text" value="${part.desc || ''}" name="part_desc_${index}_${partIndex}" class="estimate-field"></td>
          <td><input type="number" value="${part.price || ''}" name="part_price_${index}_${partIndex}" class="estimate-field"></td>
          <td>
            <select name="part_source_${index}_${partIndex}" class="estimate-field">
              <option value="מקורי" ${part.source === 'מקורי' ? 'selected' : ''}>מקורי</option>
              <option value="תחליפי" ${part.source === 'תחליפי' ? 'selected' : ''}>תחליפי</option>
              <option value="משומש" ${part.source === 'משומש' ? 'selected' : ''}>משומש</option>
            </select>
          </td>
          <td><button type="button" onclick="this.closest('tr').remove()">הסר</button></td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <button type="button" class="add-part-row" data-center-id="${index}">הוסף חלק</button>
        </div>

        <div class="repairs-section">
          <h5>עבודות תיקון</h5>
          <table class="repairs-table">
            <thead>
              <tr><th>שם העבודה</th><th>תיאור</th><th>מחיר</th><th>פעולות</th></tr>
            </thead>
            <tbody>
    `;

    repairs.forEach((repair, repairIndex) => {
      html += `
        <tr>
          <td><input type="text" value="${repair.name || ''}" name="repair_name_${index}_${repairIndex}" class="estimate-field"></td>
          <td><input type="text" value="${repair.desc || ''}" name="repair_desc_${index}_${repairIndex}" class="estimate-field"></td>
          <td><input type="number" value="${repair.cost || ''}" name="repair_cost_${index}_${repairIndex}" class="estimate-field"></td>
          <td><button type="button" onclick="this.closest('tr').remove()">הסר</button></td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <button type="button" class="add-repair-row" data-center-id="${index}">הוסף עבודה</button>
        </div>

        <div class="depreciation-field">
          <label>ירידת ערך למוקד זה (%):</label>
          <input type="number" value="${center.depreciation || 0}" name="center_depreciation_${index}" class="estimate-field" min="0" max="100">
        </div>
      </div>
    `;

    return html;
  },

  renderFeesSection() {
    const feesContainer = document.getElementById('fees-section');
    if (!feesContainer) return;

    const fees = this.helper.fees || {};
    feesContainer.innerHTML = `
      <div class="section">
        <h3>עמלות ועלויות נוספות</h3>
        <div class="row">
          <div class="field">
            <label>עמלת צילום:</label>
            <input type="number" id="photo-fee" value="${fees.photo_fee || 0}" class="estimate-field">
          </div>
          <div class="field">
            <label>עמלת משרד:</label>
            <input type="number" id="office-fee" value="${fees.office_fee || 0}" class="estimate-field">
          </div>
          <div class="field">
            <label>עמלת נסיעה:</label>
            <input type="number" id="transport-fee" value="${fees.transport_fee || 0}" class="estimate-field">
          </div>
          <div class="field">
            <label>מע"מ (%):</label>
            <input type="number" id="vat-percent" value="${fees.vat_percent || (window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate())}" class="estimate-field">
          </div>
        </div>
      </div>
    `;
  },

  renderDepreciationSection() {
    const depreciationContainer = document.getElementById('depreciation-section');
    if (!depreciationContainer) return;

    const depreciation = this.helper.depreciation || {};
    depreciationContainer.innerHTML = `
      <div class="section">
        <h3>ירידת ערך</h3>
        <div class="row">
          <div class="field">
            <label>ירידת ערך כללית (%):</label>
            <input type="number" id="global-depreciation" value="${depreciation.global || 0}" class="estimate-field" min="0" max="100">
          </div>
          <div class="field">
            <label>הערות לירידת ערך:</label>
            <textarea id="depreciation-notes" class="estimate-field">${depreciation.notes || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  },

  renderEstimateTypeSelector() {
    const typeContainer = document.getElementById('estimate-type-section');
    if (!typeContainer) return;

    typeContainer.innerHTML = `
      <div class="section">
        <h3>סוג אומדן</h3>
        <select id="estimate-type" class="estimate-field">
          <option value="estimate_אובדן_להלכה" ${this.estimateType === 'estimate_אובדן_להלכה' ? 'selected' : ''}>אומדן ראשוני - אובדן להלכה</option>
          <option value="estimate_טוטלוס" ${this.estimateType === 'estimate_טוטלוס' ? 'selected' : ''}>אומדן ראשוני - טוטלוס</option>
        </select>
        <div id="legal-text-preview" class="legal-text-preview"></div>
      </div>
    `;
  },

  updateLegalText() {
    const legalTexts = {
      estimate_אובדן_להלכה: {
        title: "אומדן ראשוני - אובדן להלכה",
        text: "ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר וארוע תאונתי.\n\nהצעה זו אינה סופית ויתכן שינויים במהלך תיקון הרכב.\n\nהערכתנו מתייחסת לנזקים כפי שהוצגו בפנינו, ולנסיבות המקרה כפי שתוארו לנו ע\"י בעל הרכב אשר לדבריו.\n\nאחוז הנזק ברכב הנ\"ל הוא %אחוז_נזק% מערך הרכב.\n\nהצעה זו אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך פירוק ו/או תיקון.\n\nלהערכתינו ירידת ערך צפויה כ %ירידת_ערך% מערך הרכב הנ\"ל מאירוע הנדון.\n\nלאור היקף הנזקים אנו ממלצים לסלק את התביעה הנ\"ל על בסיס \"אובדן להלכה\" ללא תיקון בפועל.\n\nלהערכתינו זמן השהייה במוסך לצורך תיקון %ימי_מוסך% ימי עבודה."
      },
      estimate_טוטלוס: {
        title: "אומדן ראשוני - טוטלוס",
        text: "חוות דעתינו מתבצעת בטרם תיקונים בפועל ואינה כוללת נזקים סמויים.\n\nבהתאם לבדיקה הנזק ברכב מוערך ביותר מ-60% מערך הרכב, ומשכך הרכב מסווג כטוטלוס.\n\nערך הרכב המחושב לפי מחירון לוי יצחק: %שווי_רכב%.\n\nשווי השרידים: %שווי_שרידים%.\n\nניכוי ירידת ערך: %ירידת_ערך%\n\nהערכת נזקים מבוססת על הנתונים שנמסרו ע\"י בעל הרכב, אשר לדבריו.\n\nהצהרה: אני החת\"מ: ירון כיוף, תעודת שמאי מס' 1097. הנני נותן את חוות דעתי זו במקום עדות בשבועה בבית משפט. הדין של חוות דעת זו הוא כדין עדות בשבועה."
      }
    };

    const preview = document.getElementById('legal-text-preview');
    if (preview && legalTexts[this.estimateType]) {
      preview.innerHTML = `
        <h4>${legalTexts[this.estimateType].title}</h4>
        <div class="legal-text">${legalTexts[this.estimateType].text.replace(/\n/g, '<br>')}</div>
      `;
    }
  },

  addDamageCenter() {
    const centers = this.helper.damage_centers || [];
    centers.push({
      location: '',
      description: '',
      parts: [],
      repairs: [],
      depreciation: 0
    });
    this.helper.damage_centers = centers;
    this.renderDamageCenters();
  },

  removeDamageCenter(centerId) {
    if (confirm('האם למחוק מוקד נזק זה?')) {
      this.helper.damage_centers.splice(centerId, 1);
      this.renderDamageCenters();
    }
  },

  addPartRow(centerId) {
    const center = this.helper.damage_centers[centerId];
    if (!center.parts) center.parts = [];
    center.parts.push({ name: '', desc: '', price: 0, source: 'תחליפי' });
    this.renderDamageCenters();
  },

  addRepairRow(centerId) {
    const center = this.helper.damage_centers[centerId];
    if (!center.repairs) center.repairs = [];
    center.repairs.push({ name: '', desc: '', cost: 0 });
    this.renderDamageCenters();
  },

  collectFormData() {
    const formData = new FormData(document.querySelector('#estimate-form'));
    const data = {};

    // Update vehicle info
    data.car_details = {
      plate: document.getElementById('plate')?.value || '',
      manufacturer: document.getElementById('manufacturer')?.value || '',
      model: document.getElementById('model')?.value || '',
      year: document.getElementById('year')?.value || ''
    };

    // Update fees
    data.fees = {
      photo_fee: parseFloat(document.getElementById('photo-fee')?.value || 0),
      office_fee: parseFloat(document.getElementById('office-fee')?.value || 0),
      transport_fee: parseFloat(document.getElementById('transport-fee')?.value || 0),
      vat_percent: parseFloat(document.getElementById('vat-percent')?.value || (window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate()))
    };

    // Update depreciation
    data.depreciation = {
      global: parseFloat(document.getElementById('global-depreciation')?.value || 0),
      notes: document.getElementById('depreciation-notes')?.value || ''
    };

    // Update damage centers
    data.damage_centers = this.collectDamageCentersData();

    return data;
  },

  collectDamageCentersData() {
    const centers = [];
    document.querySelectorAll('.damage-center').forEach((centerEl, index) => {
      const center = {
        location: centerEl.querySelector(`[name="location_${index}"]`)?.value || '',
        description: centerEl.querySelector(`[name="description_${index}"]`)?.value || '',
        depreciation: parseFloat(centerEl.querySelector(`[name="center_depreciation_${index}"]`)?.value || 0),
        parts: [],
        repairs: []
      };

      // Collect parts
      centerEl.querySelectorAll('.parts-table tbody tr').forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        if (inputs.length >= 4 && inputs[0].value.trim()) {
          center.parts.push({
            name: inputs[0].value.trim(),
            desc: inputs[1].value.trim(),
            price: parseFloat(inputs[2].value || 0),
            source: inputs[3].value
          });
        }
      });

      // Collect repairs
      centerEl.querySelectorAll('.repairs-table tbody tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3 && inputs[0].value.trim()) {
          center.repairs.push({
            name: inputs[0].value.trim(),
            desc: inputs[1].value.trim(),
            cost: parseFloat(inputs[2].value || 0)
          });
        }
      });

      centers.push(center);
    });

    return centers;
  },

  calculateTotals() {
    const calculations = calculate(this.helper);
    this.helper.calculations = calculations;

    // Update totals display using MathEngine for formatting
    const totalsContainer = document.getElementById('totals-display');
    if (totalsContainer) {
      totalsContainer.innerHTML = `
        <div class="totals-section">
          <h3>סיכום עלויות</h3>
          <div class="total-line">סה"כ חלקים: ${MathEngine.formatCurrency(calculations.parts_total || 0)}</div>
          <div class="total-line">סה"כ עבודות: ${MathEngine.formatCurrency(calculations.repairs_total || 0)}</div>
          <div class="total-line">עמלות: ${MathEngine.formatCurrency(calculations.fees_total || 0)}</div>
          <div class="total-line">לפני מע"מ: ${MathEngine.formatCurrency(calculations.subtotal || 0)}</div>
          <div class="total-line">מע"מ: ${MathEngine.formatCurrency(calculations.vat_amount || 0)}</div>
          <div class="total-line"><strong>סה"כ כולל מע"מ: ${MathEngine.formatCurrency(calculations.grand_total || 0)}</strong></div>
          <div class="total-line">ירידת ערך: ${MathEngine.formatCurrency(calculations.depreciation_amount || 0)}</div>
        </div>
      `;
    }
  },

  autoSave() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.save(false); // Save without alert
    }, 2000);
  },

  save(showAlert = true) {
    const formData = this.collectFormData();
    
    // Merge form data into helper
    Object.assign(this.helper, formData);

    // Mark as estimate stage
    this.helper.meta = this.helper.meta || {};
    this.helper.meta.report_stage = 'estimate';
    this.helper.meta.estimate_type = this.estimateType;
    this.helper.meta.estimate_overrides = true;
    this.helper.meta.last_modified = new Date().toISOString();

    // Store estimate snapshot
    this.helper.estimate = {
      type: this.estimateType,
      modified_sections: Object.keys(formData),
      snapshot: formData,
      created_at: new Date().toISOString()
    };

    // Recalculate with updated data
    this.calculateTotals();

    // Save to session and helper system
    sessionStorage.setItem('helper', JSON.stringify(this.helper));
    updateHelper(this.helper);

    // Send to webhook
    sendToWebhook('ESTIMATE_SAVED', this.helper);

    if (showAlert) {
      alert('📝 טיוטת אומדן נשמרה בהצלחה');
    }
  },

  generateReport() {
    if (!this.validateEstimate()) return;

    this.save(false);

    // Generate the estimate report
    const reportData = this.buildReportData();
    
    // Send to report generation webhook
    sendToWebhook('GENERATE_ESTIMATE_REPORT', reportData)
      .then(response => {
        if (response.success) {
          alert('✅ דו"ח אומדן נוצר בהצלחה');
          // Optionally redirect to report viewer or download
        } else {
          alert('❌ שגיאה ביצירת הדו"ח: ' + (response.error || 'שגיאה לא ידועה'));
        }
      })
      .catch(error => {
        console.error('Report generation error:', error);
        alert('❌ שגיאה ביצירת הדו"ח');
      });
  },

  validateEstimate() {
    // ✅ FIX: Check if validation should be skipped (coming from expertise)
    const urlParams = new URLSearchParams(window.location.search);
    const skipValidation = urlParams.get('skipValidation') === 'true';
    const fromExpertise = urlParams.get('from') === 'expertise';
    
    // Skip validation if coming from expertise
    if (skipValidation || fromExpertise) {
      console.log('✅ Estimate generation validation skipped - accessed from expertise');
      return true;
    }
    
    const required = [
      'car_details.plate',
      'car_details.manufacturer', 
      'car_details.model'
    ];

    const isValid = validateRequiredFields(this.helper, required);
    
    if (!isValid) {
      alert('❌ חסרים נתונים חובה לצורך יצירת אומדן');
      return false;
    }

    if (!this.helper.damage_centers || this.helper.damage_centers.length === 0) {
      alert('❌ יש להוסיף לפחות מוקד נזק אחד');
      return false;
    }

    return true;
  },

  buildReportData() {
    return {
      type: 'estimate',
      estimate_type: this.estimateType,
      car_details: this.helper.car_details,
      damage_centers: this.helper.damage_centers,
      fees: this.helper.fees,
      depreciation: this.helper.depreciation,
      calculations: this.helper.calculations,
      meta: this.helper.meta,
      legal_text_type: this.estimateType
    };
  },

  previewReport() {
    this.save(false);
    
    // Open preview in new window/tab
    const reportData = this.buildReportData();
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(this.generatePreviewHTML(reportData));
      previewWindow.document.close();
    }
  },

  generatePreviewHTML(data) {
    const legalTexts = {
      estimate_אובדן_להלכה: "ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר וארוע תאונתי...",
      estimate_טוטלוס: "חוות דעתינו מתבצעת בטרם תיקונים בפועל ואינה כוללת נזקים סמויים..."
    };

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>תצוגה מקדימה - אומדן</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f5f5f5; }
          .legal-text { border: 2px solid #000; padding: 15px; margin-top: 20px; }
          .totals { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>אומדן נזקי רכב</h1>
          <h2>ירון כיוף שמאות</h2>
          <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
        </div>
        
        <div class="section">
          <h3>פרטי הרכב</h3>
          <p>מספר רישוי: ${data.car_details.plate}</p>
          <p>יצרן: ${data.car_details.manufacturer}</p>
          <p>דגם: ${data.car_details.model}</p>
          <p>שנה: ${data.car_details.year}</p>
        </div>

        ${data.damage_centers.map((center, i) => `
          <div class="section">
            <h3>מוקד נזק ${i + 1}: ${center.location}</h3>
            <p>תיאור: ${center.description}</p>
            
            ${center.parts.length > 0 ? `
              <h4>חלקים:</h4>
              <table>
                <tr><th>שם החלק</th><th>תיאור</th><th>מחיר</th><th>מקור</th></tr>
                ${center.parts.map(part => `
                  <tr>
                    <td>${part.name}</td>
                    <td>${part.desc}</td>
                    <td>₪${part.price}</td>
                    <td>${part.source}</td>
                  </tr>
                `).join('')}
              </table>
            ` : ''}

            ${center.repairs.length > 0 ? `
              <h4>עבודות תיקון:</h4>
              <table>
                <tr><th>שם העבודה</th><th>תיאור</th><th>מחיר</th></tr>
                ${center.repairs.map(repair => `
                  <tr>
                    <td>${repair.name}</td>
                    <td>${repair.desc}</td>
                    <td>₪${repair.cost}</td>
                  </tr>
                `).join('')}
              </table>
            ` : ''}
          </div>
        `).join('')}

        <div class="section totals">
          <h3>סיכום עלויות</h3>
          <p>סה"כ חלקים: ₪${data.calculations.parts_total || 0}</p>
          <p>סה"כ עבודות: ₪${data.calculations.repairs_total || 0}</p>
          <p>עמלות: ₪${data.calculations.fees_total || 0}</p>
          <p>מע"מ: ₪${data.calculations.vat_amount || 0}</p>
          <p><strong>סה"כ כולל מע"מ: ₪${data.calculations.grand_total || 0}</strong></p>
        </div>

        <div class="legal-text">
          <h3>הערות משפטיות</h3>
          <p>${legalTexts[data.estimate_type] || ''}</p>
        </div>
      </body>
      </html>
    `;
  },

  loadEstimateSnapshot() {
    const snap = this.helper.estimate?.snapshot;
    if (!snap) return;

    // Merge overridden fields into main helper
    Object.keys(snap).forEach(key => {
      this.helper[key] = snap[key];
    });

    // Set estimate type from snapshot
    if (this.helper.estimate?.type) {
      this.estimateType = this.helper.estimate.type;
    }
  }
};

window.estimateEngine = EstimateEngine;
document.addEventListener('DOMContentLoaded', () => EstimateEngine.init());

console.log('✅ Enhanced estimate.js loaded');
