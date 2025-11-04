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
      max-width: 800px;
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
    
    .invoice-btn.view-doc {
      background: #3b82f6;
      color: white;
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
    
    /* Loading Spinner */
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #fbbf24;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
      <button class="tab-btn active" onclick="setInvoiceTab('documents')">
        📄 מסמכי חשבונית
      </button>
      <button class="tab-btn" onclick="setInvoiceTab('mappings')">
        🔗 הקצאות למוקדי נזק
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content">
      <div id="documentsTab" class="tab-section active">
        <div id="documentsContent">
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

  // Global variables
  let currentTab = 'documents';
  let currentCaseId = null;

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
    
    // Load tab data
    if (tabName === 'documents') {
      loadInvoiceDocuments();
    } else if (tabName === 'mappings') {
      loadDamageCenterMappings();
    }
  };

  // Get current case ID from helper or derive from plate (like parts floating screen)
  async function getCurrentCaseId() {
    // First try to get case ID directly from helper (preferred)
    if (window.helper?.case_info?.supabase_case_id && isValidUUID(window.helper.case_info.supabase_case_id)) {
      console.log('✅ Found case ID from helper.case_info.supabase_case_id:', window.helper.case_info.supabase_case_id);
      return window.helper.case_info.supabase_case_id;
    }
    
    // Fallback: try other helper sources
    const otherSources = [
      { name: 'helper.cases.id', value: window.helper?.cases?.id },
      { name: 'helper.meta.case_id', value: window.helper?.meta?.case_id },
      { name: 'sessionStorage.currentCaseId', value: sessionStorage.getItem('currentCaseId') },
      { name: 'helper.damage_assessment.case_id', value: window.helper?.damage_assessment?.case_id }
    ];
    
    for (const source of otherSources) {
      if (source.value && isValidUUID(source.value)) {
        console.log(`✅ Found case ID from ${source.name}:`, source.value);
        return source.value;
      }
    }
    
    // If no direct case ID, try to derive from plate (like parts floating screen)
    const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
    if (plate && window.supabase) {
      console.log('🔍 No direct case ID found, trying to derive from plate:', plate);
      
      try {
        // Same logic as parts floating screen
        const normalizedPlate = plate.replace(/[\s-]/g, '');
        
        const { data: casesData, error: caseError } = await window.supabase
          .from('cases')
          .select('id, filing_case_id')
          .eq('plate', normalizedPlate)
          .order('created_at', { ascending: false });
        
        if (caseError) {
          console.error('❌ Error querying cases:', caseError);
          return null;
        }
        
        if (casesData && casesData.length > 0) {
          const caseId = casesData[0].id;
          console.log('✅ Derived case ID from plate:', caseId);
          
          // Store it in helper for future use
          if (window.helper && !window.helper.case_info) {
            window.helper.case_info = {};
          }
          if (window.helper?.case_info) {
            window.helper.case_info.supabase_case_id = caseId;
          }
          
          return caseId;
        }
      } catch (error) {
        console.error('❌ Error deriving case ID from plate:', error);
      }
    }
    
    console.warn('⚠️ No valid case ID found. Available sources:', {
      'helper available': !!window.helper,
      'helper.case_info.supabase_case_id': window.helper?.case_info?.supabase_case_id,
      'helper.meta.plate': window.helper?.meta?.plate,
      'helper.vehicle.plate': window.helper?.vehicle?.plate,
      'other sources': otherSources.reduce((acc, s) => ({ ...acc, [s.name]: s.value }), {})
    });
    
    return null;
  }

  // Helper function to validate UUID format
  function isValidUUID(str) {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Load invoice documents from invoice_documents table
  async function loadInvoiceDocuments() {
    const contentDiv = document.getElementById('documentsContent');
    
    try {
      currentCaseId = await getCurrentCaseId();
      
      if (!currentCaseId) {
        const hasHelper = !!window.helper;
        const hasPlate = !!(window.helper?.meta?.plate || window.helper?.vehicle?.plate);
        
        contentDiv.innerHTML = `
          <div class="no-data-message">
            <div class="no-data-icon">❌</div>
            <div style="font-weight: bold; margin-bottom: 8px;">לא נמצא מזהה תיק</div>
            <div style="font-size: 14px;">לא ניתן לטעון מסמכי חשבונית ללא מזהה תיק</div>
            <div style="font-size: 12px; margin-top: 10px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
              <strong>מצב מערכת:</strong><br>
              Helper זמין: ${hasHelper ? '✅' : '❌'}<br>
              מספר רישוי: ${hasPlate ? '✅' : '❌'}<br>
              ${!hasHelper ? 'טען תיק תחילה' : !hasPlate ? 'מספר רישוי חסר' : 'לא נמצא תיק במאגר'}
            </div>
          </div>
        `;
        return;
      }

      // Show loading state
      contentDiv.innerHTML = `
        <div class="invoice-section">
          <h4><span class="loading-spinner"></span> טוען מסמכי חשבונית...</h4>
          <p>מחפש חשבוניות עבור תיק: ${currentCaseId}</p>
        </div>
      `;

      if (!window.supabase) {
        throw new Error('Supabase client לא זמין');
      }

      // Query invoice_documents table directly
      const { data: invoiceDocuments, error } = await window.supabase
        .from('invoice_documents')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            supplier_name,
            total_amount,
            status
          )
        `)
        .eq('case_id', currentCaseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      console.log('✅ Loaded invoice documents:', invoiceDocuments);
      
      // Display the invoice documents
      displayInvoiceDocuments(invoiceDocuments || []);

    } catch (error) {
      console.error('❌ Error loading invoice documents:', error);
      contentDiv.innerHTML = `
        <div class="invoice-section">
          <h4>❌ שגיאה בטעינת מסמכי חשבונית</h4>
          <p>שגיאה: ${error.message}</p>
          <p>מזהה תיק: ${currentCaseId || 'לא נמצא'}</p>
        </div>
      `;
    }
  }

  // Display invoice documents
  function displayInvoiceDocuments(documents) {
    const contentDiv = document.getElementById('documentsContent');
    
    if (!documents || documents.length === 0) {
      contentDiv.innerHTML = `
        <div class="no-data-message">
          <div class="no-data-icon">📋</div>
          <div style="font-weight: bold; margin-bottom: 8px;">לא נמצאו מסמכי חשבונית</div>
          <div style="font-size: 14px;">לא נמצאו מסמכי חשבונית עבור תיק זה</div>
        </div>
      `;
      return;
    }

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

    let content = `
      <div class="invoice-section">
        <h4>📄 מסמכי חשבונית (${documents.length})</h4>
        <p>נמצאו ${documents.length} מסמכי חשבונית עבור תיק ${currentCaseId}</p>
      </div>
    `;

    documents.forEach((doc, index) => {
      // Parse OCR structured data if available
      const ocrData = doc.ocr_structured_data || {};
      const invoiceDetails = ocrData.invoice_details || {};
      const items = ocrData.items || [];

      content += `
        <div class="invoice-section" style="margin-bottom: 20px; border: 2px solid #fbbf24;">
          <h4 style="background: #fbbf24; color: white; margin: -15px -15px 15px -15px; padding: 10px;">
            📄 מסמך #${index + 1} - ${formatValue(doc.filename)}
          </h4>
          
          <!-- Document Information -->
          <div class="invoice-field">
            <div class="label">שם קובץ:</div>
            <div class="value">${formatValue(doc.filename)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">תאריך העלאה:</div>
            <div class="value">${formatDate(doc.created_at)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">סטטוס OCR:</div>
            <div class="value">${formatValue(doc.ocr_status)}</div>
          </div>
          <div class="invoice-field">
            <div class="label">דיוק OCR:</div>
            <div class="value">${doc.ocr_confidence ? Math.round(doc.ocr_confidence) + '%' : '-'}</div>
          </div>
          <div class="invoice-field">
            <div class="label">שפה מזוהה:</div>
            <div class="value">${formatValue(doc.language_detected)}</div>
          </div>

          <!-- View Document Button -->
          <div style="text-align: center; margin: 15px 0;">
            <button onclick="viewInvoiceDocument('${doc.id}', '${doc.storage_path}', '${doc.storage_bucket}')" 
                    class="invoice-btn view-doc">
              👁️ צפה במסמך המקורי
            </button>
          </div>
      `;

      // Display OCR invoice details if available
      if (Object.keys(invoiceDetails).length > 0) {
        content += `
          <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <h5 style="color: #1e40af; margin-bottom: 10px;">📋 פרטי חשבונית מ-OCR:</h5>
        `;

        // Display all invoice details from OCR
        Object.entries(invoiceDetails).forEach(([key, value]) => {
          if (value && value !== 'לא זוהה' && value !== 'N/A') {
            content += `
              <div class="invoice-field">
                <div class="label">${key}:</div>
                <div class="value">${formatValue(value)}</div>
              </div>
            `;
          }
        });

        content += `</div>`;
      }

      // Display OCR items if available
      if (items && items.length > 0) {
        content += `
          <div style="margin-top: 20px;">
            <h5 style="color: #92400e; margin-bottom: 10px;">🔧 פריטי החשבונית מ-OCR (${items.length}):</h5>
            <table class="invoice-items-table">
              <thead>
                <tr>
                  <th>תיאור</th>
                  <th>כמות</th>
                  <th>מחיר יחידה</th>
                  <th>סה"כ</th>
                  <th>קטגוריה</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        items.forEach(item => {
          content += `
            <tr>
              <td>${formatValue(item.description || item.name)}</td>
              <td>${formatValue(item.quantity)}</td>
              <td>${formatPrice(item.unit_price || item.price)}</td>
              <td>${formatPrice(item.total_price || item.line_total)}</td>
              <td>${formatValue(item.category || item.type)}</td>
            </tr>
          `;
        });
        
        content += `
              </tbody>
            </table>
          </div>
        `;
      }

      // Display raw OCR text if available and no structured data
      if (doc.ocr_raw_text && Object.keys(ocrData).length === 0) {
        content += `
          <div style="margin-top: 20px;">
            <h5 style="color: #92400e; margin-bottom: 10px;">📄 טקסט OCR גולמי:</h5>
            <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; max-height: 200px; overflow-y: auto; font-size: 12px; white-space: pre-wrap;">${doc.ocr_raw_text}</div>
          </div>
        `;
      }

      content += `</div>`;
    });

    contentDiv.innerHTML = content;
  }

  // Load damage center mappings from invoice_damage_center_mappings table
  async function loadDamageCenterMappings() {
    const contentDiv = document.getElementById('mappingsContent');
    
    try {
      currentCaseId = await getCurrentCaseId();
      
      if (!currentCaseId) {
        const hasHelper = !!window.helper;
        const hasPlate = !!(window.helper?.meta?.plate || window.helper?.vehicle?.plate);
        
        contentDiv.innerHTML = `
          <div class="no-data-message">
            <div class="no-data-icon">❌</div>
            <div style="font-weight: bold; margin-bottom: 8px;">לא נמצא מזהה תיק</div>
            <div style="font-size: 14px;">לא ניתן לטעון הקצאות ללא מזהה תיק</div>
            <div style="font-size: 12px; margin-top: 10px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
              <strong>מצב מערכת:</strong><br>
              Helper זמין: ${hasHelper ? '✅' : '❌'}<br>
              מספר רישוי: ${hasPlate ? '✅' : '❌'}<br>
              ${!hasHelper ? 'טען תיק תחילה' : !hasPlate ? 'מספר רישוי חסר' : 'לא נמצא תיק במאגר'}
            </div>
          </div>
        `;
        return;
      }

      // Show loading state
      contentDiv.innerHTML = `
        <div class="invoice-section">
          <h4><span class="loading-spinner"></span> טוען הקצאות למוקדי נזק...</h4>
          <p>מחפש הקצאות עבור תיק: ${currentCaseId}</p>
        </div>
      `;

      if (!window.supabase) {
        throw new Error('Supabase client לא זמין');
      }

      // Query invoice_damage_center_mappings table directly
      const { data: mappings, error } = await window.supabase
        .from('invoice_damage_center_mappings')
        .select(`
          *,
          invoice:invoices(
            invoice_number,
            supplier_name,
            total_amount
          ),
          invoice_line:invoice_lines(
            description,
            quantity,
            unit_price,
            line_total
          )
        `)
        .eq('case_id', currentCaseId)
        .eq('mapping_status', 'active')
        .order('damage_center_id')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      console.log('✅ Loaded damage center mappings:', mappings);
      
      // Display the mappings
      displayDamageCenterMappings(mappings || []);

    } catch (error) {
      console.error('❌ Error loading damage center mappings:', error);
      contentDiv.innerHTML = `
        <div class="invoice-section">
          <h4>❌ שגיאה בטעינת הקצאות</h4>
          <p>שגיאה: ${error.message}</p>
          <p>מזהה תיק: ${currentCaseId || 'לא נמצא'}</p>
        </div>
      `;
    }
  }

  // Display damage center mappings
  function displayDamageCenterMappings(mappings) {
    const contentDiv = document.getElementById('mappingsContent');
    
    if (!mappings || mappings.length === 0) {
      contentDiv.innerHTML = `
        <div class="no-data-message">
          <div class="no-data-icon">🔗</div>
          <div style="font-weight: bold; margin-bottom: 8px;">לא נמצאו הקצאות</div>
          <div style="font-size: 14px;">לא נמצאו הקצאות של חלקי חשבונית למוקדי נזק עבור תיק זה</div>
        </div>
      `;
      return;
    }

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

    const getFieldTypeIcon = (fieldType) => {
      const icons = {
        'part': '🔧',
        'work': '⚙️', 
        'repair': '🔨',
        'material': '📦'
      };
      return icons[fieldType] || '📋';
    };

    const getFieldTypeLabel = (fieldType) => {
      const labels = {
        'part': 'חלק',
        'work': 'עבודה',
        'repair': 'תיקון',
        'material': 'חומר'
      };
      return labels[fieldType] || fieldType;
    };

    const getStatusBadge = (status) => {
      const badges = {
        'active': '<span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✅ פעיל</span>',
        'pending': '<span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">⏳ ממתין</span>',
        'cancelled': '<span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">❌ מבוטל</span>'
      };
      return badges[status] || status;
    };

    // Group mappings by damage center
    const groupedMappings = mappings.reduce((groups, mapping) => {
      const centerId = mapping.damage_center_id;
      if (!groups[centerId]) {
        groups[centerId] = [];
      }
      groups[centerId].push(mapping);
      return groups;
    }, {});

    // Calculate statistics
    const totalMappings = mappings.length;
    const uniqueCenters = Object.keys(groupedMappings).length;
    const totalValue = mappings.reduce((sum, mapping) => {
      const mappedData = mapping.mapped_data || {};
      const cost = parseFloat(mappedData.costWithoutVat) || 0;
      const quantity = parseFloat(mappedData.quantity) || 1;
      return sum + (cost * quantity);
    }, 0);
    const uniqueInvoices = new Set(mappings.filter(m => m.invoice?.invoice_number).map(m => m.invoice.invoice_number)).size;

    let content = `
      <div class="invoice-section">
        <h4>🔗 הקצאות חלקים למוקדי נזק</h4>
        <p>נמצאו ${totalMappings} הקצאות עבור תיק ${currentCaseId}</p>
        
        <!-- Statistics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #7dd3fc;">
            <div style="font-size: 24px; font-weight: 700; color: #0369a1;">${totalMappings}</div>
            <div style="font-size: 14px; color: #64748b;">סה"כ הקצאות</div>
          </div>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #86efac;">
            <div style="font-size: 24px; font-weight: 700; color: #166534;">${uniqueCenters}</div>
            <div style="font-size: 14px; color: #64748b;">מוקדי נזק</div>
          </div>
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fcd34d;">
            <div style="font-size: 24px; font-weight: 700; color: #92400e;">${formatPrice(totalValue)}</div>
            <div style="font-size: 14px; color: #64748b;">ערך כולל</div>
          </div>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5;">
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${uniqueInvoices}</div>
            <div style="font-size: 14px; color: #64748b;">חשבוניות</div>
          </div>
        </div>
      </div>
      
      <!-- Mappings Table -->
      <div class="invoice-section">
        <h4>📊 טבלת הקצאות מפורטת</h4>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">מוקד נזק</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">סוג שדה</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">נתונים מוקצים</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">חשבונית</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">סטטוס</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: 600;">תאריך</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Generate table rows
    mappings.forEach((mapping) => {
      const mappedData = mapping.mapped_data || {};
      content += `
        <tr>
          <td style="padding: 10px 8px; border: 1px solid #e5e7eb;">${formatValue(mapping.damage_center_name || mapping.damage_center_id)}</td>
          <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">
            ${getFieldTypeIcon(mapping.field_type)} ${getFieldTypeLabel(mapping.field_type)}
          </td>
          <td style="padding: 10px 8px; border: 1px solid #e5e7eb;">
            ${mappedData.name ? `<div style="font-weight: 600;">${mappedData.name}</div>` : ''}
            ${mappedData.description ? `<div style="font-size: 12px; color: #64748b;">${mappedData.description}</div>` : ''}
            ${mappedData.quantity ? `<div style="font-size: 12px;">כמות: ${mappedData.quantity}</div>` : ''}
            ${mappedData.costWithoutVat ? `<div style="font-weight: 600; color: #059669;">${formatPrice(mappedData.costWithoutVat)}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; border: 1px solid #e5e7eb;">
            ${mapping.invoice?.invoice_number ? `<div style="font-weight: 600;">${mapping.invoice.invoice_number}</div>` : ''}
            ${mapping.invoice?.supplier_name ? `<div style="font-size: 12px; color: #64748b;">${mapping.invoice.supplier_name}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${getStatusBadge(mapping.mapping_status)}</td>
          <td style="padding: 10px 8px; border: 1px solid #e5e7eb; text-align: center;">${formatDate(mapping.created_at)}</td>
        </tr>
      `;
    });

    content += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Visual grouping by damage center
    content += `
      <div class="invoice-section">
        <h4>🎯 הקצאות לפי מוקד נזק</h4>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0;">
    `;

    Object.entries(groupedMappings).forEach(([centerCode, centerMappings]) => {
      const centerTotal = centerMappings.reduce((sum, mapping) => {
        const mappedData = mapping.mapped_data || {};
        const cost = parseFloat(mappedData.costWithoutVat) || 0;
        const quantity = parseFloat(mappedData.quantity) || 1;
        return sum + (cost * quantity);
      }, 0);

      content += `
        <div style="background: #fff; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
            <h5 style="margin: 0; font-size: 16px; color: #1f2937;">${centerMappings[0]?.damage_center_name || centerCode}</h5>
            <span style="font-weight: 700; color: #059669;">${formatPrice(centerTotal)}</span>
          </div>
          
          <div>
      `;

      centerMappings.forEach(mapping => {
        const mappedData = mapping.mapped_data || {};
        const cost = parseFloat(mappedData.costWithoutVat) || 0;
        const quantity = parseFloat(mappedData.quantity) || 1;
        const totalCost = cost * quantity;

        content += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px;">${getFieldTypeIcon(mapping.field_type)} ${mappedData.name || formatValue(mapping.field_type)}</div>
              <div style="font-size: 12px; color: #6b7280;">
                ${getFieldTypeLabel(mapping.field_type)} • כמות: ${quantity}
              </div>
            </div>
            <div style="text-align: left; font-weight: 600; color: #059669;">
              ${formatPrice(totalCost)}
            </div>
          </div>
        `;
      });

      content += `
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            ${centerMappings.length} פריטים מוקצים
          </div>
        </div>
      `;
    });

    content += `
        </div>
      </div>
    `;

    contentDiv.innerHTML = content;
  }

  // View invoice document function - exposed to global scope
  window.viewInvoiceDocument = function(documentId, storagePath, storageBucket) {
    try {
      console.log('📄 Viewing invoice document:', { documentId, storagePath, storageBucket });
      
      if (!window.supabase) {
        alert('שירות השרת לא זמין');
        return;
      }

      if (!storagePath || !storageBucket) {
        alert('נתוני המסמך לא שלמים');
        return;
      }

      // Get signed URL from Supabase storage
      const { data } = window.supabase.storage
        .from(storageBucket)
        .getPublicUrl(storagePath);

      if (data && data.publicUrl) {
        // Open in new window/tab  
        const newWindow = window.open(data.publicUrl, '_blank', 'width=800,height=900,scrollbars=yes');
        
        if (!newWindow) {
          // Fallback for popup blockers
          const link = document.createElement('a');
          link.href = data.publicUrl;
          link.target = '_blank';
          link.click();
        }
      } else {
        alert('לא ניתן לקבל קישור למסמך');
      }

    } catch (error) {
      console.error('❌ Error viewing invoice document:', error);
      alert('שגיאה בפתיחת מסמך החשבונית: ' + error.message);
    }
  };

  // Main functions exposed to global scope
  window.toggleInvoiceDetails = function () {
    const modal = document.getElementById("invoiceDetailsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      modal.style.display = "block";
      loadInvoiceDocuments(); // Load initial tab
      makeDraggable(modal);
    } else {
      modal.style.display = "none";
    }
  };

  window.showInvoiceDetails = window.toggleInvoiceDetails;

  window.refreshInvoiceData = function () {
    console.log('🔄 Refreshing invoice data...');
    if (currentTab === 'documents') {
      loadInvoiceDocuments();
    } else if (currentTab === 'mappings') {
      loadDamageCenterMappings();
    }
  };

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

})();