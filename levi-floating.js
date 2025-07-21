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

    // Basic vehicle information - FIXED: Use processed helper data from Hebrew regex patterns
    console.log('🔍 LEVI DEBUG: Available data sources:', {
      vehicle: Object.keys(vehicle),
      carDetails: Object.keys(carDetails), 
      leviReport: Object.keys(leviReport),
      meta: Object.keys(meta)
    });
    
    // Comprehensive data sources from helper system after Hebrew text processing
    const allData = { ...meta, ...vehicle, ...carDetails, ...leviReport };
    console.log('🔍 LEVI DEBUG: Merged helper data:', allData);
    
    document.getElementById("levi-vehicle-type").textContent = formatValue(
      allData.model_type || 
      allData.vehicle_type || 
      allData['סוג הרכב'] || 
      '-'
    );
    document.getElementById("levi-manufacturer").textContent = formatValue(
      allData.manufacturer || 
      allData['שם היצרן'] || 
      allData.יצרן || 
      '-'
    );
    document.getElementById("levi-model-code").textContent = formatValue(
      allData.model_code || 
      allData['קוד דגם'] || 
      '-'
    );
    document.getElementById("levi-category").textContent = formatValue(
      allData.category || 
      allData['קטגוריה'] || 
      '-'
    );
    document.getElementById("levi-year").textContent = formatValue(
      allData.year || 
      allData['שנת ייצור'] || 
      allData['שנת יצור'] || 
      '-'
    );
    document.getElementById("levi-full-model").textContent = formatValue(
      allData.full_model_name || 
      allData.model ||
      allData['דגם'] ||
      `${allData.manufacturer || ''} ${allData.model || ''}`.trim() || 
      '-'
    );
    document.getElementById("levi-base-price").textContent = formatPrice(
      allData.base_price || 
      allData['מחיר בסיס'] || 
      0
    );
    document.getElementById("levi-final-price").textContent = formatPrice(
      allData.final_price || 
      allData['מחיר סופי לרכב'] || 
      allData.market_value ||
      0
    );

    // FIXED: Registration adjustments - use allData comprehensive sources
    document.getElementById("levi-registration").textContent = formatValue(
      allData.registration_date || 
      allData['עליה לכביש'] || 
      allData['תאריך רישום'] ||
      "-"
    );
    document.getElementById("levi-registration-percent").textContent = formatPercent(
      allData.registration_percent || 
      allData['עליה לכביש %'] || 
      0
    );
    document.getElementById("levi-registration-value").textContent = formatPrice(
      allData.registration_amount || 
      allData['ערך כספי עליה לכביש'] || 
      0
    );
    document.getElementById("levi-registration-total").textContent = formatPrice(
      allData.registration_cumulative || 
      allData['שווי מצטבר עליה לכביש'] || 
      0
    );

    // FIXED: Ownership adjustments - use comprehensive allData sources
    document.getElementById("levi-ownership").textContent = formatValue(
      allData.ownership_type || 
      allData['סוג בעלות'] || 
      allData.ownership_value ||
      "-"
    );
    document.getElementById("levi-ownership-percent").textContent = formatPercent(
      allData.ownership_percent || 
      allData['בעלות %'] || 
      0
    );
    document.getElementById("levi-ownership-value").textContent = formatPrice(
      allData.ownership_amount || 
      allData['ערך כספי בעלות'] || 
      0
    );
    document.getElementById("levi-ownership-total").textContent = formatPrice(
      allData.ownership_cumulative || 
      allData['שווי מצטבר בעלות'] || 
      0
    );

    // FIXED: KM adjustments - use comprehensive allData sources
    document.getElementById("levi-km").textContent = formatValue(
      allData.km || 
      allData.mileage ||
      allData['מס\' ק"מ'] || 
      allData['קילומטראז'] ||
      "-"
    );
    document.getElementById("levi-km-percent").textContent = formatPercent(
      allData.mileage_percent || 
      allData['מס\' ק"מ %'] || 
      0
    );
    document.getElementById("levi-km-value").textContent = formatPrice(
      allData.mileage_amount || 
      allData['ערך כספי מס\' ק"מ'] || 
      0
    );
    document.getElementById("levi-km-total").textContent = formatPrice(
      allData.mileage_cumulative || 
      allData['שווי מצטבר מס\' ק"מ'] || 
      0
    );

    // FIXED: Owners adjustments - use comprehensive allData sources  
    document.getElementById("levi-owners").textContent = formatValue(
      allData.owner_count || 
      allData['מספר בעלים'] || 
      "-"
    );
    document.getElementById("levi-owners-percent").textContent = formatPercent(
      allData.owners_percent || 
      allData['מס\' בעלים %'] || 
      0
    );
    document.getElementById("levi-owners-value").textContent = formatPrice(
      allData.owners_amount || 
      allData['ערך כספי מס\' בעלים'] || 
      0
    );
    document.getElementById("levi-owners-total").textContent = formatPrice(
      allData.owners_cumulative || 
      allData['שווי מצטבר מס\' בעלים'] || 
      0
    );

    // FIXED: Features adjustments - use comprehensive allData sources
    document.getElementById("levi-features").textContent = formatValue(
      allData.features || 
      allData['מאפיינים'] || 
      allData['אבזור'] ||
      "-"
    );
    document.getElementById("levi-features-percent").textContent = formatPercent(
      allData.features_percent || 
      allData['מאפיינים %'] || 
      0
    );
    document.getElementById("levi-features-value").textContent = formatPrice(
      allData.features_amount || 
      allData['ערך כספי מאפיינים'] || 
      0
    );
    document.getElementById("levi-features-total").textContent = formatPrice(
      allData.features_cumulative || 
      allData['שווי מצטבר מאפיינים'] || 
      0
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

  // Floating button removed - now controlled by top toggle squares

})();