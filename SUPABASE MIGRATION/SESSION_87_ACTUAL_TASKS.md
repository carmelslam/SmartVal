# SESSION 87: Manual Invoice Section - ACTUAL Tasks

**Date**: 2025-10-30
**Branch**: `claude/fix-invoice-upload-html-011CUdGAQJ4Un66j3Xr9DpVW`
**Status**: 📝 READY FOR IMPLEMENTATION

---

## ✅ What's ALREADY Fixed (Session 84) - NO CHANGES NEEDED

### 1. Delete Button ✅ (Lines 3162-3247)
- **Line 3207**: Uses unique invoice ID, NOT plate number
- **Fix**: `helper.invoices.filter(inv => invId !== this.currentInvoiceId)`
- **Status**: WORKING CORRECTLY - Won't delete all invoices

### 2. Invoice Reload ✅ (Lines 1270-1406)
- **Lines 1270-1289**: Uses original OCR data from `invoice_documents.ocr_structured_data`
- **Lines 1291-1395**: Reconstructs from `invoice_lines` as fallback
- **Status**: WORKING CORRECTLY - Doesn't use stale data

### 3. Auto-Save Updates Totals ✅ (Lines 2117-2311)
- **Line 2229**: Calls `recalculateInvoiceTotals()`
- **Lines 2254-2311**: Recalculates from invoice_lines and updates invoices table
- **Status**: WORKING CORRECTLY - Totals stay in sync

---

## ❌ What's ACTUALLY Missing - NEEDS IMPLEMENTATION

### Task 1: Save Manual Invoices to `invoice_documents` Table

**Current State**: Manual invoices only save to `invoices` table (lines 3608-3615)

**Why Needed**:
- OCR invoices save to both `invoices` AND `invoice_documents`
- `invoice_documents.ocr_structured_data` stores the complete invoice JSON
- Without this, reload functionality breaks for manual invoices

**Implementation** (add after line 3615):
```javascript
// SESSION 87: Save to invoice_documents table (match OCR structure)
const documentInsert = {
  case_id: caseId,
  plate: invoiceData['מספר רכב'],
  storage_url: null, // No physical PDF yet (Task 5 will generate)
  source: 'manual_input',
  ocr_structured_data: invoiceData, // Store manual data as if from OCR
  ocr_status: 'manual',
  created_at: new Date().toISOString()
};

const { data: document, error: documentError } = await window.supabase
  .from('invoice_documents')
  .insert(documentInsert)
  .select()
  .single();

if (documentError) throw documentError;

console.log('✅ SESSION 87: Manual invoice saved to invoice_documents:', document.id);

// Link invoice to document
await window.supabase
  .from('invoices')
  .update({ document_id: document.id })
  .eq('id', invoice.id);
```

**Files Modified**: `invoice upload.html:3615`
**Risk**: Low - Adds table writes, doesn't change existing logic

---

### Task 2: Save Manual Invoices to `invoice_lines` Table

**Current State**: Parts/works/repairs only stored in helper and invoices.ocr_structured_data JSONB

**Why Needed**:
- Line-item editing requires `invoice_lines` table
- Auto-save updates individual lines (line 2128-2142)
- Reload reconstructs from lines (line 1322-1395)

**Implementation** (add after Task 1):
```javascript
// SESSION 87: Save line items to invoice_lines table
const lineItems = [];
let lineNumber = 0;

// Add parts as line items
parts.forEach(part => {
  lineNumber++;
  lineItems.push({
    invoice_id: invoice.id,
    line_number: lineNumber,
    description: `${part['שם חלק']} - ${part['תיאור']}`,
    quantity: parseFloat(part['כמות']) || 1,
    unit_price: parseFloat(part['עלות']) / (parseFloat(part['כמות']) || 1),
    line_total: parseFloat(part['עלות']),
    metadata: {
      category: 'part',
      code: part['מק"ט חלק'],
      name: part['שם חלק'],
      source: part['מקור']
    }
  });
});

// Add works as line items
works.forEach(work => {
  lineNumber++;
  lineItems.push({
    invoice_id: invoice.id,
    line_number: lineNumber,
    description: work['תיאור עבודות'],
    quantity: 1,
    unit_price: parseFloat(work['עלות עבודות']),
    line_total: parseFloat(work['עלות עבודות']),
    metadata: {
      category: 'work',
      code: work['סוג העבודה']
    }
  });
});

// Add repairs as line items
repairs.forEach(repair => {
  lineNumber++;
  lineItems.push({
    invoice_id: invoice.id,
    line_number: lineNumber,
    description: repair['תיאור התיקון'],
    quantity: 1,
    unit_price: parseFloat(repair['עלות תיקונים']),
    line_total: parseFloat(repair['עלות תיקונים']),
    metadata: {
      category: 'repair',
      code: repair['סוג תיקון']
    }
  });
});

// Insert all line items
if (lineItems.length > 0) {
  const { error: linesError } = await window.supabase
    .from('invoice_lines')
    .insert(lineItems);

  if (linesError) throw linesError;
  console.log(`✅ SESSION 87: Saved ${lineItems.length} line items to invoice_lines`);
}
```

**Files Modified**: `invoice upload.html:3615` (after Task 1)
**Risk**: Low - Adds table writes

---

### Task 3: Implement getUserName() System

**Current State**: No user tracking for created_by, uploaded_by, updated_by columns

**Why Needed**: User specifically confirmed this is required

**Implementation** (add at top of script section):
```javascript
// SESSION 87: User tracking system
let cachedUserName = null;

function getUserName() {
  // Return cached value
  if (cachedUserName) {
    return cachedUserName;
  }

  // Check helper.user
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  if (helper.user?.name) {
    cachedUserName = helper.user.name;
    return cachedUserName;
  }

  // Check Supabase auth
  const auth = sessionStorage.getItem('auth');
  if (auth) {
    try {
      const authData = JSON.parse(auth);
      const user = authData.session?.user || authData.user;
      if (user?.email) {
        cachedUserName = user.email;
        return cachedUserName;
      }
    } catch (e) {
      console.error('Error parsing auth:', e);
    }
  }

  // Prompt user
  const userName = prompt('אנא הזן שם משתמש לזיהוי:');
  if (!userName || userName.trim() === '') {
    return 'משתמש לא ידוע';
  }

  // Cache and save to helper
  cachedUserName = userName.trim();
  helper.user = helper.user || {};
  helper.user.name = cachedUserName;
  sessionStorage.setItem('helper', JSON.stringify(helper));

  return cachedUserName;
}
```

**Then update saveManualInvoice()** (line 3596):
```javascript
// Add after line 3595:
const userName = getUserName();

// Update invoiceInsert object:
const invoiceInsert = {
  case_id: caseId,
  plate: invoiceData['מספר רכב'],
  invoice_number: invoiceData['מס. חשבונית'],
  invoice_type: 'PARTS',
  supplier_name: invoiceData['שם מוסך'],
  status: 'DRAFT',
  total_before_tax: subtotal,
  tax_amount: vatAmount,
  total_amount: grandTotal,
  created_by: userName,        // SESSION 87: Track creator
  uploaded_by: userName        // SESSION 87: Track uploader
};
```

**Also update invoice_lines inserts** (from Task 2):
```javascript
// Add to each line item:
lineItems.push({
  invoice_id: invoice.id,
  line_number: lineNumber,
  description: ...,
  quantity: ...,
  unit_price: ...,
  line_total: ...,
  metadata: {...},
  updated_by: userName  // SESSION 87: Track creator
});
```

**Files Modified**:
- `invoice upload.html` - Add getUserName() function
- `invoice upload.html:3596` - Update saveManualInvoice()
- Task 2 line items - Add updated_by

**Risk**: Medium - Adds user interaction (prompt)

---

### Task 4: Autocomplete for Manual Parts from PARTS_BANK

**Current State**: Manual part input fields are plain text (line 3325-3327)

**Source**: User confirmed autocomplete should pull from `window.PARTS_BANK` (parts.js)

**PARTS_BANK Structure**:
```javascript
// From parts.js:
window.PARTS_BANK = {
  "אביזרים נלווים": ["1X טאסה מקורית", "2X טאסה מקורית", ...],
  "גלגלים וצמיגים": ["ג'אנט ברזל X1", "צמיג X1", ...],
  "חיישני מנוע": ["חיישן ABS", "חיישן DSC", ...],
  ...
}
```

**Implementation**:

**A. Update manual part row HTML** (line 3324-3327):
```html
<td style="padding: 4px; position: relative;">
  <input type="text"
         placeholder="שם חלק"
         class="manual-part-name"
         oninput="showManualPartSuggestions(this)"
         onfocus="showManualPartSuggestions(this)"
         onblur="hideManualPartSuggestions(this)"
         style="width: 100%; padding: 4px; font-size: 11px; border: 1px solid #94a3b8; border-radius: 3px;" />
  <div class="manual-part-dropdown" style="display: none; position: absolute; top: 100%; right: 0; left: 0; background: white; border: 1px solid #94a3b8; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
</td>
```

**B. Add suggestion functions**:
```javascript
// SESSION 87: Autocomplete for manual parts from PARTS_BANK
function flattenPartsBank() {
  if (!window.PARTS_BANK) return [];

  const flatList = [];
  Object.keys(window.PARTS_BANK).forEach(category => {
    window.PARTS_BANK[category].forEach(partName => {
      flatList.push({
        category: category,
        name: partName
      });
    });
  });

  return flatList;
}

function showManualPartSuggestions(input) {
  const searchText = input.value.toLowerCase().trim();

  if (searchText.length < 1) {
    hideManualPartSuggestions(input);
    return;
  }

  // Get flattened parts list
  const allParts = flattenPartsBank();

  // Filter by search text
  const matches = allParts.filter(part =>
    part.name.toLowerCase().includes(searchText)
  ).slice(0, 15); // Limit to 15 suggestions

  // Get dropdown element
  const dropdown = input.nextElementSibling;
  if (!dropdown || !dropdown.classList.contains('manual-part-dropdown')) {
    return;
  }

  // Populate dropdown
  if (matches.length === 0) {
    dropdown.innerHTML = '<div style="padding: 8px; color: #999; text-align: center;">אין תוצאות</div>';
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = matches.map(part => `
    <div class="suggestion-item"
         onclick="selectManualPartSuggestion(this, '${escapeHtml(part.name)}', '${escapeHtml(part.category)}')"
         style="padding: 8px; cursor: pointer; border-bottom: 1px solid #e2e8f0;">
      <div style="font-weight: bold; color: #1e293b;">${escapeHtml(part.name)}</div>
      <div style="font-size: 10px; color: #64748b;">${escapeHtml(part.category)}</div>
    </div>
  `).join('');

  dropdown.style.display = 'block';

  // Add hover effect
  dropdown.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = '#f1f5f9';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'white';
    });
  });
}

function selectManualPartSuggestion(element, partName, category) {
  // Find the input field
  const row = element.closest('tr');
  if (!row) return;

  // Fill the part name field
  const nameInput = row.querySelector('.manual-part-name');
  if (nameInput) {
    nameInput.value = partName;

    // Hide dropdown
    const dropdown = nameInput.nextElementSibling;
    if (dropdown) dropdown.style.display = 'none';
  }

  console.log('✅ Selected part from PARTS_BANK:', { name: partName, category: category });
}

function hideManualPartSuggestions(input) {
  // Delay to allow click on suggestion
  setTimeout(() => {
    const dropdown = input.nextElementSibling;
    if (dropdown && dropdown.classList.contains('manual-part-dropdown')) {
      dropdown.style.display = 'none';
    }
  }, 200);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Files Modified**:
- `invoice upload.html:3324-3327` - Update part name input HTML
- `invoice upload.html` - Add autocomplete functions

**Risk**: Medium - Adds interactive feature (~150 lines)

---

### Task 5: Browser-Based PDF Generation with Watermark

**Current State**: Manual invoices have no PDF representation

**User Requirement**:
- Browser-based PDF generation (not webhook)
- Watermark: "חשבונית ידנית" or "חשבונית משוחזרת"
- Clear labeling that it's manual/restored

**Approach**: Use jsPDF library

**Implementation**:

**A. Add jsPDF library** (add to HTML head):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

**B. Add PDF generation function**:
```javascript
// SESSION 87: Generate PDF for manual invoice with watermark
async function generateManualInvoicePDF(invoiceData, documentId) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add watermark - "חשבונית ידנית"
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.text('חשבונית ידנית', 105, 150, { align: 'center', angle: 45 });

    // Reset for content
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Add title
    doc.setFontSize(18);
    doc.text('חשבונית ידנית / משוחזרת', 105, 20, { align: 'center' });

    // Add invoice details
    let y = 40;
    doc.setFontSize(12);
    doc.text(`מס. חשבונית: ${invoiceData['מס. חשבונית']}`, 20, y);
    y += 10;
    doc.text(`מוסך: ${invoiceData['שם מוסך']}`, 20, y);
    y += 10;
    doc.text(`תאריך: ${invoiceData['תאריך']}`, 20, y);
    y += 10;
    doc.text(`רכב: ${invoiceData['מספר רכב']}`, 20, y);
    y += 10;
    doc.text(`בעל רכב: ${invoiceData['בעל הרכב']}`, 20, y);

    // Add totals
    y += 20;
    doc.setFontSize(14);
    doc.text('סיכום:', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`חלקים: ₪${invoiceData['סהכ חלקים']}`, 30, y);
    y += 8;
    doc.text(`עבודות: ₪${invoiceData['סהכ עבודות']}`, 30, y);
    y += 8;
    doc.text(`תיקונים: ₪${invoiceData['סהכ תיקונים']}`, 30, y);
    y += 8;
    doc.text(`סה"כ לפני מע"מ: ₪${invoiceData['עלות כוללת ללא מע״מ']}`, 30, y);
    y += 8;
    doc.text(`מע"מ: ₪${invoiceData['ערך מע"מ']}`, 30, y);
    y += 8;
    doc.setFontSize(14);
    doc.text(`סה"כ: ₪${invoiceData['עלות כוללת']}`, 30, y);

    // Footer watermark
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('מסמך זה נוצר ידנית במערכת SmartVal', 105, 280, { align: 'center' });

    // Convert to blob
    const pdfBlob = doc.output('blob');

    // Upload to Supabase storage
    const fileName = `manual_invoice_${invoiceData['מס. חשבונית']}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await window.supabase.storage
      .from('invoices')
      .upload(fileName, pdfBlob);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = window.supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // Update invoice_documents with PDF URL
    await window.supabase
      .from('invoice_documents')
      .update({ storage_url: pdfUrl })
      .eq('id', documentId);

    console.log('✅ SESSION 87: PDF generated and uploaded:', pdfUrl);
    return pdfUrl;

  } catch (error) {
    console.error('❌ SESSION 87: PDF generation failed:', error);
    return null;
  }
}
```

**C. Call in saveManualInvoice()** (after Task 1):
```javascript
// SESSION 87: Generate PDF after saving to invoice_documents
if (document.id) {
  const pdfUrl = await generateManualInvoicePDF(invoiceData, document.id);
  if (pdfUrl) {
    console.log('✅ Manual invoice PDF available at:', pdfUrl);
  }
}
```

**Files Modified**:
- `invoice upload.html` - Add jsPDF script tag
- `invoice upload.html` - Add generateManualInvoicePDF() function
- `invoice upload.html:3615` - Call PDF generation after save

**Risk**: Medium-High - External library dependency, storage operations

---

## 📋 Implementation Order

1. **Task 3**: getUserName() system (30 min) - Simple, needed by other tasks
2. **Task 1**: Save to invoice_documents (20 min) - Foundation for other tasks
3. **Task 2**: Save to invoice_lines (30 min) - Depends on Task 1
4. **Task 4**: Parts autocomplete (45 min) - Independent feature
5. **Task 5**: PDF generation (60 min) - Depends on Task 1

**Total Time**: ~185 minutes (~3 hours)

---

## ✅ Testing Checklist

### Task 1 & 2 Testing:
- [ ] Create manual invoice with parts/works/repairs
- [ ] Verify saved to invoices table
- [ ] Verify saved to invoice_documents table
- [ ] Verify saved to invoice_lines table
- [ ] Reload invoice - verify loads correctly
- [ ] Edit line items - verify auto-save works
- [ ] Check console for "SESSION 87" success messages

### Task 3 Testing:
- [ ] First save - prompt appears
- [ ] Enter username - cached for session
- [ ] Second save - no prompt (uses cache)
- [ ] Verify created_by, uploaded_by in invoices table
- [ ] Verify updated_by in invoice_lines table

### Task 4 Testing:
- [ ] Type in part name field - suggestions appear
- [ ] Type "צמיג" - shows tire options
- [ ] Click suggestion - auto-fills field
- [ ] Dropdown closes after selection
- [ ] Test with no matches - shows "אין תוצאות"

### Task 5 Testing:
- [ ] Save manual invoice - PDF generates
- [ ] Open PDF URL - shows watermark "חשבונית ידנית"
- [ ] Verify invoice details in PDF
- [ ] Verify storage_url updated in invoice_documents
- [ ] Test with Hebrew text rendering

---

## 🚨 Important Notes

1. **Session 84 fixes are PRESERVED** - Don't touch delete, reload, or auto-save functions
2. **Session 83 fixes are PRESERVED** - Hebrew encoding, auto-save, no webhook on edit
3. **Autocomplete source**: `window.PARTS_BANK` from parts.js (NOT Supabase)
4. **PDF approach**: Browser-based jsPDF (NOT webhook to Make.com)
5. **getUserName()**: REQUIRED per user confirmation

---

**Ready for implementation?** All tasks are clearly defined with code examples.
