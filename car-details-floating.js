(function () {
  if (document.getElementById("carDetailsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #carDetailsModal {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 95%;
      max-width: 500px;
      max-height: 90vh;
      background: white;
      border: 1px solid #28a745;
      padding: 20px;
      z-index: 9999;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 16px;
      display: none;
      overflow-y: auto;
      cursor: move;
    }
    
    @media (max-width: 768px) {
      #carDetailsModal {
        top: 10px;
        right: 10px;
        width: 95%;
        max-width: 95%;
        padding: 15px;
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
      <h4>פרטי הרכב הבסיסיים</h4>
      <div class="car-field">
        <div class="label">מספר רכב:</div>
        <div class="value" id="car-plate">-</div>
      </div>
      <div class="car-field">
        <div class="label">יצרן:</div>
        <div class="value" id="car-manufacturer">-</div>
      </div>
      <div class="car-field">
        <div class="label">דגם:</div>
        <div class="value" id="car-model">-</div>
      </div>
      <div class="car-field">
        <div class="label">שנת יצור:</div>
        <div class="value" id="car-year">-</div>
      </div>
      <div class="car-field">
        <div class="label">צבע:</div>
        <div class="value" id="car-color">-</div>
      </div>
      <div class="car-field">
        <div class="label">מספר שילדה:</div>
        <div class="value" id="car-chassis">-</div>
      </div>
    </div>

    <div class="car-section">
      <h4>פרטי בעלים</h4>
      <div class="car-field">
        <div class="label">שם בעל הרכב:</div>
        <div class="value" id="car-owner-name">-</div>
      </div>
      <div class="car-field">
        <div class="label">ת.ז בעל הרכב:</div>
        <div class="value" id="car-owner-id">-</div>
      </div>
      <div class="car-field">
        <div class="label">כתובת:</div>
        <div class="value" id="car-owner-address">-</div>
      </div>
      <div class="car-field">
        <div class="label">טלפון:</div>
        <div class="value" id="car-owner-phone">-</div>
      </div>
    </div>

    <div class="car-section">
      <h4>פרטי ביטוח</h4>
      <div class="car-field">
        <div class="label">חברת ביטוח:</div>
        <div class="value" id="car-insurance-company">-</div>
      </div>
      <div class="car-field">
        <div class="label">מספר פוליסה:</div>
        <div class="value" id="car-policy-number">-</div>
      </div>
      <div class="car-field">
        <div class="label">סוכן ביטוח:</div>
        <div class="value" id="car-insurance-agent">-</div>
      </div>
      <div class="car-field">
        <div class="label">טלפון סוכן:</div>
        <div class="value" id="car-agent-phone">-</div>
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

      // Get vehicle data
      const vehicle = helper.vehicle || {};
      const client = helper.client || {};
      const meta = helper.meta || {};
      
      // Update UI with car data
      updateCarDisplay(vehicle, client, meta);

    } catch (error) {
      console.error("Error loading car data:", error);
      updateCarDisplay({}, {}, {});
    }
  }

  function updateCarDisplay(vehicle, client, meta) {
    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    // Vehicle information
    document.getElementById("car-plate").textContent = formatValue(meta.plate || vehicle.plate_number);
    document.getElementById("car-manufacturer").textContent = formatValue(vehicle.manufacturer);
    document.getElementById("car-model").textContent = formatValue(vehicle.model);
    document.getElementById("car-year").textContent = formatValue(vehicle.year);
    document.getElementById("car-color").textContent = formatValue(vehicle.color);
    document.getElementById("car-chassis").textContent = formatValue(vehicle.chassis_number);

    // Owner information
    document.getElementById("car-owner-name").textContent = formatValue(client.name);
    document.getElementById("car-owner-id").textContent = formatValue(client.id_number);
    document.getElementById("car-owner-address").textContent = formatValue(client.address);
    document.getElementById("car-owner-phone").textContent = formatValue(client.phone_number);

    // Insurance information
    document.getElementById("car-insurance-company").textContent = formatValue(client.insurance_company);
    document.getElementById("car-policy-number").textContent = formatValue(client.policy_number);
    document.getElementById("car-insurance-agent").textContent = formatValue(client.insurance_agent);
    document.getElementById("car-agent-phone").textContent = formatValue(client.insurance_agent_phone);

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