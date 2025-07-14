(function () {
  if (document.getElementById("leviModal")) return;

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
      </div>
    </div>

    <div class="levi-section">
      <h4>התאמות מחיר</h4>
      
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
      </div>
    </div>

    <div class="levi-buttons">
      <button class="levi-btn close" onclick="toggleLeviReport()">סגור</button>
      <button class="levi-btn refresh" onclick="refreshLeviData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Global functions
  window.toggleLeviReport = function () {
    const modal = document.getElementById("leviModal");
    if (modal.style.display === "none" || !modal.style.display) {
      loadLeviData();
      modal.style.display = "block";
      makeDraggable(modal);
    } else {
      modal.style.display = "none";
    }
  };

  // Expose refresh function to global scope for automatic updates from builder
  window.refreshLeviData = function () {
    console.log('🔄 Levi floating screen: refreshLeviData called');
    loadLeviData();
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
      let leviData = {};
      
      // Priority 1: Try to get data from sessionStorage helper
      try {
        const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
        if (helper.expertise && helper.expertise.levi_report) {
          leviData = helper.expertise.levi_report;
          console.log('Levi data loaded from sessionStorage helper.expertise.levi_report');
        }
        // Priority 2: Legacy helper.levi structure
        else if (helper.levi) {
          leviData = helper.levi;
          console.log('Levi data loaded from sessionStorage helper.levi');
        }
      } catch (parseError) {
        console.warn('Could not parse helper from sessionStorage:', parseError);
      }
      
      // Priority 3: Try to get data from global helper variable
      if (Object.keys(leviData).length === 0 && typeof helper !== 'undefined' && helper.expertise && helper.expertise.levi_report) {
        leviData = helper.expertise.levi_report;
        console.log('Levi data loaded from global helper.expertise.levi_report');
      }
      // Priority 4: Legacy global helper.levi structure
      else if (Object.keys(leviData).length === 0 && typeof helper !== 'undefined' && helper.levi) {
        leviData = helper.levi;
        console.log('Levi data loaded from global helper.levi');
      }
      
      // Priority 5: Fallback to sessionStorage leviData
      if (Object.keys(leviData).length === 0) {
        const storedData = sessionStorage.getItem("leviData");
        if (storedData && storedData !== "undefined" && storedData !== "null") {
          try {
            const parsedData = JSON.parse(storedData);
            if (parsedData && typeof parsedData === 'object') {
              leviData = parsedData;
              console.log('Levi data loaded from sessionStorage leviData');
            }
          } catch (parseError) {
            console.error('Failed to parse stored Levi data:', parseError);
          }
        }
      }

      // Validate and set defaults
      const defaultData = {
        base_price: 0,
        final_price: 0,
        model_code: "",
        full_model: "",
        category: "",
        adjustments: {
          registration: { percent: "", value: "", total: "" },
          km: { percent: "", value: "", total: "" },
          ownership: { type: "", percent: "", value: "", total: "" },
          owner_count: { percent: "", value: "", total: "" },
          features: { percent: "", value: "", total: "" }
        }
      };

      // Deep merge with defaults to ensure all properties exist
      leviData = deepMerge(defaultData, leviData);

      // Update UI with validated data
      updateLeviDisplay(leviData);

    } catch (error) {
      console.error("Error loading Levi data:", error);
      // Show user-friendly error and load defaults
      updateLeviDisplay({});
      updateStatus('שגיאה בטעינת נתוני לוי יצחק');
    }
  }

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  function updateLeviDisplay(data) {
    const formatPrice = (value) => {
      const num = parseFloat(value) || 0;
      return num > 0 ? `₪${num.toLocaleString()}` : "₪0";
    };

    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    const formatPercent = (value) => {
      return value && value.toString().trim() ? `${value}%` : "0%";
    };

    // Basic vehicle information
    document.getElementById("levi-vehicle-type").textContent = formatValue(data['סוג רכב'] || data.vehicle_type);
    document.getElementById("levi-manufacturer").textContent = formatValue(data['יצרן'] || data.manufacturer);
    document.getElementById("levi-model-code").textContent = formatValue(data['קוד דגם'] || data.model_code);
    document.getElementById("levi-category").textContent = formatValue(data['קטגוריה'] || data.category);
    document.getElementById("levi-year").textContent = formatValue(data['שנת יצור'] || data.year);
    document.getElementById("levi-full-model").textContent = formatValue(data['שם דגם מלא'] || data.full_model);
    document.getElementById("levi-base-price").textContent = formatPrice(data['מחיר בסיס'] || data.base_price);
    document.getElementById("levi-final-price").textContent = formatPrice(data['מחיר סופי לרכב'] || data.final_price);

    // Registration adjustments
    document.getElementById("levi-registration").textContent = formatValue(data['עליה לכביש'] || data.registration);
    document.getElementById("levi-registration-percent").textContent = formatPercent(data['עליה לכביש %'] || data.registration_percent);
    document.getElementById("levi-registration-value").textContent = formatPrice(data['ערך ש״ח עליה לכביש'] || data.registration_value);
    document.getElementById("levi-registration-total").textContent = formatPrice(data['שווי מצטבר עליה לכביש'] || data.registration_total);

    // Ownership adjustments
    document.getElementById("levi-ownership").textContent = formatValue(data['בעלות'] || data.ownership);
    document.getElementById("levi-ownership-percent").textContent = formatPercent(data['בעלות %'] || data.ownership_percent);
    document.getElementById("levi-ownership-value").textContent = formatPrice(data['ערך ש״ח בעלות'] || data.ownership_value);
    document.getElementById("levi-ownership-total").textContent = formatPrice(data['שווי מצטבר בעלות'] || data.ownership_total);

    // KM adjustments
    document.getElementById("levi-km").textContent = formatValue(data['מס ק״מ'] || data.km);
    document.getElementById("levi-km-percent").textContent = formatPercent(data['מס ק״מ %'] || data.km_percent);
    document.getElementById("levi-km-value").textContent = formatPrice(data['ערך ש״ח מס ק״מ'] || data.km_value);
    document.getElementById("levi-km-total").textContent = formatPrice(data['שווי מצטבר מס ק״מ'] || data.km_total);

    // Owners adjustments
    document.getElementById("levi-owners").textContent = formatValue(data['מספר בעלים'] || data.owners);
    document.getElementById("levi-owners-percent").textContent = formatPercent(data['מספר בעלים %'] || data.owners_percent);
    document.getElementById("levi-owners-value").textContent = formatPrice(data['ערך ש״ח מספר בעלים'] || data.owners_value);
    document.getElementById("levi-owners-total").textContent = formatPrice(data['שווי מצטבר מספר בעלים'] || data.owners_total);

    // Features adjustments
    document.getElementById("levi-features").textContent = formatValue(data['מאפיינים'] || data.features);
    document.getElementById("levi-features-percent").textContent = formatPercent(data['מאפיינים %'] || data.features_percent);
    document.getElementById("levi-features-value").textContent = formatPrice(data['ערך ש״ח מאפיינים'] || data.features_value);
    document.getElementById("levi-features-total").textContent = formatPrice(data['שווי מצטבר מאפיינים'] || data.features_total);

    // Update value styling
    document.querySelectorAll('.value').forEach(el => {
      if (el.textContent === "-" || el.textContent === "₪0" || el.textContent === "0%") {
        el.classList.add('empty');
      } else {
        el.classList.remove('empty');
      }
    });
  }

  // Floating button removed - now controlled by top toggle squares

})();