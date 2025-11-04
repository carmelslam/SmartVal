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
    
    /* Tab System Styles */
    .invoice-tabs {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 20px;
      gap: 2px;
    }
    
    .tab-btn {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-bottom: none;
      padding: 12px 24px;
      cursor: pointer;
      transition: all 0.3s;
      font-weight: 600;
      border-radius: 8px 8px 0 0;
      font-size: 14px;
    }
    
    .tab-btn.active {
      background: #fbbf24;
      color: white;
      border-color: #f59e0b;
    }
    
    .tab-btn:hover:not(.active) {
      background: #f3f4f6;
    }
    
    .tab-content {
      min-height: 400px;
    }
    
    .tab-section {
      display: none;
      animation: fadeIn 0.3s ease-in;
    }
    
    .tab-section.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Mobile responsive tabs */
    @media (max-width: 768px) {
      .invoice-tabs {
        flex-direction: column;
      }
      
      .tab-btn {
        border-radius: 0;
        border-bottom: 1px solid #dee2e6;
      }
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "invoiceDetailsModal";
  modal.innerHTML = `
    <div class="invoice-modal-title">📋 פרטי חשבונית</div>
    
    <!-- Tab Navigation -->
    <div class="invoice-tabs">
      <button class="tab-btn active" onclick="setInvoiceTab('details')">
        📄 פרטי חשבונית
      </button>
      <button class="tab-btn" onclick="setInvoiceTab('mappings')">
        🔗 הקצאות חלקים
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content">
      <div id="detailsTab" class="tab-section active">
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
          <!-- Tab 1 content will be loaded dynamically -->
        </div>
      </div>
      
      <div id="mappingsTab" class="tab-section">
        <div id="mappingsContent">
          <!-- Tab 2 content will be loaded dynamically -->
        </div>
      </div>
    </div>
    
    <div class="invoice-buttons">
      <button class="invoice-btn close" onclick="toggleInvoiceDetails()">סגור</button>
      <button class="invoice-btn refresh" onclick="refreshInvoiceData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 🎯 Tab Management System
  let currentTab = 'details';
  const tabData = {
    details: null,
    mappings: null
  };

  // Tab switching function - exposed to global scope
  window.setInvoiceTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName + 'Tab');
    if (tabElement) {
      tabElement.classList.add('active');
    }
    
    // Set active button
    const activeButton = document.querySelector(`[onclick="setInvoiceTab('${tabName}')"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Load tab data if not already loaded
    if (!tabData[tabName] && window.helper?.cases) {
      loadTabData(tabName);
    }
  };

  // Load tab-specific data
  async function loadTabData(tabName) {
    try {
      if (tabName === 'details') {
        // Tab 1 data already loaded by existing displayInvoiceData function
        return;
      } else if (tabName === 'mappings') {
        await loadMappingsData();
      }
    } catch (error) {
      console.error(`Error loading ${tabName} tab data:`, error);
    }
  }

  // Load mappings data for Tab 2
  async function loadMappingsData() {
    const caseId = window.helper?.cases?.id;
    if (!caseId) {
      document.getElementById('mappingsContent').innerHTML = '<p>לא נמצא מזהה תיק</p>';
      return;
    }

    try {
      // Placeholder for now - will implement full functionality in next phase
      document.getElementById('mappingsContent').innerHTML = `
        <div class="invoice-section">
          <h4>🔗 הקצאות חלקים למוקדי נזק</h4>
          <p>תוכן זה יוטען בהמשך - מציג הקצאות מטבלת invoice_damage_center_mappings</p>
          <p>מזהה תיק: ${caseId}</p>
        </div>
      `;
      tabData.mappings = { loaded: true };
    } catch (error) {
      console.error('Error loading mappings:', error);
      document.getElementById('mappingsContent').innerHTML = '<p>שגיאה בטעינת נתוני הקצאות</p>';
    }
  }

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
    
    // Refresh current tab data
    if (currentTab === 'mappings' && tabData.mappings) {
      loadMappingsData();
    }
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
      console.log('🔄 SESSION 74: Loading Invoice data from Supabase + helper...');
      
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

      // SESSION 74: Load invoices from Supabase if available
      let supabaseInvoices = [];
      if (window.invoiceService) {
        try {
          const caseId = sessionStorage.getItem('currentCaseId');
          if (caseId) {
            const result = await window.invoiceService.getInvoicesByCase(caseId);
            if (result.success && result.invoices) {
              supabaseInvoices = result.invoices;
              console.log(`✅ SESSION 74: Loaded ${supabaseInvoices.length} invoices from Supabase`);
            }
          }
        } catch (supabaseError) {
          console.warn('⚠️ SESSION 74: Could not load from Supabase:', supabaseError);
        }
      }

      // Get invoice data from helper
      const invoiceData = helper.invoice || {};
      const documentsInvoices = helper.documents?.invoices || [];
      
      // Display invoice data
      displayInvoiceData(invoiceData, documentsInvoices, supabaseInvoices);

    } catch (error) {
      console.error("Error loading invoice data:", error);
      displayNoDataMessage("שגיאה בטעינת נתוני חשבוניות");
    }
  }

  function displayInvoiceData(invoiceData, documentsInvoices, supabaseInvoices = []) {
    const contentDiv = document.getElementById('invoiceContent');
    
    // Check if we have any invoice data
    const hasMainInvoice = invoiceData && Object.values(invoiceData).some(value => 
      value && value.toString().trim() !== ''
    );
    const hasDocumentInvoices = documentsInvoices && documentsInvoices.length > 0;
    const hasSupabaseInvoices = supabaseInvoices && supabaseInvoices.length > 0;

    if (!hasMainInvoice && !hasDocumentInvoices && !hasSupabaseInvoices) {
      displayNoDataMessage("לא נמצאו נתוני חשבוניות במערכת");
      return;
    }

    let content = '';

    // SESSION 74: Display Supabase invoices first (most detailed)
    if (hasSupabaseInvoices) {
      content += generateSupabaseInvoicesSection(supabaseInvoices);
    }

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

  // SESSION 74: Generate Supabase invoices section
  function generateSupabaseInvoicesSection(invoices) {
    const formatPrice = (value) => {
      const num = parseFloat(value) || 0;
      return num > 0 ? `₪${num.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "₪0";
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('he-IL');
      } catch {
        return dateStr;
      }
    };

    const getCategoryLabel = (category) => {
      const labels = {
        'part': '🔧 חלק',
        'work': '⚙️ עבודה',
        'repair': '🔨 תיקון',
        'material': '📦 חומר',
        'other': '📋 אחר',
        'uncategorized': '❓ לא מסווג'
      };
      return labels[category] || category;
    };

    const getValidationBadge = (status) => {
      const badges = {
        'approved': '<span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 4px; font-size: 12px;">✅ אושר</span>',
        'rejected': '<span style="background: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 4px; font-size: 12px;">❌ נדחה</span>',
        'pending': '<span style="background: #fff3cd; color: #856404; padding: 3px 8px; border-radius: 4px; font-size: 12px;">⏳ ממתין</span>',
        'auto_approved': '<span style="background: #cfe2ff; color: #084298; padding: 3px 8px; border-radius: 4px; font-size: 12px;">🤖 אושר אוטומטית</span>'
      };
      return badges[status] || '';
    };

    let html = '';

    invoices.forEach((invoice, index) => {
      const linesCount = invoice.lines ? invoice.lines.length : 0;
      const mappingsCount = invoice.mappings_count || 0;

      // Enhanced Invoice Header Section
      html += `
        <div class="invoice-section">
          <h4>📄 פרטי חשבונית #${index + 1}</h4>
          
          <div class="invoice-field">
            <div class="label">מספר חשבונית:</div>
            <div class="value">${invoice.invoice_number || '-'}</div>
          </div>
          <div class="invoice-field">
            <div class="label">ספק:</div>
            <div class="value">${invoice.supplier_name || '-'}</div>
          </div>
          <div class="invoice-field">
            <div class="label">תאריך חשבונית:</div>
            <div class="value">${formatDate(invoice.invoice_date)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">סכום לפני מע"מ:</div>
            <div class="value" id="invoice-${invoice.id}-before-tax">${formatPrice(invoice.total_before_tax)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">מע"מ:</div>
            <div class="value" id="invoice-${invoice.id}-tax">${formatPrice(invoice.tax_amount)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">סכום כולל:</div>
            <div class="value" id="invoice-${invoice.id}-total" style="font-weight: 700; color: #1e40af;">${formatPrice(invoice.total_amount)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">סטטוס:</div>
            <div class="value">${invoice.status || 'ממתין'} ${invoice.validation_status ? getValidationBadge(invoice.validation_status) : ''}</div>
          </div>
          
          <!-- View Invoice Document Button -->
          ${invoice.documents && invoice.documents.length > 0 ? `
            <div style="text-align: center; margin: 15px 0;">
              <button onclick="viewInvoiceDocument('${invoice.documents[0].id}')" 
                      style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                👁️ צפה בחשבונית המקורית
              </button>
            </div>
          ` : ''}
        </div>
      `;

      // Enhanced Invoice Lines Section  
      if (invoice.lines && invoice.lines.length > 0) {
        html += `
          <div class="invoice-section">
            <h4>📋 פירוט שורות החשבונית (${linesCount} פריטים)</h4>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">שורה</th>
                    <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">תיאור</th>
                    <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">כמות</th>
                    <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">מחיר יחידה</th>
                    <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">סה"כ שורה</th>
                    <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">קטגוריה</th>
                  </tr>
                </thead>
                <tbody>
        `;

        invoice.lines.forEach(line => {
          html += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${line.line_number || '-'}</td>
              <td style="padding: 10px 8px; border: 1px solid #e5e7eb;">${line.description || '-'}</td>
              <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${line.quantity || '-'}</td>
              <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: left;">${formatPrice(line.unit_price)}</td>
              <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">${formatPrice(line.line_total)}</td>
              <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${line.metadata?.category ? getCategoryLabel(line.metadata.category) : '-'}</td>
            </tr>
          `;
        });

        // Calculate and display summary
        const calculatedTotal = invoice.lines.reduce((sum, line) => sum + (parseFloat(line.line_total) || 0), 0);
        
        html += `
                </tbody>
                <tfoot>
                  <tr style="background: #f8f9fa; border-top: 2px solid #dee2e6;">
                    <td colspan="4" style="padding: 12px 8px; border: 1px solid #dee2e6; font-weight: 600; text-align: right;">סה"כ שורות:</td>
                    <td style="padding: 12px 8px; border: 1px solid #dee2e6; font-weight: 700; text-align: left; color: #1e40af;">${formatPrice(calculatedTotal)}</td>
                    <td style="padding: 12px 8px; border: 1px solid #dee2e6;"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        `;
      }

      // Additional metadata section
      if (invoice.ocr_confidence || mappingsCount > 0 || invoice.notes) {
        html += `
          <div class="invoice-section">
            <h4>📊 מידע נוסף</h4>
            ${invoice.ocr_confidence ? `
              <div class="invoice-field">
                <div class="label">דיוק OCR:</div>
                <div class="value">${Math.round(invoice.ocr_confidence)}%</div>
              </div>
            ` : ''}
            ${mappingsCount > 0 ? `
              <div class="invoice-field">
                <div class="label">מיפויים:</div>
                <div class="value">${mappingsCount} הקצאות למוקדי נזק</div>
              </div>
            ` : ''}
            ${invoice.notes ? `
              <div class="invoice-field">
                <div class="label">הערות:</div>
                <div class="value" style="font-size: 13px; color: #64748b;">${invoice.notes}</div>
              </div>
            ` : ''}
          </div>
        `;
      }
    });

    return html;
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

  // View Invoice Document function - exposed to global scope
  window.viewInvoiceDocument = async function(documentId) {
    try {
      console.log('📄 Viewing invoice document:', documentId);
      
      if (!window.invoiceService) {
        alert('שירות החשבוניות לא זמין');
        return;
      }

      // Show loading state
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '⏳ טוען...';
      button.disabled = true;

      // Get signed URL for document
      const documentUrl = await window.invoiceService.getInvoiceDocumentURL(documentId);
      
      if (!documentUrl) {
        alert('לא נמצא קישור למסמך החשבונית');
        return;
      }

      // Open in new window/tab  
      const newWindow = window.open(documentUrl, '_blank', 'width=800,height=900,scrollbars=yes');
      
      if (!newWindow) {
        // Fallback for popup blockers
        const link = document.createElement('a');
        link.href = documentUrl;
        link.target = '_blank';
        link.click();
      }

    } catch (error) {
      console.error('❌ Error viewing invoice document:', error);
      alert('שגיאה בפתיחת מסמך החשבונית: ' + error.message);
    } finally {
      // Restore button state
      if (event?.target) {
        event.target.textContent = originalText;
        event.target.disabled = false;
      }
    }
  };

})();