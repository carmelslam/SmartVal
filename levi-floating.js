(function () {
  console.log('🚀 Levi floating script starting...');
  
  // GLOBAL EMERGENCY SHUTDOWN: Monitor for system stress
  window.emergencyDisableAutoRefresh = window.emergencyDisableAutoRefresh || false;
  
  // Check for emergency shutdown every 30 seconds
  setInterval(() => {
    if (window.emergencyDisableAutoRefresh) {
      console.log('🆘 EMERGENCY: All auto-refresh disabled by global flag');
      refreshDisabled = true;
      return;
    }
    
    // Monitor console errors - if too many, disable auto-refresh
    const errorCount = window.consoleErrorCount || 0;
    if (errorCount > 10) {
      console.log('🆘 EMERGENCY: Too many console errors - disabling auto-refresh');
      window.emergencyDisableAutoRefresh = true;
      refreshDisabled = true;
    }
  }, 30000);
  if (document.getElementById("leviModal")) {
    console.log('⚠️ leviModal already exists, exiting');
    return;
  }

  const style = document.createElement("style");
  style.innerHTML = `
    #leviModal {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 95%;
      max-width: 650px;
      max-height: 90vh;
      background: white;
      border: 1px solid #007bff;
      padding: 20px;
      z-index: 9999;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 20px;
      display: none;
      overflow-y: auto;
      cursor: move;
    }
    
    @media (max-width: 768px) {
      #leviModal {
        top: 10px;
        width: 95%;
        max-width: 95%;
        padding: 15px;
        margin: 10px;
        left: 50%;
        transform: translateX(-50%);
      }
    }
    
    @media (max-width: 768px) {
      .levi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 8px;
        font-size: 12px;
      }
      
      .levi-field {
        padding: 6px;
        min-height: 40px;
      }
      
      .levi-field .label {
        font-size: 11px;
      }
      
      .levi-field .value {
        font-size: 13px;
      }
      
      .levi-adjustment-group h5 {
        font-size: 13px;
      }
    }
    .levi-modal-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #007bff;
      text-align: center;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .levi-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .levi-section h4 {
      margin: 0 0 10px 0;
      color: #495057;
      font-size: 16px;
      font-weight: bold;
    }
    .levi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px 12px;
      text-align: right;
      font-size: 13px;
    }
    
    @media (max-width: 768px) {
      .levi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 8px;
        font-size: 12px;
      }
      
      .levi-field {
        padding: 6px;
        min-height: 40px;
      }
      
      .levi-field .label {
        font-size: 11px;
      }
      
      .levi-field .value {
        font-size: 13px;
      }
      
      .levi-adjustment-group h5 {
        font-size: 13px;
      }
    }
    .levi-adjustment-group {
      margin-bottom: 15px;
      padding: 10px;
      background: #f1f3f4;
      border-radius: 6px;
    }
    .levi-adjustment-group h5 {
      margin: 0 0 10px 0;
      color: #495057;
      font-size: 14px;
      font-weight: bold;
    }
    .levi-field {
      background: white;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      min-height: 45px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .levi-field .label {
      font-weight: bold;
      color: #6c757d;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .levi-field .value {
      color: #212529;
      font-size: 15px;
      font-weight: 600;
    }
    
    .levi-field .value.editable {
      background: white;
      border: 1px solid #007bff;
      cursor: text;
      padding: 8px;
      border-radius: 4px;
    }
    
    .levi-field input.edit-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #007bff;
      border-radius: 4px;
      font-size: 13px;
      direction: rtl;
      box-sizing: border-box;
      font-weight: 600;
    }
    .value.price {
      color: #28a745;
      font-size: 16px;
    }
    .value.empty {
      color: #6c757d;
      font-style: italic;
    }
    .levi-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .levi-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
    }
    .levi-btn.close {
      background: #dc3545;
      color: white;
    }
    .levi-btn.refresh {
      background: #28a745;
      color: white;
      transition: all 0.3s ease;
    }
    .levi-btn.refresh:hover:not(:disabled) {
      background: #218838;
      transform: scale(1.05);
    }
    .levi-btn.refresh:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "leviModal";
  modal.innerHTML = `
    <div class="levi-modal-title">דו"ח לוי יצחק - פרטים</div>
    <div class="edit-mode-controls" style="text-align: center; margin-bottom: 15px;">
      <button id="toggle-levi-edit-mode" class="edit-toggle-btn" style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
        ✏️ תיקון OCR
      </button>
      <button id="save-levi-changes" class="save-btn" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; display: none;">
        💾 שמור
      </button>
      <button id="cancel-levi-edit" class="cancel-btn" style="background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; display: none;">
        ❌ ביטול
      </button>
    </div>
    
    <div class="levi-section">
      <h4>נתוני שווי בסיסיים</h4>
      <div class="levi-grid">
        <div class="levi-field">
          <div class="label">סוג רכב</div>
          <div class="value" id="levi-vehicle-type">-</div>
        </div>
        <div class="levi-field">
          <div class="label">יצרן</div>
          <div class="value" id="levi-manufacturer">-</div>
        </div>
        <div class="levi-field">
          <div class="label">קוד דגם</div>
          <div class="value" id="levi-model-code">-</div>
        </div>
        <div class="levi-field">
          <div class="label">קטגוריה</div>
          <div class="value" id="levi-category">-</div>
        </div>
        <div class="levi-field">
          <div class="label">שנת יצור</div>
          <div class="value" id="levi-year">-</div>
        </div>
        <div class="levi-field">
          <div class="label">שם דגם מלא</div>
          <div class="value" id="levi-full-model">-</div>
        </div>
        <div class="levi-field">
          <div class="label">מחיר בסיס</div>
          <div class="value price" id="levi-base-price">₪0</div>
        </div>
        <div class="levi-field">
          <div class="label">מחיר סופי לרכב</div>
          <div class="value price" id="levi-final-price">₪0</div>
        </div>
        <div class="levi-field">
          <div class="label">תאריך הוצאת דוח לוי</div>
          <div class="value" id="levi-report-date">-</div>
        </div>
      </div>
    </div>

    <div class="levi-section">
      <h4>התאמות מחיר</h4>
      
      <!-- REORDERED: 1. מאפיינים (Features) -->
      <div class="levi-adjustment-group">
        <h5>מאפיינים:</h5>
        <div class="levi-grid">
          <div class="levi-field">
            <div class="label">מאפיינים</div>
            <div class="value" id="levi-features">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">מאפיינים %</div>
            <div class="value" id="levi-features-percent">0%</div>
          </div>
          <div class="levi-field">
            <div class="label">ערך ש״ח מאפיינים</div>
            <div class="value" id="levi-features-value">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">שווי מצטבר מאפיינים</div>
            <div class="value" id="levi-features-total">₪0</div>
          </div>
        </div>
        <div class="levi-field" style="margin-top: 10px; grid-column: 1 / -1;">
          <div class="label">תיאור מאפיינים:</div>
          <div class="value" id="levi-features-description" style="font-size: 12px; text-align: right;">-</div>
        </div>
      </div>

      <!-- REORDERED: 2. עליה לכביש (Registration) -->
      <div class="levi-adjustment-group">
        <h5>עליה לכביש:</h5>
        <div class="levi-grid">
          <div class="levi-field">
            <div class="label">עליה לכביש</div>
            <div class="value" id="levi-registration">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">עליה לכביש %</div>
            <div class="value" id="levi-registration-percent">0%</div>
          </div>
          <div class="levi-field">
            <div class="label">ערך ש״ח עליה לכביש</div>
            <div class="value" id="levi-registration-value">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">שווי מצטבר עליה לכביש</div>
            <div class="value" id="levi-registration-total">₪0</div>
          </div>
        </div>
      </div>

      <!-- REORDERED: 3. סוג בעלות (Ownership Type) -->
      <div class="levi-adjustment-group">
        <h5>סוג בעלות:</h5>
        <div class="levi-grid">
          <div class="levi-field">
            <div class="label">בעלות</div>
            <div class="value" id="levi-ownership">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">בעלות %</div>
            <div class="value" id="levi-ownership-percent">0%</div>
          </div>
          <div class="levi-field">
            <div class="label">ערך ש״ח בעלות</div>
            <div class="value" id="levi-ownership-value">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">שווי מצטבר בעלות</div>
            <div class="value" id="levi-ownership-total">₪0</div>
          </div>
        </div>
      </div>

      <!-- REORDERED: 4. מספר ק״מ (Mileage) -->
      <div class="levi-adjustment-group">
        <h5>מספר ק״מ:</h5>
        <div class="levi-grid">
          <div class="levi-field">
            <div class="label">מס ק״מ</div>
            <div class="value" id="levi-km">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">מס ק״מ %</div>
            <div class="value" id="levi-km-percent">0%</div>
          </div>
          <div class="levi-field">
            <div class="label">ערך ש״ח מס ק״מ</div>
            <div class="value" id="levi-km-value">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">שווי מצטבר מס ק״מ</div>
            <div class="value" id="levi-km-total">₪0</div>
          </div>
        </div>
      </div>

      <!-- REORDERED: 5. מספר בעלים (Number of Owners) -->
      <div class="levi-adjustment-group">
        <h5>מספר בעלים:</h5>
        <div class="levi-grid">
          <div class="levi-field">
            <div class="label">מספר בעלים</div>
            <div class="value" id="levi-owners">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">מספר בעלים %</div>
            <div class="value" id="levi-owners-percent">0%</div>
          </div>
          <div class="levi-field">
            <div class="label">ערך ש״ח מספר בעלים</div>
            <div class="value" id="levi-owners-value">₪0</div>
          </div>
          <div class="levi-field">
            <div class="label">שווי מצטבר מספר בעלים</div>
            <div class="value" id="levi-owners-total">₪0</div>
          </div>
        </div>
      </div>
    </div>

    <div class="levi-buttons">
      <button class="levi-btn close" onclick="toggleLeviReport()">סגור</button>
      <button class="levi-btn refresh" onclick="refreshLeviData();">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 🔧 Add OCR correction and editing functionality
  let isLeviEditMode = false;
  let leviOriginalValues = {};

  // Toggle edit mode
  document.getElementById('toggle-levi-edit-mode').addEventListener('click', function() {
    isLeviEditMode = !isLeviEditMode;
    
    if (isLeviEditMode) {
      enableLeviEditMode();
    } else {
      disableLeviEditMode();
    }
  });

  // Save changes
  document.getElementById('save-levi-changes').addEventListener('click', function() {
    saveLeviChangesToHelper();
    disableLeviEditMode();
  });

  // Cancel edit
  document.getElementById('cancel-levi-edit').addEventListener('click', function() {
    restoreLeviOriginalValues();
    disableLeviEditMode();
  });

  function enableLeviEditMode() {
    // Store original values
    leviOriginalValues = {};
    
    // Get all value fields that should be editable for OCR correction
    const editableFields = [
      'levi-vehicle-type', 'levi-manufacturer', 'levi-model-code', 
      'levi-category', 'levi-year', 'levi-full-model', 'levi-base-price', 
      'levi-final-price', 'levi-report-date', 'levi-features-description',
      'levi-registration', 'levi-registration-percent', 'levi-registration-value',
      'levi-ownership', 'levi-ownership-percent', 'levi-ownership-value',
      'levi-km', 'levi-km-percent', 'levi-km-value',
      'levi-owners', 'levi-owners-percent', 'levi-owners-value',
      'levi-features', 'levi-features-percent', 'levi-features-value'
    ];

    editableFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        leviOriginalValues[fieldId] = element.textContent;
        convertToEditableLeviField(element, fieldId);
      }
    });

    // Update button visibility
    document.getElementById('toggle-levi-edit-mode').textContent = '❌ ביטול תיקון';
    document.getElementById('toggle-levi-edit-mode').style.background = '#dc3545';
    document.getElementById('save-levi-changes').style.display = 'inline-block';
    document.getElementById('cancel-levi-edit').style.display = 'inline-block';
  }

  function disableLeviEditMode() {
    isLeviEditMode = false;
    
    // Convert input fields back to display divs
    Object.keys(leviOriginalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && element.tagName === 'INPUT') {
        convertToLeviDisplayField(element, element.value);
      }
    });

    // Update button visibility
    document.getElementById('toggle-levi-edit-mode').textContent = '✏️ תיקון OCR';
    document.getElementById('toggle-levi-edit-mode').style.background = '#007bff';
    document.getElementById('save-levi-changes').style.display = 'none';
    document.getElementById('cancel-levi-edit').style.display = 'none';
  }

  function convertToEditableLeviField(element, fieldId) {
    const currentValue = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    // Clean currency and percentage symbols for editing
    let cleanValue = currentValue === '-' ? '' : currentValue;
    cleanValue = cleanValue.replace(/[₪,%]/g, '');
    input.value = cleanValue;
    input.id = fieldId;
    input.className = 'edit-input';
    
    element.parentNode.replaceChild(input, element);
  }

  function convertToLeviDisplayField(inputElement, value) {
    const div = document.createElement('div');
    div.className = inputElement.classList.contains('price') ? 'value price' : 'value';
    div.id = inputElement.id;
    
    // Re-apply formatting based on field type
    let formattedValue = value || '-';
    if (inputElement.id.includes('price')) {
      formattedValue = value && value !== '-' ? `₪${parseFloat(value).toLocaleString()}` : '₪0';
    } else if (inputElement.id.includes('percent')) {
      formattedValue = value && value !== '-' ? `${value}%` : '0%';
    }
    
    div.textContent = formattedValue;
    inputElement.parentNode.replaceChild(div, inputElement);
  }

  function restoreLeviOriginalValues() {
    Object.keys(leviOriginalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        if (element.tagName === 'INPUT') {
          // Clean the original value for input fields
          let cleanValue = leviOriginalValues[fieldId].replace(/[₪,%]/g, '');
          element.value = cleanValue === '-' ? '' : cleanValue;
        } else {
          element.textContent = leviOriginalValues[fieldId];
        }
      }
    });
  }

  function saveLeviChangesToHelper() {
    if (!window.helper) {
      console.error('❌ Helper not available for saving Levi changes');
      return;
    }

    // Collect all changed values
    const changes = {};
    Object.keys(leviOriginalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        const newValue = element.tagName === 'INPUT' ? element.value : element.textContent;
        const originalClean = leviOriginalValues[fieldId].replace(/[₪,%]/g, '');
        const newClean = newValue.replace(/[₪,%]/g, '');
        
        if (newClean !== originalClean && newClean !== '-' && newClean !== '') {
          changes[fieldId] = newValue;
        }
      }
    });

    // Map changes to helper structure while preserving integrity
    const helperUpdates = mapLeviFieldsToHelper(changes);
    
    // Update helper using safe methods - preserve existing structure
    if (!window.helper.valuation) window.helper.valuation = {};
    if (!window.helper.valuation.adjustments) window.helper.valuation.adjustments = {};
    
    // Initialize adjustment structures if they don't exist
    const adjustmentTypes = ['registration', 'ownership_type', 'mileage', 'ownership_history', 'features'];
    adjustmentTypes.forEach(type => {
      if (!window.helper.valuation.adjustments[type]) {
        window.helper.valuation.adjustments[type] = { percent: 0, amount: 0, cumulative: 0 };
      }
    });

    // Update helper with new values
    if (helperUpdates.valuation) {
      Object.assign(window.helper.valuation, helperUpdates.valuation);
    }
    if (helperUpdates.vehicle) {
      if (!window.helper.vehicle) window.helper.vehicle = {};
      Object.assign(window.helper.vehicle, helperUpdates.vehicle);
    }

    // 🔧 PHASE 2.1: SINGLE STORAGE SOURCE - Save through helper system only
    try {
      // Use updateHelper() function for proper data flow
      if (typeof updateHelper === 'function') {
        // The helper has already been updated above, just need to trigger save
        updateHelper('system', { 
          levi_floating_last_save: new Date().toISOString(),
          levi_floating_source: 'user_correction'
        }, 'levi_floating_save');
        console.log('✅ PHASE 2.1: Levi OCR corrections saved through helper system (single source)');
      } else {
        // Fallback: Direct sessionStorage only (no competing localStorage)
        const helperString = JSON.stringify(window.helper);
        sessionStorage.setItem('helper', helperString);
        console.log('✅ PHASE 2.1: Levi OCR corrections saved to primary storage (helper system not available)');
      }
    } catch (error) {
      console.error('❌ PHASE 2.1: Failed to save Levi changes:', error);
    }
  }

  function mapLeviFieldsToHelper(changes) {
    const updates = {
      valuation: {},
      vehicle: {}
    };

    // Map basic fields
    if (changes['levi-base-price']) {
      updates.valuation.base_price = parseFloat(changes['levi-base-price'].replace(/[₪,]/g, '')) || 0;
    }
    if (changes['levi-final-price']) {
      updates.valuation.final_price = parseFloat(changes['levi-final-price'].replace(/[₪,]/g, '')) || 0;
    }
    if (changes['levi-report-date']) {
      updates.valuation.report_date = changes['levi-report-date'];
    }

    // Map vehicle fields
    if (changes['levi-manufacturer']) {
      updates.vehicle.manufacturer = changes['levi-manufacturer'];
    }
    if (changes['levi-year']) {
      updates.vehicle.year = changes['levi-year'];
    }
    if (changes['levi-model-code']) {
      updates.vehicle.levi_code = changes['levi-model-code'];
    }

    // Map adjustment fields to helper.valuation.adjustments structure
    const adjustmentMap = {
      'levi-registration-percent': { type: 'registration', field: 'percent', value: parseFloat(changes['levi-registration-percent']) || 0 },
      'levi-registration-value': { type: 'registration', field: 'amount', value: parseFloat(changes['levi-registration-value'].replace(/[₪,]/g, '')) || 0 },
      'levi-ownership-percent': { type: 'ownership_type', field: 'percent', value: parseFloat(changes['levi-ownership-percent']) || 0 },
      'levi-ownership-value': { type: 'ownership_type', field: 'amount', value: parseFloat(changes['levi-ownership-value'].replace(/[₪,]/g, '')) || 0 },
      'levi-km-percent': { type: 'mileage', field: 'percent', value: parseFloat(changes['levi-km-percent']) || 0 },
      'levi-km-value': { type: 'mileage', field: 'amount', value: parseFloat(changes['levi-km-value'].replace(/[₪,]/g, '')) || 0 },
      'levi-owners-percent': { type: 'ownership_history', field: 'percent', value: parseFloat(changes['levi-owners-percent']) || 0 },
      'levi-owners-value': { type: 'ownership_history', field: 'amount', value: parseFloat(changes['levi-owners-value'].replace(/[₪,]/g, '')) || 0 },
      'levi-features-percent': { type: 'features', field: 'percent', value: parseFloat(changes['levi-features-percent']) || 0 },
      'levi-features-value': { type: 'features', field: 'amount', value: parseFloat(changes['levi-features-value'].replace(/[₪,]/g, '')) || 0 }
    };

    if (!updates.valuation.adjustments) updates.valuation.adjustments = {};
    
    Object.keys(changes).forEach(fieldId => {
      if (adjustmentMap[fieldId]) {
        const mapping = adjustmentMap[fieldId];
        if (!updates.valuation.adjustments[mapping.type]) {
          updates.valuation.adjustments[mapping.type] = {};
        }
        updates.valuation.adjustments[mapping.type][mapping.field] = mapping.value;
      }
    });

    return updates;
  }

  // Global functions
  console.log('🔧 Defining toggleLeviReport function...');
  window.toggleLeviReport = function () {
    const modal = document.getElementById("leviModal");
    if (modal.style.display === "none" || !modal.style.display) {
      loadLeviData();
      modal.style.display = "block";
      makeDraggable(modal);
      
      // DISABLED: Refresh functionality temporarily disabled to prevent loops
      console.log('🚫 Refresh functionality disabled to prevent loops');
    } else {
      modal.style.display = "none";
    }
  };

  // Expose refresh function to global scope for automatic updates from builder
  window.refreshLeviData = function () {
    console.log('🔄 Levi floating screen: refreshLeviData called');
    
    // Get refresh button for feedback
    const refreshBtn = document.querySelector('.levi-btn.refresh');
    if (refreshBtn) {
      refreshBtn.textContent = 'מרענן...';
      refreshBtn.disabled = true;
    }
    
    try {
      loadLeviData();
      
      // Show success feedback
      if (refreshBtn) {
        refreshBtn.textContent = '✅ עודכן!';
        refreshBtn.disabled = false;
        
        // Reset button text after 2 seconds
        setTimeout(() => {
          refreshBtn.textContent = 'רענן נתונים';
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Error refreshing Levi data:', error);
      if (refreshBtn) {
        refreshBtn.textContent = '❌ שגיאה';
        refreshBtn.disabled = false;
        setTimeout(() => {
          refreshBtn.textContent = 'רענן נתונים';
        }, 2000);
      }
    }
  };

  // Make modal draggable
  function makeDraggable(modal) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    modal.addEventListener('mousedown', function(e) {
      if (e.target === modal || e.target.classList.contains('levi-modal-title')) {
        isDragging = true;
        dragOffset.x = e.clientX - modal.offsetLeft;
        dragOffset.y = e.clientY - modal.offsetTop;
        modal.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        const newLeft = Math.max(0, Math.min(window.innerWidth - modal.offsetWidth, e.clientX - dragOffset.x));
        const newTop = Math.max(0, Math.min(window.innerHeight - modal.offsetHeight, e.clientY - dragOffset.y));
        
        modal.style.left = newLeft + 'px';
        modal.style.top = newTop + 'px';
      }
    });

    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        modal.style.cursor = 'move';
      }
    });
  }

  // Remove old duplicate function that was causing issues
  // window.refreshLeviData is now defined above with logging

  function loadLeviData() {
    try {
      console.log('🔄 PHASE 2.1: Loading Levi data from helper ONLY (single source)...');
      
      // 🔧 PHASE 2.1: SINGLE SOURCE LOADING - window.helper is authoritative
      let helper = {};
      
      if (typeof window.helper === 'object' && window.helper !== null) {
        helper = window.helper;
        console.log('✅ PHASE 2.1: Loaded Levi data from window.helper (authoritative source)');
      } else {
        // Emergency fallback: Try sessionStorage only if window.helper unavailable
        try {
          const storedHelper = sessionStorage.getItem('helper');
          if (storedHelper) {
            helper = JSON.parse(storedHelper);
            // Sync back to window.helper immediately
            window.helper = helper;
            console.log('⚠️ PHASE 2.1: Emergency fallback - loaded from sessionStorage, synced to window.helper');
          }
        } catch (parseError) {
          console.error('❌ PHASE 2.1: Failed to load from emergency fallback:', parseError);
        }
      }

      // FOLLOW HELPER ARCHITECTURE: Load ONLY from helper structure
      // The helper is god - floating screen adjusts to it
      let result = {
        ...helper.vehicle,
        ...helper.valuation,
        ...helper.meta
      };
      
      console.log('✅ Loading from helper structure (vehicle + valuation + meta)');

      
      // Update UI using the result object (same approach as summary page)
      updateLeviDisplay(result);

    } catch (error) {
      console.error("Error loading Levi data:", error);
      updateLeviDisplay({});
    }
  }

  // Removed deepMerge function - no longer needed with simplified data loading

  function updateLeviDisplay(result) {
    console.log('🔄 updateLeviDisplay called with result:', result);
    
    // 🔧 PHASE 2.1: Get helper data from single source (window.helper)
    const helper = window.helper || {};
    
    // DEBUG: Log all percentage fields found in the data
    const percentageFields = Object.keys(result).filter(key => key.includes('%'));
    if (percentageFields.length > 0) {
      console.log('📊 DEBUG: Found percentage fields in webhook data:', percentageFields);
      percentageFields.forEach(field => {
        console.log(`   ${field}: ${result[field]}`);
      });
    } else {
      console.log('⚠️ DEBUG: No percentage fields found in webhook data');
    }
    
    // DEBUG: Log helper valuation adjustments for comparison  
    if (helper.valuation?.adjustments) {
      console.log('🔧 DEBUG: Helper valuation adjustments:');
      console.log('   Registration %:', helper.valuation.adjustments.registration?.percent);
      console.log('   Ownership %:', helper.valuation.adjustments.ownership_type?.percent);
      console.log('   Mileage %:', helper.valuation.adjustments.mileage?.percent);
      console.log('   Owners %:', helper.valuation.adjustments.ownership_history?.percent);
      console.log('   Features %:', helper.valuation.adjustments.features?.percent);
    } else {
      console.log('⚠️ DEBUG: No helper valuation adjustments found');
    }
    
    // Use same currency parsing approach as summary page
    const parseCurrency = (value) => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      // Remove currency symbols, spaces, commas and parse
      const cleanValue = value.toString().replace(/[₪,\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };

    const formatPrice = (value) => {
      const num = parseCurrency(value);
      return num > 0 ? `₪${num.toLocaleString()}` : "₪0";
    };

    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    const formatPercent = (value) => {
      if (!value || value.toString().trim() === '') return "0%";
      const strValue = value.toString().trim();
      // If already has %, don't add another one
      if (strValue.endsWith('%')) return strValue;
      return `${strValue}%`;
    };

    
    // Use helper data structure like summary page - get percentage values from manual inputs or helper
    // helper already declared above
    
    
    document.getElementById("levi-vehicle-type").textContent = formatValue(
      result['סוג רכב'] ||
      result.vehicle_type || 
      '-'
    );
    document.getElementById("levi-manufacturer").textContent = formatValue(
      result['יצרן'] ||
      result.manufacturer || 
      '-'
    );
    document.getElementById("levi-model-code").textContent = formatValue(
      result['קוד דגם'] ||
      result.levi_code ||
      '-'
    );
    document.getElementById("levi-category").textContent = formatValue(
      result['קטגוריה'] ||
      result.category || 
      '-'
    );
    document.getElementById("levi-year").textContent = formatValue(
      result['שנת יצור'] ||
      result.year || 
      '-'
    );
    document.getElementById("levi-full-model").textContent = formatValue(
      result['שם דגם מלא'] ||
      result.full_model_name || 
      result.model ||
      result['דגם'] ||
      `${result.manufacturer || ''} ${result.model || ''}`.trim() || 
      '-'
    );
    // FIXED: Use same approach as summary page - direct Hebrew field access
    const basePrice = parseCurrency(result['מחיר בסיס']) || parseCurrency(result.base_price) || 0;
    const finalPrice = parseCurrency(result['מחיר סופי לרכב']) || parseCurrency(result.final_price) || 0;
                      
    
    document.getElementById("levi-base-price").textContent = formatPrice(basePrice);
    document.getElementById("levi-final-price").textContent = formatPrice(finalPrice);
    
    // Levi report date - separate from inspection and damage dates  
    document.getElementById("levi-report-date").textContent = formatValue(
      result['תאריך'] ||
      result.levi_report_date ||
      result.report_date ||
      '-'
    );

    // FIXED: Registration adjustments - use same approach as summary
    document.getElementById("levi-registration").textContent = formatValue(
      result['ערך עליה לכביש'] || result['עליה לכביש'] || "-"
    );
    
    // FOLLOW HELPER ARCHITECTURE: Read from helper.valuation.adjustments only
    document.getElementById("levi-registration-percent").textContent = formatPercent(
      helper.valuation?.adjustments?.registration?.percent || 0
    );
    document.getElementById("levi-registration-value").textContent = formatPrice(
      helper.valuation?.adjustments?.registration?.amount ||
      result['ערך ש"ח עליה לכביש'] || 
      result['ערך ש״ח עליה לכביש'] || 
      0
    );
    document.getElementById("levi-registration-total").textContent = formatPrice(
      result['שווי מצטבר עליה לכביש'] || 0
    );

    // FIXED: Ownership adjustments - use same approach as summary
    document.getElementById("levi-ownership").textContent = formatValue(
      result['ערך בעלות'] || result['בעלות'] || "-"
    );
    
    // FOLLOW HELPER ARCHITECTURE: Read from helper.valuation.adjustments only
    document.getElementById("levi-ownership-percent").textContent = formatPercent(
      helper.valuation?.adjustments?.ownership_type?.percent || 0
    );
    // FIXED: Ownership value - from helper.valuation.adjustments
    document.getElementById("levi-ownership-value").textContent = formatPrice(
      helper.valuation?.adjustments?.ownership_type?.amount ||
      result['ערך ש"ח בעלות'] || 
      result['ערך ש״ח בעלות'] || 
      0
    );
    document.getElementById("levi-ownership-total").textContent = formatPrice(
      result['שווי מצטבר בעלות'] || 0
    );

    // FIXED: KM adjustments - use same approach as summary
    document.getElementById("levi-km").textContent = formatValue(
      result['ערך מס ק"מ'] || result['מס ק"מ'] || "-"
    );
    // FOLLOW HELPER ARCHITECTURE: Read from helper.valuation.adjustments only
    document.getElementById("levi-km-percent").textContent = formatPercent(
      helper.valuation?.adjustments?.mileage?.percent || 0
    );
    // FIXED: KM value - from helper.valuation.adjustments
    document.getElementById("levi-km-value").textContent = formatPrice(
      helper.valuation?.adjustments?.mileage?.amount ||
      result['ערך ש"ח מס ק"מ'] || 
      result['ערך ש״ח מס ק״מ'] || 
      0
    );
    document.getElementById("levi-km-total").textContent = formatPrice(
      result['שווי מצטבר מס ק"מ'] || 0
    );

    // FIXED: Owners adjustments - use same approach as summary
    document.getElementById("levi-owners").textContent = formatValue(
      result['ערך מספר בעלים'] || result['מספר בעלים'] || "-"
    );
    // FOLLOW HELPER ARCHITECTURE: Read from helper.valuation.adjustments only
    document.getElementById("levi-owners-percent").textContent = formatPercent(
      helper.valuation?.adjustments?.ownership_history?.percent || 0
    );
    // FIXED: Owners value - from helper.valuation.adjustments
    document.getElementById("levi-owners-value").textContent = formatPrice(
      helper.valuation?.adjustments?.ownership_history?.amount ||
      result['ערך ש״ח מספר בעלים'] || 
      result['ערך ש"ח מספר בעלים'] || 
      0
    );
    document.getElementById("levi-owners-total").textContent = formatPrice(
      result['שווי מצטבר מספר בעלים'] || 0
    );

    // FIXED: Features adjustments - use same approach as summary
    document.getElementById("levi-features").textContent = formatValue(
      result['ערך מאפיינים'] || result['מאפיינים'] || "-"
    );
    
    // FIXED: Features percentage - match upload-levi.html approach
    document.getElementById("levi-features-percent").textContent = formatPercent(
      helper.valuation?.adjustments?.features?.percent ||
      result['מחיר מאפיינים %'] || 
      result['מאפיינים %'] || 
      result['מחיר מאפיינים%'] || 
      result['מאפיינים%'] || 
      result['features_percent'] || 
      0
    );
    // FIXED: Features value - from helper.valuation.adjustments
    document.getElementById("levi-features-value").textContent = formatPrice(
      helper.valuation?.adjustments?.features?.amount ||
      result['ערך ש"ח מאפיינים'] || 
      result['ערך ש״ח מאפיינים'] || 
      0
    );
    document.getElementById("levi-features-total").textContent = formatPrice(
      result['שווי מצטבר מאפיינים'] || 0
    );

    // Features description - use the actual features text from the main מאפיינים field  
    document.getElementById("levi-features-description").textContent = formatValue(
      result['מאפיינים'] || // This contains the full features text in the webhook
      result['ערך מאפיינים'] || // Alternative field name
      '-'
    );

    // Update value styling
    document.querySelectorAll('.value').forEach(el => {
      if (el.textContent === "-" || el.textContent === "₪0" || el.textContent === "0%") {
        el.classList.add('empty');
      } else {
        el.classList.remove('empty');
      }
    });
  }

  // ULTRA-SAFE AUTO-REFRESH: Multiple safeguards to prevent loops
  let refreshTimeout = null;
  let lastRefreshTime = 0;
  let refreshCount = 0;
  let refreshDisabled = false;
  const REFRESH_DEBOUNCE_MS = 3000; // 3 second debounce (increased)
  const MAX_REFRESHES_PER_MINUTE = 5; // Hard limit
  const REFRESH_RESET_INTERVAL = 60000; // 1 minute
  
  // Reset refresh counter every minute
  setInterval(() => {
    refreshCount = 0;
    if (refreshDisabled) {
      console.log('🔓 Levi auto-refresh re-enabled after cooldown');
      refreshDisabled = false;
    }
  }, REFRESH_RESET_INTERVAL);
  
  function safeRefreshLeviData(source = 'auto') {
    // SAFETY CHECK 1: Is refresh disabled due to too many attempts?
    if (refreshDisabled) {
      console.log(`🚫 Levi refresh disabled (${source}) - too many attempts`);
      return;
    }
    
    const now = Date.now();
    
    // SAFETY CHECK 2: Debounce protection
    if (now - lastRefreshTime < REFRESH_DEBOUNCE_MS) {
      console.log(`🚫 Levi refresh debounced (${source}) - too soon`);
      return;
    }
    
    // SAFETY CHECK 3: Rate limiting
    refreshCount++;
    if (refreshCount > MAX_REFRESHES_PER_MINUTE) {
      console.log(`🚫 Levi refresh rate limit exceeded (${source}) - disabling for 1 minute`);
      refreshDisabled = true;
      return;
    }
    
    // SAFETY CHECK 4: Modal must be visible
    const modal = document.getElementById("leviModal");
    if (!modal || modal.style.display === "none") {
      console.log(`🚫 Levi refresh skipped (${source}) - modal not visible`);
      return;
    }
    
    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Schedule debounced refresh with additional safety
    refreshTimeout = setTimeout(() => {
      try {
        console.log(`🔄 Safe auto-refreshing Levi data (${source}) - attempt ${refreshCount}/${MAX_REFRESHES_PER_MINUTE}`);
        lastRefreshTime = Date.now();
        loadLeviData();
      } catch (error) {
        console.error('❌ Error in Levi auto-refresh:', error);
        refreshDisabled = true; // Disable on error
      }
      refreshTimeout = null;
    }, 500); // Longer delay for safety
  }
  
  // CONDITIONAL AUTO-REFRESH: Only for relevant updates
  document.addEventListener('helperUpdate', function(event) {
    console.log('📡 Levi floating detected helper update:', event.detail);
    
    // Only refresh for Levi-related updates to prevent unnecessary refreshes
    if (event.detail && 
        (event.detail.includes('levi') || 
         event.detail.includes('valuation') || 
         event.detail.includes('adjustment') ||
         event.detail.includes('vehicle'))) {
      safeRefreshLeviData('helperUpdate');
    } else {
      console.log('📡 Levi refresh skipped - update not relevant');
    }
  });

  // Also listen for storage events from other tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'helper' && e.newValue) {
      console.log('📡 Levi floating detected helper update from another tab');
      safeRefreshLeviData('storage');
    }
  });

  // Floating button removed - now controlled by top toggle squares

})();