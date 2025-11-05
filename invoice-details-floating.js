(function () {
  if (document.getElementById("invoiceDetailsModal")) return;

  // SESSION 50: Dynamically load Supabase client if not available
  function loadSupabaseClient() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.supabase) {
        console.log('✅ Supabase client already available');
        resolve(true);
        return;
      }
      
      // Check if script already exists
      if (document.querySelector('script[src*="supabaseClient.js"]')) {
        console.log('⏳ Supabase client script loading...');
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.supabase) {
            clearInterval(checkInterval);
            console.log('✅ Supabase client loaded');
            resolve(true);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.supabase) {
            console.warn('⚠️ Supabase client timeout');
            resolve(false);
          }
        }, 5000);
        return;
      }
      
      // Load the script dynamically
      console.log('📥 Loading Supabase client dynamically...');
      const script = document.createElement('script');
      script.src = './services/supabaseClient.js';
      script.onload = () => {
        console.log('✅ Supabase client script loaded');
        // Wait a bit for initialization
        setTimeout(() => {
          if (window.supabase) {
            console.log('✅ Supabase client initialized');
            resolve(true);
          } else {
            console.warn('⚠️ Supabase client script loaded but window.supabase not available');
            resolve(false);
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Supabase client:', error);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  
  // Initialize Supabase client on module load
  loadSupabaseClient();

  // Helper function to get catalog code display with invalid value filtering
  function getCatalogCodeDisplay(item) {
    const invalidValues = ['שם', 'תיאור', 'מחיר', 'כמות', 'סה"כ', 'קטגוריה', 'מקור', '-', ''];
    
    // Check catalog_code first
    if (item.catalog_code && !invalidValues.includes(item.catalog_code.trim())) {
      return item.catalog_code;
    }
    
    // Check pcode
    if (item.pcode && !invalidValues.includes(item.pcode.trim())) {
      return item.pcode;
    }
    
    // Check oem
    if (item.oem && !invalidValues.includes(item.oem.trim())) {
      return item.oem;
    }
    
    // Fallback to dash
    return '-';
  }

  const style = document.createElement("style");
  style.innerHTML = `
    #invoiceDetailsModal {
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 95vw;
      width: 90vw;
      max-height: 85vh;
      background: white;
      border: 1px solid #0066cc;
      padding: 15px;
      z-index: 9999;
      box-shadow: 0 0 25px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 12px;
      display: none;
      overflow-y: auto;
      overflow-x: auto;
    }
    
    @media (max-width: 768px) {
      #invoiceDetailsModal {
        top: 10px;
        left: 5px;
        right: 5px;
        transform: none;
        width: calc(100% - 10px);
        max-width: none;
        padding: 10px;
        max-height: 90vh;
      }
      
      .damage-center-parts-table {
        font-size: 11px !important;
      }
      
      .damage-center-parts-table th,
      .damage-center-parts-table td {
        padding: 6px 4px !important;
      }
      
      .damage-center-header {
        font-size: 13px !important;
        padding: 10px !important;
      }
      
      .tabs-header {
        flex-wrap: wrap;
      }
      
      .tab-btn {
        font-size: 12px !important;
        padding: 8px 12px !important;
      }
    }
    .results-modal-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #0066cc;
      text-align: center;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .results-summary {
      background: #f0f8ff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid #0066cc;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 10px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-weight: bold;
      color: #0066cc;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 18px;
      color: #333;
      font-weight: bold;
    }
    .search-results-container {
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .search-result-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
      transition: background 0.2s;
    }
    .search-result-item:hover {
      background: #f8f9fa;
    }
    .search-result-item:last-child {
      border-bottom: none;
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .result-name {
      font-weight: bold;
      color: #0066cc;
      font-size: 16px;
    }
    .result-price {
      font-weight: bold;
      color: #28a745;
      font-size: 16px;
    }
    .result-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 8px;
    }
    .result-detail {
      font-size: 14px;
      color: #6c757d;
    }
    .result-detail strong {
      color: #333;
    }
    .result-description {
      font-size: 13px;
      color: #666;
      font-style: italic;
      margin-top: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .results-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .results-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background 0.2s;
    }
    .results-btn.close {
      background: #6c757d;
      color: white;
    }
    .results-btn.close:hover {
      background: #5a6268;
    }
    .results-btn.export {
      background: #28a745;
      color: white;
    }
    .results-btn.export:hover {
      background: #218838;
    }
    .results-btn.refresh {
      background: #0066cc;
      color: white;
    }
    .results-btn.refresh:hover {
      background: #0052a3;
    }
    .no-results {
      text-align: center;
      padding: 40px;
      color: #6c757d;
      font-size: 16px;
    }
    .no-results-icon {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.5;
    }
    .recommended-section {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .recommended-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .recommended-text {
      font-size: 14px;
      color: #856404;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }
    .stat-item {
      background: white;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      border: 1px solid #0066cc;
    }
    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    /* SESSION 49: Tab Navigation Styles */
    .tabs-header {
      display: flex;
      gap: 0;
      margin-bottom: 20px;
      border-bottom: 2px solid #e9ecef;
    }
    .tab-btn {
      flex: 1;
      padding: 12px 20px;
      border: none;
      background: #f8f9fa;
      color: #6c757d;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }
    .tab-btn:hover {
      background: #e9ecef;
    }
    .tab-btn.active {
      background: #fff;
      color: #0066cc;
      border-bottom-color: #0066cc;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    /* SESSION 49: Damage Center Group Styles */
    .damage-center-group {
      border: 2px solid #28a745;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
    }
    .damage-center-header {
      background: #28a745;
      color: white;
      padding: 12px 15px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .damage-center-header:hover {
      background: #218838;
    }
    .damage-center-parts-table {
      width: 100%;
      border-collapse: collapse;
    }
    .damage-center-parts-table th {
      background: #e8f5e9;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      border-bottom: 2px solid #28a745;
    }
    .damage-center-parts-table td {
      padding: 10px;
      text-align: center;
      font-size: 13px;
      border-bottom: 1px solid #e9ecef;
    }
    .damage-center-parts-table tr:hover {
      background: #f8f9fa;
    }
    .damage-center-subtotal {
      background: #f0f9ff;
      padding: 10px 15px;
      font-weight: bold;
      text-align: left;
      border-top: 2px solid #28a745;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "invoiceDetailsModal";
  // SESSION 49: Restructured to 3-tab interface
  modal.innerHTML = `
    <div class="results-modal-title">
      🔍 פרטי חשבוניות
    </div>
    
    <!-- Tab Navigation -->
    <div class="tabs-header">
      <button class="tab-btn active" data-tab="documents" onclick="switchInvoiceTab('documents')">
        📄 פרטי חשבונית ושורות
      </button>
      <button class="tab-btn" data-tab="mappings" onclick="switchInvoiceTab('mappings')">
        🔗 הקצאות למוקדי נזק
      </button>
    </div>

    <!-- Tab 1 - Invoice Documents (OCR Style) -->
    <div class="tab-content active" id="tab-documents">
      <!-- Invoice Summary Header -->
      <div id="invoice-summary" style="display: none;">
        <!-- Will be populated by displayInvoiceOCRStyle -->
      </div>
      
      <!-- Invoice Lines Table -->
      <div id="invoice-lines-container" style="display: none;">
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">📋 פירוט שורות חשבונית</h4>
          
          <table class="results-table" id="invoice-results-table" style="width: 100%; border-collapse: collapse; direction: rtl;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="width: 150px; padding: 8px; text-align: right; border: 1px solid #cbd5e1; font-size: 12px;">קוד קטלוג</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; font-size: 12px;">תיאור</th>
                <th style="width: 60px; padding: 8px; text-align: center; border: 1px solid #cbd5e1; font-size: 12px;">כמות</th>
                <th style="width: 80px; padding: 8px; text-align: center; border: 1px solid #cbd5e1; font-size: 12px;">מחיר יחידה</th>
                <th style="width: 85px; padding: 8px; text-align: center; border: 1px solid #cbd5e1; font-size: 12px;">סה"כ</th>
                <th style="width: 70px; padding: 8px; text-align: center; border: 1px solid #cbd5e1; font-size: 12px;">קטגוריה</th>
              </tr>
            </thead>
            <tbody id="invoice-lines-body">
              <!-- Lines will be populated here -->
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- View Invoice Button -->
      <div id="view-invoice-section" style="display: none; text-align: center; margin-top: 20px;">
        <button id="view-invoice-btn" onclick="viewCurrentInvoiceDocument()" 
                style="background: #0066cc; color: white; border: none; padding: 12px 24px; 
                       border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;
                       box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                onmouseover="this.style.background='#0052a3'" 
                onmouseout="this.style.background='#0066cc'">
          👁️ צפייה בחשבונית המקורית
        </button>
      </div>
      
      <!-- No Data State -->
      <div class="no-results" id="no-invoice-data">
        <div class="no-results-icon">📄</div>
        <div>אין נתוני חשבונית</div>
      </div>
    </div>

    <!-- Tab 2 - Damage Center Mappings -->
    <div class="tab-content" id="tab-mappings" style="display: none;">
      <!-- Mappings Summary -->
      <div id="mappings-summary" style="display: none;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h4 style="margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">הקצאת חלקים לפי מוקד נזק</h4>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 11px; opacity: 0.8;">סה"כ הקצאות</div>
              <div id="totalMappings" style="font-size: 18px; font-weight: bold; margin-top: 5px;">0</div>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 11px; opacity: 0.8;">מוקדי נזק</div>
              <div id="totalDamageCenters" style="font-size: 18px; font-weight: bold; margin-top: 5px;">0</div>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 11px; opacity: 0.8;">ערך כולל</div>
              <div id="totalMappingValue" style="font-size: 18px; font-weight: bold; margin-top: 5px;">₪0</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Damage Centers Container -->
      <div id="damage-centers-container" style="display: none;">
        <!-- Will be populated with damage center tables -->
      </div>
      
      <!-- No Data State -->
      <div class="no-results" id="no-mappings-data">
        <div class="no-results-icon">🔗</div>
        <div>אין הקצאות נזק</div>
      </div>
    </div>


    <div class="results-buttons">
      <button class="results-btn close" onclick="toggleInvoiceDetails()">סגור</button>
      <button class="results-btn refresh" onclick="refreshInvoiceData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

  // SESSION 49: Tab state persistence
  let currentTab = 'documents';
  let tabsLoaded = {
    documents: false,
    mappings: false,
    validations: false
  };

  // Global functions
  window.toggleInvoiceDetails = function () {
    const modal = document.getElementById("invoiceDetailsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      modal.style.display = "block";
      // SESSION 49: Load current tab if not already loaded
      if (!tabsLoaded[currentTab]) {
        loadTabData(currentTab);
      }
    } else {
      modal.style.display = "none";
    }
  };

  // SESSION 49: Tab switching function with persistence
  window.switchInvoiceTab = function(tabName) {
    console.log(`📑 SESSION 49: Switching to tab: ${tabName}`);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
      activeTab.style.display = 'block';
      activeTab.classList.add('active');
    }
    
    // Update current tab
    currentTab = tabName;
    
    // Load data if not already loaded (tab persistence)
    if (!tabsLoaded[tabName]) {
      loadTabData(tabName);
    }
  };

  // SESSION 49: Load data for specific tab
  function loadTabData(tabName) {
    console.log(`🔄 Invoice floating: Loading data for tab: ${tabName}`);
    
    switch(tabName) {
      case 'documents':
        loadInvoiceDocuments();
        break;
      case 'mappings':
        loadDamageCenterMappings();
        break;
    }
    
    tabsLoaded[tabName] = true;
  }
  
  // SESSION 50: Refresh current tab data
  window.refreshInvoiceData = function() {
    console.log('🔄 Invoice floating: Refreshing current tab:', currentTab);
    
    // Show loading indicator
    const container = currentTab === 'documents' ? document.getElementById('documentsContainer') :
                     document.getElementById('mappingsContainer');
    
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔄</div>
          <div>מרענן נתונים...</div>
        </div>
      `;
    }
    
    // Reload tab data
    tabsLoaded[currentTab] = false;
    setTimeout(() => {
      loadTabData(currentTab);
    }, 100);
  };

  // SESSION 50: Remove unused export function (kept for compatibility but does nothing)
  window.exportPartsResults = function () {
    try {
      const results = getPartsSearchResults();
      if (!results || results.length === 0) {
        alert('אין תוצאות לייצוא');
        return;
      }

      // Create CSV content
      const headers = ['שם החלק', 'מחיר', 'ספק', 'מיקום', 'מצב', 'קטגוריה', 'תיאור'];
      const csvContent = [
        headers.join(','),
        ...results.map(result => [
          `"${result.name || ''}"`,
          result.price || '0',
          `"${result.supplier || ''}"`,
          `"${result.location || ''}"`,
          `"${result.condition || ''}"`,
          `"${result.category || ''}"`,
          `"${result.description || ''}"`
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `parts_search_results_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('תוצאות החיפוש יוצאו בהצלחה');
    } catch (error) {
      console.error('Export error:', error);
      alert('שגיאה בייצוא התוצאות');
    }
  };

  // Helper functions
  function getPartsSearchResults() {
    try {
      // Try to get from helper.js first
      if (typeof helper !== 'undefined' && helper.parts_search && helper.parts_search.results) {
        return helper.parts_search.results;
      }
      
      // Fallback to sessionStorage
      const sessionHelper = sessionStorage.getItem('helper');
      if (sessionHelper) {
        const helperData = JSON.parse(sessionHelper);
        if (helperData.parts_search && helperData.parts_search.results) {
          return helperData.parts_search.results;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting parts search results:', error);
      return [];
    }
  }

  function getSummaryData() {
    try {
      // Try to get from helper.js first
      if (typeof helper !== 'undefined' && helper.parts_search && helper.parts_search.summary) {
        return helper.parts_search.summary;
      }
      
      // Fallback to sessionStorage
      const sessionHelper = sessionStorage.getItem('helper');
      if (sessionHelper) {
        const helperData = JSON.parse(sessionHelper);
        if (helperData.parts_search && helperData.parts_search.summary) {
          return helperData.parts_search.summary;
        }
      }
      
      return { total_results: '', recommended: '' };
    } catch (error) {
      console.error('Error getting summary data:', error);
      return { total_results: '', recommended: '' };
    }
  }

  // TAB 1 - Load Invoice Data (Complete OCR-style implementation)
  async function loadInvoiceDocuments() {
    console.log('📄 Loading invoice data for OCR-style display...');
    
    // Ensure the modal exists before proceeding
    if (!document.getElementById('invoiceDetailsModal')) {
      console.error('❌ Invoice modal not found - cannot load data');
      return;
    }
    
    try {
      // Get current case ID
      const currentCaseId = await getCurrentCaseId();
      
      if (!currentCaseId) {
        showNoDataState('לא נמצא מזהה תיק - לא ניתן לטעון נתוני חשבונית');
        return;
      }

      // Show loading state
      showLoadingState('טוען נתוני חשבונית...');

      // Wait for Supabase to load if needed
      if (!window.supabase) {
        console.log('⏳ Waiting for Supabase client...');
        await loadSupabaseClient();
      }

      if (!window.supabase) {
        throw new Error('Supabase client לא זמין - נכשל בטעינה');
      }

      // Step 1: Get invoices for this case
      const { data: invoicesData, error: invoicesError } = await window.supabase
        .from('invoices')
        .select('*')
        .eq('case_id', currentCaseId)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        throw new Error(`Failed to load invoices: ${invoicesError.message}`);
      }

      if (!invoicesData || invoicesData.length === 0) {
        showNoDataState('לא נמצאו חשבוניות עבור תיק זה');
        return;
      }

      // For now, take the most recent invoice
      const mainInvoice = invoicesData[0];
      console.log('✅ Found main invoice:', mainInvoice);

      // Step 2: Get invoice lines for this invoice
      const { data: linesData, error: linesError } = await window.supabase
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', mainInvoice.id)
        .order('line_number', { ascending: true });

      if (linesError) {
        throw new Error(`Failed to load invoice lines: ${linesError.message}`);
      }

      // Step 3: Get invoice document (for viewing)
      const { data: documentsData, error: documentsError } = await window.supabase
        .from('invoice_documents')
        .select('*')
        .eq('invoice_id', mainInvoice.id)
        .limit(1);

      if (documentsError) {
        console.warn('Could not load document data:', documentsError);
      }

      const mainDocument = documentsData?.[0];
      
      console.log('✅ Loaded invoice data:', {
        invoice: mainInvoice,
        lines: linesData?.length || 0,
        document: !!mainDocument
      });

      // Display the data in OCR style
      displayInvoiceOCRStyle(mainInvoice, linesData || [], mainDocument);

    } catch (error) {
      console.error('❌ Error loading invoice data:', error);
      showNoDataState(`שגיאה בטעינת נתוני חשבונית: ${error.message}`);
    }
  }

  // Show loading state
  function showLoadingState(message) {
    // Check if DOM is ready
    if (!document || typeof document.getElementById !== 'function') {
      console.error('❌ DOM not ready in showLoadingState');
      return;
    }
    
    // Hide all sections safely
    const summaryEl = document.getElementById('invoice-summary');
    const linesEl = document.getElementById('invoice-lines-container');
    const viewEl = document.getElementById('view-invoice-section');
    const noDataEl = document.getElementById('no-invoice-data');
    
    if (summaryEl) summaryEl.style.display = 'none';
    if (linesEl) linesEl.style.display = 'none';
    if (viewEl) viewEl.style.display = 'none';
    
    // Show loading in no-data section
    if (noDataEl) {
      noDataEl.innerHTML = `
        <div class="no-results-icon">🔄</div>
        <div>${message}</div>
      `;
      noDataEl.style.display = 'block';
    }
  }

  // Show no data state
  function showNoDataState(message) {
    // Check if DOM is ready
    if (!document || typeof document.getElementById !== 'function') {
      console.error('❌ DOM not ready in showNoDataState');
      return;
    }
    
    // Hide all sections safely
    const summaryEl = document.getElementById('invoice-summary');
    const linesEl = document.getElementById('invoice-lines-container');
    const viewEl = document.getElementById('view-invoice-section');
    const noDataEl = document.getElementById('no-invoice-data');
    
    if (summaryEl) summaryEl.style.display = 'none';
    if (linesEl) linesEl.style.display = 'none';
    if (viewEl) viewEl.style.display = 'none';
    
    // Show no data message
    if (noDataEl) {
      noDataEl.innerHTML = `
        <div class="no-results-icon">📄</div>
        <div>${message}</div>
      `;
      noDataEl.style.display = 'block';
    }
  }

  // Get current case ID using correct helper identifiers  
  async function getCurrentCaseId() {
    console.log('🔍 Checking helper structure...');
    
    // First priority: Use direct case UUID if available
    const directCaseId = window.helper?.case_info?.supabase_case_id;
    if (directCaseId) {
      console.log('✅ Found direct case UUID:', directCaseId);
      return directCaseId;
    }
    
    // Second priority: Check current_invoice for case_uuid
    const invoiceCaseId = window.helper?.current_invoice?.case_uuid;
    if (invoiceCaseId) {
      console.log('✅ Found case UUID from current_invoice:', invoiceCaseId);
      return invoiceCaseId;
    }
    
    // Third priority: Get case ID by plate lookup
    const plate = window.helper?.case_info?.plate || window.helper?.meta?.plate || window.helper?.vehicle?.plate;
    if (plate) {
      console.log('🔍 Found plate, looking up case:', plate);
      return getCurrentCaseIdByPlate(plate);
    }
    
    console.log('❌ No case ID or plate found in helper');
    return null;
  }

  // Helper function to get case ID by plate
  async function getCurrentCaseIdByPlate(plate) {
    if (!window.supabase) {
      console.log('❌ Supabase not available');
      return null;
    }

    try {
      // Get case_id from cases table
      const normalizedPlate = plate.replace(/[\s-]/g, '');
      console.log('🔍 Normalized plate:', plate, '→', normalizedPlate);
      
      const { data: casesData, error: caseError } = await window.supabase
        .from('cases')
        .select('id, filing_case_id, status')
        .eq('plate', normalizedPlate)
        .order('created_at', { ascending: false });
      
      if (caseError) {
        console.error('❌ Failed to query cases:', caseError);
        return null;
      }
      
      if (!casesData || casesData.length === 0) {
        console.log('❌ No cases found for plate:', normalizedPlate);
        return null;
      }
      
      // Smart case selection: prioritize OPEN/IN_PROGRESS cases over most recent
      const activeCase = casesData?.find(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS') || casesData?.[0];
      
      if (!activeCase) {
        console.error('❌ No valid case found for plate:', normalizedPlate);
        return null;
      }
      
      const caseUuid = activeCase.id;
      console.log('✅ Found case UUID:', caseUuid, 'status:', activeCase.status);
      
      return caseUuid;
      
    } catch (error) {
      console.error('❌ Error getting case ID:', error);
      return null;
    }
  }

  // Display invoice data in OCR style (copying from invoice upload.html)
  function displayInvoiceOCRStyle(invoice, lines, documentData) {
    console.log('🎨 Displaying invoice in OCR style:', { invoice, lines: lines?.length, document: !!documentData });
    
    // Check if DOM is ready
    if (!document || typeof document.getElementById !== 'function') {
      console.error('❌ DOM not ready or document.getElementById not available');
      setTimeout(() => displayInvoiceOCRStyle(invoice, lines, documentData), 100);
      return;
    }
    
    // Check if required elements exist
    const noDataElement = document.getElementById('no-invoice-data');
    const summaryElement = document.getElementById('invoice-summary');
    
    if (!noDataElement || !summaryElement) {
      console.error('❌ Required DOM elements not found');
      console.log('Available elements:', {
        noData: !!noDataElement,
        summary: !!summaryElement,
        modalExists: !!document.getElementById('invoiceDetailsModal')
      });
      return;
    }
    
    // Hide no-data section
    noDataElement.style.display = 'none';
    
    // Format helper functions
    const formatValue = (value) => value && value.toString().trim() ? value : "-";
    const formatPrice = (value) => {
      const num = parseFloat(value) || 0;
      return num > 0 ? `₪${num.toLocaleString('he-IL')}` : "₪0";
    };
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('he-IL');
      } catch {
        return '-';
      }
    };
    
    // Hebrew status transformation
    const getHebrewStatus = (status) => {
      const statusMap = {
        'DRAFT': 'טיוטה',
        'PENDING': 'ממתין',
        'ASSIGNED': 'הוקצה',
        'ACCEPTED': 'אושר',
        'SENT': 'נשלח',
        'PAID': 'שולם',
        'CANCELLED': 'בוטל'
      };
      return statusMap[status] || status || '-';
    };
    
    // Get VAT rate from calculations or default to display percentage
    const getVatDisplayText = () => {
      if (window.calculations && window.calculations.vat_rate) {
        const vatPercent = Math.round(window.calculations.vat_rate * 100);
        return `מע"מ (${vatPercent}%)`;
      }
      return 'מע"מ';
    };

    // Use existing invoice totals - DO NOT CALCULATE
    const subtotal = parseFloat(invoice.total_before_tax || 0);
    const vatAmount = parseFloat(invoice.tax_amount || 0);
    const grandTotal = parseFloat(invoice.total_amount || 0);
    
    // Get category totals from invoice metadata if available, otherwise calculate from lines for display only
    let totalParts = 0, totalWorks = 0, totalRepairs = 0, totalOther = 0;
    
    if (invoice.metadata && invoice.metadata.category_totals) {
      // Use pre-calculated category totals from invoice
      totalParts = parseFloat(invoice.metadata.category_totals.parts || 0);
      totalWorks = parseFloat(invoice.metadata.category_totals.work || 0);
      totalRepairs = parseFloat(invoice.metadata.category_totals.repair || 0);
      totalOther = parseFloat(invoice.metadata.category_totals.other || 0);
    } else {
      // Fallback: sum from lines for display purposes only
      lines.forEach(line => {
        const lineTotal = parseFloat(line.line_total || 0);
        const category = line.item_category || 'other';
        
        if (category === 'part') totalParts += lineTotal;
        else if (category === 'work') totalWorks += lineTotal;
        else if (category === 'repair') totalRepairs += lineTotal;
        else totalOther += lineTotal;
      });
    }

    // Create invoice summary (copying structure from invoice upload.html)
    const summaryContainer = summaryElement;
    summaryContainer.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">📋 סיכום חשבונית</h4>
        
        <!-- Invoice Header Info -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 15px;">
          <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">
            <div style="font-size: 11px; opacity: 0.8;">מספר חשבונית</div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 3px;">${formatValue(invoice.invoice_number)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">
            <div style="font-size: 11px; opacity: 0.8;">ספק</div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 3px;">${formatValue(invoice.supplier_name)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">
            <div style="font-size: 11px; opacity: 0.8;">מספר רכב</div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 3px;">${formatValue(invoice.plate)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">
            <div style="font-size: 11px; opacity: 0.8;">תאריך</div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 3px;">${formatDate(invoice.issue_date || invoice.invoice_date)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px;">
            <div style="font-size: 11px; opacity: 0.8;">סטטוס</div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 3px;">${getHebrewStatus(invoice.status)}</div>
          </div>
        </div>
        
        <!-- Cost Breakdown by Category -->
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 13px; margin-bottom: 10px; font-weight: bold;">פירוט עלויות:</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
            <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; text-align: center;">
              <div style="font-size: 10px; opacity: 0.8;">🔧 חלקים</div>
              <div style="font-size: 14px; font-weight: bold;">${formatPrice(totalParts)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; text-align: center;">
              <div style="font-size: 10px; opacity: 0.8;">👷 עבודות</div>
              <div style="font-size: 14px; font-weight: bold;">${formatPrice(totalWorks)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; text-align: center;">
              <div style="font-size: 10px; opacity: 0.8;">🔨 תיקונים</div>
              <div style="font-size: 14px; font-weight: bold;">${formatPrice(totalRepairs)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; text-align: center;">
              <div style="font-size: 10px; opacity: 0.8;">📋 אחר</div>
              <div style="font-size: 14px; font-weight: bold;">${formatPrice(totalOther)}</div>
            </div>
          </div>
        </div>
        
        <!-- Totals Section -->
        <div style="background: rgba(255,255,255,0.25); padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px;">סה"כ לפני מע"מ:</span>
            <span style="font-size: 15px; font-weight: bold;">${formatPrice(subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px;">${getVatDisplayText()}:</span>
            <span style="font-size: 15px; font-weight: bold;">${formatPrice(vatAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid rgba(255,255,255,0.3); padding-top: 8px;">
            <span style="font-size: 16px; font-weight: bold;">סה"כ כולל מע"מ:</span>
            <span style="font-size: 18px; font-weight: bold; color: #fbbf24;">${formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>
    `;

    // Display lines table
    displayInvoiceLines(lines);
    
    // Show/hide view invoice button
    const viewInvoiceSection = document.getElementById('view-invoice-section');
    if (documentData && viewInvoiceSection) {
      // Store document data for viewing
      window._currentInvoiceDocument = documentData;
      viewInvoiceSection.style.display = 'block';
    } else if (viewInvoiceSection) {
      viewInvoiceSection.style.display = 'none';
    }
    
    // Show all sections
    summaryContainer.style.display = 'block';
    console.log('✅ Invoice OCR-style display completed');
  }

  // Display invoice lines in table (copying structure from invoice upload.html)
  function displayInvoiceLines(lines) {
    console.log('📋 Displaying invoice lines:', lines?.length || 0);
    
    // Check if DOM is ready
    if (!document || typeof document.getElementById !== 'function') {
      console.error('❌ DOM not ready in displayInvoiceLines');
      return;
    }
    
    const tableBody = document.getElementById('invoice-lines-body');
    const linesContainer = document.getElementById('invoice-lines-container');
    
    if (!tableBody) {
      console.error('❌ invoice-lines-body element not found');
      return;
    }
    
    if (!lines || lines.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 20px; text-align: center; color: #6b7280; font-style: italic;">
            אין שורות חשבונית
          </td>
        </tr>
      `;
      if (linesContainer) linesContainer.style.display = 'block';
      return;
    }

    // Group lines by category
    const categorizedLines = {
      part: [],
      work: [],
      repair: [],
      other: []
    };

    lines.forEach(line => {
      const category = line.item_category || 'other';
      if (categorizedLines[category]) {
        categorizedLines[category].push(line);
      } else {
        categorizedLines.other.push(line);
      }
    });

    // Build table rows by category
    let tableRowsHTML = '';
    
    // Helper function to render category
    const renderCategory = (categoryKey, categoryName, icon, items) => {
      if (items.length === 0) return '';
      
      let categoryHTML = `
        <tr>
          <td colspan="6" style="background: #334155; color: white; font-weight: bold; padding: 8px; text-align: right; font-size: 13px;">
            ${icon} ${categoryName} (${items.length})
          </td>
        </tr>
      `;

      items.forEach(item => {
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
        categoryHTML += `
          <tr style="background: #64748b; color: white;">
            <td style="padding: 6px 8px; font-size: 11px;">${getCatalogCodeDisplay(item)}</td>
            <td style="padding: 6px 8px; font-size: 11px;">${item.description || '-'}</td>
            <td style="padding: 6px 8px; text-align: center; font-size: 11px;">${item.quantity || 1}</td>
            <td style="padding: 6px 8px; text-align: center; font-size: 11px;">₪${(item.unit_price || 0).toLocaleString()}</td>
            <td style="padding: 6px 8px; text-align: center; font-weight: bold; font-size: 11px;">₪${lineTotal.toLocaleString()}</td>
            <td style="padding: 6px 8px; text-align: center; font-size: 10px;">${categoryName}</td>
          </tr>
        `;
      });

      return categoryHTML;
    };

    // Render each category
    tableRowsHTML += renderCategory('part', 'חלקים', '🔧', categorizedLines.part);
    tableRowsHTML += renderCategory('work', 'עבודות', '👷', categorizedLines.work);
    tableRowsHTML += renderCategory('repair', 'תיקונים', '🔨', categorizedLines.repair);
    tableRowsHTML += renderCategory('other', 'אחר', '📋', categorizedLines.other);

    tableBody.innerHTML = tableRowsHTML;
    if (linesContainer) linesContainer.style.display = 'block';
    
    console.log('✅ Invoice lines table populated');
  }

  // View current invoice document
  window.viewCurrentInvoiceDocument = async function() {
    console.log('👁️ Opening current invoice document...');
    
    if (!window._currentInvoiceDocument) {
      alert('לא נמצא מסמך חשבונית לצפייה');
      return;
    }

    const doc = window._currentInvoiceDocument;
    await viewInvoiceDocument(doc.id, doc.storage_path, doc.storage_bucket, doc.filename);
  };

  // View Invoice Document function
  window.viewInvoiceDocument = async function(docId, storagePath, storageBucket, filename) {
    console.log('👁️ Opening invoice document:', { docId, storagePath, storageBucket, filename });
    
    try {
      if (!window.supabase) {
        console.log('⏳ Waiting for Supabase client...');
        await loadSupabaseClient();
      }

      if (!window.supabase) {
        alert('שרת לא זמין - לא ניתן לפתוח מסמך');
        return;
      }

      // Always get fresh document data from database
      console.log('📋 Getting document data from database...');
      const { data: docData, error: docError } = await window.supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (docError) {
        throw new Error(`שגיאה בטעינת נתוני מסמך: ${docError.message}`);
      }

      if (!docData) {
        throw new Error('מסמך לא נמצא במאגר');
      }

      console.log('✅ Document data loaded:', docData);

      const finalStoragePath = docData.storage_path;
      const finalBucket = docData.storage_bucket || 'docs';
      
      if (!finalStoragePath) {
        throw new Error('נתיב קובץ לא נמצא במאגר');
      }

      console.log('📁 Getting URL for path:', finalStoragePath, 'bucket:', finalBucket);

      // Try to get a signed URL first (for private storage)
      try {
        const { data: signedData, error: signedError } = await window.supabase.storage
          .from(finalBucket)
          .createSignedUrl(finalStoragePath, 3600); // 1 hour expiry

        if (!signedError && signedData?.signedUrl) {
          console.log('✅ Got signed URL:', signedData.signedUrl);
          const newWindow = window.open(signedData.signedUrl, '_blank');
          
          if (!newWindow) {
            alert(`חסום חלון קופץ. אנא פתח ידנית:\n${signedData.signedUrl}`);
          }
          return;
        }
      } catch (signedError) {
        console.warn('⚠️ Signed URL failed, trying public URL:', signedError);
      }

      // Fallback to public URL
      const { data: urlData } = window.supabase.storage
        .from(finalBucket)
        .getPublicUrl(finalStoragePath);

      if (!urlData?.publicUrl) {
        throw new Error('לא ניתן לקבל קישור למסמך');
      }

      console.log('✅ Got public URL:', urlData.publicUrl);

      // Open the document in a new window/tab
      const newWindow = window.open(urlData.publicUrl, '_blank');
      
      if (!newWindow) {
        alert(`חסום חלון קופץ. אנא פתח ידנית:\n${urlData.publicUrl}`);
      } else {
        console.log('✅ Document opened successfully');
      }

    } catch (error) {
      console.error('❌ Error opening invoice document:', error);
      alert('שגיאה בפתיחת המסמך: ' + error.message);
    }
  };

  // TAB 2 - Load Damage Center Mappings (Complete table implementation)
  async function loadDamageCenterMappings() {
    console.log('🔗 Loading damage center mappings...');
    
    // Ensure the modal exists before proceeding
    if (!document.getElementById('invoiceDetailsModal')) {
      console.error('❌ Invoice modal not found - cannot load mappings');
      return;
    }
    
    try {
      // Get current case ID
      const currentCaseId = await getCurrentCaseId();
      
      if (!currentCaseId) {
        showMappingsNoDataState('לא נמצא מזהה תיק - לא ניתן לטעון הקצאות נזק');
        return;
      }

      // Show loading state
      showMappingsLoadingState('טוען הקצאות נזק...');

      // Wait for Supabase to load if needed
      if (!window.supabase) {
        console.log('⏳ Waiting for Supabase client...');
        await loadSupabaseClient();
      }

      if (!window.supabase) {
        throw new Error('Supabase client לא זמין - נכשל בטעינה');
      }

      // Query invoice_damage_center_mappings table - simple query first
      console.log('🔍 DEBUG: About to query mappings with case_id:', currentCaseId);
      
      const { data: mappingsData, error } = await window.supabase
        .from('invoice_damage_center_mappings')
        .select('*')
        .eq('case_id', currentCaseId)
        .order('created_at', { ascending: false });
        
      console.log('🔍 DEBUG: Simple mappings query completed. Error:', error);
      console.log('🔍 DEBUG: Raw mappingsData:', mappingsData);

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      console.log('✅ Loaded mappings data:', mappingsData);
      console.log('📊 Mappings count:', mappingsData?.length || 0);
      console.log('🔍 DEBUG: Current case ID:', currentCaseId);
      console.log('🔍 DEBUG: Query parameters used:', {
        case_id: currentCaseId,
        validation_status: 'approved'
      });
      
      // Debug: Let's also try without the mapping_status filter
      const { data: allMappingsData, error: allError } = await window.supabase
        .from('invoice_damage_center_mappings')
        .select('*')
        .eq('case_id', currentCaseId);
      
      console.log('🔍 DEBUG: All mappings (without status filter):', allMappingsData?.length || 0);
      if (allMappingsData && allMappingsData.length > 0) {
        console.log('🔍 DEBUG: Sample mapping:', allMappingsData[0]);
        console.log('🔍 DEBUG: Available validation statuses:', [...new Set(allMappingsData.map(m => m.validation_status))]);
        console.log('🔍 DEBUG: Available mapping statuses:', [...new Set(allMappingsData.map(m => m.mapping_status))]);
      }
      
      if (!mappingsData || mappingsData.length === 0) {
        if (allMappingsData && allMappingsData.length > 0) {
          console.log('📝 No approved mappings found, but showing all mappings for debugging');
          // Show all mappings even if not approved for better user experience
          displayDamageCenterMappingsTable(allMappingsData);
          return;
        } else {
          showMappingsNoDataState('לא נמצאו הקצאות נזק עבור תיק זה');
          return;
        }
      }

      // Display the mappings in proper table format
      displayDamageCenterMappingsTable(mappingsData);

    } catch (error) {
      console.error('❌ Error loading damage center mappings:', error);
      showMappingsNoDataState(`שגיאה בטעינת הקצאות נזק: ${error.message}`);
    }
  }

  // Show loading state for mappings
  function showMappingsLoadingState(message) {
    // Check if DOM is ready
    if (!document || typeof document.getElementById !== 'function') {
      console.error('❌ DOM not ready in showMappingsLoadingState');
      return;
    }
    
    // Hide all sections safely
    const summaryEl = document.getElementById('mappings-summary');
    const centersEl = document.getElementById('damage-centers-container');
    const noDataEl = document.getElementById('no-mappings-data');
    
    if (summaryEl) summaryEl.style.display = 'none';
    if (centersEl) centersEl.style.display = 'none';
    
    // Show loading in no-data section
    if (noDataEl) {
      noDataEl.innerHTML = `
        <div class="no-results-icon">🔄</div>
        <div>${message}</div>
      `;
      noDataEl.style.display = 'block';
    }
  }

  // Show no data state for mappings
  function showMappingsNoDataState(message) {
    // Check if DOM is ready
    if (!document || typeof document.getElementById !== 'function') {
      console.error('❌ DOM not ready in showMappingsNoDataState');
      return;
    }
    
    // Hide all sections safely
    const summaryEl = document.getElementById('mappings-summary');
    const centersEl = document.getElementById('damage-centers-container');
    const noDataEl = document.getElementById('no-mappings-data');
    
    if (summaryEl) summaryEl.style.display = 'none';
    if (centersEl) centersEl.style.display = 'none';
    
    // Show no data message
    if (noDataEl) {
      noDataEl.innerHTML = `
        <div class="no-results-icon">🔗</div>
        <div>${message}</div>
      `;
      noDataEl.style.display = 'block';
    }
  }

  // Display damage center mappings in proper table format
  function displayDamageCenterMappingsTable(mappings) {
    console.log('🎨 Displaying damage center mappings in table format:', mappings?.length || 0);
    console.log('🔍 DEBUG: Sample mapping data:', mappings?.[0]);
    
    // Hide no-data section
    const noDataEl = document.getElementById('no-mappings-data');
    console.log('🔍 DEBUG: no-mappings-data element found:', !!noDataEl);
    if (noDataEl) noDataEl.style.display = 'none';
    
    // Calculate statistics
    const totalMappings = mappings?.length || 0;
    const uniqueDamageCenters = [...new Set(mappings?.map(m => m.damage_center_id) || [])].length;
    const totalValue = mappings?.reduce((sum, mapping) => {
      const lineData = mapping.invoice_line || mapping.original_field_data || {};
      const lineTotal = parseFloat(lineData.line_total || 0);
      return sum + lineTotal;
    }, 0) || 0;
    
    // Update statistics
    const totalMappingsEl = document.getElementById('totalMappings');
    const totalDamageCentersEl = document.getElementById('totalDamageCenters');
    const totalMappingValueEl = document.getElementById('totalMappingValue');
    
    console.log('🔍 DEBUG: Statistics elements found:', {
      totalMappings: !!totalMappingsEl,
      totalDamageCenters: !!totalDamageCentersEl,
      totalMappingValue: !!totalMappingValueEl
    });
    
    if (totalMappingsEl) totalMappingsEl.textContent = totalMappings;
    if (totalDamageCentersEl) totalDamageCentersEl.textContent = uniqueDamageCenters;
    if (totalMappingValueEl) totalMappingValueEl.textContent = `₪${Math.round(totalValue).toLocaleString('he-IL')}`;
    
    // Group mappings by damage center
    const groupedMappings = {};
    mappings.forEach(mapping => {
      const centerId = mapping.damage_center_id || 'unknown';
      if (!groupedMappings[centerId]) {
        groupedMappings[centerId] = {
          center_name: mapping.damage_center_name || centerId,
          mappings: []
        };
      }
      groupedMappings[centerId].mappings.push(mapping);
    });

    // Build tables for each damage center
    const damageContainer = document.getElementById('damage-centers-container');
    console.log('🔍 DEBUG: damage-centers-container element found:', !!damageContainer);
    console.log('🔍 DEBUG: Grouped mappings:', Object.keys(groupedMappings).length, 'centers');
    
    const tablesHTML = Object.entries(groupedMappings).map(([centerId, group], index) => {
      const mappingsForCenter = group.mappings;
      const centerTotal = mappingsForCenter.reduce((sum, m) => {
        const lineData = m.invoice_line || m.original_field_data || {};
        return sum + parseFloat(lineData.line_total || 0);
      }, 0);

      // Build table rows for this center
      const tableRowsHTML = mappingsForCenter.map(mapping => {
        // Use original_field_data as fallback since JOINs aren't working
        const lineData = mapping.invoice_line || mapping.original_field_data || {};
        const invoiceData = mapping.invoice || { supplier_name: mapping.original_field_data?.supplier_name };
        const lineTotal = parseFloat(lineData.line_total || 0);

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; text-align: center; font-size: 12px;">${lineData.catalog_code || '-'}</td>
            <td style="padding: 8px; text-align: right; font-size: 12px;">${lineData.description || '-'}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">${invoiceData.supplier_name || '-'}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">${lineData.source || 'מקורי'}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">₪${(lineData.unit_price || 0).toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">${lineData.quantity || 1}</td>
            <td style="padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">₪${lineTotal.toLocaleString()}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="background: white; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Damage Center Header -->
          <div style="background: #059669; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" 
               onclick="toggleDamageCenterTable('${centerId}')">
            <div style="font-weight: bold; font-size: 16px;">
              מרכז נזק #${index + 1}: ${(group.center_name || 'לא מוגדר').replace(/^\d+\s*-\s*/, '')}
              <span style="font-size: 12px; opacity: 0.8; margin-right: 10px;">
                (${mappingsForCenter.length} הקצאות)
              </span>
            </div>
            <div style="font-weight: bold; font-size: 16px;">₪${centerTotal.toLocaleString()}</div>
          </div>
          
          <!-- Collapsible Table -->
          <div id="table-${centerId}" style="display: block;">
            <table style="width: 100%; border-collapse: collapse; direction: rtl;">
              <thead style="background: #f8fafc;">
                <tr>
                  <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-size: 12px;">קוד קטלוג</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0; font-size: 12px;">תיאור</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-size: 12px;">ספק/מוסך</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-size: 12px;">מקור</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-size: 12px;">מחיר יחידה</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-size: 12px;">כמות</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-size: 12px;">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    console.log('🔍 DEBUG: Generated HTML length:', tablesHTML.length);
    console.log('🔍 DEBUG: First 200 chars of HTML:', tablesHTML.substring(0, 200));
    
    if (damageContainer) {
      damageContainer.innerHTML = tablesHTML;
      console.log('🔍 DEBUG: HTML set to container');
      console.log('🔍 DEBUG: Container element ID:', damageContainer.id);
      console.log('🔍 DEBUG: Container element tag:', damageContainer.tagName);
      console.log('🔍 DEBUG: Container parent element:', damageContainer.parentElement?.id);
      console.log('🔍 DEBUG: Container style display:', damageContainer.style.display);
      console.log('🔍 DEBUG: Container actual innerHTML first 500 chars:', damageContainer.innerHTML.substring(0, 500));
    } else {
      console.error('❌ damage-centers-container not found!');
    }
    
    // Show sections
    const summaryEl = document.getElementById('mappings-summary');
    const containerEl = document.getElementById('damage-centers-container');
    
    console.log('🔍 DEBUG: Showing sections:', {
      summary: !!summaryEl,
      container: !!containerEl
    });
    
    if (summaryEl) {
      summaryEl.style.display = 'block';
      console.log('🔍 DEBUG: Summary element display set to block');
    }
    if (containerEl) {
      containerEl.style.display = 'block';
      containerEl.style.visibility = 'visible';
      containerEl.style.height = 'auto';
      containerEl.style.overflow = 'visible';
      console.log('🔍 DEBUG: Container element display set to block');
      console.log('🔍 DEBUG: Container innerHTML length after setting:', containerEl.innerHTML.length);
      console.log('🔍 DEBUG: Container computed styles:', window.getComputedStyle(containerEl).display);
      console.log('🔍 DEBUG: Container parent tab visibility:', containerEl.parentElement?.style.display);
      
      // Force refresh the parent tab content
      const tabMappings = document.getElementById('tab-mappings');
      if (tabMappings) {
        tabMappings.style.display = 'block';
        console.log('🔍 DEBUG: Tab-mappings display set to block');
      }
    }
    
    console.log('✅ Damage center mappings tables displayed');
  }

  // Toggle damage center table visibility
  window.toggleDamageCenterTable = function(centerId) {
    const table = document.getElementById(`table-${centerId}`);
    if (table) {
      table.style.display = table.style.display === 'none' ? 'block' : 'none';
    }
  };

  // TAB 3 - Load Invoice Validations (Simple implementation)
  async function loadInvoiceValidations() {
    console.log('✅ Loading invoice validations...');
    const container = document.getElementById('validationsContainer');
    
    container.innerHTML = `
      <div class="search-result-item">
        <div class="result-header">
          <div class="result-name">✅ אימות חשבוניות</div>
          <div class="result-price">פיתוח עתידי</div>
        </div>
        <div class="result-details">
          <div class="result-detail">
            <strong>מצב:</strong> תכונה זו תתווסף בעדכון עתידי
          </div>
          <div class="result-detail">
            <strong>מטרה:</strong> הצגת תוצאות אימות וולידציה של חשבוניות
          </div>
        </div>
        <div class="result-description">
          תכונה זו תציג מידע על סטטוס האימות, שגיאות, אזהרות ואישורים של חשבוניות
        </div>
      </div>
    `;
  }
  
  // SESSION 49: TAB 1 HELPER - Toggle damage center group collapse
  window.toggleDamageCenterGroup = function(groupId) {
    const groupContent = document.getElementById(`group-${groupId}`);
    if (groupContent) {
      groupContent.style.display = groupContent.style.display === 'none' ? 'block' : 'none';
    }
  };
  
  // SESSION 50: TAB 1 - Save individual field (inline editing)
  window.savePartField = async function(centerId, partIndex, fieldName, newValue) {
    console.log(`💾 SESSION 50: Saving field - Center: ${centerId}, Part: ${partIndex}, Field: ${fieldName}, Value: ${newValue}`);
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        alert('לא נמצא מספר רישוי');
        return;
      }
      
      const centerIndex = window.helper?.centers?.findIndex(c => (c.Id || c.id) === centerId);
      if (centerIndex === -1) {
        alert('מרכז נזק לא נמצא');
        return;
      }
      
      const center = window.helper.centers[centerIndex];
      const parts = center.Parts?.parts_required || center.Parts?.parts || [];
      
      if (partIndex >= parts.length) {
        alert('חלק לא נמצא');
        return;
      }
      
      const part = parts[partIndex];
      
      // Parse value based on field type
      let parsedValue = newValue;
      if (fieldName === 'quantity') {
        parsedValue = parseInt(newValue) || 1;
      } else if (fieldName === 'price' || fieldName === 'reduction_percentage' || fieldName === 'wear_percentage') {
        parsedValue = parseFloat(newValue) || 0;
      } else {
        parsedValue = newValue.trim();
      }
      
      // Update Supabase if available
      if (window.supabase) {
        const updateData = {};
        updateData[fieldName] = parsedValue;
        updateData.updated_by = (window.caseOwnershipService?.getCurrentUser() || {}).userId || null;
        updateData.updated_at = new Date().toISOString();
        
        const { error } = await window.supabase
          .from('parts_required')
          .update(updateData)
          .eq('plate', plate.replace(/-/g, ''))
          .eq('damage_center_id', centerId)
          .eq('part_name', part.part_name || part.name);
        
        if (error) {
          console.error('❌ SESSION 50: Supabase update error:', error);
          throw error;
        }
      }
      
      // Update helper data
      part[fieldName] = parsedValue;
      
      // Also update common field aliases
      if (fieldName === 'catalog_code') {
        part.pcode = parsedValue;
        part.oem = parsedValue;
      } else if (fieldName === 'part_name') {
        part.name = parsedValue;
      } else if (fieldName === 'quantity') {
        part.qty = parsedValue;
      } else if (fieldName === 'price') {
        part.cost = parsedValue;
        part.expected_cost = parsedValue;
        part.price_per_unit = parsedValue;
      }
      
      console.log('✅ SESSION 50: Field saved successfully');
      
      // Refresh to update calculations
      tabsLoaded.required = false;
      loadRequiredParts();
      
    } catch (error) {
      console.error('❌ SESSION 50: Save error:', error);
      alert('שגיאה בשמירה: ' + error.message);
    }
  };
  
  // SESSION 50: TAB 1 HELPER - Edit required part with inline form
  window.editRequiredPart = async function(centerId, partIndex) {
    console.log(`✏️ SESSION 50: Edit part - Center: ${centerId}, Part: ${partIndex}`);
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        alert('לא נמצא מספר רישוי');
        return;
      }
      
      const centerIndex = window.helper?.centers?.findIndex(c => (c.Id || c.id) === centerId);
      if (centerIndex === -1) {
        alert('מרכז נזק לא נמצא');
        return;
      }
      
      const center = window.helper.centers[centerIndex];
      const parts = center.Parts?.parts_required || center.Parts?.parts || [];
      
      if (partIndex >= parts.length) {
        alert('חלק לא נמצא');
        return;
      }
      
      const part = parts[partIndex];
      
      // Create editable form modal
      const editModal = document.createElement('div');
      editModal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; padding: 25px; border-radius: 12px; z-index: 20000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3); min-width: 400px;
      `;
      
      editModal.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #28a745; text-align: right;">✏️ עריכת חלק</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; direction: rtl;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">קוד קטלוגי:</label>
            <input type="text" id="edit-code" value="${part.catalog_code || part.pcode || part.oem || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">שם החלק:</label>
            <input type="text" id="edit-name" value="${part.part_name || part.name || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">כמות:</label>
              <input type="number" id="edit-qty" value="${part.quantity || part.qty || 1}" min="1"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">מחיר יחידה:</label>
              <input type="number" id="edit-price" value="${part.price_per_unit || part.price || part.cost || 0}" step="0.01"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">הנחה %:</label>
              <input type="number" id="edit-reduction" value="${part.reduction_percentage || part.reduction || 0}" min="0" max="100"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">בלאי %:</label>
              <input type="number" id="edit-wear" value="${part.wear_percentage || part.wear || 0}" min="0" max="100"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button id="save-edit-btn" style="flex: 1; background: #28a745; color: white; border: none; padding: 10px; 
                                            border-radius: 6px; cursor: pointer; font-weight: bold;">💾 שמור</button>
          <button id="cancel-edit-btn" style="flex: 1; background: #6c757d; color: white; border: none; padding: 10px; 
                                              border-radius: 6px; cursor: pointer; font-weight: bold;">✖ ביטול</button>
        </div>
      `;
      
      const backdrop = document.createElement('div');
      backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 19999;';
      
      document.body.appendChild(backdrop);
      document.body.appendChild(editModal);
      
      // Close modal function
      const closeModal = () => {
        backdrop.remove();
        editModal.remove();
      };
      
      // Cancel button
      document.getElementById('cancel-edit-btn').onclick = closeModal;
      backdrop.onclick = closeModal;
      
      // Save button
      document.getElementById('save-edit-btn').onclick = async () => {
        try {
          const newCatalogCode = document.getElementById('edit-code').value.trim();
          const newPartName = document.getElementById('edit-name').value.trim();
          const newQuantity = parseInt(document.getElementById('edit-qty').value) || 1;
          const newPrice = parseFloat(document.getElementById('edit-price').value) || 0;
          const newReduction = parseFloat(document.getElementById('edit-reduction').value) || 0;
          const newWear = parseFloat(document.getElementById('edit-wear').value) || 0;
        
          // Calculate total_cost with reductions (like wizard does)
          const priceAfterReduction = newPrice * (1 - newReduction / 100);
          const updatedPrice = priceAfterReduction * (1 - newWear / 100);
          const totalCost = updatedPrice * newQuantity;
          
          // Update Supabase if available (using correct column names from schema)
          if (window.supabase) {
            const supabaseData = {
              pcode: newCatalogCode,
              oem: newCatalogCode,
              part_name: newPartName,
              quantity: newQuantity,
              price_per_unit: newPrice,
              price: newPrice,
              reduction_percentage: newReduction,
              wear_percentage: newWear,
              updated_price: updatedPrice,  // price after reductions
              total_cost: totalCost  // final total cost
            };
            
            const { error } = await window.supabase
              .from('parts_required')
              .update(supabaseData)
              .eq('plate', plate.replace(/-/g, ''))
              .eq('damage_center_code', centerId)
              .eq('part_name', part.part_name || part.name);
            
            if (error) {
              console.error('❌ SESSION 50: Supabase update error:', error);
              throw error;
            }
          }
          
          // Update helper data with ALL calculated fields
          parts[partIndex] = {
            ...part,
            catalog_code: newCatalogCode,
            pcode: newCatalogCode,
            oem: newCatalogCode,
            part_name: newPartName,
            name: newPartName,
            quantity: newQuantity,
            qty: newQuantity,
            price: newPrice,
            cost: newPrice,
            expected_cost: newPrice,
            price_per_unit: newPrice,
            reduction_percentage: newReduction,
            reduction: newReduction,
            wear_percentage: newWear,
            wear: newWear,
            updated_price: updatedPrice,
            total_cost: totalCost  // THIS IS KEY - updates helper total_cost
          };
          
          console.log('✅ SESSION 50: Part edited successfully, total_cost:', totalCost);
          
          closeModal();
          
          // Trigger UI updates in final report if the function exists
          if (typeof window.updatePartsRequiredUI === 'function') {
            window.updatePartsRequiredUI();
          }
          if (typeof window.refreshFinalReportSections === 'function') {
            window.refreshFinalReportSections();
          }
          if (typeof window.recalculateAllTotals === 'function') {
            window.recalculateAllTotals();
          }
          
          tabsLoaded.required = false;
          loadRequiredParts();
          
        } catch (error) {
          console.error('❌ SESSION 50: Edit error:', error);
          alert('שגיאה בעריכת החלק: ' + error.message);
        }
      };
      
    } catch (error) {
      console.error('❌ SESSION 50: Edit error:', error);
      alert('שגיאה בעריכת החלק: ' + error.message);
    }
  };
  
  // SESSION 49: TAB 1 HELPER - Delete required part
  window.deleteRequiredPart = async function(centerId, partIndex) {
    console.log(`🗑️ SESSION 49: Delete part - Center: ${centerId}, Part: ${partIndex}`);
    
    if (!confirm('האם למחוק חלק זה?')) {
      return;
    }
    
    try {
      // Get plate
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        alert('לא נמצא מספר רישוי');
        return;
      }
      
      // Find center in helper
      const centerIndex = window.helper?.centers?.findIndex(c => 
        (c.Id || c.id) === centerId
      );
      
      if (centerIndex !== -1 && window.helper.centers[centerIndex]) {
        const center = window.helper.centers[centerIndex];
        const parts = center.Parts?.parts_required || center.Parts?.parts || [];
        
        if (partIndex < parts.length) {
          const partToDelete = parts[partIndex];
          
          // Delete from Supabase first (if available)
          if (window.supabase) {
            const { error } = await window.supabase
              .from('parts_required')
              .delete()
              .eq('plate', plate.replace(/-/g, ''))
              .eq('damage_center_id', centerId)
              .eq('part_name', partToDelete.part_name || partToDelete.name);
            
            if (error) {
              console.error('❌ SESSION 49: Supabase delete error:', error);
              throw error;
            }
          } else {
            console.warn('⚠️ SESSION 50: Supabase not available, deleting from helper only');
          }
          
          // Delete from helper
          parts.splice(partIndex, 1);
          
          // Update sessionStorage
          sessionStorage.setItem('helper', JSON.stringify(window.helper));
          
          // Reload tab
          tabsLoaded.required = false;
          loadRequiredParts();
          
          console.log('✅ SESSION 50: Part deleted successfully');
        }
      }
    } catch (error) {
      console.error('❌ SESSION 49: Delete error:', error);
      alert('שגיאה במחיקת החלק: ' + error.message);
    }
  };
  
  // SESSION 50: TAB 2 - Load Selected Parts (EXACT COPY from PiP getSelectedParts)
  async function loadSelectedParts() {
    console.log('✅ SESSION 50: Loading selected parts (using PiP logic)...');
    const container = document.getElementById('selectedPartsContainer');
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        container.innerHTML = '<div class="no-results">לא נמצא מספר רישוי</div>';
        return;
      }
      
      // Wait for Supabase to load if not available yet
      if (!window.supabase) {
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">🔄</div>
            <div>טוען חיבור Supabase...</div>
          </div>
        `;
        console.log('⏳ SESSION 50: Waiting for Supabase client...');
        await loadSupabaseClient();
      }
      
      if (!window.supabase) {
        container.innerHTML = '<div class="no-results">⚠️ Supabase לא זמין</div>';
        return;
      }
      
      // SESSION 84: Use OR query to match both plate formats (with and without dashes)
      const plateNoDashes = plate.replace(/-/g, '');
      const plateWithDashes = plate.includes('-') ? plate : 
                              plate.replace(/(\d{3})(\d{2})(\d{3})/, '$1-$2-$3');
      
      console.log('🔍 SESSION 84: Querying Supabase for plate (both formats):', plateNoDashes, 'OR', plateWithDashes);
      
      const { data, error } = await window.supabase
        .from('selected_parts')
        .select('*')
        .or(`plate.eq.${plateNoDashes},plate.eq.${plateWithDashes}`)
        .order('selected_at', { ascending: false });
      
      if (error) {
        console.error('❌ SESSION 50: Supabase error:', error);
        throw error;
      }
      
      const selectedParts = data || [];
      console.log(`📊 SESSION 50: Found ${selectedParts.length} selected parts for plate "${plate}"`);
      
      // Debug: If no results, check what plates exist
      if (selectedParts.length === 0) {
        try {
          const { data: allPlates } = await window.supabase
            .from('selected_parts')
            .select('plate')
            .limit(20);
          const uniquePlates = [...new Set(allPlates?.map(p => p.plate) || [])];
          console.log('🔍 SESSION 50: Available plates in selected_parts:', uniquePlates);
          console.log('💡 Your query plate:', plate);
        } catch (e) {
          console.warn('Could not fetch debug plates:', e);
        }
      }
      
      if (!selectedParts || selectedParts.length === 0) {
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📭</div>
            <div>לא נמצאו הקצאות נזק</div>
          </div>
        `;
        document.getElementById('totalSelectedParts').textContent = '0';
        document.getElementById('avgSelectedPrice').textContent = '₪0';
        document.getElementById('totalSelectedCost').textContent = '₪0';
        return;
      }
      
      // Calculate statistics (from PiP reference)
      const totalParts = selectedParts.length;
      const subtotal = selectedParts.reduce((sum, part) => {
        const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
        const qty = parseInt(part.quantity || part.qty || 1);
        return sum + (price * qty);
      }, 0);
      const avgPrice = totalParts > 0 ? subtotal / totalParts : 0;
      
      document.getElementById('totalSelectedParts').textContent = totalParts;
      document.getElementById('avgSelectedPrice').textContent = `₪${Math.round(avgPrice).toLocaleString('he-IL')}`;
      document.getElementById('totalSelectedCost').textContent = `₪${Math.round(subtotal).toLocaleString('he-IL')}`;
      
      // Build table rows (exact format from PiP - lines 4727-4784)
      const tableRows = selectedParts.map((part, index) => {
        const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
        const qty = parseInt(part.quantity || part.qty || 1);
        const calculatedPrice = price * qty;
        
        return `
        <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center; width: 40px;">
            <input type="checkbox" class="part-checkbox" data-part-id="${part.id}" data-part-index="${index}" 
                   style="width: 14px; height: 14px; cursor: pointer;">
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
            ${index + 1}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
            ${part.pcode || part.oem || 'N/A'}
          </td>
          <td style="padding: 8px 10px; text-align: right; font-size: 11px; color: #1f2937;">
            ${part.part_family || part.group || 'N/A'} - ${part.part_name || part.name || 'N/A'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #4b5563;">
            ${part.source || 'N/A'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #059669; font-weight: 600;">
            ${price ? '₪' + price.toLocaleString('he-IL', {minimumFractionDigits: 2}) : '-'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #1f2937;">
            ${qty}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #059669; font-weight: 700;">
            ${calculatedPrice ? '₪' + calculatedPrice.toLocaleString('he-IL', {minimumFractionDigits: 2}) : '-'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #4b5563;">
            ${part.supplier || part.supplier_name || '-'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
            ${part.selected_at ? new Date(part.selected_at).toLocaleDateString('he-IL', { 
              year: '2-digit', month: '2-digit', day: '2-digit'
            }) : 'N/A'}
          </td>
          <td style="padding: 8px; text-align: center; white-space: nowrap;">
            <button onclick="editSelectedPartTab2(${index})" 
                    style="background: #f59e0b; color: white; border: none; padding: 4px 8px; 
                           border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin-left: 3px;"
                    onmouseover="this.style.background='#d97706'" 
                    onmouseout="this.style.background='#f59e0b'">
              ✏️
            </button>
            <button onclick="deleteSelectedPartTab2('${part.id}', '${part.plate}')" 
                    style="background: #ef4444; color: white; border: none; padding: 4px 8px; 
                           border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;"
                    onmouseover="this.style.background='#dc2626'" 
                    onmouseout="this.style.background='#ef4444'">
              🗑️
            </button>
          </td>
        </tr>
      `}).join('');
      
      // Build full table with PiP styling (lines 4837-4860)
      container.innerHTML = `
        <div style="max-height: 500px; overflow-y: auto; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; direction: rtl;">
            <thead style="background: #10b981; color: white; position: sticky; top: 0; z-index: 1;">
              <tr>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 35px; font-size: 11px;">
                  <input type="checkbox" id="selectAllParts" 
                         style="width: 12px; height: 12px; cursor: pointer;"
                         onchange="window.toggleSelectAllTab2(this.checked)">
                </th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 40px; font-size: 11px;">#</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 100px; font-size: 11px;">קוד</th>
                <th style="padding: 8px 10px; text-align: right; border: 1px solid #059669; min-width: 200px; font-size: 11px;">שם החלק</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 80px; font-size: 11px;">מקור</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 80px; font-size: 11px;">מחיר</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 50px; font-size: 11px;">כמות</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 90px; font-size: 11px;">סכום</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 120px; font-size: 11px;">ספק</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 110px; font-size: 11px;">תאריך</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 140px; font-size: 11px;">פעולות</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        
        <!-- Subtotal Section (lines 4863-4878) -->
        <div style="background: #f0fdf4; padding: 15px; margin-top: 10px; border: 2px solid #10b981; border-radius: 8px; text-align: right; direction: rtl;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">
              סה"כ עלות משוערת:
            </div>
            <div style="text-align: left;">
              <div style="font-size: 18px; font-weight: 700; color: #059669;">
                ₪${subtotal.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                ${totalParts} חלקים • המחירים הינם משוערים בלבד
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('❌ SESSION 50: Error loading selected parts:', error);
      container.innerHTML = `<div class="no-results">שגיאה: ${error.message}</div>`;
    }
  }
  
  // SESSION 50: Tab 2 Helper Functions
  window.editSelectedPartTab2 = async function(partIndex) {
    alert('עריכת חלק נבחר - תתווסף בהמשך');
  };
  
  window.deleteSelectedPartTab2 = async function(partId, plate) {
    if (!confirm('האם למחוק חלק נבחר זה?')) return;
    
    try {
      if (!window.supabase) {
        alert('Supabase לא זמין - לא ניתן למחוק');
        return;
      }
      
      const { error } = await window.supabase
        .from('selected_parts')
        .delete()
        .eq('id', partId);
      
      if (error) throw error;
      
      // Reload Tab 2
      tabsLoaded.selected = false;
      loadSelectedParts();
    } catch (error) {
      alert('שגיאה במחיקה: ' + error.message);
    }
  };
  
  window.toggleSelectAllTab2 = function(checked) {
    document.querySelectorAll('.part-checkbox').forEach(cb => cb.checked = checked);
  };
  
  // SESSION 50: TAB 3 - EXACT COPY from showAllSearchResults (parts search.html:4979-5125)
  async function loadSearchResults() {
    console.log('📊 SESSION 50: Loading search results (using PiP logic)...');
    const container = document.getElementById('searchResultsContainer');
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        container.innerHTML = '<div class="no-results">❌ לא נמצא מספר רישוי</div>';
        return;
      }
      
      // Wait for Supabase
      if (!window.supabase) {
        console.log('⏳ SESSION 50: Waiting for Supabase client for Tab 3...');
        await loadSupabaseClient();
      }
      
      if (!window.supabase) {
        container.innerHTML = '<div class="no-results">⚠️ Supabase לא זמין</div>';
        return;
      }
      
      // EXACT COPY from showAllSearchResults - Normalize plate (remove dashes)
      const normalizedPlate = plate.replace(/-/g, '');
      console.log('📋 SESSION 50: Normalized plate:', plate, '→', normalizedPlate);
      
      // Step 1: Get case_id from cases table (EXACT COPY from PiP)
      const { data: casesData, error: caseError } = await window.supabase
        .from('cases')
        .select('id, filing_case_id')
        .eq('plate', normalizedPlate)
        .order('created_at', { ascending: false });
      
      if (caseError) {
        console.error('❌ SESSION 50: Failed to query cases:', caseError);
        throw new Error(`Failed to query cases: ${caseError.message}`);
      }
      
      const activeCase = casesData?.find(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS') || casesData?.[0];
      
      if (!activeCase) {
        console.error('❌ SESSION 50: No case found for plate:', plate);
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📦</div>
            <div>לא נמצא תיק עבור רכב זה</div>
          </div>
        `;
        return;
      }
      
      const caseUuid = activeCase.id;
      console.log('✅ SESSION 50: Found case UUID:', caseUuid);
      
      // Step 2: Get ALL sessions for this case (EXACT COPY from PiP)
      const { data: allSessions, error: sessionsError } = await window.supabase
        .from('parts_search_sessions')
        .select('id, plate, created_at')
        .eq('case_id', caseUuid);
      
      console.log(`📋 SESSION 50: Found ${allSessions?.length || 0} total sessions for case`);
      
      // Filter sessions by plate (normalize both sides for comparison)
      const sessions = allSessions?.filter(session => {
        const sessionPlate = session.plate?.replace(/-/g, '') || '';
        const queryPlate = normalizedPlate;
        return sessionPlate === queryPlate;
      }) || [];
      
      console.log(`✅ SESSION 50: Filtered to ${sessions.length} sessions matching plate`);
      
      if (sessionsError) {
        console.error('❌ SESSION 50: Error loading sessions:', sessionsError);
        throw new Error('שגיאה בטעינת היסטוריית חיפושים: ' + sessionsError.message);
      }
      
      if (!sessions || sessions.length === 0) {
        console.log('⚠️ SESSION 50: No search sessions found');
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📦</div>
            <div>לא נמצאו חיפושים עבור רכב זה</div>
          </div>
        `;
        return;
      }
      
      // Step 3: Get results for all sessions using OR filter (EXACT COPY from PiP)
      const sessionIds = sessions.map(s => s.id);
      console.log('📋 SESSION 50: Querying results for session IDs:', sessionIds);
      
      let query = window.supabase
        .from('parts_search_results')
        .select('*');
      
      // Use or() filter with multiple session_id matches
      if (sessionIds.length > 0) {
        const orFilters = sessionIds.map(id => `session_id.eq.${id}`).join(',');
        query = query.or(orFilters);
      }
      
      const { data: searchResults, error: resultsError } = await query.order('created_at', { ascending: false });
      
      if (resultsError) {
        console.error('❌ SESSION 50: Error loading search results:', resultsError);
        throw new Error('שגיאה בטעינת אימות חשבוניות: ' + resultsError.message);
      }
      
      console.log(`✅ SESSION 50: Loaded ${searchResults?.length || 0} search result records`);
      
      // Flatten all results from all searches (EXACT COPY from PiP lines 5078-5103)
      let allResults = [];
      let totalSearches = 0;
      
      if (searchResults && searchResults.length > 0) {
        searchResults.forEach(record => {
          totalSearches++;
          console.log(`📦 SESSION 50: Processing record ${totalSearches}`);
          
          // The results are stored in the 'results' JSONB field
          const results = record.results || [];
          console.log(`  └─ Results array length: ${results.length}`);
          
          // Add metadata to each result
          if (Array.isArray(results)) {
            results.forEach(result => {
              allResults.push({
                ...result,
                search_date: record.created_at,
                search_session_id: record.session_id,
                data_source: record.search_query?.data_source || record.data_source || 'catalog'
              });
            });
          }
        });
      }
      
      console.log(`📊 SESSION 50: Total searches: ${totalSearches}, Total results: ${allResults.length}`);
      
      displaySearchResults(allResults, container);
      
    } catch (error) {
      console.error('❌ SESSION 50: Error in loadSearchResults:', error);
      container.innerHTML = `<div class="no-results">שגיאה: ${error.message}</div>`;
    }
  }
  
  // SESSION 50: Display search results in Tab 3 (based on PiP createSearchResultsModal - lines 5128-5320)
  function displaySearchResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">📦</div>
          <div>לא נמצאו אימות חשבוניות</div>
        </div>
      `;
      return;
    }
    
    // Build table rows (exact format from PiP lines 5161-5184)
    const tableRows = results.map((result, index) => {
      const price = parseFloat(result.price || result.cost || 0);
      const formattedPrice = price ? `₪${price.toLocaleString('he-IL')}` : 'לא זמין';
      const searchDate = result.search_date ? new Date(result.search_date).toLocaleDateString('he-IL', {
        year: '2-digit', month: '2-digit', day: '2-digit'
      }) : 'לא זמין';
      const dataSource = result.data_source === 'catalog' ? 'קטלוגי' : 
                        result.data_source === 'web' ? 'אינטרנט' : 
                        result.data_source === 'ocr' ? 'OCR' : result.data_source || 'לא זמין';
      
      return `
        <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center; font-size: 11px; color: #6b7280;">${searchDate}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px;">
            <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 10px;">
              ${dataSource}
            </span>
          </td>
          <td style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600; color: #1f2937;">${result.supplier_name || result.supplier || 'לא זמין'}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px; font-family: monospace; color: #1e40af;">${result.pcode || result.oem || 'לא זמין'}</td>
          <td style="padding: 10px; text-align: right; font-size: 11px; color: #1f2937;">${result.cat_num_desc || result.part_name || result.description || 'לא זמין'}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px; color: #6b7280;">${result.part_family || result.group || 'לא מוגדר'}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600; color: #059669;">${formattedPrice}</td>
        </tr>
      `;
    }).join('');
    
    // Build full table (blue theme like PiP)
    container.innerHTML = `
      <div style="max-height: 500px; overflow-y: auto; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; direction: rtl;">
          <thead style="background: #3b82f6; color: white; position: sticky; top: 0; z-index: 1;">
            <tr>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 90px; font-size: 11px;">תאריך חיפוש</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 100px; font-size: 11px;">מקור נתונים</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 120px; font-size: 11px;">ספק</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 110px; font-size: 11px;">מק"ט</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #2563eb; min-width: 200px; font-size: 11px;">תיאור</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 120px; font-size: 11px;">משפחת חלק</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 100px; font-size: 11px;">מחיר</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      
      <!-- Summary section -->
      <div style="background: #eff6ff; padding: 12px 15px; margin-top: 10px; border: 2px solid #3b82f6; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 14px; font-weight: 600; color: #1e40af;">
          📊 סה"כ תוצאות: <span style="color: #2563eb; font-size: 16px;">${results.length}</span>
        </div>
      </div>
    `;
  }
  
  // SESSION 50: Fallback to helper data if Supabase unavailable
  function loadSearchResultsFromHelper() {
    const results = getPartsSearchResults();
    const summary = getSummaryData();
    const container = document.getElementById('searchResultsContainer');
    
    console.log('📦 Loading parts search results:', { results, summary });

    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">📦</div>
          <div>אין אימות חשבוניות זמינות</div>
          <div style="font-size: 14px; margin-top: 10px; color: #999;">
            בצע חיפוש חלקים כדי לראות תוצאות כאן
          </div>
        </div>
      `;
      
      // SESSION 50: Tab 3 has NO statistics elements (user requested removal)
      return;
    }

    // SESSION 50: Tab 3 - NO statistics or recommendations (per user request)

    // Generate additional stats
    const suppliers = [...new Set(results.map(r => r.supplier).filter(Boolean))];
    const conditions = [...new Set(results.map(r => r.condition).filter(Boolean))];
    const categories = [...new Set(results.map(r => r.category).filter(Boolean))];

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${suppliers.length}</div>
        <div class="stat-label">ספקים</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${conditions.length}</div>
        <div class="stat-label">מצבי חלקים</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${categories.length}</div>
        <div class="stat-label">קטגוריות</div>
      </div>
    `;

    // Display results
    container.innerHTML = results.map((result, index) => `
      <div class="search-result-item unselected-part" data-part-index="${index}">
        <div class="result-header">
          <div class="result-name">${result.name || 'חלק ללא שם'}</div>
          <div class="result-price">₪${parseFloat(result.price || 0).toLocaleString('he-IL')}</div>
        </div>
        <div class="result-selection">
          <input type="checkbox" id="part-${index}" onchange="togglePartSelection(${index})">
          <label for="part-${index}">בחר חלק זה</label>
        </div>
        <div class="result-details">
          <div class="result-detail">
            <strong>ספק:</strong> ${result.supplier || 'לא צוין'}
          </div>
          <div class="result-detail">
            <strong>מיקום:</strong> ${result.location || 'לא צוין'}
          </div>
          <div class="result-detail">
            <strong>מצב:</strong> ${result.condition || 'לא צוין'}
          </div>
          <div class="result-detail">
            <strong>קטגוריה:</strong> ${result.category || 'לא צוינה'}
          </div>
          ${result.part_number ? `
          <div class="result-detail">
            <strong>מק"ט:</strong> ${result.part_number}
          </div>
          ` : ''}
          ${result.compatibility ? `
          <div class="result-detail">
            <strong>תאימות:</strong> ${result.compatibility}
          </div>
          ` : ''}
        </div>
        ${result.description ? `
        <div class="result-description">
          ${result.description}
        </div>
        ` : ''}
      </div>
    `).join('');

    console.log('✅ Parts search results loaded successfully');
  }
  
  // Parts selection functionality - INTEGRATION WITH HELPER.PARTS_SEARCH
  let selectedParts = new Set();
  let allParts = [];
  
  function updateSelectionSummary() {
    const selectedCount = selectedParts.size;
    const unselectedCount = allParts.length - selectedCount;
    
    const selectedCountEl = document.getElementById('selectedCount');
    const unselectedCountEl = document.getElementById('unselectedCount');
    const summaryEl = document.getElementById('selectionSummary');
    
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (unselectedCountEl) unselectedCountEl.textContent = unselectedCount;
    
    if (summaryEl && allParts.length > 0) {
      summaryEl.style.display = 'block';
    } else if (summaryEl) {
      summaryEl.style.display = 'none';
    }
  }
  
  // Make togglePartSelection globally available
  window.togglePartSelection = function(partIndex) {
    if (selectedParts.has(partIndex)) {
      selectedParts.delete(partIndex);
    } else {
      selectedParts.add(partIndex);
    }
    
    // Update UI
    const partElement = document.querySelector(`[data-part-index="${partIndex}"]`);
    if (partElement) {
      if (selectedParts.has(partIndex)) {
        partElement.classList.add('selected-part');
        partElement.classList.remove('unselected-part');
      } else {
        partElement.classList.remove('selected-part');
        partElement.classList.add('unselected-part');
      }
    }
    
    updateSelectionSummary();
  };
  
  // Global functions for parts selection
  window.toggleSelectAllParts = function() {
    const selectAllBtn = document.querySelector('.results-btn.select-all');
    if (!selectAllBtn) return;
    
    if (selectedParts.size === allParts.length) {
      // Unselect all
      selectedParts.clear();
      selectAllBtn.textContent = 'בחר הכל';
      
      // Update UI
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('selected-part');
        item.classList.add('unselected-part');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
      });
    } else {
      // Select all
      selectedParts.clear();
      allParts.forEach((_, index) => selectedParts.add(index));
      selectAllBtn.textContent = 'בטל הכל';
      
      // Update UI
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.add('selected-part');
        item.classList.remove('unselected-part');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
      });
    }
    
    updateSelectionSummary();
  };
  
  window.savePartsSelection = function() {
    if (!window.helper) {
      console.error('❌ Helper not available for saving parts selection');
      alert('שגיאה: לא ניתן לשמור את הבחירה');
      return;
    }
    
    // Get current search results
    const results = getPartsSearchResults();
    if (!results || results.length === 0) {
      alert('אין אימות חשבוניות לשמירה');
      return;
    }
    
    // Prepare selected and unselected parts arrays
    const selectedPartsArray = [];
    const unselectedPartsArray = [];
    
    results.forEach((part, index) => {
      const partData = {
        ...part,
        selection_date: new Date().toISOString(),
        search_session: window.helper.parts_search?.summary?.last_search || new Date().toISOString()
      };
      
      if (selectedParts.has(index)) {
        selectedPartsArray.push(partData);
      } else {
        unselectedPartsArray.push(partData);
      }
    });
    
    // Initialize helper.parts_search if needed
    if (!window.helper.parts_search) {
      window.helper.parts_search = {
        search_history: [],
        all_results: [],
        results: [],
        summary: {
          total_searches: 0,
          total_results: 0,
          selected_count: 0,
          last_search: ''
        }
      };
    }
    
    // Store the selection according to helper structure
    window.helper.parts_search.selected_parts = selectedPartsArray;
    window.helper.parts_search.unselected_parts = unselectedPartsArray;
    window.helper.parts_search.summary.selected_count = selectedPartsArray.length;
    window.helper.parts_search.last_selection_date = new Date().toISOString();
    
    // Also store all results for reference
    window.helper.parts_search.all_results = results;
    
    // Save to storage
    try {
      const helperString = JSON.stringify(window.helper);
      sessionStorage.setItem('helper', helperString);
      localStorage.setItem('helper_data', helperString);
      
      console.log('✅ Parts selection saved to helper:');
      console.log('Selected parts:', selectedPartsArray.length);
      console.log('Unselected parts:', unselectedPartsArray.length);
      
      // Trigger helper update event
      document.dispatchEvent(new CustomEvent('helperUpdate', {
        detail: 'parts_selection_updated'
      }));
      
      alert(`נשמר בהצלחה!\nנבחרו: ${selectedPartsArray.length} חלקים\nלא נבחרו: ${unselectedPartsArray.length} חלקים`);
      
    } catch (error) {
      console.error('❌ Error saving parts selection:', error);
      alert('שגיאה בשמירת הבחירה');
    }
  };
  
  // SESSION 49: Initialize allParts when Tab 3 results are loaded
  const originalLoadSearchResults = loadSearchResults;
  loadSearchResults = function() {
    originalLoadSearchResults();
    
    // Update allParts array for selection functionality (Tab 3)
    allParts = getPartsSearchResults() || [];
    selectedParts.clear();
    updateSelectionSummary();
  };
  
})();