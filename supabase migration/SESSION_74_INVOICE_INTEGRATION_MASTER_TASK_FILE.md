# SESSION 74: Invoice Integration Master Task File
## Phase 5a - Complete Invoice Management with Damage Center Mapping

**Created:** 2025-10-23  
**Estimated Duration:** 4-5 days (32-40 hours)  
**Complexity:** HIGH - Multiple integrations, OCR, mappings, 3-source dropdowns  
**Status:** 📋 PLANNING COMPLETE - Ready for Implementation

---

## 🎯 PROJECT OVERVIEW

### What We're Building:
A complete invoice management system that:
1. Captures OCR data from Make.com webhook
2. Stores invoice items with automatic categorization
3. Maps invoice items to damage center fields in final report builder
4. Supports 3-source parts dropdown (selected + bank + invoice)
5. Syncs with helper bidirectionally
6. Updates damage centers with actual invoice costs

### Why This Is Complex:
- **OCR Integration** - Webhook handling, async processing
- **Damage Center Mapping** - Iframe communication, auto-fill logic
- **Multi-Source Dropdowns** - Combining 3 data sources for parts
- **Helper Sync** - Bidirectional updates without data loss
- **Categorization** - Auto-categorize items (parts/works/repairs)
- **User Tracking** - Phase 6 auth integration everywhere

---

## 📁 FILES TO MODIFY/CREATE

### SQL Files (8) - Already Created ✅
Located: `supabase/sql/Phase5a_Invoice/`
1. `01_add_user_tracking_to_invoices.sql`
2. `02_create_invoice_documents_table.sql`
3. `03_create_invoice_suppliers_table.sql`
4. `04_create_invoice_validations_table.sql`
5. `05_create_indexes_and_rls.sql`
6. `06_enable_realtime.sql`
7. `07_create_invoice_damage_center_mapping.sql`
8. `08_add_item_category_to_invoice_lines.sql`

### JavaScript Files to Create:
1. `services/invoice-service.js` - Supabase CRUD operations
2. `services/invoice-helper-sync.js` - Helper bidirectional sync
3. `services/invoice-categorization.js` - Auto-categorization logic
4. `services/damage-center-mapper.js` - Mapping service
5. `components/invoice-parts-dropdown.js` - 3-source dropdown component

### HTML Files to Modify:
1. `invoice upload.html` - Add Supabase integration
2. `final-report-builder.html` - Add damage center mapping UI
3. `invoice-details-floating.js` - Connect to Supabase

### Helper Structure to Modify:
- `window.helper.invoices[]` - Keep for backward compatibility
- `window.helper.financials.invoices` - Sync with Supabase
- `window.helper.centers[]` - Update with invoice mappings

---

## 📋 MASTER TASK BREAKDOWN (30 Tasks)

### ═══════════════════════════════════════════════════════════
### PHASE 1: DATABASE SETUP & DEPLOYMENT (Day 1 Morning)
### ═══════════════════════════════════════════════════════════

#### Task 1.1: Deploy SQL Schema ⏳
**Priority:** CRITICAL  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Steps:**
1. Open Supabase dashboard SQL editor
2. Copy contents of `01_add_user_tracking_to_invoices.sql`
3. Execute and verify (check for errors)
4. Repeat for files 02-08 in order
5. Run verification queries after each file

**Verification:**
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'invoice%' 
ORDER BY table_name;
-- Expected: 6 tables

-- Check columns added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'invoice_lines' 
AND column_name IN ('item_category', 'created_by');
-- Expected: 2 rows

-- Check functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%invoice%' OR routine_name LIKE '%categor%'
ORDER BY routine_name;
-- Expected: ~15 functions

-- Test auto-categorization
SELECT * FROM auto_categorize_invoice_line('תיקון פח דלת');
-- Expected: {category: 'repair', confidence: 0.65}
```

**Success Criteria:**
- ✅ All 8 SQL files executed without errors
- ✅ 6 tables exist (4 new + 2 modified)
- ✅ ~40 indexes created
- ✅ ~28 RLS policies active
- ✅ ~15 functions working
- ✅ Auto-categorization test passes

**Common Errors & Fixes:**
- **Error:** `pg_trgm extension not found`
  - **Fix:** `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- **Error:** `relation "profiles" does not exist`
  - **Fix:** Phase 6 not deployed - deploy Phase6_Auth first
- **Error:** `permission denied for table`
  - **Fix:** Check RLS policies, may need to temporarily disable for testing

**Rollback Plan:**
```sql
-- If something goes wrong, drop new tables
DROP TABLE IF EXISTS invoice_damage_center_mappings CASCADE;
DROP TABLE IF EXISTS invoice_validations CASCADE;
DROP TABLE IF EXISTS invoice_suppliers CASCADE;
DROP TABLE IF EXISTS invoice_documents CASCADE;

-- Remove added columns
ALTER TABLE invoice_lines DROP COLUMN IF EXISTS item_category;
ALTER TABLE invoices DROP COLUMN IF EXISTS created_by;
```

---

#### Task 1.2: Test Database Operations ⏳
**Priority:** HIGH  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 1.1

**Steps:**
1. Test invoice CRUD operations
2. Test invoice_lines with categorization
3. Test mapping creation
4. Test helper functions
5. Test RLS policies

**Test Queries:**
```sql
-- Test 1: Insert invoice
INSERT INTO invoices (
  plate, 
  invoice_number, 
  supplier_name, 
  issue_date, 
  total_amount,
  created_by
) VALUES (
  'TEST123',
  'INV-TEST-001',
  'Test Supplier',
  CURRENT_DATE,
  1000.00,
  (SELECT user_id FROM profiles LIMIT 1)
) RETURNING id;

-- Save invoice_id for next tests
-- Let's call it: test_invoice_id

-- Test 2: Insert invoice lines (should auto-categorize)
INSERT INTO invoice_lines (
  invoice_id,
  line_number,
  description,
  quantity,
  unit_price,
  line_total
) VALUES 
  (test_invoice_id, 1, 'תיקון פח דלת קדמית', 1, 350.00, 350.00),
  (test_invoice_id, 2, 'דלת אחורית ימין', 1, 1500.00, 1500.00),
  (test_invoice_id, 3, 'צביעה מלאה', 1, 2000.00, 2000.00)
RETURNING id, description, item_category, category_confidence;

-- Expected: 
-- Row 1: category = 'repair', confidence ~0.65
-- Row 2: category = 'part', confidence ~0.75
-- Row 3: category = 'work', confidence ~0.70

-- Test 3: Get parts only
SELECT * FROM get_invoice_items_by_category(test_invoice_id, 'part');
-- Expected: 1 row (דלת אחורית)

-- Test 4: Get unmapped items
SELECT * FROM get_unmapped_invoice_items(test_invoice_id);
-- Expected: 3 rows (all items unmapped)

-- Test 5: Create a mapping
SELECT map_invoice_to_damage_center(
  p_invoice_id := test_invoice_id,
  p_invoice_line_id := (SELECT id FROM invoice_lines WHERE invoice_id = test_invoice_id LIMIT 1),
  p_case_id := (SELECT id FROM cases LIMIT 1),
  p_damage_center_id := 'test_center_1',
  p_field_type := 'work',
  p_field_index := 0,
  p_mapped_data := '{"name": "תיקון פח", "costWithoutVat": 350}'::jsonb,
  p_mapped_by := (SELECT user_id FROM profiles LIMIT 1)
);

-- Test 6: Get mappings
SELECT * FROM get_damage_center_mappings(
  (SELECT id FROM cases LIMIT 1),
  'test_center_1'
);
-- Expected: 1 row

-- Test 7: Batch categorize
SELECT * FROM batch_categorize_invoice_lines(test_invoice_id);

-- CLEANUP TEST DATA
DELETE FROM invoices WHERE invoice_number = 'INV-TEST-001';
```

**Success Criteria:**
- ✅ Can insert invoices with user tracking
- ✅ Auto-categorization works on insert
- ✅ Can query by category
- ✅ Mapping functions work
- ✅ RLS policies don't block operations

---

### ═══════════════════════════════════════════════════════════
### PHASE 2: INVOICE SERVICE LAYER (Day 1 Afternoon)
### ═══════════════════════════════════════════════════════════

#### Task 2.1: Create invoice-service.js ⏳
**Priority:** CRITICAL  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.2

**File Location:** `services/invoice-service.js`

**Structure:**
```javascript
/**
 * Invoice Service - Supabase CRUD operations for invoices
 * Handles: invoices, invoice_lines, invoice_documents, mappings
 */

import { supabase } from '../lib/supabaseClient.js';
import { caseOwnershipService } from './caseOwnershipService.js';

class InvoiceService {
  constructor() {
    this.currentUser = null;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  async initialize() {
    try {
      const user = await caseOwnershipService.getCurrentUser();
      this.currentUser = user;
      console.log('📄 InvoiceService initialized for user:', user?.email);
      return true;
    } catch (error) {
      console.error('❌ InvoiceService initialization failed:', error);
      return false;
    }
  }

  // ============================================================================
  // INVOICE CRUD OPERATIONS
  // ============================================================================

  /**
   * Create invoice with lines
   * @param {Object} invoiceData - Invoice header data
   * @param {Array} lines - Array of invoice line items
   * @param {string} caseId - Case UUID
   * @returns {Object} Created invoice with ID
   */
  async createInvoice(invoiceData, lines = [], caseId = null) {
    try {
      console.log('📝 Creating invoice:', invoiceData.invoice_number);
      
      // TODO: Implement invoice creation
      // 1. Insert invoice record
      // 2. Insert invoice_lines
      // 3. Auto-categorize lines (trigger should handle)
      // 4. Return complete invoice
      
      return { success: true, invoice: null };
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices by case
   */
  async getInvoicesByCase(caseId) {
    // TODO: Implement
  }

  /**
   * Get invoice with lines
   */
  async getInvoiceWithLines(invoiceId) {
    // TODO: Implement
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId, updates) {
    // TODO: Implement
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId) {
    // TODO: Implement (admin only)
  }

  // ============================================================================
  // INVOICE DOCUMENT OPERATIONS (OCR)
  // ============================================================================

  /**
   * Upload invoice document to storage
   */
  async uploadInvoiceDocument(file, caseId, invoiceId = null) {
    // TODO: Implement
    // 1. Upload to Supabase Storage 'docs' bucket
    // 2. Create invoice_documents record
    // 3. Return document ID
  }

  /**
   * Update OCR results
   */
  async updateOCRResults(documentId, ocrData) {
    // TODO: Implement
    // Update invoice_documents with OCR data
  }

  /**
   * Get OCR data by invoice
   */
  async getOCRData(invoiceId) {
    // TODO: Use get_invoice_ocr_data() function
  }

  // ============================================================================
  // INVOICE LINES OPERATIONS
  // ============================================================================

  /**
   * Get invoice lines by category
   */
  async getLinesByCategory(invoiceId, category) {
    // TODO: Use get_invoice_items_by_category() function
  }

  /**
   * Get parts for dropdown (invoice parts only)
   */
  async getInvoicePartsForDropdown(invoiceId) {
    // TODO: Query invoice_lines WHERE item_category = 'part'
  }

  /**
   * Manual categorization override
   */
  async updateLineCategory(lineId, category, method = 'manual') {
    // TODO: Update item_category, category_method, category_confidence
  }

  /**
   * Batch categorize invoice
   */
  async batchCategorize(invoiceId) {
    // TODO: Call batch_categorize_invoice_lines() function
  }

  // ============================================================================
  // DAMAGE CENTER MAPPING OPERATIONS
  // ============================================================================

  /**
   * Create mapping from invoice item to damage center field
   */
  async createMapping(mappingData) {
    // TODO: Call map_invoice_to_damage_center() function
  }

  /**
   * Get mappings for damage center
   */
  async getMappingsForCenter(caseId, damageCenterId) {
    // TODO: Call get_damage_center_mappings() function
  }

  /**
   * Get unmapped invoice items
   */
  async getUnmappedItems(invoiceId) {
    // TODO: Call get_unmapped_invoice_items() function
  }

  /**
   * Remove mapping
   */
  async removeMapping(mappingId) {
    // TODO: Update mapping_status = 'removed'
  }

  /**
   * Update mapping (user edited after auto-fill)
   */
  async updateMapping(mappingId, modifications) {
    // TODO: Update user_modifications, is_user_modified = true
  }

  // ============================================================================
  // SEARCH & FILTER OPERATIONS
  // ============================================================================

  /**
   * Search invoices
   */
  async searchInvoices(filters) {
    // TODO: Implement search with filters:
    // - date range
    // - supplier
    // - amount range
    // - case
    // - status
  }

  // ============================================================================
  // VALIDATION OPERATIONS
  // ============================================================================

  /**
   * Get validation status
   */
  async getValidationStatus(invoiceId) {
    // TODO: Query invoice_validations
  }

  /**
   * Approve/reject invoice
   */
  async updateValidationStatus(invoiceId, status, notes) {
    // TODO: Update invoice_validations
  }

  // ============================================================================
  // SUPPLIER OPERATIONS
  // ============================================================================

  /**
   * Search suppliers (fuzzy)
   */
  async searchSuppliers(term, limit = 10) {
    // TODO: Call search_suppliers() function
  }

  /**
   * Get or create supplier
   */
  async getOrCreateSupplier(supplierName, category = null) {
    // TODO: Call auto_create_supplier_if_not_exists()
  }

  // ============================================================================
  // HELPER INTEGRATION (for backward compatibility)
  // ============================================================================

  /**
   * Sync invoice to helper
   */
  syncToHelper(invoice, lines) {
    // TODO: Update window.helper.invoices[] and helper.financials.invoices
  }

  /**
   * Sync from helper to Supabase
   */
  async syncFromHelper(helperInvoices) {
    // TODO: Create/update invoices from helper data
  }
}

// Singleton instance
export const invoiceService = new InvoiceService();

// Auto-initialize
invoiceService.initialize();
```

**Implementation Steps:**
1. Create file structure with all methods (stubs)
2. Implement invoice CRUD (create, read, update, delete)
3. Implement invoice_lines operations
4. Implement OCR document operations
5. Implement mapping operations
6. Implement search/filter
7. Add comprehensive error handling
8. Add logging throughout

**Success Criteria:**
- ✅ All methods defined (even if stubbed)
- ✅ Can create invoice with lines
- ✅ Can retrieve invoices by case
- ✅ Auto-categorization works
- ✅ Mapping functions work
- ✅ Error handling on all operations
- ✅ User tracking included in all inserts/updates

---

#### Task 2.2: Create invoice-helper-sync.js ⏳
**Priority:** HIGH  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 2.1

**Purpose:** Bidirectional sync between Supabase and window.helper

**File Location:** `services/invoice-helper-sync.js`

**Structure:**
```javascript
/**
 * Invoice Helper Sync Service
 * Handles bidirectional sync between Supabase and window.helper
 */

import { invoiceService } from './invoice-service.js';

class InvoiceHelperSync {
  
  // ============================================================================
  // SUPABASE → HELPER (Load from database)
  // ============================================================================
  
  /**
   * Load invoices from Supabase and populate helper
   */
  async loadInvoicesToHelper(caseId) {
    try {
      console.log('📥 Loading invoices from Supabase to helper...');
      
      // Get invoices from Supabase
      const invoices = await invoiceService.getInvoicesByCase(caseId);
      
      // Update helper.invoices[] (simple array - backward compatible)
      window.helper.invoices = this.convertToSimpleFormat(invoices);
      
      // Update helper.financials.invoices (comprehensive format)
      window.helper.financials = window.helper.financials || {};
      window.helper.financials.invoices = this.convertToComprehensiveFormat(invoices);
      
      console.log('✅ Loaded', invoices.length, 'invoices to helper');
      return invoices.length;
    } catch (error) {
      console.error('❌ Error loading invoices to helper:', error);
      throw error;
    }
  }
  
  /**
   * Convert Supabase format to helper simple format
   */
  convertToSimpleFormat(invoices) {
    // TODO: Convert to helper.invoices[] format
    return invoices.map(inv => ({
      plate: inv.plate,
      owner: '', // Get from case
      garage_name: inv.supplier_name,
      date: inv.issue_date,
      invoice_type: inv.invoice_type?.toLowerCase() || 'mixed',
      items: inv.invoice_lines || [],
      total: inv.total_amount,
      processed_at: inv.created_at
    }));
  }
  
  /**
   * Convert Supabase format to helper comprehensive format
   */
  convertToComprehensiveFormat(invoices) {
    // TODO: Convert to helper.financials.invoices format
  }
  
  // ============================================================================
  // HELPER → SUPABASE (Save to database)
  // ============================================================================
  
  /**
   * Sync helper invoices to Supabase
   */
  async syncHelperToSupabase(caseId) {
    try {
      console.log('📤 Syncing helper invoices to Supabase...');
      
      const helperInvoices = window.helper.invoices || [];
      
      for (const invoice of helperInvoices) {
        // Check if already exists in Supabase
        // If not, create it
        // TODO: Implement sync logic
      }
      
      console.log('✅ Synced', helperInvoices.length, 'invoices to Supabase');
    } catch (error) {
      console.error('❌ Error syncing helper to Supabase:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // DAMAGE CENTER MAPPING SYNC
  // ============================================================================
  
  /**
   * Apply invoice mappings to helper.centers
   */
  async applyMappingsToCenters(caseId) {
    try {
      console.log('🔗 Applying invoice mappings to damage centers...');
      
      if (!window.helper.centers || window.helper.centers.length === 0) {
        console.warn('⚠️ No damage centers in helper');
        return;
      }
      
      // Get all mappings for this case
      // TODO: Get mappings and apply to helper.centers
      
      console.log('✅ Applied mappings to damage centers');
    } catch (error) {
      console.error('❌ Error applying mappings:', error);
      throw error;
    }
  }
  
  /**
   * Save mappings from helper.centers to Supabase
   */
  async saveCenterMappings(caseId) {
    try {
      console.log('💾 Saving damage center mappings...');
      
      // TODO: Iterate helper.centers
      // Check which fields have invoice data
      // Create/update mappings in Supabase
      
      console.log('✅ Saved center mappings');
    } catch (error) {
      console.error('❌ Error saving center mappings:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================
  
  /**
   * Resolve conflicts between helper and Supabase
   */
  async resolveConflicts(caseId) {
    // TODO: Implement conflict resolution
    // Use updated_at timestamps to determine latest version
  }
}

export const invoiceHelperSync = new InvoiceHelperSync();
```

**Success Criteria:**
- ✅ Can load invoices from Supabase → helper
- ✅ Can save invoices from helper → Supabase
- ✅ Can apply mappings to helper.centers
- ✅ Can save mappings from helper.centers
- ✅ No data loss during sync
- ✅ Conflict resolution works

---

### ═══════════════════════════════════════════════════════════
### PHASE 3: INVOICE UPLOAD INTEGRATION (Day 2 Morning)
### ═══════════════════════════════════════════════════════════

#### Task 3.1: Integrate invoice upload.html with Supabase ⏳
**Priority:** CRITICAL  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.1, 2.2

**File:** `invoice upload.html`

**Changes Required:**

**1. Add imports at top:**
```javascript
import { invoiceService } from './services/invoice-service.js';
import { invoiceHelperSync } from './services/invoice-helper-sync.js';
```

**2. Modify file upload handler (around line 705):**
```javascript
async handleFileSelection(file) {
  if (!file) return;
  if (!this.validateFile(file)) return;
  
  this.uploadedFile = file;
  this.showPreview(file);
  
  // NEW: Upload to Supabase Storage immediately
  try {
    const caseId = sessionStorage.getItem('currentCaseId'); // Get from session
    const documentId = await invoiceService.uploadInvoiceDocument(file, caseId);
    this.currentDocumentId = documentId;
    console.log('✅ File uploaded to Supabase:', documentId);
  } catch (error) {
    console.error('❌ File upload failed:', error);
    this.showAlert('שגיאה בהעלאת קובץ', 'error');
  }
  
  this.showAlert('קובץ נטען בהצלחה', 'success');
}
```

**3. Modify OCR webhook handler (around line 825):**
```javascript
async handleOCRResults(result) {
  this.ocrResults = result.items || [];
  this.displayOCRResults(result);
  this.showValidationStatus(result);
  
  // NEW: Save OCR results to Supabase
  try {
    if (this.currentDocumentId) {
      await invoiceService.updateOCRResults(this.currentDocumentId, {
        ocr_raw_text: result.raw_text || '',
        ocr_structured_data: result,
        ocr_confidence: result.confidence || 0,
        ocr_status: 'completed',
        processing_completed_at: new Date().toISOString()
      });
      console.log('✅ OCR results saved to Supabase');
    }
  } catch (error) {
    console.error('❌ Failed to save OCR results:', error);
  }
  
  // Update helper with OCR results (keep existing code)
  this.updateHelperWithResults(result);
  
  // Show save button
  document.getElementById('save-results').style.display = 'inline-block';
}
```

**4. Modify save results handler (around line 915):**
```javascript
async saveResults() {
  try {
    console.log('💾 Saving invoice results...');
    
    const plate = document.getElementById('plate').value;
    const caseId = sessionStorage.getItem('currentCaseId');
    
    // Prepare invoice data
    const invoiceData = {
      plate: plate,
      invoice_number: `INV-${Date.now()}`, // Or extract from OCR
      supplier_name: document.getElementById('garage_name').value,
      issue_date: document.getElementById('date').value,
      invoice_type: document.getElementById('invoice-type').value?.toUpperCase(),
      total_amount: this.calculateTotal(),
      status: 'DRAFT'
    };
    
    // Prepare invoice lines
    const lines = this.ocrResults.map((item, index) => ({
      line_number: index + 1,
      description: item.name || item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      line_total: (item.quantity || 1) * (item.unit_price || 0)
      // item_category will be auto-filled by trigger
    }));
    
    // Save to Supabase
    const result = await invoiceService.createInvoice(invoiceData, lines, caseId);
    
    if (result.success) {
      console.log('✅ Invoice saved to Supabase:', result.invoice.id);
      
      // Sync to helper (for backward compatibility)
      invoiceService.syncToHelper(result.invoice, lines);
      
      // Save helper to session
      sessionStorage.setItem('helper', JSON.stringify(window.helper));
      
      this.showAlert('✅ חשבונית נשמרה בהצלחה', 'success');
      
      // Optional: Redirect or clear form
      // window.location.href = 'final-report-builder.html';
    }
  } catch (error) {
    console.error('❌ Error saving invoice:', error);
    this.showAlert('❌ שגיאה בשמירת החשבונית: ' + error.message, 'error');
  }
}
```

**5. Add categorization display in OCR results table:**
```javascript
// In displayOCRResults() function, add category column
row.innerHTML = `
  <td><input type="text" value="${item.name || ''}" data-field="name" data-index="${index}" class="result-field"></td>
  <td><input type="text" value="${item.description || ''}" data-field="description" data-index="${index}" class="result-field"></td>
  <td><input type="number" value="${item.quantity || 1}" data-field="quantity" data-index="${index}" class="result-field" min="1"></td>
  <td><input type="number" value="${item.unit_price || 0}" data-field="unit_price" data-index="${index}" class="result-field" step="0.01"></td>
  <td><span class="total-cell">₪${(item.quantity || 1) * (item.unit_price || 0)}</span></td>
  <td>
    <select data-field="category" data-index="${index}" class="category-field">
      <option value="uncategorized">לא מסווג</option>
      <option value="part">חלק</option>
      <option value="work">עבודה</option>
      <option value="repair">תיקון</option>
      <option value="material">חומר</option>
      <option value="other">אחר</option>
    </select>
  </td>
  <td><button type="button" onclick="window.invoiceProcessor.removeItem(${index})" class="btn btn-danger">הסר</button></td>
`;
```

**Testing Steps:**
1. Upload invoice PDF
2. Check file saved to Supabase Storage
3. Check invoice_documents record created
4. Wait for OCR webhook
5. Check OCR results saved to invoice_documents
6. Click Save Results
7. Check invoice created in invoices table
8. Check invoice_lines created with categories
9. Check helper.invoices[] updated
10. Verify in Supabase dashboard

**Success Criteria:**
- ✅ File uploads to Supabase Storage
- ✅ invoice_documents record created
- ✅ OCR results captured in database
- ✅ Invoice and lines saved on button click
- ✅ Auto-categorization works (check item_category column)
- ✅ Helper stays in sync
- ✅ User tracking (created_by) populated

**Common Errors:**
- Storage bucket permissions → Check RLS policies
- Missing caseId → Add to session storage on case load
- Auto-categorization not working → Check trigger enabled
- User tracking null → Ensure caseOwnershipService initialized

---

### ═══════════════════════════════════════════════════════════
### PHASE 4: DAMAGE CENTER MAPPING UI (Day 2 Afternoon + Day 3)
### ═══════════════════════════════════════════════════════════

#### Task 4.1: Create damage-center-mapper.js Service ⏳
**Priority:** CRITICAL  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.1

**File Location:** `services/damage-center-mapper.js`

**Purpose:** Handle mapping between invoice items and damage center fields

**Structure:**
```javascript
/**
 * Damage Center Mapper Service
 * Handles mapping invoice items to damage center fields
 */

import { invoiceService } from './invoice-service.js';

class DamageCenterMapper {
  constructor() {
    this.activeInvoiceId = null;
    this.activeCaseId = null;
    this.mappings = new Map(); // centerId-fieldType-fieldIndex → mappingData
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  async initialize(caseId, invoiceId = null) {
    this.activeCaseId = caseId;
    this.activeInvoiceId = invoiceId;
    
    if (caseId) {
      await this.loadExistingMappings(caseId);
    }
    
    console.log('🔗 DamageCenterMapper initialized');
  }

  async loadExistingMappings(caseId) {
    // TODO: Load all mappings for case from Supabase
    // Store in this.mappings Map
  }

  // ============================================================================
  // DROPDOWN DATA
  // ============================================================================
  
  /**
   * Get dropdown items for a specific field type
   * @param {string} fieldType - 'work', 'repair', or 'part'
   * @param {string} damageCenterId - The damage center ID
   * @returns {Array} Dropdown items
   */
  async getDropdownItems(fieldType, damageCenterId) {
    try {
      if (fieldType === 'part') {
        // Parts: 3 sources
        return await this.getPartsDropdownItems();
      } else {
        // Works/Repairs: 1 source (invoice only)
        return await this.getInvoiceItemsByType(fieldType);
      }
    } catch (error) {
      console.error('❌ Error getting dropdown items:', error);
      return [];
    }
  }

  /**
   * Get parts dropdown (3 sources combined)
   */
  async getPartsDropdownItems() {
    const results = [];
    
    // Source 1: Invoice parts
    if (this.activeInvoiceId) {
      const invoiceParts = await invoiceService.getLinesByCategory(
        this.activeInvoiceId, 
        'part'
      );
      results.push(...invoiceParts.map(item => ({
        ...item,
        source: 'invoice',
        displayText: `${item.description} (מחשבונית)`,
        icon: '📄'
      })));
    }
    
    // Source 2: Selected parts (from parts_required table)
    const selectedParts = await this.getSelectedParts();
    results.push(...selectedParts.map(item => ({
      ...item,
      source: 'selected',
      displayText: `${item.part_name} (נבחר)`,
      icon: '✓'
    })));
    
    // Source 3: General parts bank
    const bankParts = await this.getGeneralPartsBank();
    results.push(...bankParts.map(item => ({
      ...item,
      source: 'bank',
      displayText: `${item.name} (בנק חלקים)`,
      icon: '🏦'
    })));
    
    return results;
  }

  /**
   * Get invoice items by type (works/repairs)
   */
  async getInvoiceItemsByType(type) {
    if (!this.activeInvoiceId) return [];
    
    const items = await invoiceService.getLinesByCategory(
      this.activeInvoiceId,
      type
    );
    
    return items.map(item => ({
      ...item,
      source: 'invoice',
      displayText: item.description,
      icon: type === 'work' ? '🔧' : '🔨'
    }));
  }

  async getSelectedParts() {
    // TODO: Query parts_required table
    return [];
  }

  async getGeneralPartsBank() {
    // TODO: Query parts catalog if exists
    return [];
  }

  // ============================================================================
  // MAPPING OPERATIONS
  // ============================================================================
  
  /**
   * Create mapping from dropdown selection
   */
  async createMapping(dropdownItem, damageCenterId, fieldType, fieldIndex) {
    try {
      console.log('🔗 Creating mapping:', damageCenterId, fieldType, fieldIndex);
      
      // Prepare mapped data based on source
      let mappedData;
      if (dropdownItem.source === 'invoice') {
        mappedData = {
          name: dropdownItem.description,
          description: dropdownItem.description,
          costWithoutVat: dropdownItem.unit_price,
          quantity: dropdownItem.quantity,
          total: dropdownItem.line_total
        };
      } else if (dropdownItem.source === 'selected') {
        mappedData = {
          name: dropdownItem.part_name,
          description: dropdownItem.description,
          costWithoutVat: dropdownItem.unit_price,
          quantity: dropdownItem.quantity
        };
      } else {
        mappedData = {
          name: dropdownItem.name,
          description: dropdownItem.description,
          costWithoutVat: dropdownItem.price
        };
      }
      
      // Create mapping in Supabase
      const mapping = await invoiceService.createMapping({
        invoice_id: this.activeInvoiceId,
        invoice_line_id: dropdownItem.id,
        case_id: this.activeCaseId,
        damage_center_id: damageCenterId,
        field_type: fieldType,
        field_index: fieldIndex,
        mapped_data: mappedData
      });
      
      // Store in local cache
      const key = `${damageCenterId}-${fieldType}-${fieldIndex}`;
      this.mappings.set(key, mapping);
      
      console.log('✅ Mapping created:', mapping.id);
      return mapping;
      
    } catch (error) {
      console.error('❌ Error creating mapping:', error);
      throw error;
    }
  }

  /**
   * Get existing mapping for a field
   */
  getMapping(damageCenterId, fieldType, fieldIndex) {
    const key = `${damageCenterId}-${fieldType}-${fieldIndex}`;
    return this.mappings.get(key);
  }

  /**
   * Check if field is mapped
   */
  isMapped(damageCenterId, fieldType, fieldIndex) {
    return this.mappings.has(`${damageCenterId}-${fieldType}-${fieldIndex}`);
  }

  /**
   * Remove mapping
   */
  async removeMapping(damageCenterId, fieldType, fieldIndex) {
    const key = `${damageCenterId}-${fieldType}-${fieldIndex}`;
    const mapping = this.mappings.get(key);
    
    if (mapping) {
      await invoiceService.removeMapping(mapping.id);
      this.mappings.delete(key);
      console.log('🗑️ Mapping removed');
    }
  }

  // ============================================================================
  // FIELD AUTO-FILL
  // ============================================================================
  
  /**
   * Apply mapping data to field
   * Returns object with field values to set
   */
  applyMappingToField(mappedData) {
    return {
      name: mappedData.name || '',
      description: mappedData.description || '',
      cost: mappedData.costWithoutVat || 0,
      quantity: mappedData.quantity || 1,
      total: mappedData.total || (mappedData.costWithoutVat * mappedData.quantity),
      fromInvoice: true
    };
  }

  // ============================================================================
  // HELPER INTEGRATION
  // ============================================================================
  
  /**
   * Apply all mappings to helper.centers
   */
  async applyAllMappingsToHelper() {
    try {
      console.log('📝 Applying all mappings to helper...');
      
      if (!window.helper.centers) {
        console.warn('⚠️ No centers in helper');
        return;
      }
      
      for (const [key, mapping] of this.mappings.entries()) {
        const [centerId, fieldType, fieldIndex] = key.split('-');
        
        // Find center
        const center = window.helper.centers.find(c => c.center_id === centerId);
        if (!center) continue;
        
        // Get field array
        const fieldArray = center[`${fieldType}s`]; // works, parts, repairs
        if (!fieldArray || !fieldArray[fieldIndex]) continue;
        
        // Apply mapped data
        Object.assign(fieldArray[fieldIndex], this.applyMappingToField(mapping.mapped_data));
      }
      
      console.log('✅ Applied', this.mappings.size, 'mappings to helper');
      
    } catch (error) {
      console.error('❌ Error applying mappings:', error);
      throw error;
    }
  }
}

export const damageCenterMapper = new DamageCenterMapper();
```

**Success Criteria:**
- ✅ Can get dropdown items filtered by type
- ✅ Parts dropdown combines 3 sources
- ✅ Can create mappings
- ✅ Can check if field is mapped
- ✅ Can apply mappings to helper
- ✅ Mappings persist to Supabase

---

#### Task 4.2: Create invoice-parts-dropdown.js Component ⏳
**Priority:** HIGH  
**Estimated Time:** 2 hours  
**Dependencies:** Task 4.1

**File Location:** `components/invoice-parts-dropdown.js`

**Purpose:** Reusable dropdown component with auto-complete and 3-source support

**Structure:**
```javascript
/**
 * Invoice Parts Dropdown Component
 * Supports 3 sources: invoice parts, selected parts, parts bank
 * With auto-complete and filtering
 */

class InvoicePartsDropdown {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      placeholder: options.placeholder || 'הקלד לחיפוש...',
      fieldType: options.fieldType || 'part', // part, work, repair
      onSelect: options.onSelect || (() => {}),
      showSourceIcons: options.showSourceIcons !== false,
      minSearchLength: options.minSearchLength || 1
    };
    
    this.items = [];
    this.filteredItems = [];
    this.isOpen = false;
    
    this.render();
    this.attachEventListeners();
  }

  // ============================================================================
  // RENDERING
  // ============================================================================
  
  render() {
    this.container.innerHTML = `
      <div class="invoice-dropdown-wrapper">
        <input 
          type="text" 
          class="invoice-dropdown-input" 
          placeholder="${this.options.placeholder}"
          autocomplete="off"
        />
        <div class="invoice-dropdown-list" style="display: none;">
          <div class="invoice-dropdown-items"></div>
        </div>
      </div>
      
      <style>
        .invoice-dropdown-wrapper {
          position: relative;
          width: 100%;
        }
        
        .invoice-dropdown-input {
          width: 100%;
          padding: 10px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          direction: rtl;
        }
        
        .invoice-dropdown-input:focus {
          border-color: #3498db;
          outline: none;
        }
        
        .invoice-dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 300px;
          overflow-y: auto;
          background: white;
          border: 1px solid #ccc;
          border-top: none;
          border-radius: 0 0 4px 4px;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .invoice-dropdown-item {
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          direction: rtl;
        }
        
        .invoice-dropdown-item:hover {
          background: #f8f9fa;
        }
        
        .invoice-dropdown-item-text {
          flex: 1;
        }
        
        .invoice-dropdown-item-source {
          font-size: 12px;
          color: #666;
          margin-left: 10px;
        }
        
        .invoice-dropdown-item-icon {
          margin-left: 5px;
        }
        
        .invoice-dropdown-no-results {
          padding: 10px;
          text-align: center;
          color: #666;
        }
      </style>
    `;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  attachEventListeners() {
    const input = this.container.querySelector('.invoice-dropdown-input');
    const list = this.container.querySelector('.invoice-dropdown-list');
    
    // Input event - filter on type
    input.addEventListener('input', (e) => {
      const query = e.target.value;
      
      if (query.length >= this.options.minSearchLength) {
        this.filter(query);
        this.open();
      } else {
        this.close();
      }
    });
    
    // Focus event - show all items
    input.addEventListener('focus', () => {
      if (this.items.length > 0) {
        this.filteredItems = this.items;
        this.renderItems();
        this.open();
      }
    });
    
    // Click outside - close
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  // ============================================================================
  // DATA MANAGEMENT
  // ============================================================================
  
  async loadItems(items) {
    this.items = items;
    this.filteredItems = items;
    console.log(`📋 Loaded ${items.length} items to dropdown`);
  }

  filter(query) {
    const lowerQuery = query.toLowerCase();
    
    this.filteredItems = this.items.filter(item => {
      return item.displayText.toLowerCase().includes(lowerQuery) ||
             (item.description && item.description.toLowerCase().includes(lowerQuery));
    });
    
    this.renderItems();
  }

  // ============================================================================
  // RENDERING ITEMS
  // ============================================================================
  
  renderItems() {
    const itemsContainer = this.container.querySelector('.invoice-dropdown-items');
    
    if (this.filteredItems.length === 0) {
      itemsContainer.innerHTML = `
        <div class="invoice-dropdown-no-results">
          לא נמצאו תוצאות
        </div>
      `;
      return;
    }
    
    itemsContainer.innerHTML = this.filteredItems.map(item => `
      <div class="invoice-dropdown-item" data-item-id="${item.id}">
        <div class="invoice-dropdown-item-text">
          ${this.options.showSourceIcons ? `<span class="invoice-dropdown-item-icon">${item.icon || ''}</span>` : ''}
          ${item.displayText}
        </div>
        ${item.source ? `<div class="invoice-dropdown-item-source">${this.getSourceLabel(item.source)}</div>` : ''}
      </div>
    `).join('');
    
    // Attach click handlers to items
    itemsContainer.querySelectorAll('.invoice-dropdown-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        this.selectItem(this.filteredItems[index]);
      });
    });
  }

  getSourceLabel(source) {
    const labels = {
      'invoice': 'חשבונית',
      'selected': 'נבחר',
      'bank': 'בנק חלקים'
    };
    return labels[source] || source;
  }

  // ============================================================================
  // ITEM SELECTION
  // ============================================================================
  
  selectItem(item) {
    console.log('✅ Item selected:', item.displayText);
    
    // Update input
    const input = this.container.querySelector('.invoice-dropdown-input');
    input.value = item.displayText;
    
    // Close dropdown
    this.close();
    
    // Callback
    this.options.onSelect(item);
  }

  // ============================================================================
  // OPEN/CLOSE
  // ============================================================================
  
  open() {
    const list = this.container.querySelector('.invoice-dropdown-list');
    list.style.display = 'block';
    this.isOpen = true;
  }

  close() {
    const list = this.container.querySelector('.invoice-dropdown-list');
    list.style.display = 'none';
    this.isOpen = false;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  clear() {
    const input = this.container.querySelector('.invoice-dropdown-input');
    input.value = '';
    this.close();
  }

  setValue(text) {
    const input = this.container.querySelector('.invoice-dropdown-input');
    input.value = text;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

// Export for use in other modules
window.InvoicePartsDropdown = InvoicePartsDropdown;
```

**Usage Example:**
```javascript
// Create dropdown
const dropdown = new InvoicePartsDropdown('my-container', {
  fieldType: 'part',
  placeholder: 'בחר חלק...',
  onSelect: async (item) => {
    console.log('Selected:', item);
    // Create mapping
    await damageCenterMapper.createMapping(item, centerId, 'part', fieldIndex);
    // Apply to field
    applyToField(item);
  }
});

// Load items
const items = await damageCenterMapper.getDropdownItems('part', centerId);
dropdown.loadItems(items);
```

**Success Criteria:**
- ✅ Dropdown renders correctly
- ✅ Auto-complete works (filters on type)
- ✅ Shows source indicators (חשבונית/נבחר/בנק)
- ✅ Selection callback works
- ✅ Can be used multiple times on same page
- ✅ Responsive and RTL-friendly

---

#### Task 4.3: Integrate Damage Center Mapping in final-report-builder.html ⏳
**Priority:** CRITICAL  
**Estimated Time:** 4 hours  
**Dependencies:** Task 4.1, 4.2

**File:** `final-report-builder.html`

**Implementation Steps:**

**1. Add imports:**
```javascript
import { damageCenterMapper } from './services/damage-center-mapper.js';
import './components/invoice-parts-dropdown.js';
```

**2. Add "Map from Invoice" button to damage centers section:**
```html
<!-- Add near damage centers section -->
<div class="damage-center-mapping-controls">
  <button id="open-mapping-modal" class="btn btn-primary">
    📄 מיפוי מחשבונית
  </button>
  <span id="mapping-status" class="mapping-status"></span>
</div>

<style>
.damage-center-mapping-controls {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.mapping-status {
  font-size: 14px;
  color: #666;
}
</style>
```

**3. Create mapping modal:**
```html
<!-- Add modal HTML -->
<div id="damage-center-mapping-modal" class="modal" style="display: none;">
  <div class="modal-content" style="max-width: 900px;">
    <div class="modal-header">
      <h2>מיפוי פריטים מחשבונית למרכזי נזק</h2>
      <button class="modal-close">&times;</button>
    </div>
    
    <div class="modal-body">
      <!-- Invoice selection -->
      <div class="form-group">
        <label>בחר חשבונית:</label>
        <select id="mapping-invoice-select" class="form-control">
          <option value="">-- בחר חשבונית --</option>
        </select>
      </div>
      
      <!-- Damage centers list -->
      <div id="mapping-centers-list">
        <!-- Will be populated dynamically -->
      </div>
    </div>
    
    <div class="modal-footer">
      <button id="apply-mappings-btn" class="btn btn-success">החל שינויים</button>
      <button class="btn btn-secondary modal-close">ביטול</button>
    </div>
  </div>
</div>

<style>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  direction: rtl;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.damage-center-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: #f8f9fa;
}

.damage-center-card h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.field-mapping-row {
  display: grid;
  grid-template-columns: 150px 1fr 80px;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.field-label {
  font-weight: bold;
  color: #555;
}

.mapping-indicator {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

.mapping-indicator.mapped {
  background: #d4edda;
  color: #155724;
}

.mapping-indicator.unmapped {
  background: #f8d7da;
  color: #721c24;
}
</style>
```

**4. Add mapping logic:**
```javascript
// Initialize mapper on page load
let currentInvoiceId = null;
let currentCaseId = null;

async function initializeDamageCenterMapping() {
  try {
    // Get current case
    currentCaseId = sessionStorage.getItem('currentCaseId');
    if (!currentCaseId) {
      console.warn('⚠️ No case ID found');
      return;
    }
    
    // Initialize mapper
    await damageCenterMapper.initialize(currentCaseId);
    
    // Load invoices for selection
    await loadInvoicesForMapping();
    
    console.log('✅ Damage center mapping initialized');
  } catch (error) {
    console.error('❌ Failed to initialize mapping:', error);
  }
}

async function loadInvoicesForMapping() {
  try {
    const invoices = await invoiceService.getInvoicesByCase(currentCaseId);
    
    const select = document.getElementById('mapping-invoice-select');
    select.innerHTML = '<option value="">-- בחר חשבונית --</option>';
    
    invoices.forEach(inv => {
      const option = document.createElement('option');
      option.value = inv.id;
      option.textContent = `${inv.invoice_number} - ${inv.supplier_name} (${inv.issue_date})`;
      select.appendChild(option);
    });
    
    // Auto-select if only one
    if (invoices.length === 1) {
      select.value = invoices[0].id;
      currentInvoiceId = invoices[0].id;
      await loadMappingInterface();
    }
  } catch (error) {
    console.error('❌ Error loading invoices:', error);
  }
}

async function loadMappingInterface() {
  try {
    if (!currentInvoiceId) {
      alert('אנא בחר חשבונית');
      return;
    }
    
    const centers = window.helper.centers || [];
    const centersList = document.getElementById('mapping-centers-list');
    
    centersList.innerHTML = '';
    
    for (const center of centers) {
      const card = document.createElement('div');
      card.className = 'damage-center-card';
      card.innerHTML = `
        <h3>${center.center_name || `מרכז נזק ${center.center_number}`}</h3>
        <div class="center-fields">
          ${await renderCenterFields(center)}
        </div>
      `;
      centersList.appendChild(card);
    }
    
  } catch (error) {
    console.error('❌ Error loading mapping interface:', error);
  }
}

async function renderCenterFields(center) {
  let html = '';
  
  // Works
  if (center.works && center.works.length > 0) {
    html += '<h4>עבודות</h4>';
    for (let i = 0; i < center.works.length; i++) {
      html += await renderFieldRow(center.center_id, 'work', i, center.works[i]);
    }
  }
  
  // Parts
  if (center.parts && center.parts.length > 0) {
    html += '<h4>חלקים</h4>';
    for (let i = 0; i < center.parts.length; i++) {
      html += await renderFieldRow(center.center_id, 'part', i, center.parts[i]);
    }
  }
  
  // Repairs
  if (center.repairs && center.repairs.length > 0) {
    html += '<h4>תיקונים</h4>';
    for (let i = 0; i < center.repairs.length; i++) {
      html += await renderFieldRow(center.center_id, 'repair', i, center.repairs[i]);
    }
  }
  
  return html;
}

async function renderFieldRow(centerId, fieldType, fieldIndex, fieldData) {
  const isMapped = damageCenterMapper.isMapped(centerId, fieldType, fieldIndex);
  const fieldId = `field-${centerId}-${fieldType}-${fieldIndex}`;
  
  return `
    <div class="field-mapping-row">
      <div class="field-label">
        ${fieldData.name || `${fieldType} ${fieldIndex + 1}`}
      </div>
      <div id="${fieldId}-dropdown"></div>
      <div class="mapping-indicator ${isMapped ? 'mapped' : 'unmapped'}">
        ${isMapped ? '✓ ממופה' : 'לא ממופה'}
      </div>
    </div>
    <script>
      // Create dropdown for this field
      setTimeout(() => {
        const dropdown = new InvoicePartsDropdown('${fieldId}-dropdown', {
          fieldType: '${fieldType}',
          placeholder: 'הקלד לחיפוש...',
          onSelect: async (item) => {
            await handleFieldMapping('${centerId}', '${fieldType}', ${fieldIndex}, item);
          }
        });
        
        // Load items
        damageCenterMapper.getDropdownItems('${fieldType}', '${centerId}').then(items => {
          dropdown.loadItems(items);
        });
        
        // Store dropdown instance
        window['dropdown_${fieldId}'] = dropdown;
      }, 100);
    </script>
  `;
}

async function handleFieldMapping(centerId, fieldType, fieldIndex, item) {
  try {
    console.log('🔗 Mapping field:', centerId, fieldType, fieldIndex);
    
    // Create mapping
    const mapping = await damageCenterMapper.createMapping(
      item,
      centerId,
      fieldType,
      fieldIndex
    );
    
    // Update mapping indicator
    const indicator = document.querySelector(`#field-${centerId}-${fieldType}-${fieldIndex}-dropdown`)
      .closest('.field-mapping-row')
      .querySelector('.mapping-indicator');
    
    if (indicator) {
      indicator.className = 'mapping-indicator mapped';
      indicator.textContent = '✓ ממופה';
    }
    
    console.log('✅ Field mapped successfully');
    
  } catch (error) {
    console.error('❌ Error mapping field:', error);
    alert('שגיאה במיפוי השדה');
  }
}

async function applyAllMappings() {
  try {
    console.log('📝 Applying all mappings to helper...');
    
    // Apply mappings to helper.centers
    await damageCenterMapper.applyAllMappingsToHelper();
    
    // Save helper
    sessionStorage.setItem('helper', JSON.stringify(window.helper));
    
    // Sync to Supabase
    await invoiceHelperSync.saveCenterMappings(currentCaseId);
    
    // Close modal
    closeMappingModal();
    
    alert('✅ השינויים הוחלו בהצלחה!');
    
    // Refresh page to show updated values
    location.reload();
    
  } catch (error) {
    console.error('❌ Error applying mappings:', error);
    alert('שגיאה בהחלת השינויים');
  }
}

// Event listeners
document.getElementById('open-mapping-modal').addEventListener('click', () => {
  document.getElementById('damage-center-mapping-modal').style.display = 'flex';
  loadMappingInterface();
});

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', closeMappingModal);
});

document.getElementById('mapping-invoice-select').addEventListener('change', (e) => {
  currentInvoiceId = e.target.value;
  if (currentInvoiceId) {
    damageCenterMapper.activeInvoiceId = currentInvoiceId;
    loadMappingInterface();
  }
});

document.getElementById('apply-mappings-btn').addEventListener('click', applyAllMappings);

function closeMappingModal() {
  document.getElementById('damage-center-mapping-modal').style.display = 'none';
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  initializeDamageCenterMapping();
});
```

**Success Criteria:**
- ✅ "מיפוי מחשבונית" button appears
- ✅ Modal opens and shows invoices
- ✅ Damage centers listed with fields
- ✅ Each field has dropdown
- ✅ Dropdowns show correct items (3 sources for parts)
- ✅ Selection creates mapping
- ✅ "החל שינויים" button applies to helper
- ✅ Page reload shows updated values

**Testing Steps:**
1. Open final-report-builder.html with case that has damage centers
2. Click "מיפוי מחשבונית" button
3. Select invoice from dropdown
4. See damage centers listed
5. Click on a work field → see invoice works in dropdown
6. Click on a part field → see 3 sources combined
7. Select item → see "✓ ממופה" indicator
8. Click "החל שינויים"
9. Check helper.centers updated
10. Check mappings saved to Supabase

---

### ═══════════════════════════════════════════════════════════
### PHASE 5: INVOICE FLOATING SCREEN (Day 4 Morning)
### ═══════════════════════════════════════════════════════════

#### Task 5.1: Connect invoice-details-floating.js to Supabase ⏳
**Priority:** MEDIUM  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.1

**File:** `invoice-details-floating.js`

**Changes Required:**

**1. Add imports:**
```javascript
import { invoiceService } from './services/invoice-service.js';
```

**2. Modify data loading (replace static data):**
```javascript
// OLD: Static data from helper
const invoices = window.helper.invoices || [];

// NEW: Load from Supabase
const caseId = sessionStorage.getItem('currentCaseId');
const invoices = await invoiceService.getInvoicesByCase(caseId);
```

**3. Add search functionality:**
```javascript
async function searchInvoices(query) {
  const caseId = sessionStorage.getItem('currentCaseId');
  
  const results = await invoiceService.searchInvoices({
    case_id: caseId,
    query: query,
    // Additional filters...
  });
  
  displayInvoices(results);
}
```

**4. Add real-time updates:**
```javascript
// Subscribe to invoice changes
supabase
  .channel('invoice-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'invoices' }, 
    (payload) => {
      console.log('Invoice changed:', payload);
      refreshInvoicesList();
    }
  )
  .subscribe();
```

**Success Criteria:**
- ✅ Loads invoices from Supabase
- ✅ Search works
- ✅ Real-time updates work
- ✅ Can view invoice details
- ✅ Can edit invoice (update Supabase)

---

### ═══════════════════════════════════════════════════════════
### PHASE 6: TESTING & BUG FIXES (Day 4 Afternoon + Day 5)
### ═══════════════════════════════════════════════════════════

#### Task 6.1: End-to-End Testing ⏳
**Priority:** CRITICAL  
**Estimated Time:** 4 hours  
**Dependencies:** All previous tasks

**Test Scenarios:**

**Scenario 1: Upload Invoice → OCR → Save**
1. Open invoice upload.html
2. Upload test PDF
3. Wait for OCR webhook
4. Verify OCR results displayed
5. Check categories assigned
6. Click Save
7. Verify invoice saved to Supabase
8. Verify helper updated
9. Check database: invoice + lines + document records

**Scenario 2: Map Invoice to Damage Centers**
1. Open final-report-builder.html
2. Load case with damage centers
3. Click "מיפוי מחשבונית"
4. Select invoice
5. Map 3 items (1 work, 1 part, 1 repair)
6. Apply changes
7. Verify helper.centers updated
8. Verify mappings in database
9. Reload page → verify values persist

**Scenario 3: Parts Dropdown (3 Sources)**
1. Ensure case has: invoice parts, selected parts
2. Open mapping modal
3. Click on parts field
4. Verify dropdown shows all 3 sources
5. Verify source indicators (חשבונית/נבחר/בנק)
6. Select from each source
7. Verify mapping created

**Scenario 4: Edit and Re-map**
1. Create initial mapping
2. Apply changes
3. Reopen mapping modal
4. Change mapping for same field
5. Apply changes
6. Verify old mapping marked as 'replaced'
7. Verify new mapping active

**Scenario 5: Multi-User (if possible)**
1. User A creates invoice
2. User B opens same case
3. User B sees invoice (RLS check)
4. User B creates mapping
5. Both see updates (Realtime check)

**Scenario 6: Error Handling**
1. Try upload without file
2. Try save without required fields
3. Try map without selecting invoice
4. Verify error messages clear
5. Verify no data corruption

**Scenario 7: Helper Sync**
1. Create invoice in Supabase
2. Verify appears in helper.invoices
3. Edit invoice in helper
4. Sync to Supabase
5. Verify changes in database

**Scenario 8: Categorization**
1. Insert line with description "דלת קדמית"
2. Verify category = 'part'
3. Insert line with description "צביעה"
4. Verify category = 'work'
5. Test batch categorization

---

#### Task 6.2: Common Issues & Fixes ⏳
**Priority:** HIGH  
**Estimated Time:** Variable (depends on issues found)

**Expected Issues:**

**Issue 1: RLS Blocking Queries**
```sql
-- Symptom: "new row violates row-level security policy"
-- Fix: Check RLS policies, temporarily disable for testing:
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
-- Then fix policy and re-enable:
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

**Issue 2: Auto-Categorization Not Working**
```sql
-- Symptom: item_category always 'uncategorized'
-- Check: Is trigger enabled?
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'auto_categorize_on_insert';

-- If not found, recreate trigger from SQL file 08
```

**Issue 3: Mappings Not Persisting**
```sql
-- Check if mappings being created:
SELECT * FROM invoice_damage_center_mappings 
WHERE case_id = 'your-case-id';

-- Check mapping_status:
SELECT mapping_status, COUNT(*) 
FROM invoice_damage_center_mappings 
GROUP BY mapping_status;
```

**Issue 4: Helper Not Updating**
```javascript
// Debug: Log helper before/after mapping
console.log('Helper before:', JSON.parse(JSON.stringify(window.helper)));
await damageCenterMapper.applyAllMappingsToHelper();
console.log('Helper after:', JSON.parse(JSON.stringify(window.helper)));

// Check if changes saved to sessionStorage:
console.log('Session helper:', sessionStorage.getItem('helper'));
```

**Issue 5: Parts Dropdown Empty**
```javascript
// Debug dropdown items:
const items = await damageCenterMapper.getDropdownItems('part', centerId);
console.log('Dropdown items:', items);

// Check each source:
console.log('Invoice parts:', await invoiceService.getLinesByCategory(invoiceId, 'part'));
console.log('Selected parts:', await damageCenterMapper.getSelectedParts());
console.log('Bank parts:', await damageCenterMapper.getGeneralPartsBank());
```

**Issue 6: OCR Data Not Captured**
```sql
-- Check if document created:
SELECT * FROM invoice_documents WHERE case_id = 'your-case-id';

-- Check OCR status:
SELECT ocr_status, ocr_confidence FROM invoice_documents;

-- Check OCR data:
SELECT ocr_structured_data FROM invoice_documents 
WHERE id = 'document-id';
```

**Issue 7: User Tracking NULL**
```javascript
// Check if user initialized:
console.log('Current user:', await caseOwnershipService.getCurrentUser());

// If null, check auth:
const { data: { user } } = await supabase.auth.getUser();
console.log('Supabase user:', user);
```

---

### ═══════════════════════════════════════════════════════════
### PHASE 7: DOCUMENTATION & CLEANUP (Day 5)
### ═══════════════════════════════════════════════════════════

#### Task 7.1: Update Documentation ⏳
**Priority:** MEDIUM  
**Estimated Time:** 1 hour

**Files to Update:**

1. **SESSION_74_SUMMARY.txt** - Final completion summary
2. **SUPABASE_MIGRATION_PROJECT.md** - Mark Phase 5a complete
3. **README.md in Phase5a_Invoice** - Add post-deployment notes
4. Create **INVOICE_MODULE_USER_GUIDE.md** - User-facing documentation

**User Guide Contents:**
```markdown
# Invoice Module User Guide

## Uploading Invoices
1. Navigate to Invoice Upload page
2. Click "Select File" or drag-and-drop PDF/image
3. Fill in plate number, owner, date
4. Click "Process Invoice"
5. Wait for OCR (10-30 seconds)
6. Review extracted items
7. Edit categories if needed
8. Click "Save Results"

## Mapping to Damage Centers
1. Open Final Report Builder
2. Click "מיפוי מחשבונית" button
3. Select invoice from dropdown
4. For each field:
   - Click dropdown
   - Type to search
   - Select item
5. Click "החל שינויים"
6. Damage centers now have invoice costs

## Parts Dropdown
- 📄 = From invoice (OCR)
- ✓ = From parts search (selected parts)
- 🏦 = From parts bank (general catalog)

Select from any source - all work the same!

## Troubleshooting
- Invoice not appearing? Check case ID matches
- OCR failed? Re-upload file or enter manually
- Mapping not applying? Check you clicked "החל שינויים"
- Old values showing? Refresh page after applying
```

---

#### Task 7.2: Code Cleanup ⏳
**Priority:** LOW  
**Estimated Time:** 1 hour

**Cleanup Tasks:**
- Remove console.log statements (or set to debug mode only)
- Remove TODO comments
- Add JSDoc comments to functions
- Format code consistently
- Remove unused imports
- Check for hardcoded values

---

## 📊 PROGRESS TRACKING

### Daily Milestones:

**Day 1 Goals:**
- ✅ SQL schema deployed
- ✅ Invoice service created
- ✅ Helper sync service created
- ✅ Invoice upload integrated

**Day 2 Goals:**
- ✅ Damage center mapper created
- ✅ Parts dropdown component created
- ✅ Mapping UI in final-report-builder

**Day 3 Goals:**
- ✅ All mapping functionality working
- ✅ 3-source dropdown working
- ✅ Helper sync working

**Day 4 Goals:**
- ✅ Invoice floating screen connected
- ✅ All test scenarios passing
- ✅ Major bugs fixed

**Day 5 Goals:**
- ✅ All edge cases handled
- ✅ Documentation complete
- ✅ Code cleaned up
- ✅ Phase 5a COMPLETE

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **Database First** - Get SQL right before JavaScript
2. **Test Each Layer** - Don't stack untested code
3. **User Tracking** - created_by/updated_by on EVERYTHING
4. **Helper Compatibility** - Don't break existing code
5. **Error Handling** - Try/catch everywhere
6. **Logging** - Console.log for debugging
7. **RLS Policies** - Verify permissions constantly
8. **Helper Sync** - Bidirectional, no data loss

---

## 🎯 FINAL DELIVERABLES

### Code:
- ✅ 8 SQL files deployed
- ✅ 5 JavaScript service files
- ✅ 1 dropdown component
- ✅ 3 HTML files modified
- ✅ Helper structure updated

### Documentation:
- ✅ Session 74 summary
- ✅ User guide
- ✅ API documentation
- ✅ Troubleshooting guide

### Testing:
- ✅ 8 test scenarios passed
- ✅ No critical bugs
- ✅ RLS policies verified
- ✅ Real-time working

---

## 📝 NOTES FOR NEXT SESSIONS

**Things to Watch:**
- Performance with many invoices (pagination?)
- OCR accuracy (may need AI categorization)
- Parts bank integration (if exists)
- Multi-invoice mapping to same center
- Mapping history/audit trail

**Future Enhancements:**
- AI categorization before save
- Invoice templates/standardization
- Bulk operations (map multiple at once)
- Export mappings report
- Invoice validation rules

---

**Created:** 2025-10-23  
**Status:** READY FOR IMPLEMENTATION  
**Estimated Completion:** Day 5 (Oct 28)  
**Priority:** HIGH - Critical for final report accuracy

---

## ✅ CHECKLIST

Use this to track overall progress:

### Day 1:
- [ ] Task 1.1: Deploy SQL
- [ ] Task 1.2: Test database
- [ ] Task 2.1: Create invoice-service.js
- [ ] Task 2.2: Create invoice-helper-sync.js
- [ ] Task 3.1: Integrate invoice upload

### Day 2:
- [ ] Task 4.1: Create damage-center-mapper.js
- [ ] Task 4.2: Create dropdown component
- [ ] Task 4.3: Integrate in final-report-builder (Part 1)

### Day 3:
- [ ] Task 4.3: Integrate in final-report-builder (Part 2 - Complete)
- [ ] Test mapping workflow end-to-end

### Day 4:
- [ ] Task 5.1: Connect invoice floating screen
- [ ] Task 6.1: End-to-end testing
- [ ] Task 6.2: Fix critical bugs

### Day 5:
- [ ] Task 6.2: Fix remaining bugs
- [ ] Task 7.1: Documentation
- [ ] Task 7.2: Code cleanup
- [ ] Final verification
- [ ] **PHASE 5A COMPLETE** 🎉

---

**END OF MASTER TASK FILE**
