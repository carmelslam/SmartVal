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
      transition: all 0.3s ease;
    }
    .levi-btn.refresh:hover:not(:disabled) {
      background: #218838;
      transform: scale(1.05);
    }
    .levi-btn.refresh:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
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
        <div class="levi-field">
          <div class="label">תאריך הוצאת דוח לוי</div>
          <div class="value" id="levi-report-date">-</div>
        </div>
      </div>
    </div>

    <div class="levi-section">
      <h4>התאמות מחיר</h4>
      
      <!-- REORDERED: 1. מאפיינים (Features) -->
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
        <div class="levi-field" style="margin-top: 10px; grid-column: 1 / -1;">
          <div class="label">תיאור מאפיינים:</div>
          <div class="value" id="levi-features-description" style="font-size: 12px; text-align: right;">-</div>
        </div>
      </div>

      <!-- REORDERED: 2. עליה לכביש (Registration) -->
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

      <!-- REORDERED: 3. סוג בעלות (Ownership Type) -->
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

      <!-- REORDERED: 4. מספר ק״מ (Mileage) -->
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

      <!-- REORDERED: 5. מספר בעלים (Number of Owners) -->
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
    </div>

    <div class="levi-buttons">
      <button class="levi-btn close" onclick="toggleLeviReport()">סגור</button>
      <button class="levi-btn refresh" onclick="console.log('🔄 Onclick triggered'); refreshLeviData();">רענן נתונים</button>
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
      
      // CRITICAL FIX: Add event listener for refresh button after modal is shown
      setTimeout(() => {
        const refreshBtn = modal.querySelector('.levi-btn.refresh');
        if (refreshBtn) {
          // Remove any existing listeners to prevent duplicates
          refreshBtn.replaceWith(refreshBtn.cloneNode(true));
          const newRefreshBtn = modal.querySelector('.levi-btn.refresh');
          
          // Add fresh event listener
          newRefreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Refresh button clicked via event listener');
            window.refreshLeviData();
          });
          console.log('✅ Added event listener to refresh button');
        }
      }, 100);
    } else {
      modal.style.display = "none";
    }
  };

  // Expose refresh function to global scope for automatic updates from builder
  window.refreshLeviData = function () {
    console.log('🔄 Levi floating screen: refreshLeviData called');
    
    // Get refresh button for feedback
    const refreshBtn = document.querySelector('.levi-btn.refresh');
    if (refreshBtn) {
      refreshBtn.textContent = 'מרענן...';
      refreshBtn.disabled = true;
    }
    
    try {
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      loadLeviData();
      
      // Show success feedback
      if (refreshBtn) {
        refreshBtn.textContent = '✅ עודכן!';
        refreshBtn.disabled = false;
        
        // Reset button text after 2 seconds
        setTimeout(() => {
          refreshBtn.textContent = 'רענן נתונים';
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Error refreshing Levi data:', error);
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

      // FIXED: Create a result object similar to summary page approach
      // The summary page gets Hebrew fields directly from the result object
      // We need to extract the Hebrew webhook data and create a similar result object
      let result = {};
      
      // Try to get the Hebrew webhook data from raw_webhook_data
      if (helper.raw_webhook_data) {
        const webhookKeys = Object.keys(helper.raw_webhook_data);
        const latestWebhookKey = webhookKeys[webhookKeys.length - 1];
        if (latestWebhookKey && helper.raw_webhook_data[latestWebhookKey]?.data) {
          result = { ...helper.raw_webhook_data[latestWebhookKey].data };
        }
      }
      
      // Also merge other helper data as fallback
      result = {
        ...helper.vehicle,
        ...helper.car_details, 
        ...helper.expertise?.levi_report,
        ...helper.meta,
        ...helper.valuation,
        ...helper, // Include top-level helper fields
        ...result  // Hebrew webhook data takes priority
      };

      
      // Update UI using the result object (same approach as summary page)
      updateLeviDisplay(result);

    } catch (error) {
      console.error("Error loading Levi data:", error);
      updateLeviDisplay({});
    }
  }

  // Removed deepMerge function - no longer needed with simplified data loading

  function updateLeviDisplay(result) {
    console.log('🔄 updateLeviDisplay called with result:', result);
    
    // DEBUG: Log all percentage fields found in the data
    const percentageFields = Object.keys(result).filter(key => key.includes('%'));
    if (percentageFields.length > 0) {
      console.log('📊 DEBUG: Found percentage fields in webhook data:', percentageFields);
      percentageFields.forEach(field => {
        console.log(`   ${field}: ${result[field]}`);
      });
    } else {
      console.log('⚠️ DEBUG: No percentage fields found in webhook data');
    }
    
    // Use same currency parsing approach as summary page
    const parseCurrency = (value) => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      // Remove currency symbols, spaces, commas and parse
      const cleanValue = value.toString().replace(/[₪,\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };

    const formatPrice = (value) => {
      const num = parseCurrency(value);
      return num > 0 ? `₪${num.toLocaleString()}` : "₪0";
    };

    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    const formatPercent = (value) => {
      if (!value || value.toString().trim() === '') return "0%";
      const strValue = value.toString().trim();
      // If already has %, don't add another one
      if (strValue.endsWith('%')) return strValue;
      return `${strValue}%`;
    };

    
    // Use helper data structure like summary page - get percentage values from manual inputs or helper
    const helper = JSON.parse(sessionStorage.getItem('helper')) || {};
    
    
    document.getElementById("levi-vehicle-type").textContent = formatValue(
      result['סוג רכב'] ||
      result.vehicle_type || 
      '-'
    );
    document.getElementById("levi-manufacturer").textContent = formatValue(
      result['יצרן'] ||
      result.manufacturer || 
      '-'
    );
    document.getElementById("levi-model-code").textContent = formatValue(
      result['קוד דגם'] ||
      result.levi_code ||
      '-'
    );
    document.getElementById("levi-category").textContent = formatValue(
      result['קטגוריה'] ||
      result.category || 
      '-'
    );
    document.getElementById("levi-year").textContent = formatValue(
      result['שנת יצור'] ||
      result.year || 
      '-'
    );
    document.getElementById("levi-full-model").textContent = formatValue(
      result['שם דגם מלא'] ||
      result.full_model_name || 
      result.model ||
      result['דגם'] ||
      `${result.manufacturer || ''} ${result.model || ''}`.trim() || 
      '-'
    );
    // FIXED: Use same approach as summary page - direct Hebrew field access
    const basePrice = parseCurrency(result['מחיר בסיס']) || parseCurrency(result.base_price) || 0;
    const finalPrice = parseCurrency(result['מחיר סופי לרכב']) || parseCurrency(result.final_price) || 0;
                      
    
    document.getElementById("levi-base-price").textContent = formatPrice(basePrice);
    document.getElementById("levi-final-price").textContent = formatPrice(finalPrice);
    
    // Levi report date - separate from inspection and damage dates  
    document.getElementById("levi-report-date").textContent = formatValue(
      result['תאריך'] ||
      result.levi_report_date ||
      result.report_date ||
      '-'
    );

    // FIXED: Registration adjustments - use same approach as summary
    document.getElementById("levi-registration").textContent = formatValue(
      result['ערך עליה לכביש'] || result['עליה לכביש'] || "-"
    );
    
    // FIXED: Registration percentage with all possible variations
    document.getElementById("levi-registration-percent").textContent = formatPercent(
      result['עליה לכביש %'] || 
      result['עליה לכביש%'] || 
      result['registration_percent'] || 
      0
    );
    document.getElementById("levi-registration-value").textContent = formatPrice(
      result['ערך ש"ח עליה לכביש'] || 0
    );
    document.getElementById("levi-registration-total").textContent = formatPrice(
      result['שווי מצטבר עליה לכביש'] || 0
    );

    // FIXED: Ownership adjustments - use same approach as summary
    document.getElementById("levi-ownership").textContent = formatValue(
      result['ערך בעלות'] || result['בעלות'] || "-"
    );
    
    // FIXED: Ownership percentage with all possible variations
    document.getElementById("levi-ownership-percent").textContent = formatPercent(
      result['בעלות %'] || 
      result['בעלות%'] || 
      result['ownership_type_percent'] || 
      0
    );
    // FIXED MAPPING: ערך ש״ח בעלות from webhook data
    document.getElementById("levi-ownership-value").textContent = formatPrice(
      result['ערך ש"ח בעלות'] || result['ערך ש״ח בעלות'] || 0
    );
    document.getElementById("levi-ownership-total").textContent = formatPrice(
      result['שווי מצטבר בעלות'] || 0
    );

    // FIXED: KM adjustments - use same approach as summary
    document.getElementById("levi-km").textContent = formatValue(
      result['ערך מס ק"מ'] || result['מס ק"מ'] || "-"
    );
    // FIXED: KM percentage with all possible quotation mark variations  
    document.getElementById("levi-km-percent").textContent = formatPercent(
      result['מס ק״מ %'] || 
      result['מס ק"מ %'] || 
      result['מס׳ ק"מ %'] || 
      result['מס\' ק״מ %'] || 
      result['מס ק״מ%'] || 
      result['mileage_percent'] || 
      0
    );
    // FIXED MAPPING: ערך ש״ח מס ק״מ from webhook data
    document.getElementById("levi-km-value").textContent = formatPrice(
      result['ערך ש"ח מס ק"מ'] || result['ערך ש״ח מס ק״מ'] || 0
    );
    document.getElementById("levi-km-total").textContent = formatPrice(
      result['שווי מצטבר מס ק"מ'] || 0
    );

    // FIXED: Owners adjustments - use same approach as summary
    document.getElementById("levi-owners").textContent = formatValue(
      result['ערך מספר בעלים'] || result['מספר בעלים'] || "-"
    );
    // FIXED: Owners percentage with all possible variations
    document.getElementById("levi-owners-percent").textContent = formatPercent(
      result['מספר בעלים %'] || 
      result['מספר בעלים%'] || 
      result['ownership_history_percent'] || 
      0
    );
    // FIXED MAPPING: ערך ש״ח מספר בעלים from webhook data
    document.getElementById("levi-owners-value").textContent = formatPrice(
      result['ערך ש״ח מספר בעלים'] || result['ערך ש"ח מספר בעלים'] || 0
    );
    document.getElementById("levi-owners-total").textContent = formatPrice(
      result['שווי מצטבר מספר בעלים'] || 0
    );

    // FIXED: Features adjustments - use same approach as summary
    document.getElementById("levi-features").textContent = formatValue(
      result['ערך מאפיינים'] || result['מאפיינים'] || "-"
    );
    
    // FIXED: Features percentage with all possible variations
    document.getElementById("levi-features-percent").textContent = formatPercent(
      result['מחיר מאפיינים %'] || 
      result['מאפיינים %'] || 
      result['מחיר מאפיינים%'] || 
      result['מאפיינים%'] || 
      result['features_percent'] || 
      0
    );
    document.getElementById("levi-features-value").textContent = formatPrice(
      result['ערך ש"ח מאפיינים'] || 0
    );
    document.getElementById("levi-features-total").textContent = formatPrice(
      result['שווי מצטבר מאפיינים'] || 0
    );

    // COMPLETED MAPPING: Features description - properly maps "תיאור מאפיינים" to "מאפיינים" field
    document.getElementById("levi-features-description").textContent = formatValue(
      result['מאפיינים'] || // Primary webhook field containing features description
      result['תיאור מאפיינים'] || // Alternative mapping
      result['ערך מאפיינים'] || // Fallback field name
      '-'
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

  // DISABLED TO PREVENT LOOPS
  // Listen for helper updates and refresh display
  // document.addEventListener('helperUpdate', function(event) {
  //   console.log('📡 Levi floating detected helper update:', event.detail);
  //   // Only refresh if the modal is visible
  //   const modal = document.getElementById("leviModal");
  //   if (modal && modal.style.display !== "none") {
  //     console.log('🔄 Auto-refreshing Levi data due to helper update');
  //     loadLeviData();
  //   }
  // });

  // DISABLED TO PREVENT LOOPS
  // Also listen for storage events from other tabs
  // window.addEventListener('storage', function(e) {
  //   if (e.key === 'helper' && e.newValue) {
  //     console.log('📡 Levi floating detected helper update from another tab');
  //     
  //     // Only refresh if the modal is visible
  //     const modal = document.getElementById("leviModal");
  //     if (modal && modal.style.display !== "none") {
  //       console.log('🔄 Auto-refreshing Levi data due to cross-tab update');
  //       setTimeout(() => {
  //         loadLeviData();
  //       }, 100);
  //     }
  //   }
  // });

  // Floating button removed - now controlled by top toggle squares

})();