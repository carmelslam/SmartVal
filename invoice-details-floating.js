(function () {
  if (document.getElementById("invoiceDetailsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #invoiceDetailsModal {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 95%;
      max-width: 650px;
      max-height: 90vh;
      background: white;
      border: 1px solid #fbbf24;
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
      #invoiceDetailsModal {
        top: 10px;
        width: 95%;
        max-width: 95%;
        padding: 15px;
        margin: 10px;
        left: 50%;
        transform: translateX(-50%);
      }
    }
    
    .invoice-modal-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #f59e0b;
      text-align: center;
      border-bottom: 2px solid #fbbf24;
      padding-bottom: 10px;
    }
    
    .invoice-section {
      background: #fefef2;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      border: 1px solid #fef3c7;
    }
    
    .invoice-section h4 {
      margin: 0 0 10px 0;
      color: #92400e;
      font-size: 16px;
      font-weight: bold;
    }
    
    .invoice-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #fef3c7;
    }
    
    .invoice-field:last-child {
      border-bottom: none;
    }
    
    .invoice-field .label {
      font-weight: bold;
      color: #78350f;
      font-size: 14px;
    }
    
    .invoice-field .value {
      color: #451a03;
      font-size: 15px;
      font-weight: 600;
    }
    
    .invoice-field .value.editable {
      background: white;
      border: 1px solid #f59e0b;
      cursor: text;
      padding: 8px;
      border-radius: 4px;
    }
    
    .invoice-field input.edit-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      font-size: 14px;
      direction: rtl;
      box-sizing: border-box;
      font-weight: 600;
    }
    
    .value.price {
      color: #059669;
      font-weight: bold;
    }
    
    .value.empty {
      color: #6b7280;
      font-style: italic;
    }
    
    .no-data-message {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 16px;
      background: #f9fafb;
      border-radius: 12px;
      border: 2px dashed #d1d5db;
    }
    
    .no-data-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .invoice-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 13px;
    }
    
    .invoice-items-table th,
    .invoice-items-table td {
      padding: 8px;
      text-align: right;
      border: 1px solid #fef3c7;
    }
    
    .invoice-items-table th {
      background: #fbbf24;
      color: white;
      font-weight: bold;
    }
    
    .invoice-items-table td {
      background: #fffbeb;
    }
    
    .invoice-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .invoice-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
    }
    
    .invoice-btn.close {
      background: #dc3545;
      color: white;
    }
    
    .invoice-btn.refresh {
      background: #fbbf24;
      color: #78350f;
    }
    
    .invoice-total-section {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #78350f;
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
      text-align: center;
    }
    
    .invoice-total-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 16px;
    }
    
    .invoice-total-final {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid rgba(120, 53, 15, 0.3);
      padding-top: 10px;
      margin-top: 15px;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "invoiceDetailsModal";
  modal.innerHTML = `
    <div class="invoice-modal-title">פרטי חשבוניות</div>
    <div class="edit-mode-controls" style="text-align: center; margin-bottom: 15px;">
      <button id="toggle-invoice-edit-mode" class="edit-toggle-btn" style="background: #f59e0b; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
        ✏️ עריכת חשבוניות
      </button>
      <button id="save-invoice-changes" class="save-btn" style="background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; display: none;">
        💾 שמור
      </button>
      <button id="cancel-invoice-edit" class="cancel-btn" style="background: #6b7280; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; display: none;">
        ❌ ביטול
      </button>
    </div>
    <div id="invoiceContent">
      <!-- Content will be loaded dynamically -->
    </div>
    <div class="invoice-buttons">
      <button class="invoice-btn close" onclick="toggleInvoiceDetails()">סגור</button>
      <button class="invoice-btn refresh" onclick="refreshInvoiceData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 🔧 Add invoice editing functionality
  let isInvoiceEditMode = false;
  let invoiceOriginalValues = {};

  // Toggle edit mode
  document.getElementById('toggle-invoice-edit-mode').addEventListener('click', function() {
    isInvoiceEditMode = !isInvoiceEditMode;
    
    if (isInvoiceEditMode) {
      enableInvoiceEditMode();
    } else {
      disableInvoiceEditMode();
    }
  });

  // Save changes
  document.getElementById('save-invoice-changes').addEventListener('click', async function() {
    await saveInvoiceChangesToHelper();
    disableInvoiceEditMode();
  });

  // Cancel edit
  document.getElementById('cancel-invoice-edit').addEventListener('click', function() {
    restoreInvoiceOriginalValues();
    disableInvoiceEditMode();
  });

  function enableInvoiceEditMode() {
    // Store original values
    invoiceOriginalValues = {};
    
    // Find all editable invoice fields (amount, price, quantity fields)
    const editableSelectors = [
      '[id*="amount"]', '[id*="price"]', '[id*="total"]', 
      '[id*="quantity"]', '[id*="cost"]', '[id*="sum"]',
      '.value.price', '.invoice-field .value'
    ];

    const editableElements = [];
    editableSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Only include elements that contain numeric/price content
        if (el.textContent && (el.textContent.includes('₪') || /^\d+/.test(el.textContent.trim()))) {
          editableElements.push(el);
        }
      });
    });

    // Remove duplicates and convert to editable fields
    const uniqueElements = [...new Set(editableElements)];
    uniqueElements.forEach(element => {
      if (element.id) {
        invoiceOriginalValues[element.id] = element.textContent;
        convertToEditableInvoiceField(element, element.id);
      }
    });

    // Update button visibility
    document.getElementById('toggle-invoice-edit-mode').textContent = '❌ ביטול עריכה';
    document.getElementById('toggle-invoice-edit-mode').style.background = '#dc2626';
    document.getElementById('save-invoice-changes').style.display = 'inline-block';
    document.getElementById('cancel-invoice-edit').style.display = 'inline-block';
  }

  function disableInvoiceEditMode() {
    isInvoiceEditMode = false;
    
    // Convert input fields back to display divs
    Object.keys(invoiceOriginalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && element.tagName === 'INPUT') {
        convertToInvoiceDisplayField(element, element.value);
      }
    });

    // Update button visibility
    document.getElementById('toggle-invoice-edit-mode').textContent = '✏️ עריכת חשבוניות';
    document.getElementById('toggle-invoice-edit-mode').style.background = '#f59e0b';
    document.getElementById('save-invoice-changes').style.display = 'none';
    document.getElementById('cancel-invoice-edit').style.display = 'none';
  }

  function convertToEditableInvoiceField(element, fieldId) {
    const currentValue = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    // Clean currency symbols for editing
    let cleanValue = currentValue === '-' ? '' : currentValue;
    cleanValue = cleanValue.replace(/[₪,]/g, '').trim();
    input.value = cleanValue;
    input.id = fieldId;
    input.className = 'edit-input';
    
    element.parentNode.replaceChild(input, element);
  }

  function convertToInvoiceDisplayField(inputElement, value) {
    const div = document.createElement('div');
    div.className = inputElement.classList.contains('price') ? 'value price' : 'value';
    div.id = inputElement.id;
    
    // Re-apply formatting based on field type
    let formattedValue = value || '-';
    if (inputElement.className.includes('price') || inputElement.id.includes('price') || inputElement.id.includes('total') || inputElement.id.includes('amount')) {
      const numValue = parseFloat(value) || 0;
      formattedValue = numValue > 0 ? `₪${numValue.toLocaleString()}` : '₪0';
    }
    
    div.textContent = formattedValue;
    inputElement.parentNode.replaceChild(div, inputElement);
  }

  function restoreInvoiceOriginalValues() {
    Object.keys(invoiceOriginalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        if (element.tagName === 'INPUT') {
          // Clean the original value for input fields
          let cleanValue = invoiceOriginalValues[fieldId].replace(/[₪,]/g, '').trim();
          element.value = cleanValue === '-' ? '' : cleanValue;
        } else {
          element.textContent = invoiceOriginalValues[fieldId];
        }
      }
    });
  }

  async function saveInvoiceChangesToHelper() {
    if (!window.helper) {
      console.error('❌ Helper not available for saving invoice changes');
      return;
    }

    // Collect all changed values
    const changes = {};
    Object.keys(invoiceOriginalValues).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        const newValue = element.tagName === 'INPUT' ? element.value : element.textContent;
        const originalClean = invoiceOriginalValues[fieldId].replace(/[₪,]/g, '').trim();
        const newClean = newValue.replace(/[₪,]/g, '').trim();
        
        if (newClean !== originalClean && newClean !== '-' && newClean !== '') {
          changes[fieldId] = parseFloat(newClean) || 0;
        }
      }
    });

    // Update helper invoice structure
    if (!window.helper.invoice) window.helper.invoice = { items: [], totals: {} };
    
    // Map changes to helper structure
    Object.keys(changes).forEach(fieldId => {
      const value = changes[fieldId];
      
      // Update based on field ID patterns
      if (fieldId.includes('total') || fieldId.includes('sum')) {
        if (!window.helper.invoice.totals) window.helper.invoice.totals = {};
        window.helper.invoice.totals[fieldId] = value;
      } else if (fieldId.includes('vat') || fieldId.includes('tax')) {
        if (!window.helper.invoice.tax) window.helper.invoice.tax = {};
        window.helper.invoice.tax[fieldId] = value;
      } else {
        // Individual item costs
        if (!window.helper.invoice.manual_adjustments) window.helper.invoice.manual_adjustments = {};
        window.helper.invoice.manual_adjustments[fieldId] = value;
      }
    });

    // 🔧 PHASE 2.1: Save through helper system only (single source)
    try {
      if (typeof updateHelper === 'function') {
        // Use global updateHelper function with proper path and source
        updateHelper('invoice', window.helper.invoice, 'invoice_floating_manual_adjustment');
        console.log('✅ PHASE 2.1: Invoice changes saved through helper system (single source)');
      } else {
        // Fallback: Try importing updateHelper function
        const { updateHelper: importedUpdateHelper } = await import('./helper.js');
        await importedUpdateHelper('invoice', window.helper.invoice, 'invoice_floating_import');
        console.log('✅ PHASE 2.1: Invoice changes saved through imported helper function');
      }
    } catch (error) {
      console.error('❌ PHASE 2.1: Failed to save invoice changes through helper system:', error);
      // Emergency fallback: Direct sessionStorage only (no localStorage)
      try {
        sessionStorage.setItem('helper', JSON.stringify(window.helper));
        console.log('⚠️ PHASE 2.1: Emergency fallback - saved to primary storage only');
      } catch (fallbackError) {
        console.error('❌ PHASE 2.1: Emergency fallback also failed:', fallbackError);
      }
    }
  }

  // Global functions
  window.toggleInvoiceDetails = function () {
    const modal = document.getElementById("invoiceDetailsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      loadInvoiceData();
      modal.style.display = "block";
      makeDraggable(modal);
    } else {
      modal.style.display = "none";
    }
  };

  window.showInvoiceDetails = window.toggleInvoiceDetails;

  // ULTRA-SAFE INVOICE AUTO-REFRESH: Conservative approach
  let invoiceRefreshTimeout = null;
  let lastInvoiceRefreshTime = 0;
  let invoiceRefreshCount = 0;
  let invoiceRefreshDisabled = false;
  const INVOICE_REFRESH_DEBOUNCE_MS = 4000; // 4 second debounce
  const MAX_INVOICE_REFRESHES_PER_MINUTE = 2; // Very conservative
  
  // Reset invoice refresh counter every minute
  setInterval(() => {
    invoiceRefreshCount = 0;
    if (invoiceRefreshDisabled) {
      console.log('🔓 Invoice auto-refresh re-enabled after cooldown');
      invoiceRefreshDisabled = false;
    }
  }, 60000);
  
  function safeRefreshInvoiceData(source = 'manual') {
    // SAFETY CHECK 1: Is refresh disabled?
    if (invoiceRefreshDisabled) {
      console.log(`🚫 Invoice refresh disabled (${source})`);
      return;
    }
    
    const now = Date.now();
    
    // SAFETY CHECK 2: Debouncing
    if (source !== 'manual' && (now - lastInvoiceRefreshTime) < INVOICE_REFRESH_DEBOUNCE_MS) {
      console.log(`🚫 Invoice refresh debounced (${source})`);
      return;
    }
    
    // SAFETY CHECK 3: Rate limiting (except manual)
    if (source !== 'manual') {
      invoiceRefreshCount++;
      if (invoiceRefreshCount > MAX_INVOICE_REFRESHES_PER_MINUTE) {
        console.log(`🚫 Invoice refresh rate limit exceeded (${source})`);
        invoiceRefreshDisabled = true;
        return;
      }
    }
    
    // SAFETY CHECK 4: Modal visibility (except manual)
    const modal = document.getElementById("invoiceDetailsModal");
    if (source !== 'manual' && (!modal || modal.style.display === "none")) {
      console.log(`🚫 Invoice refresh skipped (${source}) - modal not visible`);
      return;
    }
    
    // Clear any pending refresh
    if (invoiceRefreshTimeout) {
      clearTimeout(invoiceRefreshTimeout);
    }
    
    // Schedule safe refresh
    const delay = source === 'manual' ? 0 : 800;
    invoiceRefreshTimeout = setTimeout(() => {
      try {
        console.log(`🔄 Safe invoice refresh (${source})`);
        lastInvoiceRefreshTime = Date.now();
        loadInvoiceData();
      } catch (error) {
        console.error('❌ Error in invoice refresh:', error);
        if (source !== 'manual') {
          invoiceRefreshDisabled = true;
        }
      }
      invoiceRefreshTimeout = null;
    }, delay);
  }
  
  // Expose refresh function to global scope for automatic updates from builder
  window.refreshInvoiceData = function () {
    console.log('🔄 Invoice floating screen: refreshInvoiceData called');
    safeRefreshInvoiceData('manual'); // Manual calls are always allowed
  };
  
  // VERY SELECTIVE AUTO-REFRESH: Only for invoice-specific updates
  document.addEventListener('helperUpdate', function(event) {
    if (event.detail && 
        (event.detail.includes('invoice') || 
         event.detail.includes('document') ||
         event.detail === 'invoice_processed')) {
      console.log('📡 Invoice refresh triggered by relevant update:', event.detail);
      safeRefreshInvoiceData('helperUpdate');
    }
  });
  
  // Cross-tab updates for invoices
  window.addEventListener('storage', function(e) {
    if (e.key === 'helper' && e.newValue) {
      const modal = document.getElementById("invoiceDetailsModal");
      if (modal && modal.style.display !== "none") {
        safeRefreshInvoiceData('storage');
      }
    }
  });

  // Make modal draggable
  function makeDraggable(modal) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    modal.addEventListener('mousedown', function(e) {
      if (e.target === modal || e.target.classList.contains('invoice-modal-title')) {
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
  // window.refreshInvoiceData is now defined above with logging

  async function loadInvoiceData() {
    try {
      console.log('🔄 PHASE 2.1: Loading Invoice data from helper ONLY (single source)...');
      
      // 🔧 PHASE 2.1: SINGLE SOURCE LOADING - window.helper is authoritative
      let helper = {};
      
      if (typeof window.helper === 'object' && window.helper !== null) {
        helper = window.helper;
        console.log('✅ PHASE 2.1: Loaded Invoice data from window.helper (authoritative source)');
      } else {
        // Try to get current helper from helper system
        try {
          const { getCurrentHelper } = await import('./helper.js');
          const currentHelper = getCurrentHelper();
          if (currentHelper && Object.keys(currentHelper).length > 0) {
            helper = currentHelper;
            window.helper = helper; // Sync to window.helper
            console.log('✅ PHASE 2.1: Loaded Invoice data from helper system, synced to window.helper');
          }
        } catch (importError) {
          console.warn('❌ PHASE 2.1: Could not load from helper system:', importError);
        }
      }

      // Get invoice data from helper
      const invoiceData = helper.invoice || {};
      const documentsInvoices = helper.documents?.invoices || [];
      
      // Display invoice data
      displayInvoiceData(invoiceData, documentsInvoices);

    } catch (error) {
      console.error("Error loading invoice data:", error);
      displayNoDataMessage("שגיאה בטעינת נתוני חשבוניות");
    }
  }

  function displayInvoiceData(invoiceData, documentsInvoices) {
    const contentDiv = document.getElementById('invoiceContent');
    
    // Check if we have any invoice data
    const hasMainInvoice = invoiceData && Object.values(invoiceData).some(value => 
      value && value.toString().trim() !== ''
    );
    const hasDocumentInvoices = documentsInvoices && documentsInvoices.length > 0;

    if (!hasMainInvoice && !hasDocumentInvoices) {
      displayNoDataMessage("לא נמצאו נתוני חשבוניות במערכת");
      return;
    }

    let content = '';

    // Display main invoice data if exists
    if (hasMainInvoice) {
      content += generateMainInvoiceSection(invoiceData);
    }

    // Display document invoices if exist
    if (hasDocumentInvoices) {
      content += generateDocumentInvoicesSection(documentsInvoices);
    }

    contentDiv.innerHTML = content;
  }

  function generateMainInvoiceSection(invoice) {
    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };

    const formatPrice = (value) => {
      const num = parseFloat(value) || 0;
      return num > 0 ? `₪${num.toLocaleString()}` : "₪0";
    };

    // Handle Hebrew field names from structured invoice format
    const getInvoiceValue = (hebrewKey, englishKey) => {
      return invoice[hebrewKey] || invoice[englishKey] || '-';
    };

    return `
      <div class="invoice-section">
        <h4>📋 פרטי חשבונית כלליים</h4>
        
        <div class="invoice-field">
          <div class="label">מספר רכב:</div>
          <div class="value">${formatValue(getInvoiceValue('מספר רכב', 'car_number'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">יצרן:</div>
          <div class="value">${formatValue(getInvoiceValue('יצרן', 'manufacturer'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">דגם:</div>
          <div class="value">${formatValue(getInvoiceValue('דגם', 'model'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">בעל הרכב:</div>
          <div class="value">${formatValue(getInvoiceValue('בעל הרכב', 'owner_name'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">תאריך:</div>
          <div class="value">${formatValue(getInvoiceValue('תאריך', 'date'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">מס. חשבונית:</div>
          <div class="value">${formatValue(getInvoiceValue('מס. חשבונית', 'invoice_number'))}</div>
        </div>
      </div>
      
      <div class="invoice-section">
        <h4>🏢 פרטי מוסך</h4>
        
        <div class="invoice-field">
          <div class="label">שם מוסך:</div>
          <div class="value">${formatValue(getInvoiceValue('שם מוסך', 'garage_name'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">דוא"ל מוסך:</div>
          <div class="value">${formatValue(getInvoiceValue('דוא"ל מוסך', 'garage_email'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">טלפון מוסך:</div>
          <div class="value">${formatValue(getInvoiceValue('טלפון מוסך', 'garage_phone'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">כתובת מוסך:</div>
          <div class="value">${formatValue(getInvoiceValue('כתובת מוסך', 'garage_address'))}</div>
        </div>
        <div class="invoice-field">
          <div class="label">מוקד נזק:</div>
          <div class="value">${formatValue(getInvoiceValue('מוקד נזק', 'damage_center'))}</div>
        </div>
      </div>

      <div class="invoice-total-section">
        <div class="invoice-total-row">
          <span>סה"כ חלקים:</span>
          <span class="value price">${formatPrice(getInvoiceValue('סהכ חלקים', 'total_parts') || getInvoiceValue('סה"כ חלקים', 'total_parts'))}</span>
        </div>
        <div class="invoice-total-row">
          <span>סה"כ עבודות:</span>
          <span class="value price">${formatPrice(getInvoiceValue('סהכ עבודות', 'total_works') || getInvoiceValue('סה"כ עבודות', 'total_works'))}</span>
        </div>
        <div class="invoice-total-row">
          <span>סה"כ תיקונים:</span>
          <span class="value price">${formatPrice(getInvoiceValue('סהכ תיקונים', 'total_repairs') || getInvoiceValue('סה"כ תיקונים', 'total_repairs'))}</span>
        </div>
        <div class="invoice-total-row">
          <span>עלות ללא מע"מ:</span>
          <span class="value price">${formatPrice(getInvoiceValue('עלות כוללת ללא מע״מ', 'subtotal_before_vat'))}</span>
        </div>
        <div class="invoice-total-row">
          <span>מע"מ:</span>
          <span class="value price">${formatPrice(getInvoiceValue('מע"מ', 'vat'))}</span>
        </div>
        <div class="invoice-total-final">
          <div class="invoice-total-row">
            <span>עלות כוללת:</span>
            <span class="value price">${formatPrice(getInvoiceValue('עלות כוללת', 'total_cost'))}</span>
          </div>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
          <div class="invoice-field">
            <div class="label">הערות:</div>
            <div class="value" style="font-size: 12px;">${formatValue(getInvoiceValue('הערות', 'notes'))}</div>
          </div>
        </div>
      </div>

      ${generateInvoiceItemsSection(invoice)}
    `;
  }

  function generateInvoiceItemsSection(invoice) {
    let content = '';

    // Parts table - Handle Hebrew structure
    const parts = invoice['חלקים'] || invoice.parts || [];
    if (parts && parts.length > 0) {
      content += `
        <div class="invoice-section">
          <h4>🔧 חלקים (${parts.length})</h4>
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>מק"ט חלק</th>
                <th>שם חלק</th>
                <th>תיאור</th>
                <th>כמות</th>
                <th>מקור</th>
                <th>עלות</th>
              </tr>
            </thead>
            <tbody>
              ${parts.map(part => `
                <tr>
                  <td>${part['מק"ט חלק'] || part.part_code || '-'}</td>
                  <td>${part['שם חלק'] || part.name || '-'}</td>
                  <td>${part['תיאור'] || part.description || '-'}</td>
                  <td>${part['כמות'] || part.quantity || '1'}</td>
                  <td>${part['מקור'] || part.source || '-'}</td>
                  <td>${part['עלות'] ? `₪${parseFloat(part['עלות']).toLocaleString()}` : (part.price ? `₪${parseFloat(part.price).toLocaleString()}` : '₪0')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Works table - Handle Hebrew structure
    const works = invoice['עבודות'] || invoice.works || [];
    if (works && works.length > 0) {
      content += `
        <div class="invoice-section">
          <h4>⚒️ עבודות (${works.length})</h4>
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>סוג העבודה</th>
                <th>תיאור עבודות</th>
                <th>עלות עבודות</th>
              </tr>
            </thead>
            <tbody>
              ${works.map(work => `
                <tr>
                  <td>${work['סוג העבודה'] || work.type || '-'}</td>
                  <td>${work['תיאור עבודות'] || work.description || '-'}</td>
                  <td>${work['עלות עבודות'] !== 'אין מידע' ? (work['עלות עבודות'] ? `₪${parseFloat(work['עלות עבודות']).toLocaleString()}` : '₪0') : 'אין מידע'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Repairs table - Handle Hebrew structure
    const repairs = invoice['תיקונים'] || invoice.repairs || [];
    if (repairs && repairs.length > 0) {
      content += `
        <div class="invoice-section">
          <h4>🔨 תיקונים (${repairs.length})</h4>
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>סוג תיקון</th>
                <th>תיאור התיקון</th>
                <th>עלות תיקונים</th>
              </tr>
            </thead>
            <tbody>
              ${repairs.map(repair => `
                <tr>
                  <td>${repair['סוג תיקון'] || repair.type || repair.name || '-'}</td>
                  <td>${repair['תיאור התיקון'] || repair.description || '-'}</td>
                  <td>${repair['עלות תיקונים'] !== 'אין מידע' ? (repair['עלות תיקונים'] ? `₪${parseFloat(repair['עלות תיקונים']).toLocaleString()}` : '₪0') : 'אין מידע'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Additional invoice information section
    content += generateAdditionalInvoiceInfo(invoice);
    
    return content;
  }
  
  function generateAdditionalInvoiceInfo(invoice) {
    const formatValue = (value) => {
      return value && value.toString().trim() ? value : "-";
    };
    
    const getInvoiceValue = (hebrewKey, englishKey) => {
      return invoice[hebrewKey] || invoice[englishKey] || '-';
    };
    
    return `
      <div class="invoice-section">
        <h4>📊 פרטים נוספים</h4>
        
        <div class="levi-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; text-align: right;">
          <div class="invoice-field">
            <div class="label">מפיק החשבונית:</div>
            <div class="value">${formatValue(getInvoiceValue('מפיק החשבונית', 'invoice_issuer'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">ח.פ:</div>
            <div class="value">${formatValue(getInvoiceValue('ח.פ', 'business_id'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">מספר רישיון:</div>
            <div class="value">${formatValue(getInvoiceValue('מספר רישיון', 'plate'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">טלפון נייד:</div>
            <div class="value">${formatValue(getInvoiceValue('טלפון נייד', 'mobile_phone'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">מספר תיק:</div>
            <div class="value">${formatValue(getInvoiceValue('מספר תיק', 'case_number'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">פוליסה:</div>
            <div class="value">${formatValue(getInvoiceValue('פוליסה', 'policy_number'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">מספר תביעה:</div>
            <div class="value">${formatValue(getInvoiceValue('מספר תביעה', 'claim_number'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">קילומטראז':</div>
            <div class="value">${formatValue(getInvoiceValue('קילומטראז׳', 'mileage'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">תאריך פתיחת תיק:</div>
            <div class="value">${formatValue(getInvoiceValue('תאריך פתיחת תיק', 'case_open_date'))}</div>
          </div>
          <div class="invoice-field">
            <div class="label">תאריך קבלת רכב:</div>
            <div class="value">${formatValue(getInvoiceValue('תאריך קבלת רכב', 'vehicle_receive_date'))}</div>
          </div>
        </div>
      </div>
    `;
  }

  function generateDocumentInvoicesSection(invoices) {
    return `
      <div class="invoice-section">
        <h4>📁 חשבוניות נוספות (${invoices.length})</h4>
        ${invoices.map((invoice, index) => `
          <div style="background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 6px; border: 1px solid #d1d5db;">
            <strong>חשבונית ${index + 1}:</strong>
            <pre style="font-family: Arial; white-space: pre-wrap; margin: 8px 0; font-size: 12px; background: white; padding: 8px; border-radius: 4px;">${JSON.stringify(invoice, null, 2)}</pre>
          </div>
        `).join('')}
      </div>
    `;
  }

  function displayNoDataMessage(message) {
    const contentDiv = document.getElementById('invoiceContent');
    contentDiv.innerHTML = `
      <div class="no-data-message">
        <div class="no-data-icon">🧾</div>
        <div style="font-weight: bold; margin-bottom: 8px;">${message}</div>
        <div style="font-size: 14px; opacity: 0.8;">
          נתוני החשבוניות יועלו לאחר עיבוד החשבוניות במערכת OCR
        </div>
      </div>
    `;
  }

})();