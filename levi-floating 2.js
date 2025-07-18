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
    
    // Debug: Check what data is in sessionStorage - SIMPLIFIED
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    console.log('🔍 DEBUG: Helper structures in Levi floating screen:', {
      'vehicle': helper.vehicle,
      'carDetails': helper.car_details,
      'leviReport': helper.expertise?.levi_report,
      'meta': helper.meta
    });
    
    // Debug: Check specific Hebrew adjustment keys
    console.log('🔍 DEBUG: Hebrew adjustment keys in leviReport:', {
      'עליה לכביש': helper.expertise?.levi_report?.['עליה לכביש'],
      'בעלות': helper.expertise?.levi_report?.['בעלות'],
      'מס ק״מ': helper.expertise?.levi_report?.['מס ק״מ'],
      'מספר בעלים': helper.expertise?.levi_report?.['מספר בעלים'],
      'מאפיינים': helper.expertise?.levi_report?.['מאפיינים']
    });
    
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
      let helper = {};
      
      // SIMPLIFIED: Match car details pattern - load from sessionStorage helper
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

      // Get Levi data using system structure - SIMPLIFIED
      const vehicle = helper.vehicle || {};
      const carDetails = helper.car_details || {};
      const leviReport = helper.expertise?.levi_report || {};
      const meta = helper.meta || {};
      
      // Update UI with Levi data using proper helper structure
      updateLeviDisplay(vehicle, carDetails, leviReport, meta);

    } catch (error) {
      console.error("Error loading Levi data:", error);
      updateLeviDisplay({}, {}, {}, {});
    }
  }

  // Removed deepMerge function - no longer needed with simplified data loading

  function updateLeviDisplay(vehicle, carDetails, leviReport, meta) {
    console.log('🔄 updateLeviDisplay called with:', {
      vehicle, carDetails, leviReport, meta
    });
    
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

    // Basic vehicle information - FIXED: Use proper helper structure
    document.getElementById("levi-vehicle-type").textContent = formatValue(vehicle.vehicle_type || 'רכב פרטי');
    document.getElementById("levi-manufacturer").textContent = formatValue(vehicle.manufacturer || carDetails.manufacturer);
    document.getElementById("levi-model-code").textContent = formatValue(vehicle.model_code || carDetails.model_code);
    document.getElementById("levi-category").textContent = formatValue(leviReport.category || 'רכב פרטי');
    document.getElementById("levi-year").textContent = formatValue(vehicle.year || carDetails.year);
    document.getElementById("levi-full-model").textContent = formatValue(leviReport.full_model || `${vehicle.manufacturer} ${vehicle.model}`);
    document.getElementById("levi-base-price").textContent = formatPrice(leviReport.base_price || leviReport['מחיר בסיס']);
    document.getElementById("levi-final-price").textContent = formatPrice(leviReport.final_price || leviReport['מחיר סופי לרכב']);

    // FIXED: Registration adjustments - correct mapping
    document.getElementById("levi-registration").textContent = formatValue(leviReport['עליה לכביש'] || "-");
    document.getElementById("levi-registration-percent").textContent = formatPercent(leviReport['עליה לכביש %'] || 0);
    document.getElementById("levi-registration-value").textContent = formatPrice(leviReport['ערך ש״ח עליה לכביש'] || 0);
    document.getElementById("levi-registration-total").textContent = formatPrice(leviReport['שווי מצטבר עליה לכביש'] || 0);

    // FIXED: Ownership adjustments - correct mapping
    document.getElementById("levi-ownership").textContent = formatValue(leviReport['בעלות'] || "-");
    document.getElementById("levi-ownership-percent").textContent = formatPercent(leviReport['בעלות %'] || 0);
    document.getElementById("levi-ownership-value").textContent = formatPrice(leviReport['ערך ש״ח בעלות'] || 0);
    document.getElementById("levi-ownership-total").textContent = formatPrice(leviReport['שווי מצטבר בעלות'] || 0);

    // FIXED: KM adjustments - correct mapping
    document.getElementById("levi-km").textContent = formatValue(leviReport['מס ק״מ'] || "-");
    document.getElementById("levi-km-percent").textContent = formatPercent(leviReport['מס ק״מ %'] || 0);
    document.getElementById("levi-km-value").textContent = formatPrice(leviReport['ערך ש״ח מס ק״מ'] || 0);
    document.getElementById("levi-km-total").textContent = formatPrice(leviReport['שווי מצטבר מס ק״מ'] || 0);

    // FIXED: Owners adjustments - correct mapping
    document.getElementById("levi-owners").textContent = formatValue(leviReport['מספר בעלים'] || "-");
    document.getElementById("levi-owners-percent").textContent = formatPercent(leviReport['מספר בעלים %'] || 0);
    document.getElementById("levi-owners-value").textContent = formatPrice(leviReport['ערך ש״ח מספר בעלים'] || 0);
    document.getElementById("levi-owners-total").textContent = formatPrice(leviReport['שווי מצטבר מספר בעלים'] || 0);

    // FIXED: Features adjustments - correct mapping
    document.getElementById("levi-features").textContent = formatValue(leviReport['מאפיינים'] || "-");
    document.getElementById("levi-features-percent").textContent = formatPercent(leviReport['מאפיינים %'] || 0);
    document.getElementById("levi-features-value").textContent = formatPrice(leviReport['ערך ש״ח מאפיינים'] || 0);
    document.getElementById("levi-features-total").textContent = formatPrice(leviReport['שווי מצטבר מאפיינים'] || 0);

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