(function () {
  console.log('🚗 Car Details Floating Module loaded');
  if (document.getElementById("carDetailsModal")) {
    console.log('⚠️ Car details modal already exists, skipping initialization');
    return;
  }

  const style = document.createElement("style");
  style.innerHTML = `
    #carDetailsModal {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 95%;
      max-width: 800px;
      max-height: 90vh;
      background: white;
      border: 1px solid #28a745;
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
      #carDetailsModal {
        top: 10px;
        width: 95%;
        max-width: 95%;
        padding: 15px;
        margin: 10px;
        left: 50%;
        transform: translateX(-50%);
      }
    }
    
    .car-modal-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #28a745;
      text-align: center;
      border-bottom: 2px solid #28a745;
      padding-bottom: 10px;
    }
    
    .car-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .car-section h4 {
      margin: 0 0 15px 0;
      color: #495057;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      border-bottom: 2px solid #dee2e6;
      padding-bottom: 8px;
    }
    
    .car-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
    }
    
    @media (max-width: 768px) {
      .car-fields-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }
    
    .car-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      background: white;
    }
    
    .car-field .label {
      font-weight: bold;
      color: #6c757d;
      font-size: 13px;
      min-width: 120px;
    }
    
    .car-field .value {
      color: #212529;
      font-size: 14px;
      font-weight: 600;
      text-align: left;
    }
    
    .car-field .value.editable {
      background: white;
      border: 1px solid #28a745;
      cursor: text;
      padding: 8px;
      border-radius: 4px;
    }
    
    .car-field input.edit-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #28a745;
      border-radius: 4px;
      font-size: 14px;
      direction: rtl;
      box-sizing: border-box;
      font-weight: 600;
    }
    
    .value.empty {
      color: #6c757d;
      font-style: italic;
    }
    
    .car-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .car-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
    }
    
    .car-btn.close {
      background: #dc3545;
      color: white;
    }
    
    .car-btn.refresh {
      background: #28a745;
      color: white;
      transition: all 0.3s ease;
    }
    
    .car-btn.refresh:hover:not(:disabled) {
      background: #218838;
      transform: scale(1.05);
    }
    
    .car-btn.refresh:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .car-btn.refresh.spinning::before {
      content: "🔄 ";
      display: inline-block;
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "carDetailsModal";
  modal.innerHTML = `
    <div class="car-modal-title">פרטי רכב</div>
    <div class="edit-mode-controls" style="text-align: center; margin-bottom: 15px;">
      <button id="toggle-edit-mode" class="edit-toggle-btn" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
        ✏️ עריכה
      </button>
      <button id="save-changes" class="save-btn" style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; display: none;">
        💾 שמור
      </button>
      <button id="cancel-edit" class="cancel-btn" style="background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; display: none;">
        ❌ ביטול
      </button>
    </div>
    
    <div class="car-section">
      <h4>פרטי רכב</h4>
      <div class="car-fields-grid">
        <div class="car-field">
          <div class="label">תאריך בדיקה:</div>
          <div class="value" id="vehicle-inspection-date">-</div>
        </div>
        <div class="car-field">
          <div class="label">מספר רכב:</div>
          <div class="value" id="vehicle-plate">-</div>
        </div>
        <div class="car-field">
          <div class="label">שם היצרן:</div>
          <div class="value" id="vehicle-manufacturer">-</div>
        </div>
        <div class="car-field">
          <div class="label">דגם:</div>
          <div class="value" id="vehicle-model">-</div>
        </div>
        <div class="car-field">
          <div class="label">סוג הדגם:</div>
          <div class="value" id="vehicle-model-type">-</div>
        </div>
        <div class="car-field">
          <div class="label">סוג הרכב:</div>
          <div class="value" id="vehicle-type">-</div>
        </div>
        <div class="car-field">
          <div class="label">רמת גימור:</div>
          <div class="value" id="vehicle-trim">-</div>
        </div>
        <div class="car-field">
          <div class="label">מספר שילדה:</div>
          <div class="value" id="vehicle-chassis">-</div>
        </div>
        <div class="car-field">
          <div class="label">שנת ייצור:</div>
          <div class="value" id="vehicle-year">-</div>
        </div>
        <div class="car-field">
          <div class="label">סוג בעלות:</div>
          <div class="value" id="vehicle-ownership-type">-</div>
        </div>
        <div class="car-field">
          <div class="label">נפח מנוע:</div>
          <div class="value" id="vehicle-engine-volume">-</div>
        </div>
        <div class="car-field">
          <div class="label">סוג דלק:</div>
          <div class="value" id="vehicle-fuel-type">-</div>
        </div>
        <div class="car-field">
          <div class="label">מספר דגם הרכב:</div>
          <div class="value" id="vehicle-model-code">-</div>
        </div>
        <div class="car-field">
          <div class="label">קוד לוי יצחק:</div>
          <div class="value" id="vehicle-levi-code">-</div>
        </div>
        <div class="car-field">
          <div class="label">דגם מנוע:</div>
          <div class="value" id="vehicle-engine-model">-</div>
        </div>
        <div class="car-field">
          <div class="label">הנעה:</div>
          <div class="value" id="vehicle-drive-type">-</div>
        </div>
        <div class="car-field">
          <div class="label">קוד משרד התחבורה:</div>
          <div class="value" id="vehicle-office-code">-</div>
        </div>
        <div class="car-field">
          <div class="label">קילומטראז׳:</div>
          <div class="value" id="vehicle-km">-</div>
        </div>
      </div>
    </div>

    <div class="car-section">
      <h4>פרטי בעלים ונזק</h4>
      <div class="car-fields-grid">
        <div class="car-field">
          <div class="label">שם בעל הרכב:</div>
          <div class="value" id="car-owner">-</div>
        </div>
        <div class="car-field">
          <div class="label">תאריך נזק:</div>
          <div class="value" id="car-damage-date">-</div>
        </div>
        <div class="car-field">
          <div class="label">כתובת בעלים:</div>
          <div class="value" id="car-owner-address">-</div>
        </div>
        <div class="car-field">
          <div class="label">טלפון בעלים:</div>
          <div class="value" id="car-owner-phone">-</div>
        </div>
        <div class="car-field">
          <div class="label">מחיר בסיס:</div>
          <div class="value" id="car-base-price">-</div>
        </div>
        <div class="car-field">
          <div class="label">ערך שוק:</div>
          <div class="value" id="car-market-value">-</div>
        </div>
        <div class="car-field">
          <div class="label">מד אוץ:</div>
          <div class="value" id="car-odometer">-</div>
        </div>
        <div class="car-field">
          <div class="label">מקום בדיקה:</div>
          <div class="value" id="car-inspection-location">-</div>
        </div>
      </div>
    </div>

    <div class="car-section">
      <h4>פרטי מוסך וביטוח</h4>
      <div class="car-fields-grid">
        <div class="car-field">
          <div class="label">שם מוסך:</div>
          <div class="value" id="garage-name">-</div>
        </div>
        <div class="car-field">
          <div class="label">טלפון מוסך:</div>
          <div class="value" id="garage-phone">-</div>
        </div>
        <div class="car-field">
          <div class="label">דואר אלקטרוני מוסך:</div>
          <div class="value" id="garage-email">-</div>
        </div>
        <div class="car-field">
          <div class="label">חברת ביטוח:</div>
          <div class="value" id="insurance-company">-</div>
        </div>
        <div class="car-field">
          <div class="label">סוכן ביטוח:</div>
          <div class="value" id="agent-name">-</div>
        </div>
        <div class="car-field">
          <div class="label">טלפון סוכן:</div>
          <div class="value" id="agent-phone">-</div>
        </div>
        <div class="car-field">
          <div class="label">דואר אלקטרוני סוכן:</div>
          <div class="value" id="agent-email">-</div>
        </div>
        <div class="car-field">
          <div class="label">דואר אלקטרוני חברת ביטוח:</div>
          <div class="value" id="insurance-email">-</div>
        </div>
      </div>
    </div>


    <div class="car-buttons">
      <button class="car-btn close" onclick="toggleCarDetails()">סגור</button>
      <button class="car-btn refresh" onclick="refreshCarData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 🔧 Add inline editing functionality
  let isEditMode = false;
  let originalValues = {};

  // Toggle edit mode
  document.getElementById('toggle-edit-mode').addEventListener('click', function() {
    isEditMode = !isEditMode;
    
    if (isEditMode) {
      enableEditMode();
    } else {
      disableEditMode();
    }
  });

  // Save changes
  document.getElementById('save-changes').addEventListener('click', function() {
    saveChangesToHelper();
    disableEditMode();
  });

  // Cancel edit
  document.getElementById('cancel-edit').addEventListener('click', function() {
    restoreOriginalValues();
    disableEditMode();
  });

  function enableEditMode() {
    // Store original values
    originalValues = {};
    
    // Get all value fields that should be editable
    const editableFields = [
      'vehicle-manufacturer', 'vehicle-model', 'vehicle-model-type', 
      'vehicle-trim', 'vehicle-chassis', 'vehicle-year', 'vehicle-ownership-type',
      'vehicle-engine-volume', 'vehicle-fuel-type', 'vehicle-model-code',
      'vehicle-levi-code', 'vehicle-engine-model', 'vehicle-drive-type',
      'vehicle-office-code', 'vehicle-km', 'car-owner', 'car-damage-date',
      'car-owner-address', 'car-owner-phone', 'car-garage-name', 
      'car-garage-phone', 'car-garage-email', 'car-garage-address'
    ];

    editableFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        originalValues[fieldId] = element.textContent;
        convertToEditableField(element, fieldId);
      }
    });

    // Update button visibility
    document.getElementById('toggle-edit-mode').textContent = '❌ ביטול עריכה';
    document.getElementById('toggle-edit-mode').style.background = '#dc3545';
    document.getElementById('save-changes').style.display = 'inline-block';
    document.getElementById('cancel-edit').style.display = 'inline-block';
  }

  function disableEditMode() {
    isEditMode = false;
    
    // Convert input fields back to display divs
    Object.keys(originalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && element.tagName === 'INPUT') {
        convertToDisplayField(element, element.value);
      }
    });

    // Update button visibility
    document.getElementById('toggle-edit-mode').textContent = '✏️ עריכה';
    document.getElementById('toggle-edit-mode').style.background = '#28a745';
    document.getElementById('save-changes').style.display = 'none';
    document.getElementById('cancel-edit').style.display = 'none';
  }

  function convertToEditableField(element, fieldId) {
    const currentValue = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue === '-' ? '' : currentValue;
    input.id = fieldId;
    input.className = 'edit-input';
    
    element.parentNode.replaceChild(input, element);
  }

  function convertToDisplayField(inputElement, value) {
    const div = document.createElement('div');
    div.className = 'value';
    div.id = inputElement.id;
    div.textContent = value || '-';
    
    inputElement.parentNode.replaceChild(div, inputElement);
  }

  function restoreOriginalValues() {
    Object.keys(originalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        if (element.tagName === 'INPUT') {
          element.value = originalValues[fieldId];
        } else {
          element.textContent = originalValues[fieldId];
        }
      }
    });
  }

  function saveChangesToHelper() {
    // CORRECT HELPER PATTERN: Use updateHelper() function instead of direct manipulation
    console.log('🔄 HELPER ARCHITECTURE: Saving changes using proper updateHelper() pattern');
    
    if (typeof updateHelper !== 'function') {
      console.error('❌ updateHelper function not available - helper system not properly loaded');
      return;
    }

    // Collect all changed values
    const changes = {};
    Object.keys(originalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        const newValue = element.tagName === 'INPUT' ? element.value : element.textContent;
        if (newValue !== originalValues[fieldId] && newValue !== '-') {
          changes[fieldId] = newValue;
        }
      }
    });

    // Map changes to helper structure
    const helperUpdates = mapFieldsToHelper(changes);
    
    // CORRECT PATTERN: Use updateHelper() for each section instead of direct manipulation
    try {
      if (helperUpdates.vehicle && Object.keys(helperUpdates.vehicle).length > 0) {
        updateHelper('vehicle', helperUpdates.vehicle, 'car_details_floating');
        console.log('✅ Vehicle data updated via updateHelper()');
      }
      
      if (helperUpdates.stakeholders && Object.keys(helperUpdates.stakeholders).length > 0) {
        updateHelper('stakeholders', helperUpdates.stakeholders, 'car_details_floating');
        console.log('✅ Stakeholders data updated via updateHelper()');
      }
      
      if (helperUpdates.case_info && Object.keys(helperUpdates.case_info).length > 0) {
        updateHelper('case_info', helperUpdates.case_info, 'car_details_floating');
        console.log('✅ Case info data updated via updateHelper()');
      }
      
      if (helperUpdates.valuation && Object.keys(helperUpdates.valuation).length > 0) {
        updateHelper('valuation', helperUpdates.valuation, 'car_details_floating');
        console.log('✅ Valuation data updated via updateHelper()');
      }
      
      // CORRECT PATTERN: Use broadcastHelperUpdate() to notify other modules
      if (typeof broadcastHelperUpdate === 'function') {
        broadcastHelperUpdate('car_details_floating', helperUpdates);
        console.log('✅ Helper updates broadcasted to other modules');
      }
      
      console.log('✅ All changes saved using proper helper architecture');
    } catch (error) {
      console.error('❌ Failed to save changes via updateHelper():', error);
    }
  }

  function mapFieldsToHelper(changes) {
    const updates = {
      vehicle: {},
      stakeholders: { 
        owner: {}, 
        garage: {},
        insurance: {
          agent: {}
        }
      },
      case_info: {},
      valuation: {}
    };

    // Map vehicle fields
    const vehicleFieldMap = {
      'vehicle-manufacturer': 'manufacturer',
      'vehicle-model': 'model',
      'vehicle-model-type': 'model_type',
      'vehicle-trim': 'trim',
      'vehicle-chassis': 'chassis',
      'vehicle-year': 'year',
      'vehicle-ownership-type': 'ownership_type',
      'vehicle-engine-volume': 'engine_volume',
      'vehicle-fuel-type': 'fuel_type',
      'vehicle-model-code': 'model_code',
      // REMOVED: 'vehicle-levi-code': 'levi_code' - this goes to valuation section, not vehicle
      'vehicle-engine-model': 'engine_model',
      'vehicle-drive-type': 'drive_type',
      'vehicle-office-code': 'office_code',
      'vehicle-km': 'km'
    };

    // Map stakeholder fields
    const ownerFieldMap = {
      'car-owner': 'name',
      'car-owner-address': 'address',
      'car-owner-phone': 'phone'
    };

    const garageFieldMap = {
      'car-garage-name': 'name',
      'car-garage-phone': 'phone',
      'car-garage-email': 'email',
      'car-garage-address': 'address'
    };

    const insuranceFieldMap = {
      'insurance-company': 'company',
      'insurance-email': 'email'
    };

    const agentFieldMap = {
      'agent-name': 'name',
      'agent-phone': 'phone',
      'agent-email': 'email'
    };

    // Map case info fields
    const caseFieldMap = {
      'car-damage-date': 'damage_date'
    };

    // Map valuation fields (separate from vehicle)
    const valuationFieldMap = {
      'vehicle-levi-code': 'levi_code'
    };

    // Special handling for damage date - also update general info page field
    if (changes['car-damage-date']) {
      // Update damage_date_new field in general info page if it exists
      const generalInfoDamageDate = document.getElementById('damage_date_new');
      if (generalInfoDamageDate) {
        generalInfoDamageDate.value = changes['car-damage-date'];
        generalInfoDamageDate.dispatchEvent(new Event('change', { bubbles: true }));
        // CORRECT PATTERN: Use helper system to mark manual entry
        if (typeof updateHelper === 'function') {
          updateHelper('system', { damageDate_manualEntry: true }, 'car_details_floating_sync');
        }
        console.log('✅ Updated damage_date_new in general info from car details floating:', changes['car-damage-date']);
      }
    }

    // Apply mappings
    Object.keys(changes).forEach(fieldId => {
      if (vehicleFieldMap[fieldId]) {
        updates.vehicle[vehicleFieldMap[fieldId]] = changes[fieldId];
      } else if (ownerFieldMap[fieldId]) {
        updates.stakeholders.owner[ownerFieldMap[fieldId]] = changes[fieldId];
      } else if (garageFieldMap[fieldId]) {
        updates.stakeholders.garage[garageFieldMap[fieldId]] = changes[fieldId];
      } else if (insuranceFieldMap[fieldId]) {
        updates.stakeholders.insurance[insuranceFieldMap[fieldId]] = changes[fieldId];
      } else if (agentFieldMap[fieldId]) {
        updates.stakeholders.insurance.agent[agentFieldMap[fieldId]] = changes[fieldId];
      } else if (caseFieldMap[fieldId]) {
        updates.case_info[caseFieldMap[fieldId]] = changes[fieldId];
      } else if (valuationFieldMap[fieldId]) {
        updates.valuation[valuationFieldMap[fieldId]] = changes[fieldId];
      }
    });

    return updates;
  }

  // REMOVED: No custom storage - helper is the only source

  // Global functions
  window.toggleCarDetails = function () {
    const modal = document.getElementById("carDetailsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      // SIMPLE: Load from helper only
      loadCarData();
      modal.style.display = "block";
      makeDraggable(modal);
    } else {
      modal.style.display = "none";
    }
  };

  window.showCarDetails = window.toggleCarDetails;

  // Expose refresh function to global scope for automatic updates from builder
  window.refreshCarData = function () {
    console.log('🔄 Car Details floating screen: refreshCarData called');
    
    // Get refresh button for feedback
    const refreshBtn = document.querySelector('.car-btn.refresh');
    if (refreshBtn) {
      refreshBtn.textContent = 'מרענן...';
      refreshBtn.disabled = true;
    }
    
    // CORRECT ARCHITECTURE: Use only window.helper as data source
    try {
      // Clear any cached data
      if (window.currentCaseData) {
        delete window.currentCaseData;
      }
      
      // HELPER ARCHITECTURE: Check if helper is available and up-to-date
      if (window.helper) {
        console.log('🔍 Fresh helper data from window.helper:', window.helper);
        console.log('🔍 Helper.car_details:', window.helper.car_details);
        console.log('🔍 Helper.vehicle:', window.helper.vehicle);
        console.log('🔍 Helper.meta:', window.helper.meta);
        console.log('🔍 Helper.stakeholders:', window.helper.stakeholders);
      } else {
        console.warn('⚠️ window.helper not available during refresh');
      }
      
      // Load the fresh data
      loadCarData();
      
      // Show success feedback
      setTimeout(() => {
        if (refreshBtn) {
          refreshBtn.textContent = '✅ עודכן!';
          refreshBtn.disabled = false;
          
          // Reset button text after 2 seconds
          setTimeout(() => {
            refreshBtn.textContent = 'רענן נתונים';
          }, 2000);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
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
      if (e.target === modal || e.target.classList.contains('car-modal-title')) {
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
  // window.refreshCarData is now defined above with logging

  function loadCarData() {
    try {
      console.log('🔄 HELPER ARCHITECTURE: Loading car data from window.helper ONLY...');
      
      // CORRECT ARCHITECTURE: window.helper is the SINGLE SOURCE OF TRUTH
      if (!window.helper) {
        console.warn('⚠️ window.helper not available - helper system not initialized');
        return;
      }
      
      console.log('✅ Loading car data from window.helper (central hub)');
      
      // HELPER IS THE HUB: Auto-populate from helper structure ONLY
      updateCarDisplay(window.helper);
    } catch (error) {
      console.error("❌ Error loading car data:", error);
    }
  }

  // Helper functions for formatting display values
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  };

  const formatPrice = (value) => {
    if (!value) return "-";
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return formatValue(value);
    return num.toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  function updateCarDisplay(helper) {
    // FOLLOW HELPER ARCHITECTURE: Read ONLY from helper structure
    console.log('🔄 HELPER ARCHITECTURE: Auto-populating from helper structure');
    
    if (!helper) {
      console.warn('⚠️ No helper data provided');
      return;
    }
    // HELPER IS GOD: Auto-populate UI fields from helper structure
    // Plate number
    const plateValue = helper.meta?.plate || helper.vehicle?.plate || '-';
    document.getElementById("vehicle-plate").textContent = formatValue(plateValue.replace(/[-\s]/g, ''));
    
    // Vehicle basic info
    document.getElementById("vehicle-manufacturer").textContent = formatValue(helper.vehicle?.manufacturer);
    document.getElementById("vehicle-model").textContent = formatValue(helper.vehicle?.model);
    document.getElementById("vehicle-model-type").textContent = formatValue(helper.vehicle?.model_type);
    document.getElementById("vehicle-type").textContent = formatValue(helper.vehicle?.vehicle_type);
    document.getElementById("vehicle-trim").textContent = formatValue(helper.vehicle?.trim);
    document.getElementById("vehicle-chassis").textContent = formatValue(helper.vehicle?.chassis);
    document.getElementById("vehicle-year").textContent = formatValue(helper.vehicle?.year);
    document.getElementById("vehicle-ownership-type").textContent = formatValue(helper.vehicle?.ownership_type);
    document.getElementById("vehicle-engine-volume").textContent = formatValue(helper.vehicle?.engine_volume);
    document.getElementById("vehicle-fuel-type").textContent = formatValue(helper.vehicle?.fuel_type);
    document.getElementById("vehicle-engine-model").textContent = formatValue(helper.vehicle?.engine_model);
    document.getElementById("vehicle-drive-type").textContent = formatValue(helper.vehicle?.drive_type);
    document.getElementById("vehicle-office-code").textContent = formatValue(helper.vehicle?.office_code);
    document.getElementById("vehicle-km").textContent = formatValue(helper.vehicle?.km);
    
    // 🔧 FIELD MAPPING FIX: Model code from car_details section (webhook response data)
    // Priority: helper.car_details.model_code (webhook data) > helper.vehicle.model_code > legacy locations
    const vehicleModelCode = helper.car_details?.model_code || helper.vehicle?.model_code || helper.vehicle_model_code || helper.makeCarData?.vehicle_model_code;
    console.log('🔍 PHASE 2.4: Fixed vehicle model code mapping from car_details (priority order):', {
      '1st priority - helper.car_details.model_code': helper.car_details?.model_code,
      '2nd priority - helper.vehicle.model_code': helper.vehicle?.model_code,
      '3rd priority - helper.vehicle_model_code (legacy)': helper.vehicle_model_code,
      '4th priority - helper.makeCarData?.vehicle_model_code (legacy)': helper.makeCarData?.vehicle_model_code,
      'FINAL vehicleModelCode': vehicleModelCode
    });
    document.getElementById("vehicle-model-code").textContent = formatValue(vehicleModelCode);
    document.getElementById("vehicle-levi-code").textContent = formatValue(helper.valuation?.levi_code);
    
    // Dates from correct helper sections
    document.getElementById("vehicle-inspection-date").textContent = formatDate(helper.case_info?.inspection_date);
    document.getElementById("car-damage-date").textContent = formatDate(helper.case_info?.damage_date);
    
    // Owner info from stakeholders section
    document.getElementById("car-owner").textContent = formatValue(helper.stakeholders?.owner?.name);
    document.getElementById("car-owner-address").textContent = formatValue(helper.stakeholders?.owner?.address);
    document.getElementById("car-owner-phone").textContent = formatValue(helper.stakeholders?.owner?.phone);
    
    // Additional fields from helper structure
    document.getElementById("car-base-price").textContent = formatPrice(helper.valuation?.base_price);
    document.getElementById("car-market-value").textContent = formatPrice(helper.vehicle?.market_value);
    document.getElementById("car-odometer").textContent = formatValue(helper.vehicle?.km);
    document.getElementById("car-inspection-location").textContent = formatValue(helper.case_info?.inspection_location);
    document.getElementById("garage-name").textContent = formatValue(helper.stakeholders?.garage?.name);
    document.getElementById("garage-phone").textContent = formatValue(helper.stakeholders?.garage?.phone);
    document.getElementById("garage-email").textContent = formatValue(helper.stakeholders?.garage?.email);
    document.getElementById("insurance-company").textContent = formatValue(helper.stakeholders?.insurance?.company);
    document.getElementById("agent-name").textContent = formatValue(helper.stakeholders?.insurance?.agent?.name);
    document.getElementById("agent-phone").textContent = formatValue(helper.stakeholders?.insurance?.agent?.phone);
    
    // Add missing email fields from helper
    document.getElementById("agent-email").textContent = formatValue(helper.stakeholders?.insurance?.agent?.email);
    document.getElementById("insurance-email").textContent = formatValue(helper.stakeholders?.insurance?.email);
    
    console.log('✅ HELPER ARCHITECTURE: Car details populated from helper structure');
  }

  // REMOVED: Duplicate formatDate - moved to top with other helper functions

  // CRITICAL FIX: Add refresh prevention to stop infinite loops
  let lastCarRefreshTime = 0;

  // ULTRA-SAFE CAR AUTO-REFRESH: Maximum protection against loops
  let carRefreshTimeout = null;
  let lastCarRefreshSource = null;
  let carRefreshCount = 0;
  let carRefreshDisabled = false;
  const CAR_REFRESH_DEBOUNCE_MS = 5000; // 5 second debounce (very conservative)
  const MAX_CAR_REFRESHES_PER_MINUTE = 3; // Very restrictive limit
  const CAR_REFRESH_RESET_INTERVAL = 60000; // 1 minute
  
  // Reset car refresh counter every minute
  setInterval(() => {
    carRefreshCount = 0;
    if (carRefreshDisabled) {
      console.log('🔓 Car auto-refresh re-enabled after cooldown');
      carRefreshDisabled = false;
    }
  }, CAR_REFRESH_RESET_INTERVAL);
  
  function safeRefreshCarData(source = 'auto') {
    // SAFETY CHECK 1: Is refresh disabled?
    if (carRefreshDisabled) {
      console.log(`🚫 Car refresh disabled (${source}) - protection active`);
      return;
    }
    
    const now = Date.now();
    
    // SAFETY CHECK 2: Very strict debouncing
    if (now - lastCarRefreshTime < CAR_REFRESH_DEBOUNCE_MS) {
      console.log(`🚫 Car refresh debounced (${source}) - too soon`);
      return;
    }
    
    // SAFETY CHECK 3: Same source protection
    if (lastCarRefreshSource === source && (now - lastCarRefreshTime) < (CAR_REFRESH_DEBOUNCE_MS * 2)) {
      console.log(`🚫 Car refresh blocked (${source}) - same source recently refreshed`);
      return;
    }
    
    // SAFETY CHECK 4: Rate limiting
    carRefreshCount++;
    if (carRefreshCount > MAX_CAR_REFRESHES_PER_MINUTE) {
      console.log(`🚫 Car refresh rate limit exceeded (${source}) - disabling`);
      carRefreshDisabled = true;
      return;
    }
    
    // SAFETY CHECK 5: Modal visibility
    const modal = document.getElementById("carDetailsModal");
    if (!modal || modal.style.display === "none") {
      console.log(`🚫 Car refresh skipped (${source}) - modal not visible`);
      return;
    }
    
    // Clear any pending refresh
    if (carRefreshTimeout) {
      clearTimeout(carRefreshTimeout);
    }
    
    // Schedule ultra-safe refresh
    carRefreshTimeout = setTimeout(() => {
      try {
        console.log(`🔄 Ultra-safe car data refresh (${source}) - attempt ${carRefreshCount}/${MAX_CAR_REFRESHES_PER_MINUTE}`);
        lastCarRefreshTime = Date.now();
        lastCarRefreshSource = source;
        loadCarData();
      } catch (error) {
        console.error('❌ Error in car auto-refresh:', error);
        carRefreshDisabled = true; // Disable on any error
      }
      carRefreshTimeout = null;
    }, 1000); // 1 second delay for safety
  }
  
  // HIGHLY SELECTIVE AUTO-REFRESH: Only for car-specific updates
  document.addEventListener('helperUpdate', function(event) {
    console.log('📡 Car details floating detected helper update:', event.detail);
    
    // Very selective - only refresh for direct car/vehicle updates
    if (event.detail && 
        (event.detail.includes('vehicle.') || 
         event.detail.includes('car_details.') ||
         event.detail.includes('stakeholders.owner') ||
         event.detail === 'vehicle_data_updated')) {
      safeRefreshCarData('helperUpdate');
    } else {
      console.log('📡 Car refresh skipped - update not car-related');
    }
  });

  // Also listen for storage events from other tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'helper' && e.newValue) {
      console.log('📡 Car details floating detected helper update from another tab');
      safeRefreshCarData('storage');
    }
  });

  // Auto-persist data on page load (but don't auto-open the floating screen)
  setTimeout(() => {
    console.log('🚀 Auto-persisting car data on page load (not opening screen)...');
    
    // CORRECT ARCHITECTURE: Check ONLY window.helper as single source
    if (window.helper) {
      console.log('✅ Found helper data - persisting automatically (screen remains closed)');
      
      // Only persist data from window.helper, don't call loadCarData which might show the screen
      if (!persistedCarData) {
        persistedCarData = {
          vehicle: window.helper.vehicle || {},
          carDetails: window.helper.car_details || {},
          stakeholders: window.helper.stakeholders || {},
          meta: window.helper.meta || {}
        };
        console.log('💾 Persisted data from window.helper (single source of truth)');
      }
    }
  }, 500);

  // FIXED: Declare persistedCarData variable
  let persistedCarData = null;
  
  // Also check periodically for data (in case it arrives later)
  let dataCheckCount = 0;
  const dataCheckInterval = setInterval(() => {
    dataCheckCount++;
    
    // HELPER IS GOD: Check only helper data, no legacy storage
    if (!persistedCarData && window.helper) {
      console.log('✅ Found helper data on periodic check - persisting (not opening screen)');
      
      // Only persist the data from helper, don't call loadCarData
      try {
        persistedCarData = {
          vehicle: window.helper.vehicle || {},
          carDetails: window.helper.car_details || {},
          stakeholders: window.helper.stakeholders || {},
          meta: window.helper.meta || {}
        };
        console.log('💾 Persisted from window.helper on periodic check');
        clearInterval(dataCheckInterval);
      } catch (e) {
        console.warn('Could not persist data on periodic check:', e);
      }
    }
    
    // Stop checking after 10 attempts (20 seconds)
    if (dataCheckCount >= 10 || persistedCarData) {
      console.log('⏹️ Stopping periodic data checks');
      clearInterval(dataCheckInterval);
    }
  }, 2000);

  console.log('✅ Car Details Floating Module initialized successfully');
})();