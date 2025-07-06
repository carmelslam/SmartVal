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

  window.refreshCarData = function () {
    loadCarData();
  };

  function loadCarData() {
    try {
      let helper = {};
      
      // Try to get data from sessionStorage helper
      try {
        const storedHelper = sessionStorage.getItem('helper');
        if (storedHelper) {
          helper = JSON.parse(storedHelper);
        }
      } catch (parseError) {
        console.warn('Could not parse helper from sessionStorage:', parseError);
      }
      
      // Fallback to global helper variable
      if (Object.keys(helper).length === 0 && typeof window.helper !== 'undefined') {
        helper = window.helper;
      }

      // Get vehicle data using system structure
      const vehicle = helper.vehicle || {};
      const carDetails = helper.car_details || {};
      const client = helper.client || {};
      const meta = helper.meta || {};
      
      // Update UI with car data using proper helper structure
      updateCarDisplay(vehicle, carDetails, client, meta);

    } catch (error) {
      console.error("Error loading car data:", error);
      updateCarDisplay({}, {}, {}, {});
    }
  }

  function updateCarDisplay(vehicle, carDetails, client, meta) {
    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    // helper.vehicle fields
    document.getElementById("vehicle-plate").textContent = formatValue(meta.plate || vehicle.plate_number);
    document.getElementById("vehicle-manufacturer").textContent = formatValue(vehicle.manufacturer);
    document.getElementById("vehicle-model").textContent = formatValue(vehicle.model);
    document.getElementById("vehicle-year").textContent = formatValue(vehicle.year);
    document.getElementById("vehicle-km").textContent = formatValue(vehicle.km);
    document.getElementById("vehicle-chassis").textContent = formatValue(vehicle.chassis);
    document.getElementById("vehicle-model-code").textContent = formatValue(vehicle.model_code);
    document.getElementById("vehicle-fuel-type").textContent = formatValue(vehicle.fuel_type);

    // helper.car_details fields  
    document.getElementById("car-owner").textContent = formatValue(carDetails.owner);
    document.getElementById("car-ownership-type").textContent = formatValue(carDetails.ownership_type);
    document.getElementById("car-market-value").textContent = formatValue(carDetails.market_value);
    document.getElementById("car-damage-date").textContent = formatValue(carDetails.damageDate);
    document.getElementById("car-owner-address").textContent = formatValue(carDetails.ownerAddress);
    document.getElementById("car-owner-phone").textContent = formatValue(carDetails.ownerPhone);

    // Garage and insurance from helper.car_details
    document.getElementById("garage-name").textContent = formatValue(carDetails.garageName || vehicle.garage_name);
    document.getElementById("garage-phone").textContent = formatValue(carDetails.garagePhone || vehicle.garage_phone);
    document.getElementById("insurance-company").textContent = formatValue(carDetails.insuranceCompany);
    document.getElementById("agent-name").textContent = formatValue(carDetails.agentName);
    document.getElementById("agent-phone").textContent = formatValue(carDetails.agentPhone);

    // Update value styling
    document.querySelectorAll('.value').forEach(el => {
      if (el.textContent === "-") {
        el.classList.add('empty');
      } else {
        el.classList.remove('empty');
      }
    });
  }

})();