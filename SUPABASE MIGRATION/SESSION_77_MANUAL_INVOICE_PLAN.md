# PHASE 5a - Manual Invoice Input Form - Implementation Plan

**Session:** 80  
**Date:** 2025-10-26  
**Status:** Planning Phase - Awaiting User Approval

---

## 📋 OVERVIEW

Create a standalone manual invoice input form that mirrors the automated OCR webhook structure exactly. This serves as a fallback when OCR processing fails or is unavailable.

**Key Principle:** Manual entries must be indistinguishable from automated entries in all downstream modules (damage centers wizard, final report builder).

---

## 🎯 OBJECTIVES

1. **Mirror Webhook Structure:** Output identical JSON structure to automated OCR system
2. **Dynamic Categories:** Add/remove items at will in Parts, Works, Repairs
3. **Real-Time Calculations:** Auto-calculate category totals and grand totals
4. **Hebrew RTL Support:** Proper right-to-left layout with Hebrew labels
5. **Data Persistence:** Save to sessionStorage helper + Supabase
6. **Professional UX:** Invoice-like appearance, responsive, accessible

---

## 📐 FILE STRUCTURE

**Single File:** `manual_invoice_input.html`

**Size Constraint:** < 100KB  
**Dependencies:** None (vanilla JS/CSS/HTML only)  
**Browsers:** Chrome, Firefox, Safari, Edge (modern versions)

---

## 🏗️ UI STRUCTURE

### 1. HEADER SECTION

```html
<header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
  <h1>הזנת חשבונית ידנית</h1>
  <span class="badge">קלט ידני</span>
</header>
```

**Elements:**
- Title: "הזנת חשבונית ידנית"
- Badge: "קלט ידני" (orange/amber color to distinguish from automated)
- Save button (sticky at top right): "💾 שמור חשבונית"

---

### 2. FIXED FIELDS SECTION

**Layout:** CSS Grid, 2-3 columns depending on screen size

**Required Fields (marked with red *):**
- בעל הרכב (Car owner) *
- תאריך (Date - dd/mm/yy) *
- מס. חשבונית (Invoice number) *
- שם מוסך (Garage name) *
- טלפון מוסך (Garage phone) *

**Optional Fields:**
- מספר רכב (Vehicle plate)
- יצרן (Manufacturer)
- דגם (Model)
- שנת ייצור (Production year)
- מד אוץ (Odometer)
- מספר תיק (File number)
- דוא"ל מוסך (Garage email)
- כתובת מוסך (Garage address)
- מוקד נזק (Damage area)
- הערות (Notes)
- ח.פ. (Company number)

**HTML Structure:**
```html
<section class="fixed-fields">
  <div class="field-group">
    <label for="car-owner">בעל הרכב <span class="required">*</span></label>
    <input type="text" id="car-owner" name="car-owner" required dir="rtl" />
  </div>
  <!-- Repeat for all fields -->
</section>
```

---

### 3. DYNAMIC CATEGORIES SECTION

**Three collapsible blocks (all visible on load):**

#### **A. חלקים (Parts) 🔧**

**Row Structure:**
```html
<tr class="item-row" data-category="parts" data-row-id="part-1">
  <td><input type="text" name="part-code" placeholder="מק״ט" dir="ltr" /></td>
  <td><input type="text" name="part-name" placeholder="שם חלק" dir="rtl" /></td>
  <td><input type="text" name="part-desc" placeholder="תיאור" dir="rtl" /></td>
  <td><input type="number" name="part-qty" value="1" min="1" dir="ltr" /></td>
  <td>
    <select name="part-source" dir="rtl">
      <option value="מקורי">מקורי</option>
      <option value="תחליפי">תחליפי</option>
      <option value="אחר">אחר</option>
    </select>
  </td>
  <td><input type="number" name="part-cost" placeholder="0.00" step="0.01" dir="ltr" class="cost-field" /></td>
  <td><button type="button" class="remove-btn" onclick="removeRow('part-1')">×</button></td>
</tr>
```

**Footer:**
```html
<tfoot>
  <tr>
    <td colspan="6" style="text-align: left;">
      <button type="button" class="add-btn" onclick="addPartRow()">+ הוסף חלק</button>
    </td>
    <td style="font-weight: bold; text-align: right;">
      סה״כ חלקים: <span id="parts-total">₪0.00</span>
    </td>
  </tr>
</tfoot>
```

#### **B. עבודות (Works) 👷**

**Row Structure:**
```html
<tr class="item-row" data-category="works" data-row-id="work-1">
  <td><input type="text" name="work-code" placeholder="קוד" dir="ltr" /></td>
  <td colspan="3"><input type="text" name="work-desc" placeholder="תיאור עבודות" dir="rtl" /></td>
  <td><input type="number" name="work-cost" placeholder="0.00" step="0.01" dir="ltr" class="cost-field" /></td>
  <td><button type="button" class="remove-btn" onclick="removeRow('work-1')">×</button></td>
</tr>
```

**Footer:** Same pattern as Parts

#### **C. תיקונים (Repairs) 🔨**

**Row Structure:** Same as Works

---

### 4. GRAND TOTALS SECTION

**Layout:** Prominent box at bottom, right-aligned

```html
<section class="grand-totals">
  <div class="total-line">
    <span>עלות כוללת ללא מע״מ:</span>
    <span id="subtotal" class="calculated">₪0.00</span>
  </div>
  <div class="total-line editable">
    <label for="vat-percent">מע״מ (%):</label>
    <input type="number" id="vat-percent" value="18" min="0" max="100" step="0.1" style="width: 60px;" />
  </div>
  <div class="total-line">
    <span>ערך מע״מ:</span>
    <span id="vat-amount" class="calculated">₪0.00</span>
  </div>
  <div class="total-line grand">
    <span>עלות כוללת:</span>
    <span id="grand-total" class="calculated">₪0.00</span>
  </div>
</section>
```

**Calculation Logic:**
- Subtotal = sum(parts total, works total, repairs total)
- VAT Amount = subtotal × (VAT% ÷ 100)
- Grand Total = subtotal + VAT amount

---

### 5. SIGNATURE SECTION

```html
<section class="signature">
  <div class="sig-field">
    <label>מולא על ידי:</label>
    <span id="filled-by">[AUTO-FILL FROM USER CONTEXT]</span>
  </div>
  <div class="sig-field">
    <label>תאריך:</label>
    <span id="sig-date">[AUTO-FILL CURRENT DATE]</span>
  </div>
  <div class="sig-field">
    <label>מקור:</label>
    <span class="badge">קלט ידני</span>
  </div>
</section>
```

**Auto-fill Logic:**
```javascript
// On page load
const user = JSON.parse(sessionStorage.getItem('auth'))?.user;
const userName = user?.user_metadata?.full_name || user?.email || 'משתמש';
document.getElementById('filled-by').textContent = userName;

const now = new Date();
const sigDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
document.getElementById('sig-date').textContent = sigDate;
```

---

## 💾 DATA STRUCTURE

### Target Output (must match webhook exactly):

```json
{
  "מספר רכב": "698-42-003",
  "יצרן": "טויוטה",
  "דגם": "C-HR LOUNGE S",
  "שנת ייצור": "",
  "מד אוץ": "34970",
  "בעל הרכב": "שרה חסון",
  "מספר תיק": "839",
  "תאריך": "15/04/25",
  "מס. חשבונית": "6",
  "שם מוסך": "מוסך ש.מ קוסמטיקאר בע\"מ",
  "דוא"ל מוסך": "sh.m kosmtekar@walla.com",
  "טלפון מוסך": "053-2344434 04-840960",
  "כתובת מוסך": "ניו יורק 1 דאלית אל כרמל",
  "מוקד נזק": "מגן אחורי",
  "סהכ חלקים": "18724.00",
  "סהכ עבודות": "4120.00",
  "סהכ תיקונים": "0",
  "עלות כוללת ללא מע״מ": "22844.00",
  "מע"מ": "18%",
  "ערך מע"מ": "4111.92",
  "עלות כוללת": "26955.92",
  "הערות": "",
  "לינק": "",
  "חלקים": [
    {
      "מק"ט חלק": "1-004-52159F913",
      "שם חלק": "מגן אחורי עליון",
      "תיאור": "מגן אחורי עליון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "8239.00"
    }
  ],
  "עבודות": [
    {
      "סוג העבודה": "KM",
      "תיאור עבודות": "פחחות",
      "עלות עבודות": "1320.00"
    }
  ],
  "תיקונים": [],
  "ח.פ.": "517109013",
  "source": "manual_input",
  "processed_at": "2025-10-26T14:35:22.123Z"
}
```

**Key Requirements:**
- All amounts as strings with 2 decimals: "1234.00" (NO commas in stored values)
- VAT as percentage with %: "18%"
- Arrays for חלקים, עבודות, תיקונים (can be empty [])
- source: "manual_input" (hardcoded)
- processed_at: ISO timestamp

---

## ⚙️ JAVASCRIPT FUNCTIONS

### Data Collection

```javascript
function collectFormData() {
  return {
    // Fixed fields
    "מספר רכב": getValue('vehicle-plate'),
    "יצרן": getValue('manufacturer'),
    "דגם": getValue('model'),
    "שנת ייצור": getValue('production-year'),
    "מד אוץ": getValue('odometer'),
    "בעל הרכב": getValue('car-owner'),
    "מספר תיק": getValue('file-number'),
    "תאריך": getValue('date'),
    "מס. חשבונית": getValue('invoice-number'),
    "שם מוסך": getValue('garage-name'),
    "דוא\"ל מוסך": getValue('garage-email'),
    "טלפון מוסך": getValue('garage-phone'),
    "כתובת מוסך": getValue('garage-address'),
    "מוקד נזק": getValue('damage-area'),
    "הערות": getValue('notes'),
    
    // Categories
    "חלקים": getPartsArray(),
    "עבודות": getWorksArray(),
    "תיקונים": getRepairsArray(),
    
    // Totals
    "סהכ חלקים": formatAmount(calculateCategoryTotal('parts')),
    "סהכ עבודות": formatAmount(calculateCategoryTotal('works')),
    "סהכ תיקונים": formatAmount(calculateCategoryTotal('repairs')),
    "עלות כוללת ללא מע״מ": formatAmount(calculateSubtotal()),
    "מע"מ": getVATPercent() + "%",
    "ערך מע"מ": formatAmount(calculateVATAmount()),
    "עלות כוללת": formatAmount(calculateTotal()),
    
    // Metadata
    "ח.פ.": getValue('company-number'),
    "לינק": "",
    "source": "manual_input",
    "processed_at": new Date().toISOString()
  };
}

function getPartsArray() {
  const rows = document.querySelectorAll('tr[data-category="parts"]');
  return Array.from(rows).map(row => ({
    "מק\"ט חלק": row.querySelector('[name="part-code"]').value,
    "שם חלק": row.querySelector('[name="part-name"]').value,
    "תיאור": row.querySelector('[name="part-desc"]').value,
    "כמות": row.querySelector('[name="part-qty"]').value,
    "מקור": row.querySelector('[name="part-source"]').value,
    "עלות": formatAmount(parseFloat(row.querySelector('[name="part-cost"]').value) || 0)
  }));
}

function getWorksArray() {
  const rows = document.querySelectorAll('tr[data-category="works"]');
  return Array.from(rows).map(row => ({
    "סוג העבודה": row.querySelector('[name="work-code"]').value,
    "תיאור עבודות": row.querySelector('[name="work-desc"]').value,
    "עלות עבודות": formatAmount(parseFloat(row.querySelector('[name="work-cost"]').value) || 0)
  }));
}

function getRepairsArray() {
  const rows = document.querySelectorAll('tr[data-category="repairs"]');
  return Array.from(rows).map(row => ({
    "סוג תיקון": row.querySelector('[name="repair-code"]').value,
    "תיאור התיקון": row.querySelector('[name="repair-desc"]').value,
    "עלות תיקונים": formatAmount(parseFloat(row.querySelector('[name="repair-cost"]').value) || 0)
  }));
}

function formatAmount(num) {
  return num.toFixed(2); // Returns "1234.56" (no commas)
}
```

### Row Management

```javascript
let rowCounter = {
  parts: 1,
  works: 1,
  repairs: 1
};

function addPartRow() {
  const rowId = `part-${++rowCounter.parts}`;
  const tbody = document.querySelector('#parts-table tbody');
  const row = document.createElement('tr');
  row.className = 'item-row';
  row.dataset.category = 'parts';
  row.dataset.rowId = rowId;
  
  row.innerHTML = `
    <td><input type="text" name="part-code" placeholder="מק״ט" dir="ltr" /></td>
    <td><input type="text" name="part-name" placeholder="שם חלק" dir="rtl" /></td>
    <td><input type="text" name="part-desc" placeholder="תיאור" dir="rtl" /></td>
    <td><input type="number" name="part-qty" value="1" min="1" dir="ltr" class="qty-field" /></td>
    <td>
      <select name="part-source" dir="rtl">
        <option value="מקורי">מקורי</option>
        <option value="תחליפי">תחליפי</option>
        <option value="אחר">אחר</option>
      </select>
    </td>
    <td><input type="number" name="part-cost" placeholder="0.00" step="0.01" dir="ltr" class="cost-field" /></td>
    <td><button type="button" class="remove-btn" onclick="removeRow('${rowId}')">×</button></td>
  `;
  
  tbody.appendChild(row);
  
  // Attach event listeners for calculations
  attachRowListeners(row);
  
  // Focus first input
  row.querySelector('input').focus();
  
  // Animate
  row.style.animation = 'slideIn 0.3s ease-out';
}

function addWorkRow() {
  // Similar to addPartRow but for works
}

function addRepairRow() {
  // Similar to addPartRow but for repairs
}

function removeRow(rowId) {
  const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
  if (!row) return;
  
  // Check if row has data
  const hasData = Array.from(row.querySelectorAll('input, select'))
    .some(field => field.value && field.value !== '1');
  
  if (hasData && !confirm('האם למחוק שורה זו? הנתונים יאבדו.')) {
    return;
  }
  
  // Animate out
  row.style.animation = 'fadeOut 0.2s ease-out';
  setTimeout(() => {
    row.remove();
    recalculateAll();
  }, 200);
}
```

### Calculations (with Debouncing)

```javascript
let calculationTimer = null;

function attachRowListeners(row) {
  const costFields = row.querySelectorAll('.cost-field, .qty-field');
  costFields.forEach(field => {
    field.addEventListener('input', debounceCalculate);
  });
}

function debounceCalculate() {
  clearTimeout(calculationTimer);
  calculationTimer = setTimeout(recalculateAll, 300);
}

function recalculateAll() {
  // Calculate category totals
  const partsTotal = calculateCategoryTotal('parts');
  const worksTotal = calculateCategoryTotal('works');
  const repairsTotal = calculateCategoryTotal('repairs');
  
  document.getElementById('parts-total').textContent = `₪${partsTotal.toLocaleString('he-IL', {minimumFractionDigits: 2})}`;
  document.getElementById('works-total').textContent = `₪${worksTotal.toLocaleString('he-IL', {minimumFractionDigits: 2})}`;
  document.getElementById('repairs-total').textContent = `₪${repairsTotal.toLocaleString('he-IL', {minimumFractionDigits: 2})}`;
  
  // Calculate subtotal
  const subtotal = partsTotal + worksTotal + repairsTotal;
  document.getElementById('subtotal').textContent = `₪${subtotal.toLocaleString('he-IL', {minimumFractionDigits: 2})}`;
  
  // Calculate VAT
  const vatPercent = parseFloat(document.getElementById('vat-percent').value) || 0;
  const vatAmount = subtotal * (vatPercent / 100);
  document.getElementById('vat-amount').textContent = `₪${vatAmount.toLocaleString('he-IL', {minimumFractionDigits: 2})}`;
  
  // Calculate grand total
  const grandTotal = subtotal + vatAmount;
  document.getElementById('grand-total').textContent = `₪${grandTotal.toLocaleString('he-IL', {minimumFractionDigits: 2})}`;
}

function calculateCategoryTotal(category) {
  const rows = document.querySelectorAll(`tr[data-category="${category}"]`);
  let total = 0;
  
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.qty-field')?.value) || 1;
    const cost = parseFloat(row.querySelector('.cost-field')?.value) || 0;
    total += qty * cost;
  });
  
  return total;
}

function calculateSubtotal() {
  return calculateCategoryTotal('parts') + 
         calculateCategoryTotal('works') + 
         calculateCategoryTotal('repairs');
}

function calculateVATAmount() {
  const subtotal = calculateSubtotal();
  const vatPercent = parseFloat(document.getElementById('vat-percent').value) || 0;
  return subtotal * (vatPercent / 100);
}

function calculateTotal() {
  return calculateSubtotal() + calculateVATAmount();
}

function getVATPercent() {
  return parseFloat(document.getElementById('vat-percent').value) || 0;
}
```

### Validation

```javascript
function validateRequiredFields() {
  const requiredFields = [
    { id: 'car-owner', label: 'בעל הרכב' },
    { id: 'date', label: 'תאריך' },
    { id: 'invoice-number', label: 'מס. חשבונית' },
    { id: 'garage-name', label: 'שם מוסך' },
    { id: 'garage-phone', label: 'טלפון מוסך' }
  ];
  
  const missing = [];
  
  requiredFields.forEach(field => {
    const input = document.getElementById(field.id);
    if (!input.value.trim()) {
      missing.push(field.label);
      input.style.border = '2px solid #dc2626';
      input.classList.add('error');
    } else {
      input.style.border = '';
      input.classList.remove('error');
    }
  });
  
  return missing;
}

function highlightErrors(fieldIds) {
  fieldIds.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      field.style.border = '2px solid #dc2626';
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}
```

### Save Operations

```javascript
async function handleSave() {
  console.log('💾 Starting manual invoice save...');
  
  // Step 1: Validate
  const missingFields = validateRequiredFields();
  if (missingFields.length > 0) {
    showErrorMessage(`שדות חובה חסרים: ${missingFields.join(', ')}`);
    return;
  }
  
  // Step 2: Collect data
  const invoiceData = collectFormData();
  console.log('📋 Collected invoice data:', invoiceData);
  
  // Step 3: Save to helper
  try {
    saveToHelper(invoiceData);
    console.log('✅ Saved to helper.manualInvoice');
  } catch (error) {
    console.error('❌ Helper save failed:', error);
    showErrorMessage('שגיאה בשמירה ל-sessionStorage');
    return;
  }
  
  // Step 4: Save to Supabase
  try {
    await saveToSupabase(invoiceData);
    console.log('✅ Saved to Supabase');
  } catch (error) {
    console.error('❌ Supabase save failed:', error);
    showErrorMessage('שגיאה בשמירה למסד הנתונים. אנא נסה שוב.');
    return;
  }
  
  // Step 5: Success
  showSuccessMessage('✅ חשבונית נשמרה בהצלחה');
}

function saveToHelper(data) {
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  
  // Add to invoices array
  if (!helper.invoices) helper.invoices = [];
  
  // Check for duplicate invoice number
  const existingIndex = helper.invoices.findIndex(inv => 
    inv['מס. חשבונית'] === data['מס. חשבונית']
  );
  
  if (existingIndex >= 0) {
    // Update existing
    helper.invoices[existingIndex] = data;
  } else {
    // Add new
    helper.invoices.push(data);
  }
  
  sessionStorage.setItem('helper', JSON.stringify(helper));
}

async function saveToSupabase(data) {
  // Get case_id from helper or create new case
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  const caseId = helper.case_id;
  
  if (!caseId) {
    throw new Error('No case_id found in helper');
  }
  
  // Prepare invoice insert
  const invoiceInsert = {
    case_id: caseId,
    plate: data['מספר רכב'],
    invoice_number: data['מס. חשבונית'],
    invoice_type: 'PARTS', // Default, can be inferred from items
    supplier_name: data['שם מוסך'],
    status: 'DRAFT',
    total_before_tax: parseFloat(data['עלות כוללת ללא מע״מ']),
    tax_amount: parseFloat(data['ערך מע"מ']),
    total_amount: parseFloat(data['עלות כוללת'])
  };
  
  // Insert invoice
  const { data: invoice, error: invoiceError } = await window.supabase
    .from('invoices')
    .insert(invoiceInsert)
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;
  
  console.log('✅ Invoice inserted:', invoice.id);
  
  // Prepare invoice lines
  const lines = [];
  let lineNumber = 1;
  
  // Add parts
  data['חלקים'].forEach(part => {
    lines.push({
      invoice_id: invoice.id,
      line_number: lineNumber++,
      description: part['שם חלק'] || part['תיאור'],
      quantity: parseFloat(part['כמות']),
      unit_price: parseFloat(part['עלות']),
      line_total: parseFloat(part['כמות']) * parseFloat(part['עלות']),
      metadata: {
        category: 'PART',
        code: part['מק"ט חלק'],
        source: part['מקור']
      }
    });
  });
  
  // Add works
  data['עבודות'].forEach(work => {
    lines.push({
      invoice_id: invoice.id,
      line_number: lineNumber++,
      description: work['תיאור עבודות'],
      quantity: 1,
      unit_price: parseFloat(work['עלות עבודות']),
      line_total: parseFloat(work['עלות עבודות']),
      metadata: {
        category: 'WORK',
        code: work['סוג העבודה']
      }
    });
  });
  
  // Add repairs
  data['תיקונים'].forEach(repair => {
    lines.push({
      invoice_id: invoice.id,
      line_number: lineNumber++,
      description: repair['תיאור התיקון'],
      quantity: 1,
      unit_price: parseFloat(repair['עלות תיקונים']),
      line_total: parseFloat(repair['עלות תיקונים']),
      metadata: {
        category: 'REPAIR',
        code: repair['סוג תיקון']
      }
    });
  });
  
  // Insert lines
  if (lines.length > 0) {
    const { error: linesError } = await window.supabase
      .from('invoice_lines')
      .insert(lines);
    
    if (linesError) throw linesError;
    console.log(`✅ Inserted ${lines.length} invoice lines`);
  }
  
  return invoice.id;
}
```

### UI Feedback

```javascript
function showSuccessMessage(msg) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success';
  alert.innerHTML = `
    <span style="font-size: 24px;">✅</span>
    <span>${msg}</span>
  `;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

function showErrorMessage(msg) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-error';
  alert.innerHTML = `
    <span style="font-size: 24px;">❌</span>
    <span>${msg}</span>
  `;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}
```

---

## 🎨 CSS STYLING

### Core Styles

```css
/* RTL and Hebrew support */
body {
  direction: rtl;
  text-align: right;
  font-family: 'Arial', 'Segoe UI', sans-serif;
  background: #f1f5f9;
  margin: 0;
  padding: 0;
}

/* LTR for numbers */
input[type="number"],
input[type="date"],
input[dir="ltr"] {
  direction: ltr;
  text-align: left;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Fixed fields grid */
.fixed-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #334155;
}

.field-group input,
.field-group select {
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
}

.field-group input:focus,
.field-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.field-group input.error {
  border-color: #dc2626;
  background: #fef2f2;
}

.required {
  color: #dc2626;
  font-weight: bold;
}

/* Category tables */
.category-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background: #64748b;
  color: white;
  padding: 10px 8px;
  text-align: right;
  font-size: 13px;
  font-weight: bold;
}

tbody td {
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
}

tbody input,
tbody select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 13px;
}

tbody input:focus,
tbody select:focus {
  outline: none;
  border-color: #667eea;
}

.cost-field {
  text-align: left;
  font-weight: bold;
}

tfoot {
  background: #f1f5f9;
}

tfoot td {
  padding: 12px 8px;
  font-weight: bold;
}

/* Buttons */
.add-btn {
  background: #22c55e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
}

.add-btn:hover {
  background: #16a34a;
}

.remove-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.remove-btn:hover {
  background: #b91c1c;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  position: sticky;
  top: 20px;
  z-index: 100;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.save-btn:hover {
  box-shadow: 0 6px 10px rgba(0,0,0,0.3);
}

/* Grand totals */
.grand-totals {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.total-line {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 15px;
}

.total-line.grand {
  border-top: 2px solid rgba(255,255,255,0.3);
  padding-top: 12px;
  margin-top: 8px;
  font-size: 18px;
  font-weight: bold;
}

.calculated {
  background: rgba(255,255,255,0.2);
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: bold;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .fixed-fields {
    grid-template-columns: 1fr;
  }
  
  table {
    font-size: 12px;
  }
  
  thead th,
  tbody td {
    padding: 6px 4px;
  }
  
  .container {
    padding: 10px;
  }
}
```

---

## 🔌 INTEGRATION

### SessionStorage Helper Structure

```javascript
{
  "case_id": "uuid...",
  "plate": "698-42-003",
  "invoices": [
    {
      // Automated OCR invoice
      "source": "ocr_webhook",
      "מס. חשבונית": "6",
      // ... full structure
    },
    {
      // Manual invoice
      "source": "manual_input",
      "מס. חשבונית": "7",
      // ... full structure
    }
  ]
}
```

### Supabase Tables

**invoices:**
- id (uuid, PK)
- case_id (uuid, FK)
- plate (text)
- invoice_number (text)
- invoice_type (text)
- supplier_name (text)
- status (text)
- total_before_tax (numeric)
- tax_amount (numeric)
- total_amount (numeric)

**invoice_lines:**
- id (uuid, PK)
- invoice_id (uuid, FK)
- line_number (int)
- description (text)
- quantity (numeric)
- unit_price (numeric)
- line_total (numeric)
- discount_percent (numeric)
- metadata (jsonb) - contains category, code, source

---

## 🧪 TESTING CHECKLIST

Before delivery:
- [ ] All required fields validated
- [ ] Add/remove rows works smoothly
- [ ] Calculations update in real-time (debounced 300ms)
- [ ] Data structure matches webhook exactly
- [ ] sessionStorage save/load works
- [ ] Supabase insert works
- [ ] Hebrew RTL displays correctly
- [ ] Numbers display LTR
- [ ] Mobile responsive (test on 375px width)
- [ ] No console errors
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Keyboard navigation works
- [ ] Success/error messages display properly
- [ ] Duplicate invoice number detection works

---

## 📦 DELIVERABLES

1. **manual_invoice_input.html** - Complete standalone file
2. **Usage instructions** (Hebrew, as HTML comment in file)
3. **Sample output JSON** (for testing)
4. **Integration notes** (how to embed in existing system)

---

## ⚠️ CONSTRAINTS & ASSUMPTIONS

**Constraints:**
- No external libraries
- File size < 100KB
- Modern browsers only (ES6+)
- Hebrew language only

**Assumptions:**
- Supabase client available at `window.supabase`
- sessionStorage available and not full
- User authenticated (for reviewed_by field)
- case_id exists in helper before manual entry

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: HTML Structure (30 min)
- Create header, fixed fields, categories, totals, signature
- Basic styling for layout

### Phase 2: Dynamic Rows (45 min)
- Add/remove functions
- Event listeners
- Row animations

### Phase 3: Calculations (30 min)
- Category totals
- Grand totals
- Debounced updates

### Phase 4: Data Collection (30 min)
- collectFormData()
- Array builders
- Format matching

### Phase 5: Validation (20 min)
- Required fields check
- Error highlighting
- User feedback

### Phase 6: Save Operations (45 min)
- sessionStorage helper
- Supabase insert
- Error handling

### Phase 7: Styling (45 min)
- Professional appearance
- RTL/LTR support
- Responsive design
- Animations

### Phase 8: Testing (60 min)
- All checklist items
- Browser testing
- Mobile testing

**Total Estimated Time:** 4-5 hours

---

## 📝 NEXT STEPS

1. **Get User Approval** for this plan
2. **Create file structure** (manual_invoice_input.html)
3. **Implement Phase 1-8** sequentially
4. **Test thoroughly** with sample data
5. **Deliver** complete file + documentation

---

**Status:** ⏳ AWAITING USER APPROVAL

**When approved, proceed to implementation.**
