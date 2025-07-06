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
    
    @media only screen and (max-width: 768px) {
      #invoiceDetailsModal {
        top: 5px !important;
        left: 5px !important;
        right: 5px !important;
        bottom: auto !important;
        width: auto !important;
        max-width: none !important;
        transform: none !important;
        padding: 12px !important;
        border-radius: 12px !important;
        max-height: 90vh !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }
      
      .invoice-items-table {
        font-size: 11px !important;
      }
      
      .invoice-modal-title {
        font-size: 16px !important;
        margin-bottom: 12px !important;
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
    <div id="invoiceContent">
      <!-- Content will be loaded dynamically -->
    </div>
    <div class="invoice-buttons">
      <button class="invoice-btn close" onclick="toggleInvoiceDetails()">סגור</button>
      <button class="invoice-btn refresh" onclick="refreshInvoiceData()">רענן נתונים</button>
    </div>
  `;
  document.body.appendChild(modal);

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

  window.refreshInvoiceData = function () {
    loadInvoiceData();
  };

  function loadInvoiceData() {
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

    return `
      <div class="invoice-section">
        <h4>📋 נתוני חשבונית ראשית</h4>
        
        <div class="invoice-field">
          <div class="label">שם מוסך:</div>
          <div class="value">${formatValue(invoice.garage_name)}</div>
        </div>
        <div class="invoice-field">
          <div class="label">אימייל מוסך:</div>
          <div class="value">${formatValue(invoice.garage_email)}</div>
        </div>
        <div class="invoice-field">
          <div class="label">טלפון מוסך:</div>
          <div class="value">${formatValue(invoice.garage_phone)}</div>
        </div>
      </div>

      <div class="invoice-total-section">
        <div class="invoice-total-row">
          <span>סה"כ חלקים:</span>
          <span class="value price">${formatPrice(invoice.total_parts)}</span>
        </div>
        <div class="invoice-total-row">
          <span>סה"כ עבודות:</span>
          <span class="value price">${formatPrice(invoice.total_works)}</span>
        </div>
        <div class="invoice-total-row">
          <span>סה"כ תיקונים:</span>
          <span class="value price">${formatPrice(invoice.total_repairs)}</span>
        </div>
        <div class="invoice-total-row">
          <span>סכום ביניים:</span>
          <span class="value price">${formatPrice(invoice.subtotal)}</span>
        </div>
        <div class="invoice-total-row">
          <span>מע"מ:</span>
          <span class="value price">${formatPrice(invoice.vat)}</span>
        </div>
        <div class="invoice-total-final">
          <div class="invoice-total-row">
            <span>סה"כ סופי:</span>
            <span class="value price">${formatPrice(invoice.total)}</span>
          </div>
        </div>
      </div>

      ${generateInvoiceItemsSection(invoice)}
    `;
  }

  function generateInvoiceItemsSection(invoice) {
    let content = '';

    // Parts table
    if (invoice.parts && invoice.parts.length > 0) {
      content += `
        <div class="invoice-section">
          <h4>🔧 חלקים</h4>
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>שם החלק</th>
                <th>תיאור</th>
                <th>מקור</th>
                <th>מחיר</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.parts.map(part => `
                <tr>
                  <td>${part.name || '-'}</td>
                  <td>${part.description || '-'}</td>
                  <td>${part.source || '-'}</td>
                  <td>${part.price ? `₪${parseFloat(part.price).toLocaleString()}` : '₪0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Works table
    if (invoice.works && invoice.works.length > 0) {
      content += `
        <div class="invoice-section">
          <h4>⚒️ עבודות</h4>
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>סוג עבודה</th>
                <th>תיאור</th>
                <th>הערות</th>
                <th>עלות</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.works.map(work => `
                <tr>
                  <td>${work.type || '-'}</td>
                  <td>${work.description || '-'}</td>
                  <td>${work.note || '-'}</td>
                  <td>${work.cost ? `₪${parseFloat(work.cost).toLocaleString()}` : '₪0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Repairs table
    if (invoice.repairs && invoice.repairs.length > 0) {
      content += `
        <div class="invoice-section">
          <h4>🔨 תיקונים</h4>
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>שם התיקון</th>
                <th>תיאור</th>
                <th>עלות</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.repairs.map(repair => `
                <tr>
                  <td>${repair.name || '-'}</td>
                  <td>${repair.description || '-'}</td>
                  <td>${repair.cost ? `₪${parseFloat(repair.cost).toLocaleString()}` : '₪0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    return content;
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