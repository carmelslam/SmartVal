First part :
Implement suggestive and auto population for damage centers fields from invoices = in case an invoice exists 
This setup is relevant for the final report type private 
Other types fallback to the existing logic as now .

Second part: 
Suggestive logic to differentials section in the final report builder 
--------------------------------------------------------



---

# **IMPLEMENTATION TASK: Invoice-to-Damage-Center Assignment System**

## **CRITICAL CONTEXT**

**System:** EVALIX - Hebrew automotive damage assessment system  
**Tech Stack:** HTML, JavaScript, Supabase PostgreSQL  
**Risk Level:** 🔴 HIGH - 80% of system depends on helper.damage_centers  
**Approach:** Staged updates with user control - NO automatic overrides

---

## **ARCHITECTURE OVERVIEW**

### **Data Flow:**

```
1. Invoice Upload → OCR → Supabase
   ├─ invoices table (header)
   └─ invoice_lines table (individual items with UUIDs)

2. New Assignment UI Page
   ├─ User assigns invoice lines to damage centers
   ├─ Saves to helper.final_report.invoice_assignments[] (STAGING)
   └─ Saves to invoice_damage_center_mappings table (status: 'pending')

3. Final Report Builder
   ├─ Shows banner: "X pending assignments"
   ├─ User clicks "Apply to Damage Centers"
   ├─ Reads helper.final_report.invoice_assignments
   ├─ ADDS items to helper.damage_centers arrays
   ├─ Saves helper.damage_centers to Supabase cases table
   └─ Marks mappings as 'applied'
```

### **Core Principle:**
**helper.damage_centers is single source of truth. Updates only through explicit user action.**

---

## **EXISTING DATA STRUCTURES**

### **Supabase Tables:**

```sql
-- invoice_lines (already exists)
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY,
  invoice_id UUID,
  line_number INTEGER,
  description TEXT,
  quantity NUMERIC(10, 2),
  unit_price NUMERIC(10, 2),
  line_total NUMERIC(10, 2),
  item_category TEXT, -- 'part' | 'work' | 'repair' | 'material' | 'other'
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- invoice_damage_center_mappings (already exists)
CREATE TABLE invoice_damage_center_mappings (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  invoice_line_id UUID,
  case_id UUID NOT NULL,
  damage_center_id TEXT NOT NULL,
  damage_center_name TEXT,
  field_type TEXT NOT NULL, -- 'part' | 'work' | 'repair'
  field_index INTEGER,
  field_id TEXT,
  original_field_data JSONB,
  mapped_data JSONB,
  mapping_status TEXT DEFAULT 'active', -- 'pending' | 'applied' | 'rejected' | 'active'
  is_user_modified BOOLEAN DEFAULT false,
  mapping_confidence NUMERIC(5, 2),
  validation_status TEXT DEFAULT 'pending',
  mapped_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Existing helper.damage_centers Structure:**

```javascript
helper.damage_centers = [
  {
    Id: "dc_1761039505667_1",
    "Damage center Number": "1",
    Location: "אחורי הרכב",
    Description: "כנף אחורית שמאלית מעוקמת",
    RepairNature: "החלפת כנף וצביעה",
    
    Parts: {
      parts_required: [
        {
          row_uuid: "uuid",
          case_id: "uuid",
          plate: "22184003",
          damage_center_code: "dc_1761039505667_1",
          part_name: "קישוט פנס אח' ימ'",
          description: "קישוט פנס אח' ימ'",
          pcode: "VBP4211831",
          oem: "VBP4211831",
          supplier_name: "מ.פינס בע\"מ",
          price_per_unit: 72.47,
          reduction_percentage: 0,
          wear_percentage: 1,
          updated_price: 71.75,
          total_cost: 215.24,
          quantity: 3,
          source: "manual", // or "wizard" or "invoice"
          _invoice_line_id: null, // Set if from invoice
          _invoice_id: null,
          make: "",
          model: "",
          year: "",
          מחיר: 71.75,
          מיקום: "ישראל",
          הערות: "",
          זמינות: "זמין",
          metadata: {},
          updated_at: "timestamp"
        }
      ],
      parts_meta: {
        total_items: 4,
        total_cost: 5220,
        timestamp: "timestamp"
      }
    },
    
    Works: {
      works: [
        {
          category: "כל עבודות הפחחות",
          cost: 3000,
          comments: "לוודא התאמת דגם",
          added_at: "timestamp",
          source: "wizard_inline_component", // or "invoice"
          _invoice_line_id: null,
          _invoice_id: null
        }
      ],
      works_meta: {
        total_items: 1,
        total_cost: 3000,
        timestamp: "timestamp"
      }
    },
    
    Repairs: {
      repairs: [
        {
          name: "תיקון מתלה אחורי",
          cost: 1300,
          description: "חיזוק ושימון",
          added_at: "timestamp",
          source: "wizard_inline_component", // or "invoice"
          _invoice_line_id: null,
          _invoice_id: null
        }
      ],
      repairs_meta: {
        total_items: 1,
        total_cost: 1300,
        timestamp: "timestamp"
      }
    },
    
    Summary: {
      "Total works": 3000,
      "Total parts": 5220,
      "Total repairs": 1300,
      Subtotal: 9520,
      "VAT percentage": 18,
      "VAT amount": 1714,
      "Total with VAT": 11234
    }
  }
];
```

---

## **NEW DATA STRUCTURE TO CREATE**

### **helper.final_report:**

```javascript
helper.final_report = {
  case_id: "uuid",
  plate: "698-42-003",
  
  // STAGING AREA: Assignments waiting to be applied
  invoice_assignments: [
    {
      assignment_id: "uuid", // From invoice_damage_center_mappings.id
      invoice_line_id: "uuid",
      invoice_id: "uuid",
      damage_center_id: "dc_1761039505667_1",
      field_type: "part", // 'part' | 'work' | 'repair'
      
      // Full invoice line data
      invoice_line: {
        id: "uuid",
        description: "מגן אחורי עליון",
        quantity: 1,
        unit_price: 8239.00,
        line_total: 8239.00,
        item_category: "part",
        metadata: {
          "מק״ט חלק": "1-004-52159F913",
          "שם חלק": "מגן אחורי עליון"
        }
      },
      
      assigned_at: "timestamp",
      assigned_by: "user-uuid",
      assignment_status: "pending", // 'pending' | 'applied' | 'rejected'
      applied_at: null,
      applied_by: null
    }
  ],
  
  // Summary by damage center
  assignments_by_center: {
    "dc_1761039505667_1": {
      damage_center_number: "1",
      damage_center_name: "מגן אחורי",
      parts_count: 3,
      works_count: 2,
      repairs_count: 0,
      total_cost: 14123.00,
      items: []
    }
  },
  
  // Tracking
  total_assignments: 15,
  pending_assignments: 15,
  applied_assignments: 0,
  total_assigned_cost: 22623.00,
  last_assignment_at: "timestamp",
  last_applied_at: null
};
```

---

## **IMPLEMENTATION TASKS**

### **PHASE 1: Create Assignment UI Page**

**File to create:** `invoice_assignment.html`

**Page Structure:**

```html
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>שיוך פריטי חשבונית למוקדי נזק</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>שיוך פריטי חשבונית למוקדי נזק</h1>
            <p class="subtitle">שייך פריטים מהחשבונית למוקדי הנזק המתאימים</p>
        </header>
        
        <div class="assignment-container">
            <!-- LEFT PANEL: Invoice Lines -->
            <div class="invoice-lines-panel">
                <h2>פריטי חשבונית</h2>
                <div id="invoice-lines-content">
                    <!-- Dynamically populated -->
                </div>
            </div>
            
            <!-- RIGHT PANEL: Summary -->
            <div class="assignment-summary-panel">
                <h2>סיכום שיוכים</h2>
                <div id="summary-content">
                    <!-- Dynamically populated -->
                </div>
                <button id="save-and-continue-btn" class="primary-btn">
                    שמור שיוכים והמשך לדוח סופי
                </button>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="helper.js"></script>
    <script src="invoice_assignment.js"></script>
</body>
</html>
```

**JavaScript to create:** `invoice_assignment.js`

Key functions to implement:

```javascript
// 1. Initialize page
async function initializeAssignmentUI() {
    // Load invoice lines from Supabase
    // Load damage centers from helper
    // Load existing assignments if any
    // Render UI
}

// 2. Load invoice lines
async function loadInvoiceLinesForCase(caseId) {
    // Query invoices table for case
    // Query invoice_lines table
    // Return enriched lines
}

// 3. Render invoice lines table
function renderInvoiceLines(lines, damageCenters, existingAssignments) {
    // Group by invoice and category
    // Build tables with DC dropdowns
    // Mark already-assigned items
}

// 4. Handle assign click
async function handleAssignClick(event) {
    // Get invoice line data
    // Create mapping in Supabase (status: 'pending')
    // Add to helper.final_report.invoice_assignments
    // Update UI
    // Save to sessionStorage
}

// 5. Handle unassign click
async function handleUnassignClick(event) {
    // Remove from Supabase
    // Remove from helper.final_report
    // Update UI
}

// 6. Update summary
function updateFinalReportSummary() {
    // Group by center
    // Calculate totals
    // Render summary panel
}

// 7. Save and continue
function saveAndContinue() {
    // Save helper.final_report to sessionStorage
    // Navigate to final_report_builder.html
}
```

---

### **PHASE 2: Update Final Report Builder**

**File to modify:** `final_report_builder.html`

**Add these functions to existing JavaScript:**

```javascript
// 1. On page load - check for pending assignments
async function checkPendingAssignments() {
    // Load helper.final_report from sessionStorage
    // If not found, load from Supabase
    // Count pending assignments
    // If > 0, show banner
}

// 2. Show pending assignments banner
function showPendingAssignmentsBanner(count) {
    // Create banner HTML
    // Show summary by damage center
    // Add action buttons:
    //   - Apply assignments
    //   - Preview
    //   - Reject
}

// 3. Apply assignments to centers
async function applyAssignmentsToCenters() {
    // Confirm with user
    // For each pending assignment:
    //   - Convert invoice_line to center format
    //   - ADD to helper.damage_centers arrays
    //   - Recalculate metas
    // Save helper.damage_centers to Supabase
    // Update mappings to 'applied'
    // Remove banner
    // Refresh UI
}

// 4. Apply single assignment
async function applyAssignmentToCenter(assignment) {
    // Find damage center
    // Convert based on field_type
    // Add to appropriate array
    // Recalculate meta
}

// 5. Mapping functions
function mapInvoiceLineToCenterPart(invoiceLine, damageCenter) {
    // Return part object matching helper.damage_centers structure
    // Include all required fields
    // Mark source: "invoice"
    // Include _invoice_line_id, _invoice_id
}

function mapInvoiceLineToCenterWork(invoiceLine) {
    // Return work object
}

function mapInvoiceLineToCenterRepair(invoiceLine) {
    // Return repair object
}

// 6. Save damage centers to Supabase
async function saveDamageCentersToSupabase() {
    // Update cases table
    // Set damage_centers column to helper.damage_centers JSON
}

// 7. Reject assignments
async function rejectAssignments() {
    // Update mappings to 'rejected'
    // Clear helper.final_report
    // Remove banner
}
```

---

### **PHASE 3: Helper Utilities**

**Add to helper.js:**

```javascript
// UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 2
    }).format(amount);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Recalculate center summary
function recalculateCenterSummary(center) {
    const totalParts = center.Parts.parts_meta?.total_cost || 0;
    const totalWorks = center.Works.works_meta?.total_cost || 0;
    const totalRepairs = center.Repairs.repairs_meta?.total_cost || 0;
    
    const subtotal = totalParts + totalWorks + totalRepairs;
    const vatPercent = 18;
    const vatAmount = subtotal * (vatPercent / 100);
    const totalWithVat = subtotal + vatAmount;
    
    center.Summary = {
        "Total works": totalWorks,
        "Total parts": totalParts,
        "Total repairs": totalRepairs,
        Subtotal: subtotal,
        "VAT percentage": vatPercent,
        "VAT amount": vatAmount,
        "Total with VAT": totalWithVat
    };
}

// Loading overlay
function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    document.getElementById('loading-overlay')?.remove();
}
```

---

## **DETAILED CODE EXAMPLES**

### **invoice_assignment.js - Complete Implementation:**

```javascript
// Global state
let currentCase = null;
let invoiceLines = [];
let damageCenters = [];
let existingAssignments = new Map(); // invoice_line_id -> damage_center_id

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeAssignmentUI();
});

/**
 * Initialize assignment UI
 */
async function initializeAssignmentUI() {
    try {
        showLoadingOverlay('טוען נתונים...');
        
        // 1. Get current case from helper or URL
        currentCase = helper.currentCase || await loadCurrentCase();
        
        if (!currentCase) {
            alert('לא נמצא תיק פעיל');
            return;
        }
        
        // 2. Load damage centers
        damageCenters = helper.damage_centers || await loadDamageCenters(currentCase.id);
        
        if (!damageCenters || damageCenters.length === 0) {
            alert('לא נמצאו מוקדי נזק. נא ליצור מוקדי נזק תחילה.');
            return;
        }
        
        // 3. Load invoice lines
        invoiceLines = await loadInvoiceLinesForCase(currentCase.id);
        
        if (!invoiceLines || invoiceLines.length === 0) {
            alert('לא נמצאו פריטי חשבונית לשיוך');
            return;
        }
        
        // 4. Build existing assignments map
        existingAssignments = await buildExistingAssignmentsMap(currentCase.id);
        
        // 5. Initialize helper.final_report if needed
        if (!helper.final_report) {
            helper.final_report = {
                case_id: currentCase.id,
                plate: currentCase.plate,
                invoice_assignments: [],
                assignments_by_center: {},
                total_assignments: 0,
                pending_assignments: 0,
                applied_assignments: 0,
                total_assigned_cost: 0
            };
        }
        
        // 6. Load existing assignments into helper.final_report
        await loadExistingAssignments(currentCase.id);
        
        // 7. Render UI
        renderInvoiceLinesPanel();
        renderSummaryPanel();
        
        // 8. Attach event listeners
        attachEventListeners();
        
        hideLoadingOverlay();
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Error initializing:', error);
        alert('שגיאה בטעינת הנתונים: ' + error.message);
    }
}

/**
 * Load invoice lines for case
 */
async function loadInvoiceLinesForCase(caseId) {
    // Get all invoices for this case
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, supplier_name, plate')
        .eq('case_id', caseId);
    
    if (invError) throw invError;
    if (!invoices || invoices.length === 0) return [];
    
    // Get all invoice lines
    const invoiceIds = invoices.map(inv => inv.id);
    
    const { data: lines, error: linesError } = await supabase
        .from('invoice_lines')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('line_number', { ascending: true });
    
    if (linesError) throw linesError;
    
    // Enrich lines with invoice info
    return lines.map(line => {
        const invoice = invoices.find(inv => inv.id === line.invoice_id);
        return {
            ...line,
            _invoice_number: invoice?.invoice_number,
            _supplier_name: invoice?.supplier_name,
            _plate: invoice?.plate
        };
    });
}

/**
 * Build existing assignments map
 */
async function buildExistingAssignmentsMap(caseId) {
    const map = new Map();
    
    // Check helper.damage_centers for items with source: "invoice"
    if (helper.damage_centers) {
        helper.damage_centers.forEach(center => {
            // Check parts
            center.Parts.parts_required.forEach(part => {
                if (part.source === 'invoice' && part._invoice_line_id) {
                    map.set(part._invoice_line_id, center.Id);
                }
            });
            
            // Check works
            center.Works.works.forEach(work => {
                if (work.source === 'invoice' && work._invoice_line_id) {
                    map.set(work._invoice_line_id, center.Id);
                }
            });
            
            // Check repairs
            center.Repairs.repairs.forEach(repair => {
                if (repair.source === 'invoice' && repair._invoice_line_id) {
                    map.set(repair._invoice_line_id, center.Id);
                }
            });
        });
    }
    
    return map;
}

/**
 * Load existing assignments from Supabase
 */
async function loadExistingAssignments(caseId) {
    const { data: mappings, error } = await supabase
        .from('invoice_damage_center_mappings')
        .select(`
            *,
            invoice_line:invoice_lines(*)
        `)
        .eq('case_id', caseId)
        .eq('mapping_status', 'pending');
    
    if (error) {
        console.error('Error loading existing assignments:', error);
        return;
    }
    
    if (!mappings || mappings.length === 0) return;
    
    // Add to helper.final_report
    helper.final_report.invoice_assignments = mappings.map(m => ({
        assignment_id: m.id,
        invoice_line_id: m.invoice_line_id,
        invoice_id: m.invoice_id,
        damage_center_id: m.damage_center_id,
        field_type: m.field_type,
        invoice_line: m.invoice_line,
        assigned_at: m.created_at,
        assigned_by: m.mapped_by,
        assignment_status: 'pending',
        applied_at: null,
        applied_by: null
    }));
    
    updateFinalReportSummary();
}

/**
 * Render invoice lines panel
 */
function renderInvoiceLinesPanel() {
    const container = document.getElementById('invoice-lines-content');
    
    // Group by invoice
    const grouped = groupByInvoice(invoiceLines);
    
    let html = '';
    
    grouped.forEach(group => {
        html += `
            <div class="invoice-group">
                <h3>${group.supplier_name} - חשבונית ${group.invoice_number}</h3>
                
                ${renderCategoryTable('חלקים', group.parts)}
                ${renderCategoryTable('עבודות', group.works)}
                ${renderCategoryTable('תיקונים', group.repairs)}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Group invoice lines by invoice and category
 */
function groupByInvoice(lines) {
    const grouped = {};
    
    lines.forEach(line => {
        const key = line.invoice_id;
        
        if (!grouped[key]) {
            grouped[key] = {
                invoice_id: line.invoice_id,
                invoice_number: line._invoice_number,
                supplier_name: line._supplier_name,
                parts: [],
                works: [],
                repairs: []
            };
        }
        
        if (line.item_category === 'part') {
            grouped[key].parts.push(line);
        } else if (line.item_category === 'work') {
            grouped[key].works.push(line);
        } else if (line.item_category === 'repair') {
            grouped[key].repairs.push(line);
        }
    });
    
    return Object.values(grouped);
}

/**
 * Render category table
 */
function renderCategoryTable(categoryName, items) {
    if (!items || items.length === 0) return '';
    
    // Build damage center options
    const dcOptions = damageCenters.map(dc => 
        `<option value="${dc.Id}">${dc["Damage center Number"]} - ${dc.Description || dc.Location}</option>`
    ).join('');
    
    let html = `
        <div class="category-section">
            <h4>${categoryName}</h4>
            <table class="invoice-items-table">
                <thead>
                    <tr>
                        <th>תיאור</th>
                        <th>כמות</th>
                        <th>מחיר יחידה</th>
                        <th>סה"כ</th>
                        <th>מוקד נזק</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    items.forEach(item => {
        const isAssigned = existingAssignments.has(item.id);
        const assignedDcId = existingAssignments.get(item.id);
        const rowClass = isAssigned ? 'assigned' : '';
        
        html += `
            <tr class="${rowClass}" data-invoice-line-id="${item.id}" data-field-type="${item.item_category}">
                <td>${item.description || ''}</td>
                <td>${item.quantity || 1}</td>
                <td>${formatCurrency(item.unit_price || 0)}</td>
                <td>${formatCurrency(item.line_total || 0)}</td>
                <td>
                    <select class="dc-selector" ${isAssigned ? 'disabled' : ''}>
                        <option value="">בחר מוקד נזק...</option>
                        ${dcOptions}
                    </select>
                </td>
                <td>
                    ${isAssigned 
                        ? `<button class="unassign-btn" data-dc-id="${assignedDcId}">בטל שיוך</button>`
                        : `<button class="assign-btn">שייך</button>`
                    }
                </td>
            </tr>
        `;
        
        // Pre-select if assigned
        if (isAssigned) {
            // Will set after rendering
        }
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

/**
 * Render summary panel
 */
function renderSummaryPanel() {
    const container = document.getElementById('summary-content');
    
    const byCenter = helper.final_report.assignments_by_center || {};
    const pending = helper.final_report.invoice_assignments?.filter(
        a => a.assignment_status === 'pending'
    ) || [];
    
    let html = `
        <div class="summary-stats">
            <div class="stat-item">
                <span class="stat-label">סה"כ שיוכים:</span>
                <span class="stat-value">${pending.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">סה"כ עלות:</span>
                <span class="stat-value">${formatCurrency(helper.final_report.total_assigned_cost || 0)}</span>
            </div>
        </div>
        
        <div class="assignments-by-center">
            <h3>שיוכים לפי מוקד נזק</h3>
    `;
    
    if (Object.keys(byCenter).length === 0) {
        html += '<p class="empty-state">טרם בוצעו שיוכים</p>';
    } else {
        Object.values(byCenter).forEach(center => {
            html += `
                <div class="center-summary">
                    <h4>מוקד ${center.damage_center_number} - ${center.damage_center_name}</h4>
                    <ul>
                        <li>${center.parts_count} חלקים</li>
                        <li>${center.works_count} עבודות</li>
                        <li>${center.repairs_count} תיקונים</li>
                    </ul>
                    <p class="center-total">סה"כ: ${formatCurrency(center.total_cost)}</p>
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Assign buttons
    document.querySelectorAll('.assign-btn').forEach(btn => {
        btn.addEventListener('click', handleAssignClick);
    });
    
    // Unassign buttons
    document.querySelectorAll('.unassign-btn').forEach(btn => {
        btn.addEventListener('click', handleUnassignClick);
    });
    
    // Save and continue button
    document.getElementById('save-and-continue-btn')?.addEventListener('click', saveAndContinue);
}

/**
 * Handle assign click
 */
async function handleAssignClick(event) {
    const btn = event.target;
    const row = btn.closest('tr');
    const invoiceLineId = row.dataset.invoiceLineId;
    const fieldType = row.dataset.fieldType;
    const selector = row.querySelector('.dc-selector');
    const damageCenterId = selector.value;
    
    if (!damageCenterId) {
        alert('נא לבחור מוקד נזק');
        return;
    }
    
    try {
        btn.disabled = true;
        btn.textContent = 'שומר...';
        
        // Get invoice line
        const invoiceLine = invoiceLines.find(l => l.id === invoiceLineId);
        if (!invoiceLine) throw new Error('Invoice line not found');
        
        // Get damage center
        const damageCenter = damageCenters.find(dc => dc.Id === damageCenterId);
        if (!damageCenter) throw new Error('Damage center not found');
        
        // Create mapping in Supabase
        const { data: mapping, error } = await supabase
            .from('invoice_damage_center_mappings')
            .insert({
                invoice_id: invoiceLine.invoice_id,
                invoice_line_id: invoiceLineId,
                case_id: currentCase.id,
                damage_center_id: damageCenterId,
                damage_center_name: `${damageCenter["Damage center Number"]} - ${damageCenter.Description || damageCenter.Location}`,
                field_type: fieldType,
                field_id: generateUUID(),
                original_field_data: invoiceLine.metadata || {},
                mapped_data: {
                    description: invoiceLine.description,
                    quantity: invoiceLine.quantity,
                    unit_price: invoiceLine.unit_price,
                    line_total: invoiceLine.line_total
                },
                mapping_status: 'pending',
                is_user_modified: false,
                mapping_confidence: 100,
                validation_status: 'approved',
                mapped_by: helper.currentUser?.id
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Add to helper.final_report
        const assignment = {
            assignment_id: mapping.id,
            invoice_line_id: invoiceLineId,
            invoice_id: invoiceLine.invoice_id,
            damage_center_id: damageCenterId,
            field_type: fieldType,
            invoice_line: invoiceLine,
            assigned_at: mapping.created_at,
            assigned_by: mapping.mapped_by,
            assignment_status: 'pending',
            applied_at: null,
            applied_by: null
        };
        
        helper.final_report.invoice_assignments.push(assignment);
        existingAssignments.set(invoiceLineId, damageCenterId);
        
        // Update summary
        updateFinalReportSummary();
        
        // Save to session
        sessionStorage.setItem('helper_final_report', JSON.stringify(helper.final_report));
        
        // Update UI
        row.classList.add('assigned');
        selector.disabled = true;
        btn.outerHTML = '<button class="unassign-btn">בטל שיוך</button>';
        
        renderSummaryPanel();
        attachEventListeners();
        
    } catch (error) {
        console.error('Error assigning:', error);
        alert('שגיאה בשיוך: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'שייך';
    }
}

/**
 * Handle unassign click
 */
async function handleUnassignClick(event) {
    const btn = event.target;
    const row = btn.closest('tr');
    const invoiceLineId = row.dataset.invoiceLineId;
    
    try {
        btn.disabled = true;
        btn.textContent = 'מוחק...';
        
        // Find assignment
        const assignmentIndex = helper.final_report.invoice_assignments.findIndex(
            a => a.invoice_line_id === invoiceLineId && a.assignment_status === 'pending'
        );
        
        if (assignmentIndex === -1) throw new Error('Assignment not found');
        
        const assignment = helper.final_report.invoice_assignments[assignmentIndex];
        
        // Delete from Supabase
        const { error } = await supabase
            .from('invoice_damage_center_mappings')
            .delete()
            .eq('id', assignment.assignment_id);
        
        if (error) throw error;
        
        // Remove from helper
        helper.final_report.invoice_assignments.splice(assignmentIndex, 1);
        existingAssignments.delete(invoiceLineId);
        
        // Update summary
        updateFinalReportSummary();
        
        // Save to session
        sessionStorage.setItem('helper_final_report', JSON.stringify(helper.final_report));
        
        // Update UI
        row.classList.remove('assigned');
        row.querySelector('.dc-selector').disabled = false;
        btn.outerHTML = '<button class="assign-btn">שייך</button>';
        
        renderSummaryPanel();
        attachEventListeners();
        
    } catch (error) {
        console.error('Error unassigning:', error);
        alert('שגיאה בביטול: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'בטל שיוך';
    }
}

/**
 * Update final report summary
 */
function updateFinalReportSummary() {
    const byCenter = {};
    
    helper.final_report.invoice_assignments
        .filter(a => a.assignment_status === 'pending')
        .forEach(assignment => {
            if (!byCenter[assignment.damage_center_id]) {
                const dc = damageCenters.find(d => d.Id === assignment.damage_center_id);
                byCenter[assignment.damage_center_id] = {
                    damage_center_number: dc?.["Damage center Number"] || "",
                    damage_center_name: dc?.Description || dc?.Location || "",
                    parts_count: 0,
                    works_count: 0,
                    repairs_count: 0,
                    total_cost: 0,
                    items: []
                };
            }
            
            const center = byCenter[assignment.damage_center_id];
            
            if (assignment.field_type === 'part') center.parts_count++;
            else if (assignment.field_type === 'work') center.works_count++;
            else if (assignment.field_type === 'repair') center.repairs_count++;
            
            center.total_cost += assignment.invoice_line.line_total || 0;
        });
    
    helper.final_report.assignments_by_center = byCenter;
    
    const pending = helper.final_report.invoice_assignments.filter(a => a.assignment_status === 'pending');
    helper.final_report.total_assignments = helper.final_report.invoice_assignments.length;
    helper.final_report.pending_assignments = pending.length;
    helper.final_report.total_assigned_cost = pending.reduce(
        (sum, a) => sum + (a.invoice_line.line_total || 0), 0
    );
    helper.final_report.last_assignment_at = new Date().toISOString();
}

/**
 * Save and continue
 */
function saveAndContinue() {
    // Save to session
    sessionStorage.setItem('helper_final_report', JSON.stringify(helper.final_report));
    
    // Navigate to final report
    window.location.href = 'final_report_builder.html';
}
```

---

## **CSS STYLES**

Add to `styles.css`:

```css
/* Assignment UI */
.assignment-container {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-top: 20px;
}

.invoice-lines-panel,
.assignment-summary-panel {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.invoice-group {
    margin-bottom: 30px;
    border-bottom: 2px solid #eee;
    padding-bottom: 20px;
}

.category-section {
    margin: 15px 0;
}

.invoice-items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

.invoice-items-table th,
.invoice-items-table td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: right;
}

.invoice-items-table th {
    background: #f5f5f5;
    font-weight: bold;
}

.invoice-items-table tr.assigned {
    background: #e8f5e9;
}

.dc-selector {
    width: 100%;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.assign-btn,
.unassign-btn {
    padding: 5px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.assign-btn {
    background: #4CAF50;
    color: white;
}

.assign-btn:hover {
    background: #45a049;
}

.unassign-btn {
    background: #f44336;
    color: white;
}

.unassign-btn:hover {
    background: #da190b;
}

/* Summary Panel */
.summary-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
}

.stat-item {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.9em;
    color: #666;
}

.stat-value {
    font-size: 1.5em;
    font-weight: bold;
    color: #333;
    margin-top: 5px;
}

.center-summary {
    background: #f9f9f9;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 4px;
    border-right: 4px solid #2196F3;
}

.center-summary h4 {
    margin: 0 0 10px 0;
    color: #2196F3;
}

.center-summary ul {
    list-style: none;
    padding: 0;
    margin: 10px 0;
}

.center-summary li {
    padding: 3px 0;
}

.center-total {
    font-weight: bold;
    color: #4CAF50;
    margin: 10px 0 0 0;
}

/* Pending Banner */
.pending-assignments-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 20px;
    align-items: center;
}

.banner-icon {
    font-size: 3em;
}

.banner-content h3 {
    margin: 0 0 5px 0;
}

.banner-content p {
    margin: 5px 0;
    opacity: 0.9;
}

.assignments-summary-list {
    list-style: none;
    padding: 10px 0;
    margin: 0;
}

.assignments-summary-list li {
    padding: 5px 0;
    border-top: 1px solid rgba(255,255,255,0.2);
}

.banner-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.primary-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
}

.primary-btn:hover {
    background: #45a049;
}

.secondary-btn,
.tertiary-btn {
    background: white;
    color: #667eea;
    border: 2px solid white;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

/* Loading overlay */
#loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    color: white;
}

.loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

## **TESTING CHECKLIST**

### **Phase 1: Assignment UI** PAHSE ONE - INDEPENDENT 
- [ ] Page loads without errors
- [ ] Invoice lines displayed correctly
- [ ] Damage center dropdowns populated
- [ ] Assign button saves to Supabase
- [ ] Assign button updates helper.final_report
- [ ] Assign button updates UI (marks row as assigned)
- [ ] Summary panel shows correct counts
- [ ] Unassign button removes from Supabase
- [ ] Unassign button removes from helper.final_report
- [ ] Save and Continue navigates to final report

### **Phase 2: Final Report Builder** PAHSE TWO - INDEPENDENT 
- [ ] Loads helper.final_report from sessionStorage
- [ ] Shows pending assignments banner
- [ ] Banner displays correct count and summary
- [ ] Apply button adds items to helper.centers
- [ ] Apply button saves to Supabase cases table
- [ ] Apply button marks mappings as 'applied'
- [ ] Damage centers display invoice items
- [ ] Can distinguish wizard items vs invoice items (by source field)
- [ ] Reject button marks mappings as 'rejected'

### **Edge Cases**
- [ ] No invoices exist (assignment page shows message)
- [ ] No damage centers exist (assignment page shows message)
- [ ] All items already assigned (UI reflects this)
- [ ] Multiple invoices for same case (groups correctly)
- [ ] Apply with no pending assignments (shows message)
- [ ] Page refresh maintains state

---

## **CRITICAL SAFETY NOTES**

**THE DAMGE CENTERS SECTION in the FINAL REPORT BUILDER ALREADY WRITE DIRECTLY ON CENTERS - KEEP AS IS . YOU NEED TOO ADD A LOCATION IN HELPER.FINAL_REPORT AS EXPLAINED ABOVE - BUT DONT BREAK HOW THE DAMAGE CENTERS CURRENTLY WRITE**
⚠️ **DO NOT:**
- Modify existing helper.centers structure
- Modify existing UI structure
- Auto-apply assignments without user confirmation
- Delete wizard-created items
- Change any existing wizard or invoice module behavior
- Modify Supabase table schemas - unless we discover that change is needed 

✅ **DO:**
- Always ADD items to arrays, never replace
- Always mark source as "invoice" for invoice items
- Always save helper version to Supabase after updates
- Always validate user input
- Always handle errors gracefully



"Please implement the Invoice-to-Damage-Center Assignment System as described. Start by asking me the questions in the 'QUESTIONS TO ASK BEFORE STARTING' section, then proceed with implementation in phases."