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

  // Store loaded data to persist between refreshes
  let persistedCarData = null;

  // Global functions
  window.toggleCarDetails = function () {
    const modal = document.getElementById("carDetailsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      // If we have persisted data, use it; otherwise load fresh
      if (persistedCarData) {
        console.log('📌 Using persisted car data');
        updateCarDisplay(
          persistedCarData.vehicle || {}, 
          persistedCarData.carDetails || {}, 
          persistedCarData.stakeholders || {}, 
          persistedCarData.meta || {},
          persistedCarData.valuationData || persistedCarData.valuation || {}
        );
      } else {
        loadCarData();
      }
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
      
      // Clear persisted data to force fresh load
      persistedCarData = null;
      console.log('🧹 Cleared persisted data, forcing fresh load');
      
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
      console.log('🔄 loadCarData: Starting to load car data...');
      
      // CRITICAL: Primary data source should be the helper from sessionStorage
      let helperData = null;
      const helperString = sessionStorage.getItem('helper');
      
      if (helperString) {
        try {
          helperData = JSON.parse(helperString);
          console.log('✅ Successfully loaded helper from sessionStorage');
          console.log('📊 Full helper data:', helperData);
          console.log('📊 Helper structure:', {
            hasVehicle: !!helperData.vehicle,
            hasMeta: !!helperData.meta,
            hasCarDetails: !!helperData.car_details,
            hasStakeholders: !!helperData.stakeholders
          });
          
          // Log specific fields we're looking for
          if (helperData.vehicle) {
            console.log('🚗 Vehicle data:', helperData.vehicle);
          }
          if (helperData.car_details) {
            console.log('📋 Car details:', helperData.car_details);
          }
          if (helperData.meta) {
            console.log('📌 Meta data:', helperData.meta);
          }
          if (helperData.stakeholders) {
            console.log('👥 Stakeholders:', helperData.stakeholders);
          }
        } catch (e) {
          console.error('Failed to parse helper from sessionStorage:', e);
        }
      } else {
        console.warn('⚠️ No helper data in sessionStorage!');
      }
      
      // Check window.helper first (since we set window.helper = helper in helper.js)
      if (!helperData && window.helper) {
        helperData = window.helper;
        console.log('📋 Using window.helper as data source');
        console.log('📊 window.helper contents:', window.helper);
      }
      
      // Secondary: Check window.currentCaseData
      if (!helperData && window.currentCaseData) {
        helperData = window.currentCaseData;
        console.log('📋 Using window.currentCaseData as fallback');
      }
      
      // Tertiary: Check legacy carData
      if (!helperData || (!helperData.vehicle && !helperData.meta)) {
        const carDataString = sessionStorage.getItem('carData');
        if (carDataString) {
          try {
            const legacyData = JSON.parse(carDataString);
            console.log('🔍 Using legacy carData as fallback:', legacyData);
            
            // Convert legacy format to helper format
            helperData = {
              meta: { 
                plate: legacyData.plate, 
                location: legacyData.location, 
                damage_date: legacyData.damageDate || legacyData.date 
              },
              vehicle: { 
                plate: legacyData.plate,
                manufacturer: legacyData.manufacturer, 
                model: legacyData.model, 
                year: legacyData.year,
                chassis: legacyData.chassis,
                km: legacyData.km,
                model_code: legacyData.model_code,
                fuel_type: legacyData.fuel_type
              },
              car_details: legacyData,
              stakeholders: { 
                owner: { name: legacyData.owner },
                owner_name: legacyData.owner,
                garage: { 
                  name: legacyData.garageName,
                  phone: legacyData.garagePhone
                },
                insurance: {
                  company: legacyData.insuranceCompany,
                  agent: {
                    name: legacyData.agentName,
                    phone: legacyData.insurance_agent_phone
                  }
                }
              }
            };
          } catch (e) {
            console.warn('Could not parse legacy carData:', e);
          }
        }
      }
      
      // Default empty structure if no data found
      if (!helperData) {
        console.warn('⚠️ No data found in any source, using empty structure');
        helperData = {
          vehicle: {},
          meta: {},
          car_details: {},
          stakeholders: { owner: {}, garage: {}, insurance: { agent: {} } }
        };
      }
      
      // Extract display data from helper structure
      const vehicle = helperData.vehicle || {};
      const carDetails = helperData.car_details || {};
      const stakeholders = helperData.stakeholders || {};
      const meta = helperData.meta || {};
      const caseInfo = helperData.case_info || {};
      const valuationData = helperData.valuation || {};
      
      console.log('📊 Extracted data for display:', { 
        vehicle: Object.keys(vehicle).length ? vehicle : 'empty',
        carDetails: Object.keys(carDetails).length ? carDetails : 'empty',
        stakeholders: Object.keys(stakeholders).length ? stakeholders : 'empty',
        meta: Object.keys(meta).length ? meta : 'empty'
      });
      
      // Debug specific important fields
      console.log('🔍 Key fields check:');
      console.log('  - Plate:', meta.plate || vehicle.plate || carDetails.plate || 'NOT FOUND');
      console.log('  - Manufacturer:', vehicle.manufacturer || carDetails.manufacturer || 'NOT FOUND');
      console.log('  - Model:', vehicle.model || carDetails.model || 'NOT FOUND');
      console.log('  - Year:', vehicle.year || carDetails.year || 'NOT FOUND');
      console.log('  - Owner:', stakeholders.owner?.name || stakeholders.owner_name || carDetails.owner || 'NOT FOUND');
      
      // Update UI and persist the data
      updateCarDisplay(vehicle, carDetails, stakeholders, meta, valuationData);
      
      // Persist the loaded data
      persistedCarData = {
        vehicle: vehicle,
        carDetails: carDetails,
        stakeholders: stakeholders,
        meta: meta,
        valuationData: valuationData
      };
      console.log('💾 Data persisted for future use');

    } catch (error) {
      console.error("❌ Error loading car data:", error);
      updateCarDisplay({}, {}, {}, {}, {});
    }
  }

  function updateCarDisplay(vehicle, carDetails, stakeholders, meta, valuationData = {}) {
    // Ensure all parameters are objects to prevent reference errors
    vehicle = vehicle || {};
    carDetails = carDetails || {};
    stakeholders = stakeholders || {};
    meta = meta || {};
    valuationData = valuationData || {};
    
    console.log('🔄 ENHANCED updateCarDisplay called with:', {
      vehicle, carDetails, stakeholders, meta, valuationData
    });
    
    // ENHANCED: Log what data we actually have
    console.log('🔍 Vehicle data available:', vehicle ? Object.keys(vehicle) : 'null/undefined');
    console.log('🔍 CarDetails data available:', carDetails ? Object.keys(carDetails) : 'null/undefined');
    console.log('🔍 Stakeholders data available:', stakeholders ? Object.keys(stakeholders) : 'null/undefined');
    console.log('🔍 Meta data available:', meta ? Object.keys(meta) : 'null/undefined');
    
    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };
    
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
    document.getElementById("vehicle-plate").textContent = formatValue(plateValue);
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

  // Listen for helper updates and always refresh display from helper
  document.addEventListener('helperUpdate', function(event) {
    console.log('📡 Car details floating detected helper update:', event.detail);
    // Always reload from helper (sessionStorage)
    loadCarData();
  });

  // Also listen for storage events from other tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'helper' && e.newValue) {
      console.log('📡 Car details floating detected helper update from another tab');
      
      // Only refresh if the modal is visible
      const modal = document.getElementById("carDetailsModal");
      if (modal && modal.style.display !== "none") {
        console.log('🔄 Auto-refreshing car details due to cross-tab update');
        setTimeout(() => {
          window.refreshCarData();
        }, 100);
      }
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