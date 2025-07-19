(function () {
  if (document.getElementById("carDetailsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #carDetailsModal {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 95%;
      max-width: 650px;
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
      margin: 0 0 10px 0;
      color: #495057;
      font-size: 16px;
      font-weight: bold;
    }
    
    .car-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .car-field:last-child {
      border-bottom: none;
    }
    
    .car-field .label {
      font-weight: bold;
      color: #6c757d;
      font-size: 14px;
    }
    
    .car-field .value {
      color: #212529;
      font-size: 15px;
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
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "carDetailsModal";
  modal.innerHTML = `
    <div class="car-modal-title">פרטי רכב</div>
    
    <div class="car-section">
      <h4>פרטי רכב (Vehicle)</h4>
      <div class="car-field">
        <div class="label">מספר רכב:</div>
        <div class="value" id="vehicle-plate">-</div>
      </div>
      <div class="car-field">
        <div class="label">יצרן:</div>
        <div class="value" id="vehicle-manufacturer">-</div>
      </div>
      <div class="car-field">
        <div class="label">דגם:</div>
        <div class="value" id="vehicle-model">-</div>
      </div>
      <div class="car-field">
        <div class="label">שנת יצור:</div>
        <div class="value" id="vehicle-year">-</div>
      </div>
      <div class="car-field">
        <div class="label">קילומטראז׳:</div>
        <div class="value" id="vehicle-km">-</div>
      </div>
      <div class="car-field">
        <div class="label">שילדה:</div>
        <div class="value" id="vehicle-chassis">-</div>
      </div>
      <div class="car-field">
        <div class="label">קוד דגם:</div>
        <div class="value" id="vehicle-model-code">-</div>
      </div>
      <div class="car-field">
        <div class="label">סוג דלק:</div>
        <div class="value" id="vehicle-fuel-type">-</div>
      </div>
    </div>

    <div class="car-section">
      <h4>פרטי רכב נוספים (Car Details)</h4>
      <div class="car-field">
        <div class="label">בעלים:</div>
        <div class="value" id="car-owner">-</div>
      </div>
      <div class="car-field">
        <div class="label">סוג בעלות:</div>
        <div class="value" id="car-ownership-type">-</div>
      </div>
      <div class="car-field">
        <div class="label">ערך שוק:</div>
        <div class="value" id="car-market-value">-</div>
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
    </div>

    <div class="car-section">
      <h4>פרטי מוסך וביטוח</h4>
      <div class="car-field">
        <div class="label">שם מוסך:</div>
        <div class="value" id="garage-name">-</div>
      </div>
      <div class="car-field">
        <div class="label">טלפון מוסך:</div>
        <div class="value" id="garage-phone">-</div>
      </div>
      <div class="car-field">
        <div class="label">חברת ביטוח:</div>
        <div class="value" id="insurance-company">-</div>
      </div>
      <div class="car-field">
        <div class="label">סוכן:</div>
        <div class="value" id="agent-name">-</div>
      </div>
      <div class="car-field">
        <div class="label">טלפון סוכן:</div>
        <div class="value" id="agent-phone">-</div>
      </div>
    </div>

    <div class="car-buttons">
      <button class="car-btn close" onclick="toggleCarDetails()">סגור</button>
      <button class="car-btn refresh" onclick="refreshCarData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Global functions
  window.toggleCarDetails = function () {
    const modal = document.getElementById("carDetailsModal");
    if (modal.style.display === "none" || !modal.style.display) {
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
    
    // Debug: Check what data is in sessionStorage
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    console.log('🔍 DEBUG: Helper in Car Details floating screen:', helper);
    console.log('🔍 DEBUG: Helper.car_details:', helper.car_details);
    console.log('🔍 DEBUG: Helper.vehicle:', helper.vehicle);
    console.log('🔍 DEBUG: Helper.meta:', helper.meta);
    
    loadCarData();
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
          console.log('📊 Helper structure:', {
            hasVehicle: !!helperData.vehicle,
            hasMeta: !!helperData.meta,
            hasCarDetails: !!helperData.car_details,
            hasStakeholders: !!helperData.stakeholders
          });
        } catch (e) {
          console.error('Failed to parse helper from sessionStorage:', e);
        }
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
      
      // Update UI
      updateCarDisplay(vehicle, carDetails, stakeholders, meta);

    } catch (error) {
      console.error("❌ Error loading car data:", error);
      updateCarDisplay({}, {}, {}, {});
    }
  }

  function updateCarDisplay(vehicle, carDetails, stakeholders, meta) {
    console.log('🔄 updateCarDisplay called with:', {
      vehicle, carDetails, stakeholders, meta
    });
    
    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    // Vehicle fields - check multiple possible locations
    document.getElementById("vehicle-plate").textContent = formatValue(
      meta.plate || vehicle.plate || vehicle.plate_number || carDetails.plate
    );
    document.getElementById("vehicle-manufacturer").textContent = formatValue(
      vehicle.manufacturer || carDetails.manufacturer
    );
    document.getElementById("vehicle-model").textContent = formatValue(
      vehicle.model || carDetails.model
    );
    document.getElementById("vehicle-year").textContent = formatValue(
      vehicle.year || carDetails.year
    );
    document.getElementById("vehicle-km").textContent = formatValue(
      vehicle.km || carDetails.km
    );
    document.getElementById("vehicle-chassis").textContent = formatValue(
      vehicle.chassis || carDetails.chassis
    );
    document.getElementById("vehicle-model-code").textContent = formatValue(
      vehicle.model_code || carDetails.model_code
    );
    document.getElementById("vehicle-fuel-type").textContent = formatValue(
      vehicle.fuel_type || carDetails.fuel_type
    );

    // Owner fields - check all possible locations
    const ownerName = stakeholders.owner?.name || stakeholders.owner_name || carDetails.owner;
    document.getElementById("car-owner").textContent = formatValue(ownerName);
    
    document.getElementById("car-ownership-type").textContent = formatValue(
      vehicle.ownership_type || carDetails.ownership_type
    );
    document.getElementById("car-market-value").textContent = formatValue(
      carDetails.market_value || vehicle.market_value
    );
    document.getElementById("car-damage-date").textContent = formatValue(
      meta.damage_date || carDetails.damageDate || carDetails.damage_date
    );
    
    // Owner contact info
    document.getElementById("car-owner-address").textContent = formatValue(
      stakeholders.owner?.address || stakeholders.owner_address || carDetails.ownerAddress
    );
    document.getElementById("car-owner-phone").textContent = formatValue(
      stakeholders.owner?.phone || stakeholders.owner_phone || carDetails.ownerPhone
    );

    // Garage info - check stakeholders and car_details
    document.getElementById("garage-name").textContent = formatValue(
      stakeholders.garage?.name || carDetails.garageName || carDetails.garage_name
    );
    document.getElementById("garage-phone").textContent = formatValue(
      stakeholders.garage?.phone || carDetails.garagePhone || carDetails.garage_phone
    );
    
    // Insurance info
    document.getElementById("insurance-company").textContent = formatValue(
      stakeholders.insurance?.company || carDetails.insuranceCompany
    );
    
    // Insurance agent info
    document.getElementById("agent-name").textContent = formatValue(
      stakeholders.insurance?.agent?.name || carDetails.agentName
    );
    document.getElementById("agent-phone").textContent = formatValue(
      stakeholders.insurance?.agent?.phone || carDetails.insurance_agent_phone
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

})();