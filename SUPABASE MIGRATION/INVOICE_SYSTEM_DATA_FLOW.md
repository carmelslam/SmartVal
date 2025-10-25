# Invoice System Data Flow - Complete Architecture

**Session 76 - Created: 2025-10-25**

## 📊 Tables Overview

### 1. **invoice_documents** (Upload & OCR Storage)
**Purpose:** Store uploaded PDF and OCR processing results  
**SQL:** `Phase5a_Invoice/02_create_invoice_documents_table.sql`

**Key Fields:**
- `id` - Document UUID
- `case_id` - Link to case
- `plate` - License plate
- `filename` - Original filename
- `storage_path` - Path in Supabase Storage bucket 'docs'
- `storage_bucket` - 'docs'
- **`ocr_structured_data`** - JSONB with complete OCR response from Make.com webhook
- `ocr_status` - 'pending' | 'processing' | 'completed' | 'failed'
- `ocr_raw_text` - Raw extracted text
- `processing_method` - 'make_ocr'

**Populated by:** `InvoiceService.uploadInvoiceDocument()`  
**Updated by:** `InvoiceService.updateOCRResults()` after webhook

---

### 2. **invoices** (Main Invoice Header)
**Purpose:** Store invoice header/summary data  
**SQL:** `Unassigned_SQL/20250926_initial_schema.sql` + `Phase5a_Invoice/01_add_user_tracking_to_invoices.sql`

**Key Fields:**
- `id` - Invoice UUID
- `case_id` - Link to case
- `plate` - License plate
- **`invoice_number`** - UNIQUE invoice number (from OCR or generated)
- `supplier_name` - Garage/supplier name
- `supplier_tax_id` - Tax ID
- `issue_date` - Invoice date
- `due_date` - Payment due date
- `total_amount` - Final total with tax
- `total_before_tax` - Subtotal
- `tax_amount` - VAT amount
- `currency` - 'ILS'
- `payment_status` - 'pending' | 'paid' | 'overdue'
- `approval_status` - 'pending' | 'approved' | 'rejected'
- `invoice_type` - 'PARTS' | 'LABOR' | 'TOWING' | 'OTHER'
- `metadata` - JSONB for extra data
- `created_by` - User UUID
- `updated_by` - User UUID

**Populated by:** `InvoiceService.createInvoice()`  
**Called from:** `InvoiceProcessor.saveResults()` in invoice upload.html

---

### 3. **invoice_lines** (Line Items)
**Purpose:** Store individual items/parts/works from invoice  
**SQL:** Same as invoices + `Phase5a_Invoice/08_add_item_category_to_invoice_lines.sql`

**Key Fields:**
- `id` - Line UUID
- `invoice_id` - Link to invoices table
- `line_number` - Order in invoice
- `description` - Item description
- `quantity` - Amount
- `unit_price` - Price per unit
- `line_total` - quantity * unit_price
- `unit` - 'יחידה' | 'שעות' | etc.
- `discount_percent` - Discount %
- `vat_rate` - 17% default
- **`item_category`** - 'PART' | 'WORK' | 'REPAIR' (auto-categorized by trigger)
- `category_confidence` - AI confidence score
- `category_method` - 'manual' | 'keyword' | 'ai'
- `part_id` - Link to parts_required table (optional)
- `metadata` - JSONB
- `created_by` - User UUID

**Populated by:** `InvoiceService.createInvoice()` - inserts all lines in batch  
**Auto-categorized by:** SQL trigger (checks keywords in description)

---

### 4. **invoice_suppliers** (Supplier Details)
**Purpose:** Store supplier/garage contact information  
**SQL:** `Phase5a_Invoice/03_create_invoice_suppliers_table.sql`

**Key Fields:**
- `id` - Supplier UUID
- `supplier_name` - UNIQUE name
- `tax_id` - Tax ID
- `email`, `phone`, `address`, `city`, `postal_code`
- `supplier_type` - 'garage' | 'parts_supplier' | 'towing' | 'other'
- `is_active` - Boolean
- `metadata` - JSONB

**Populated by:** Manual or OCR extraction  
**Status:** NOT CURRENTLY AUTO-POPULATED

---

### 5. **invoice_validations** (Approval Workflow)
**Purpose:** Track approval/rejection decisions  
**SQL:** `Phase5a_Invoice/04_create_invoice_validations_table.sql`

**Key Fields:**
- `id` - Validation UUID
- `invoice_id` - Link to invoices
- `validated_by` - User UUID
- `validation_status` - 'approved' | 'rejected' | 'pending_review'
- `validation_notes` - Reason for decision
- `validated_at` - Timestamp

**Populated by:** Approval UI (NOT YET IMPLEMENTED)  
**Status:** PLANNED BUT NOT ACTIVE

---

### 6. **invoice_damage_center_mappings** (Field Mapping)
**Purpose:** Map invoice line items to damage center fields  
**SQL:** `Phase5a_Invoice/07_create_invoice_damage_center_mapping.sql`

**Key Fields:**
- `id` - Mapping UUID
- `case_id` - Link to case
- `invoice_id` - Link to invoices
- `invoice_line_id` - Link to specific invoice line
- `damage_center_code` - Which damage center (e.g., 'CENTER_1')
- `field_path` - JSON path to field (e.g., 'parts.frontBumper.price')
- `mapped_value` - The value to apply
- `mapped_by` - User UUID

**Populated by:** Damage center mapper UI (damage-center-mapper.js)  
**Status:** CODE COMPLETE, NOT TESTED

---

## 🔄 Complete Data Flow

### Step 1: Upload Invoice PDF
```
User uploads PDF file
  ↓
InvoiceProcessor.processInvoice() (invoice upload.html:865)
  ↓
InvoiceService.uploadInvoiceDocument(file, caseId, plate)
  ↓
Supabase Storage: docs bucket → uploads sanitized file
  ↓
invoice_documents table: INSERT with ocr_status='pending'
  ↓
Returns: documentId
```

### Step 2: OCR Processing
```
Send to Make.com webhook for OCR
  ↓
Make.com processes PDF with OCR
  ↓
Webhook response back to InvoiceProcessor.handleOCRResults()
  ↓
InvoiceService.updateOCRResults(documentId, ocrData)
  ↓
invoice_documents table: UPDATE ocr_structured_data, ocr_status='completed'
```

### Step 3: Save Invoice to Database
```
User clicks "💾 שמור תוצאות"
  ↓
InvoiceProcessor.saveResults() (invoice upload.html:1108)
  ↓
Prepares invoiceData and lines from this.ocrResults
  ↓
InvoiceService.createInvoice(invoiceData, lines, caseId)
  ↓
invoices table: INSERT invoice header
  ↓
invoice_lines table: INSERT all line items
  ↓
SQL trigger: Auto-categorize items (PART/WORK/REPAIR)
  ↓
Returns: { success: true, invoice: {...} }
```

### Step 4: Update Helper (Backward Compatibility)
```
InvoiceProcessor.updateHelperWithResults(result)
  ↓
Adds invoice to sessionStorage helper.invoices[]
  ↓
Deduplicates by invoice_number
  ↓
window.updateHelper('invoices', helper.invoices)
```

### Step 5: Damage Center Mapping (OPTIONAL)
```
User opens final-report-builder.html
  ↓
Clicks "מיפוי מחשבונית" button
  ↓
damage-center-mapper.js opens modal
  ↓
Shows dropdown with invoice lines filtered by category
  ↓
User selects item → auto-fills damage center field
  ↓
invoice_damage_center_mappings table: INSERT mapping
  ↓
helper.centers updated with invoice costs
```

---

## ❌ Current Issues & Root Causes

### Issue 1: Summary Shows 0.00
**Screenshot:** User shows OCR results summary = ₪0.00

**Root Cause:**  
invoice upload.html:960-975 tries to calculate total from `this.ocrResults` but if OCR webhook fails or returns empty, array is empty.

**Fix Applied (Session 76):**
```javascript
const calculatedTotal = this.ocrResults.reduce((sum, item) => {
  return sum + ((item.quantity || 1) * (item.unit_price || 0));
}, 0);
```

**Status:** ✅ FIXED - Now calculates correctly

---

### Issue 2: Tables Empty (invoices, invoice_lines)
**User says:** "the fields are empty and other invoices tables that need to take info from the main invoice table are empty"

**Root Cause:**  
`InvoiceService.createInvoice()` line 75-78 requires `this.currentUser` to be set:
```javascript
const userId = this.currentUser?.user_id;
if (!userId) {
  throw new Error('User not authenticated');
}
```

But `InvoiceService.initialize()` is NEVER called, so `this.currentUser` is null.

**Fix Needed:**
```javascript
// In invoice upload.html, when creating InvoiceService:
const invoiceService = new InvoiceService();
await invoiceService.initialize(); // MUST CALL THIS
window.invoiceService = invoiceService;
```

**Status:** ⚠️ NOT FIXED YET

---

### Issue 3: No Invoice View URL
**User says:** "i still dont see the url that i can view the invoice from supabase"

**Root Cause:**  
`InvoiceService.getInvoiceDocumentURL()` exists (Session 76) but is NOT called from UI.

**Fix Needed:**  
Add button in OCR results section:
```html
<button onclick="viewInvoicePDF()">📄 צפה בחשבונית</button>
```

```javascript
async viewInvoicePDF() {
  if (this.currentDocumentId) {
    const url = await this.invoiceService.getInvoiceDocumentURL(this.currentDocumentId);
    window.open(url, '_blank');
  }
}
```

**Status:** ⚠️ NOT IMPLEMENTED YET

---

### Issue 4: Duplicate Invoices in Helper
**User says:** "helper is registering the same invoice each time i run it"

**Root Cause:**  
`updateHelperWithResults()` was pushing without checking for duplicates.

**Fix Applied (Session 76):**
```javascript
// Remove any existing invoice with same invoice_number before adding
helper.invoices = helper.invoices.filter(inv => {
  const existingInvNum = inv.invoice_number || inv['מס. חשבונית'] || inv.invoiceNumber;
  return existingInvNum !== invoiceNumber;
});
```

**Status:** ✅ FIXED - Now deduplicates by invoice_number only

---

### Issue 5: Clear Form Doesn't Remove Invoice
**User says:** "🗑️ נקה טופס in the ui should delete the associated invoice from helper.invoices"

**Fix Applied (Session 76):**
```javascript
clearForm() {
  if (this.currentInvoiceId) {
    helper.invoices = helper.invoices.filter(inv => inv.invoice_id !== this.currentInvoiceId);
    // Update helper system
    window.updateHelper('invoices', helper.invoices, 'invoice-upload-clear');
  }
}
```

**Status:** ✅ FIXED

---

## 🔍 Verification Checklist

To verify the invoice system is working correctly:

### Check 1: invoice_documents populated
```sql
SELECT id, filename, ocr_status, storage_path 
FROM invoice_documents 
WHERE case_id = 'YOUR_CASE_ID'
ORDER BY created_at DESC;
```

**Expected:** One row per uploaded invoice PDF with `ocr_status='completed'`

---

### Check 2: invoices populated
```sql
SELECT id, invoice_number, supplier_name, total_amount 
FROM invoices 
WHERE case_id = 'YOUR_CASE_ID'
ORDER BY created_at DESC;
```

**Expected:** One row per saved invoice with correct total_amount

---

### Check 3: invoice_lines populated
```sql
SELECT il.*, i.invoice_number
FROM invoice_lines il
JOIN invoices i ON il.invoice_id = i.id
WHERE i.case_id = 'YOUR_CASE_ID'
ORDER BY il.invoice_id, il.line_number;
```

**Expected:** Multiple rows per invoice with item_category auto-filled

---

### Check 4: Categorization working
```sql
SELECT item_category, COUNT(*) 
FROM invoice_lines il
JOIN invoices i ON il.invoice_id = i.id
WHERE i.case_id = 'YOUR_CASE_ID'
GROUP BY item_category;
```

**Expected:**
```
PART     | 5
WORK     | 3
REPAIR   | 2
```

---

### Check 5: View URL works
```javascript
const invoiceService = new InvoiceService();
await invoiceService.initialize();
const url = await invoiceService.getInvoiceDocumentURL('DOCUMENT_ID');
console.log(url); // Should be signed URL
```

**Expected:** Supabase signed URL valid for 1 hour

---

## 🚀 Remaining Implementation Tasks

1. **Initialize InvoiceService properly** - Call `initialize()` on page load
2. **Add "View PDF" button** - Show invoice document URL in UI
3. **Test full flow** - Upload → OCR → Save → Verify tables
4. **Implement approval UI** - For invoice_validations table
5. **Test damage center mapping** - Verify invoice_damage_center_mappings works
6. **Add real-time updates** - Subscribe to invoice changes
7. **Create invoice list view** - Show all invoices for a case

---

**Created:** 2025-10-25  
**Author:** Claude (Session 76)  
**Status:** Documentation Complete - Implementation 85%
