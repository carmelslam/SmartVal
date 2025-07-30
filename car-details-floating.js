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
    if (!window.helper) {
      console.error('❌ Helper not available for saving changes');
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

    // Map changes to helper structure while preserving integrity
    const helperUpdates = mapFieldsToHelper(changes);
    
    // Update helper using safe methods
    if (helperUpdates.vehicle && Object.keys(helperUpdates.vehicle).length > 0) {
      Object.assign(window.helper.vehicle, helperUpdates.vehicle);
    }
    if (helperUpdates.stakeholders && Object.keys(helperUpdates.stakeholders).length > 0) {
      if (!window.helper.stakeholders) window.helper.stakeholders = {};
      if (!window.helper.stakeholders.owner) window.helper.stakeholders.owner = {};
      if (!window.helper.stakeholders.garage) window.helper.stakeholders.garage = {};
      
      Object.assign(window.helper.stakeholders.owner, helperUpdates.stakeholders.owner || {});
      Object.assign(window.helper.stakeholders.garage, helperUpdates.stakeholders.garage || {});
    }
    if (helperUpdates.case_info && Object.keys(helperUpdates.case_info).length > 0) {
      if (!window.helper.case_info) window.helper.case_info = {};
      Object.assign(window.helper.case_info, helperUpdates.case_info);
    }

    // Save to storage locations
    try {
      const helperString = JSON.stringify(window.helper);
      sessionStorage.setItem('helper', helperString);
      localStorage.setItem('helper_data', helperString);
      console.log('✅ Changes saved to helper and storage');
    } catch (error) {
      console.error('❌ Failed to save changes:', error);
    }
  }

  function mapFieldsToHelper(changes) {
    const updates = {
      vehicle: {},
      stakeholders: { owner: {}, garage: {} },
      case_info: {}
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
      'vehicle-levi-code': 'levi_code',
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

    // Map case info fields
    const caseFieldMap = {
      'car-damage-date': 'damage_date'
    };

    // Special handling for damage date - also update general info page field
    if (changes['car-damage-date']) {
      // Update damage_date_new field in general info page if it exists
      const generalInfoDamageDate = document.getElementById('damage_date_new');
      if (generalInfoDamageDate) {
        generalInfoDamageDate.value = changes['car-damage-date'];
        generalInfoDamageDate.dispatchEvent(new Event('change', { bubbles: true }));
        // Mark as manually entered to protect from auto-population
        sessionStorage.setItem('damageDate_manualEntry', 'true');
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
      } else if (caseFieldMap[fieldId]) {
        updates.case_info[caseFieldMap[fieldId]] = changes[fieldId];
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
    
    // Force reload from sessionStorage to get latest data
    try {
      // Clear any cached data
      if (window.currentCaseData) {
        delete window.currentCaseData;
      }
      
      // SIMPLE: No custom storage to clear
      
      // Get fresh data from sessionStorage
      const helperString = sessionStorage.getItem('helper');
      if (helperString) {
        const helper = JSON.parse(helperString);
        console.log('🔍 Fresh helper data loaded:', helper);
        console.log('🔍 Helper.car_details:', helper.car_details);
        console.log('🔍 Helper.vehicle:', helper.vehicle);
        console.log('🔍 Helper.meta:', helper.meta);
        console.log('🔍 Helper.stakeholders:', helper.stakeholders);
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
      console.log('🔄 HELPER ARCHITECTURE: Loading car data from helper only...');
      
      // FOLLOW HELPER ARCHITECTURE: Single source of truth - window.helper
      if (!window.helper) {
        console.warn('⚠️ No helper data available');
        return;
      }
      
      // HELPER IS GOD: Auto-populate from helper structure
      updateCarDisplay(window.helper);
    } catch (error) {
      console.error("❌ Error loading car data:", error);
    }
  }

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
    
    // Model code vs Levi code - from correct helper fields
    document.getElementById("vehicle-model-code").textContent = formatValue(helper.vehicle?.model_code);
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
    
    console.log('✅ HELPER ARCHITECTURE: Car details populated from helper structure');
  }
    
    // Format date to DD/MM/YYYY like inspection date
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr; // Return original if invalid
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return dateStr; // Return original if parsing fails
      }
    };
    
    // Format price with thousand separator like market value
    const formatPrice = (value) => {
      if (!value) return "-";
      const num = parseFloat(value.toString().replace(/,/g, ''));
      if (isNaN(num)) return formatValue(value);
      return num.toLocaleString();
    };

    // ENHANCED: Vehicle fields - prioritize vehicle section, then car_details
    const plateValue = vehicle.plate || meta.plate || carDetails.plate;
    console.log('🆔 Plate values check:', {
      'vehicle.plate': vehicle.plate,
      'meta.plate': meta.plate,
      'carDetails.plate': carDetails.plate,
      'final plateValue': plateValue
    });
    // Apply plate standardization (remove dashes for Israeli format XXXXXXXX)
    const standardizedPlate = plateValue ? String(plateValue).replace(/[-\s]/g, '') : plateValue;
    document.getElementById("vehicle-plate").textContent = formatValue(standardizedPlate);
    document.getElementById("vehicle-manufacturer").textContent = formatValue(
      vehicle.manufacturer || carDetails.manufacturer
    );
    document.getElementById("vehicle-model").textContent = formatValue(
      vehicle.model || carDetails.model
    );
    document.getElementById("vehicle-model-type").textContent = formatValue(
      vehicle.model_type || carDetails.model_type
    );
    document.getElementById("vehicle-type").textContent = formatValue(
      vehicle.vehicle_type || carDetails.vehicle_type
    );
    document.getElementById("vehicle-trim").textContent = formatValue(
      vehicle.trim || carDetails.trim
    );
    document.getElementById("vehicle-chassis").textContent = formatValue(
      vehicle.chassis || carDetails.chassis
    );
    document.getElementById("vehicle-year").textContent = formatValue(
      vehicle.year || carDetails.year
    );
    document.getElementById("vehicle-ownership-type").textContent = formatValue(
      vehicle.ownership_type || carDetails.ownership_type
    );
    document.getElementById("vehicle-engine-volume").textContent = formatValue(
      vehicle.engine_volume || carDetails.engine_volume
    );
    document.getElementById("vehicle-fuel-type").textContent = formatValue(
      vehicle.fuel_type || carDetails.fuel_type
    );
    // CRITICAL: Debug model code vs levi code data sources
    console.log('🔍 Model Code vs Levi Code Debug:', {
      'carDetails.vehicle_model_code': carDetails.vehicle_model_code,
      'vehicle.vehicle_model_code': vehicle.vehicle_model_code,
      'meta.vehicle_model_code': meta.vehicle_model_code,
      'carDetails.model_code': carDetails.model_code,
      'vehicle.model_code': vehicle.model_code,
      'valuationData.levi_code': valuationData?.levi_code,
      'valuationData.levi_model_code': valuationData?.levi_model_code,
      'valuationData.code': valuationData?.code,
      'valuationData.model_code': valuationData?.model_code
    });
    
    // ENHANCED DEBUG: Show full data structures
    console.log('🔍 Full carDetails object:', carDetails);
    console.log('🔍 Full vehicle object:', vehicle);
    console.log('🔍 Full meta object:', meta);
    console.log('🔍 Full valuationData object:', valuationData);
    
    // 🔒 PLATE PROTECTION: Show protection status
    if (window.getPlateProtectionStatus) {
      const protectionStatus = window.getPlateProtectionStatus();
      console.log('🔒 Plate Protection Status:', protectionStatus);
      if (protectionStatus.isProtected) {
        console.log(`🔒 Protected plate: "${protectionStatus.originalPlate}" (source: ${protectionStatus.source})`);
        if (protectionStatus.alertCount > 0) {
          console.warn(`⚠️ Protection alerts: ${protectionStatus.alertCount} attempts blocked`);
        }
      }
    }
    
    // Model code - ONLY from open case webhook "מספר דגם הרכב" (separate from Levi)
    const modelCodeValue = carDetails.vehicle_model_code ||  // Primary: from open case webhook "מספר דגם הרכב"
                          vehicle.vehicle_model_code ||       // Vehicle section model code (NOT Levi)
                          meta.vehicle_model_code ||          // Meta section model code (NOT Levi)
                          carDetails.model_code ||            // General model code field (if not overridden by Levi)
                          vehicle.model_code ||               // Vehicle model code field (if not overridden by Levi)
                          "-";
                          
    document.getElementById("vehicle-model-code").textContent = formatValue(modelCodeValue);
    console.log('🚗 Model Code final value:', modelCodeValue);
    
    // Levi code - ONLY from Levi webhook response "קוד דגם" (separate from model code)
    const leviCodeValue = (valuationData && valuationData.levi_code) ||        // Primary: From Levi "קוד דגם"
                         (valuationData && valuationData.levi_model_code) ||   // Levi code variations
                         (valuationData && valuationData.code) ||              // Alternative Levi field
                         (valuationData && valuationData.model_code) ||        // Levi specific model code
                         "-";
                         
    document.getElementById("vehicle-levi-code").textContent = formatValue(leviCodeValue);
    console.log('📊 Levi Code final value:', leviCodeValue);
    // Inspection date - from case opening or car details page where user enters inspection date
    const helperData = JSON.parse(sessionStorage.getItem('helper') || '{}');
    document.getElementById("vehicle-inspection-date").textContent = formatDate(
      helperData.case_info?.inspection_date ||  // From case opening (correct field)
      meta.inspection_date ||                   // From car details page input field
      valuationData.inspection_date ||          // From valuation data
      "-"
    );
    document.getElementById("vehicle-engine-model").textContent = formatValue(
      vehicle.engine_model || carDetails.engine_model
    );
    document.getElementById("vehicle-drive-type").textContent = formatValue(
      vehicle.drive_type || carDetails.drive_type
    );
    document.getElementById("vehicle-office-code").textContent = formatValue(
      vehicle.office_code || meta.office_code || carDetails.office_code
    );
    document.getElementById("vehicle-km").textContent = formatValue(
      vehicle.km || carDetails.km || carDetails.odo
    );

    // Owner fields - prioritize stakeholders section
    const ownerName = stakeholders.owner?.name || carDetails.owner;
    document.getElementById("car-owner").textContent = formatValue(ownerName);
    
    // Damage date - from case opening or general info page (where user inputs damage date)
    document.getElementById("car-damage-date").textContent = formatDate(
      carDetails.damage_date ||  // From general info page where user enters damage date
      carDetails.damageDate ||   // Legacy field
      meta.damage_date ||        // From case_info on case opening 
      "-"
    );
    
    // Owner contact info
    document.getElementById("car-owner-address").textContent = formatValue(
      stakeholders.owner?.address || carDetails.ownerAddress
    );
    document.getElementById("car-owner-phone").textContent = formatValue(
      stakeholders.owner?.phone || carDetails.ownerPhone
    );
    
    // Additional fields from general info
    // Base price - mapped specifically from Levi webhook valuation data
    document.getElementById("car-base-price").textContent = formatPrice(
      (valuationData && valuationData.base_price) || 
      (valuationData && valuationData.price) ||
      (valuationData && valuationData.market_value) ||
      carDetails.base_price || 
      vehicle.base_price
    );
    // Market value - to be mapped from valuation/pricing module
    document.getElementById("car-market-value").textContent = formatPrice(
      carDetails.market_value || vehicle.market_value
    );
    document.getElementById("car-odometer").textContent = formatValue(
      vehicle.km || carDetails.odo || carDetails.km
    );
    // Inspection location - only from open case page
    document.getElementById("car-inspection-location").textContent = formatValue(
      meta.inspection_location || meta.location || "-"
    );

    // Garage name - only from general info page, separate from inspection location
    document.getElementById("garage-name").textContent = formatValue(
      stakeholders.garage?.name || carDetails.garage_name || carDetails.garageName || "-"
    );
    document.getElementById("garage-phone").textContent = formatValue(
      stakeholders.garage?.phone || carDetails.garage_phone || carDetails.garagePhone
    );
    document.getElementById("garage-email").textContent = formatValue(
      stakeholders.garage?.email || carDetails.garage_email || carDetails.garageEmail
    );
    
    // Insurance info
    document.getElementById("insurance-company").textContent = formatValue(
      stakeholders.insurance?.company || carDetails.insuranceCompany
    );
    document.getElementById("insurance-email").textContent = formatValue(
      stakeholders.insurance?.email || carDetails.insurance_email || carDetails.insuranceEmail
    );
    
    // Insurance agent info
    document.getElementById("agent-name").textContent = formatValue(
      stakeholders.insurance?.agent?.name || carDetails.agentName
    );
    document.getElementById("agent-phone").textContent = formatValue(
      stakeholders.insurance?.agent?.phone || carDetails.insurance_agent_phone || carDetails.agentPhone
    );
    document.getElementById("agent-email").textContent = formatValue(
      stakeholders.insurance?.agent?.email || carDetails.insurance_agent_email || carDetails.agentEmail
    );

    // Update value styling
    document.querySelectorAll('.value').forEach(el => {
      if (el.textContent === "-") {
        el.classList.add('empty');
      } else {
        el.classList.remove('empty');
      }
    });
    
    // Log populated fields count for debugging
    const populatedFields = document.querySelectorAll('.value:not(.empty)').length;
    const totalFields = document.querySelectorAll('.value').length;
    console.log(`✅ Populated ${populatedFields} out of ${totalFields} fields`);
  }

  // CRITICAL FIX: Add refresh prevention to stop infinite loops
  let isCarRefreshing = false;
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
    
    // Check all data sources
    const helperStr = sessionStorage.getItem('helper');
    const carDataStr = sessionStorage.getItem('carData');
    const localHelperStr = localStorage.getItem('helper_data');
    
    if (helperStr || carDataStr || localHelperStr || window.helper) {
      console.log('✅ Found car data - persisting automatically (screen remains closed)');
      
      // Only persist data, don't call loadCarData which might show the screen
      if (window.helper && !persistedCarData) {
        persistedCarData = {
          vehicle: window.helper.vehicle || {},
          carDetails: window.helper.car_details || {},
          stakeholders: window.helper.stakeholders || {},
          meta: window.helper.meta || {}
        };
        console.log('💾 Persisted data from window.helper');
      }
      
      // Parse and persist from sessionStorage if needed
      try {
        if (helperStr && helperStr !== '{}' && !persistedCarData) {
          const helper = JSON.parse(helperStr);
          persistedCarData = {
            vehicle: helper.vehicle || {},
            carDetails: helper.car_details || {},
            stakeholders: helper.stakeholders || {},
            meta: helper.meta || {}
          };
          console.log('💾 Persisted data from sessionStorage');
        }
      } catch (e) {
        console.warn('Could not parse helper data for persistence:', e);
      }
    }
  }, 500);

  // Also check periodically for data (in case it arrives later)
  let dataCheckCount = 0;
  const dataCheckInterval = setInterval(() => {
    dataCheckCount++;
    
    if (!persistedCarData) {
      const hasData = sessionStorage.getItem('helper') || 
                     sessionStorage.getItem('carData') || 
                     localStorage.getItem('helper_data') || 
                     window.helper;
                     
      if (hasData) {
        console.log('✅ Found car data on periodic check - persisting (not opening screen)');
        
        // Only persist the data, don't call loadCarData
        try {
          if (window.helper) {
            persistedCarData = {
              vehicle: window.helper.vehicle || {},
              carDetails: window.helper.car_details || {},
              stakeholders: window.helper.stakeholders || {},
              meta: window.helper.meta || {}
            };
            console.log('💾 Persisted from window.helper on periodic check');
          } else if (sessionStorage.getItem('helper')) {
            const helper = JSON.parse(sessionStorage.getItem('helper'));
            persistedCarData = {
              vehicle: helper.vehicle || {},
              carDetails: helper.car_details || {},
              stakeholders: helper.stakeholders || {},
              meta: helper.meta || {}
            };
            console.log('💾 Persisted from sessionStorage on periodic check');
          }
        } catch (e) {
          console.warn('Could not persist data on periodic check:', e);
        }
        
        clearInterval(dataCheckInterval);
      }
    } else {
      console.log('📌 Data already persisted, stopping periodic checks');
      clearInterval(dataCheckInterval);
    }
    
    // Stop checking after 10 attempts (20 seconds)
    if (dataCheckCount >= 10) {
      console.log('⏹️ Stopping periodic data checks');
      clearInterval(dataCheckInterval);
    }
  }, 2000);

  console.log('✅ Car Details Floating Module initialized successfully');
})();