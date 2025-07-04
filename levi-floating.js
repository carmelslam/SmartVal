(function () {
  if (document.getElementById("leviModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #leviModal {
      position: fixed;
      top: 70px;
      left: 20px;
      max-width: 520px;
      background: white;
      border: 1px solid #007bff;
      padding: 25px;
      z-index: 9999;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 12px;
      display: none;
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
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
      text-align: right;
      font-size: 14px;
    }
    .levi-field {
      background: white;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
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
    }
    .levi-btn.edit {
      background: #ffc107;
      color: #212529;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "leviModal";
  modal.innerHTML = `
    <div class="levi-modal-title">דו"ח לוי יצחק - פרטים</div>
    
    <div class="levi-section">
      <h4>נתוני שווי בסיסיים</h4>
      <div class="levi-grid">
        <div class="levi-field">
          <div class="label">ערך הרכב</div>
          <div class="value price" id="levi-value">₪0</div>
        </div>
        <div class="levi-field">
          <div class="label">קוד דגם</div>
          <div class="value" id="levi-model-code">-</div>
        </div>
        <div class="levi-field">
          <div class="label">סוג בעלות</div>
          <div class="value" id="levi-car-type">-</div>
        </div>
        <div class="levi-field">
          <div class="label">ערך שוק</div>
          <div class="value price" id="levi-market-value">₪0</div>
        </div>
      </div>
    </div>

    <div class="levi-section">
      <h4>התאמות מחיר</h4>
      <div class="levi-grid">
        <div class="levi-field">
          <div class="label">התאמת קילומטראז'</div>
          <div class="value" id="levi-mileage-adj">-</div>
        </div>
        <div class="levi-field">
          <div class="label">התאמת בעלות</div>
          <div class="value" id="levi-ownership-adj">-</div>
        </div>
        <div class="levi-field">
          <div class="label">התאמת ציוד</div>
          <div class="value" id="levi-features-adj">-</div>
        </div>
        <div class="levi-field">
          <div class="label">ערך ביטוח</div>
          <div class="value price" id="levi-insurance-value">₪0</div>
        </div>
      </div>
    </div>

    <div class="levi-buttons">
      <button class="levi-btn close" onclick="toggleLeviReport()">סגור</button>
      <button class="levi-btn refresh" onclick="refreshLeviData()">רענן נתונים</button>
      <button class="levi-btn edit" onclick="editLeviData()">ערוך</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Global functions
  window.toggleLeviReport = function () {
    const modal = document.getElementById("leviModal");
    if (modal.style.display === "none" || !modal.style.display) {
      loadLeviData();
      modal.style.display = "block";
    } else {
      modal.style.display = "none";
    }
  };

  window.refreshLeviData = function () {
    loadLeviData();
  };

  window.editLeviData = function () {
    alert("פונקציונליות עריכה תתווסף בגרסה הבאה");
  };

  function loadLeviData() {
    try {
      // Try to get data from helper.js or sessionStorage
      let leviData = {};
      
      // Check if helper.js is available
      if (typeof helper !== 'undefined' && helper.levi) {
        leviData = helper.levi;
      } else {
        // Fallback to sessionStorage
        const storedData = sessionStorage.getItem("leviData");
        if (storedData) {
          leviData = JSON.parse(storedData);
        }
      }

      // Default empty structure
      const defaultData = {
        levi_value: 0,
        model_code: "",
        car_type: "",
        market_value: 0,
        insurance_value: 0,
        adjustments: {
          mileage_adjustment: "",
          ownership_adjustment: "",
          features_adjustment: ""
        }
      };

      // Merge with defaults
      leviData = { ...defaultData, ...leviData };

      // Update UI
      updateLeviDisplay(leviData);

    } catch (error) {
      console.error("Error loading Levi data:", error);
      updateLeviDisplay({});
    }
  }

  function updateLeviDisplay(data) {
    const formatPrice = (value) => {
      const num = parseFloat(value) || 0;
      return num > 0 ? `₪${num.toLocaleString()}` : "₪0";
    };

    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    // Basic values
    document.getElementById("levi-value").textContent = formatPrice(data.levi_value);
    document.getElementById("levi-model-code").textContent = formatValue(data.model_code);
    document.getElementById("levi-car-type").textContent = formatValue(data.car_type);
    document.getElementById("levi-market-value").textContent = formatPrice(data.market_value);
    document.getElementById("levi-insurance-value").textContent = formatPrice(data.insurance_value);

    // Adjustments
    const adjustments = data.adjustments || {};
    document.getElementById("levi-mileage-adj").textContent = formatValue(adjustments.mileage_adjustment);
    document.getElementById("levi-ownership-adj").textContent = formatValue(adjustments.ownership_adjustment);
    document.getElementById("levi-features-adj").textContent = formatValue(adjustments.features_adjustment);

    // Update value styling
    document.querySelectorAll('.value').forEach(el => {
      if (el.textContent === "-" || el.textContent === "₪0") {
        el.classList.add('empty');
      } else {
        el.classList.remove('empty');
      }
    });
  }

  // Add floating button to access Levi report from any page
  if (!document.getElementById("leviFloatBtn")) {
    const floatBtn = document.createElement("button");
    floatBtn.id = "leviFloatBtn";
    floatBtn.innerHTML = "דו\"ח לוי";
    floatBtn.style.cssText = `
      position: fixed;
      top: 20px;
      left: 140px;
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      z-index: 9998;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    floatBtn.onclick = toggleLeviReport;
    document.body.appendChild(floatBtn);
  }

})();