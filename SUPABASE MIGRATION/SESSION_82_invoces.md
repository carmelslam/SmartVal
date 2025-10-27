task :

# Task: Add Existing Invoice Loader to Invoice Processing Module

## Overall Concept & System Context

**Platform**: EVALIX - Hebrew-language automotive damage assessment system  
**Module**: מודול עיבוד חשבוניות (Invoice Processing Module)  
**Database**: Supabase  
**Helper Object**: sessionStorage-based helper.js  
**Integration Point**: Before the "העלאת חשבונית" (Upload Invoice) section

**System Impact**: This feature creates a dual-path invoice processing workflow - users can either upload NEW invoices (existing flow) OR load EXISTING invoices from Supabase (new flow). Both paths converge into the same "תוצאות עיבוד OCR" processing section, ensuring consistent data handling regardless of invoice source.

---

## Business Logic & Flow

### Why This Feature?
Enable users to retrieve and re-process invoices already stored in Supabase for the current case, avoiding duplicate uploads and providing access to historical invoice data for editing or review.

### How It Works:
1. **Identification**: Uses **composite key** - case UUID + plate number - to fetch all related invoices from Supabase
   - Case UUID: `helper.case_info.supabase_case_id`
   - Plate number: `helper.case_info.plate_number`
2. **Selection Interface**: Presents invoices in user-friendly dropdown (by garage name, not technical IDs)
3. **Data Population**: Selected invoice data flows into existing OCR results section as if it came from fresh OCR processing
4. **Unified Processing**: From this point forward, all existing page functionality (save, edit, buttons) treats the loaded invoice identically to a newly uploaded one

### Why Composite Key (case_uuid + plate_number)?
- **Case UUID ensures data isolation** - only invoices linked to THIS specific damage assessment case
- **Plate number adds verification layer** - confirms invoice belongs to correct vehicle
- **Prevents cross-contamination** - if plate number appears in multiple cases, UUID keeps them separate

---

## Component Breakdown & Implementation Requirements

### Part 1: UI Section - "Load Existing Invoices"

**Location**: Insert new section BEFORE "העלאת חשבונית" section

**Components Required**:
- Section header: "טעינת חשבוניות קיימות" (Load Existing Invoices)
- Trigger button: "טען חשבוניות ממאגר" (Load Invoices from Database)
- Dropdown field: Display format = `{garage_name} - {invoice_date}` (human-readable, NOT invoice_id)
- Web view button: "צפה בחשבונית" (View Invoice) - appears only after invoice selection

**Platform Relations**:
- HTML structure integrates with existing module layout
- Maintains RTL (Right-to-Left) Hebrew text flow
- Styling matches current EVALIX design system
- Uses existing CSS classes from invoice module

**HTML Structure Example**:
```html
<div class="existing-invoices-section" style="margin-bottom: 20px;">
    <h3>טעינת חשבוניות קיימות</h3>
    <button id="loadInvoicesBtn" class="btn-primary">טען חשבוניות ממאגר</button>
    
    <div id="invoiceDropdownContainer" style="display: none; margin-top: 10px;">
        <select id="existingInvoicesDropdown" class="form-control">
            <option value="">-- בחר חשבונית --</option>
        </select>
        <button id="viewInvoiceBtn" class="btn-secondary" style="display: none; margin-top: 10px;">
            צפה בחשבונית
        </button>
    </div>
    
    <div id="invoiceLoadingSpinner" style="display: none;">
        <span>טוען חשבוניות...</span>
    </div>
</div>
```

---

### Part 2: Data Retrieval Logic

**Trigger**: User clicks "טען חשבוניות ממאגר" button

**Flow Diagram**:
```
User Click → Validate Context → Extract Keys → Query Supabase → Populate Dropdown
```

**JavaScript Implementation**:

```javascript
async function loadExistingInvoices() {
    // Step 1: Validate context exists
    if (!validateInvoiceLoadContext()) {
        return;
    }
    
    // Step 2: Extract identification keys from helper
    const caseUuid = helper.case_info.supabase_case_id;
    const plateNumber = helper.case_info.plate_number;
    
    // Step 3: Show loading indicator
    document.getElementById('invoiceLoadingSpinner').style.display = 'block';
    document.getElementById('loadInvoicesBtn').disabled = true;
    
    try {
        // Step 4: Query Supabase with composite key
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('case_uuid', caseUuid)
            .eq('plate_number', plateNumber)
            .is('deleted_at', null) // Skip soft-deleted invoices
            .order('created_at', { ascending: false })
            .limit(50); // Prevent dropdown overflow
        
        if (error) throw error;
        
        // Step 5: Handle results
        if (data && data.length > 0) {
            populateInvoiceDropdown(data);
            document.getElementById('invoiceDropdownContainer').style.display = 'block';
            showUserMessage(`נמצאו ${data.length} חשבוניות`);
        } else {
            showUserMessage('לא נמצאו חשבוניות קיימות לתיק זה');
        }
        
    } catch (error) {
        console.error('Error loading invoices:', error);
        showUserMessage('שגיאה בטעינת חשבוניות מהמאגר');
    } finally {
        // Step 6: Hide loading indicator
        document.getElementById('invoiceLoadingSpinner').style.display = 'none';
        document.getElementById('loadInvoicesBtn').disabled = false;
    }
}
```

**Why This Method**:
- Composite key ensures we only get invoices for THIS case AND vehicle
- Sorting by `created_at DESC` shows most recent invoices first
- Limit of 50 prevents UI performance issues with dropdown
- Storing full invoice object in dropdown data attribute avoids second database call

**Platform Relations**:
- Uses existing Supabase JavaScript client already integrated in system
- Async/await pattern matches existing system architecture
- Error handling structure follows existing module patterns

---

### Part 3: Helper Object Context Validation

**Purpose**: Ensure required data exists before attempting database query

**Function**:
```javascript
function validateInvoiceLoadContext() {
    // Check 1: Case UUID exists
    if (!helper.case_info?.supabase_case_id) {
        console.error('Missing case UUID in helper.case_info.supabase_case_id');
        showUserMessage('שגיאה: לא נמצא מזהה תיק במערכת');
        return false;
    }
    
    // Check 2: Plate number exists
    if (!helper.case_info?.plate_number) {
        console.error('Missing plate number in helper.case_info');
        showUserMessage('שגיאה: לא נמצא מספר רישוי במערכת');
        return false;
    }
    
    console.log('Context validation passed:', {
        case_uuid: helper.case_info.supabase_case_id,
        plate_number: helper.case_info.plate_number
    });
    
    return true;
}
```

**Why This Matters**:
- Prevents failed database queries with missing parameters
- Gives user clear Hebrew feedback if case context is incomplete
- Protects against loading wrong invoices due to missing identification
- Logs validation for debugging purposes

**Platform Relations**:
- Reads from existing `helper.case_info` structure
- Assumes case UUID and plate number are already populated when invoice module loads
- If missing, indicates upstream initialization problem that should be investigated

---

### Part 4: Dropdown Population

**Purpose**: Display invoices in user-friendly format

**Function**:
```javascript
function populateInvoiceDropdown(invoices) {
    const dropdown = document.getElementById('existingInvoicesDropdown');
    
    // Clear existing options except first placeholder
    dropdown.innerHTML = '<option value="">-- בחר חשבונית --</option>';
    
    // Populate with invoice options
    invoices.forEach(invoice => {
        const option = document.createElement('option');
        
        // Display format: Garage Name - Date
        const displayDate = formatDate(invoice.invoice_date); // Format as DD/MM/YYYY
        option.text = `${invoice.garage_name} - ${displayDate}`;
        option.value = invoice.invoice_id;
        
        // Store full invoice object as data attribute for later retrieval
        option.dataset.invoiceData = JSON.stringify(invoice);
        
        dropdown.appendChild(option);
    });
}
```

**Why This Format**:
- Garage name is meaningful to user (vs technical invoice_id)
- Date provides context for selecting correct invoice
- Storing full object in data attribute prevents second database call on selection
- Dropdown standard UI pattern for single selection

---

### Part 5: Invoice Selection & Data Population

**Trigger**: User selects invoice from dropdown

**Flow Diagram**:
```
Dropdown Change → Extract Invoice Data → Validate Case Match → Populate OCR Section → Update Helper → Enable View Button
```

**JavaScript Implementation**:
```javascript
document.getElementById('existingInvoicesDropdown').addEventListener('change', function(e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    
    if (!selectedOption.value) {
        // User selected placeholder option
        document.getElementById('viewInvoiceBtn').style.display = 'none';
        return;
    }
    
    // Extract stored invoice data
    const invoiceData = JSON.parse(selectedOption.dataset.invoiceData);
    
    // Defensive check: Verify invoice belongs to current case
    if (invoiceData.case_uuid !== helper.case_info.supabase_case_id) {
        console.error('Invoice case UUID mismatch!', {
            invoice_uuid: invoiceData.case_uuid,
            current_uuid: helper.case_info.supabase_case_id
        });
        showUserMessage('שגיאה: חשבונית לא שייכת לתיק זה');
        return;
    }
    
    // Populate OCR section with invoice data
    populateOcrSectionFromInvoice(invoiceData);
    
    // Update helper object with invoice metadata
    helper.current_invoice = {
        invoice_id: invoiceData.invoice_id,
        case_uuid: invoiceData.case_uuid,
        source: 'existing',
        storage_url: invoiceData.storage_url
    };
    
    // Save helper to sessionStorage
    saveHelper();
    
    // Enable view button
    document.getElementById('viewInvoiceBtn').style.display = 'block';
    
    showUserMessage('חשבונית נטענה בהצלחה');
});
```

**Field Mapping Function**:
```javascript
function populateOcrSectionFromInvoice(invoiceData) {
    // Map invoice fields to OCR result section fields
    // Adjust field IDs based on your actual HTML structure
    
    document.getElementById('invoiceNumber').value = invoiceData.invoice_number || '';
    document.getElementById('garageName').value = invoiceData.garage_name || '';
    document.getElementById('invoiceDate').value = invoiceData.invoice_date || '';
    document.getElementById('totalAmount').value = invoiceData.total_amount || '';
    document.getElementById('vatAmount').value = invoiceData.vat_amount || '';
    
    // Populate parts table if exists
    if (invoiceData.parts_list && Array.isArray(invoiceData.parts_list)) {
        populatePartsTable(invoiceData.parts_list);
    }
    
    // Populate labor costs if exists
    if (invoiceData.labor_costs) {
        document.getElementById('laborCosts').value = invoiceData.labor_costs;
    }
    
    // Trigger change events to activate existing validation/save handlers
    document.getElementById('totalAmount').dispatchEvent(new Event('change'));
}
```

**Why This Approach**:
- Reuses existing "תוצאות עיבוד OCR" section (no UI duplication)
- Creates identical data structure to OCR results
- Leverages existing validation and save logic
- Additional UUID verification prevents edge case data corruption
- Dispatching change events activates existing field handlers

**Platform Relations**:
- DOM manipulation to populate HTML input fields
- Helper object structure matches OCR result format
- Existing onChange handlers automatically triggered for validation

---

### Part 6: View Invoice Button

**Trigger**: User clicks "צפה בחשבונית" button

**JavaScript Implementation**:
```javascript
document.getElementById('viewInvoiceBtn').addEventListener('click', function() {
    const storageUrl = helper.current_invoice?.storage_url;
    
    if (!storageUrl) {
        showUserMessage('שגיאה: לא נמצא קישור לחשבונית');
        return;
    }
    
    // Open invoice in new tab
    window.open(storageUrl, '_blank');
});
```

**Why Separate Button**:
- Avoids accidental navigation away from processing page
- Allows user to view original document while editing extracted data
- Standard UX pattern for document review workflows
- New tab keeps current work context intact

**Platform Relations**:
- Uses Supabase storage URL structure
- Works with existing Cloudinary/storage integration
- Opens in new browser tab (doesn't interrupt current session)

---

### Part 7: Data Persistence & Sync

**Purpose**: Save edited invoice data back to Supabase

**Modified Save Function Logic**:
```javascript
async function saveInvoiceData() {
    // Gather edited field values from OCR section
    const editedData = {
        invoice_number: document.getElementById('invoiceNumber').value,
        garage_name: document.getElementById('garageName').value,
        invoice_date: document.getElementById('invoiceDate').value,
        total_amount: parseFloat(document.getElementById('totalAmount').value),
        vat_amount: parseFloat(document.getElementById('vatAmount').value),
        parts_list: getPartsTableData(),
        labor_costs: parseFloat(document.getElementById('laborCosts').value),
        updated_at: new Date().toISOString()
    };
    
    try {
        // Detect if UPDATE existing or INSERT new
        if (helper.current_invoice?.invoice_id) {
            // UPDATE existing invoice path
            const { data, error } = await supabase
                .from('invoices')
                .update(editedData)
                .eq('invoice_id', helper.current_invoice.invoice_id)
                .eq('case_uuid', helper.case_info.supabase_case_id) // Safety check
                .select();
            
            if (error) throw error;
            
            showUserMessage('חשבונית עודכנה בהצלחה');
            
        } else {
            // INSERT new invoice path (existing flow)
            editedData.case_uuid = helper.case_info.supabase_case_id;
            editedData.plate_number = helper.case_info.plate_number;
            editedData.created_at = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('invoices')
                .insert([editedData])
                .select();
            
            if (error) throw error;
            
            // Store new invoice_id for future updates
            helper.current_invoice = {
                invoice_id: data[0].invoice_id,
                case_uuid: data[0].case_uuid,
                source: 'ocr_new'
            };
            
            saveHelper();
            
            showUserMessage('חשבונית נשמרה בהצלחה');
        }
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showUserMessage('שגיאה בשמירת חשבונית');
        throw error;
    }
}
```

**Why This Structure**:
- Single save function handles both UPDATE and INSERT
- `invoice_id` presence determines operation type
- Including `case_uuid` in UPDATE WHERE clause provides database-level safety
- No code duplication between new and existing invoice flows

**Platform Relations**:
- Uses same Supabase client methods throughout system
- Helper object changes automatically trigger save (existing architecture)
- Error handling follows system-wide patterns

---

### Part 8: Button Functionality Preservation

**Requirement**: All existing page buttons (export PDF, send to Make.com, delete, etc.) must work identically whether invoice came from:
- Fresh upload + OCR processing
- Loaded from Supabase

**How to Ensure This**:

1. **Helper Object Structure Consistency**:
```javascript
// Both paths create identical structure:
helper.current_invoice = {
    invoice_id: '...',      // Present for existing, added after first save for new
    case_uuid: '...',       // Always present
    source: 'existing',     // or 'ocr_new'
    storage_url: '...',     // URL to original document
    // All invoice fields...
};
```

2. **No Conditional Logic in Button Handlers**:
- All buttons read from helper object
- Helper structure is identical regardless of source
- Buttons work automatically without modification

3. **Source Flag for Debugging Only**:
```javascript
// Source flag helps with debugging but doesn't affect functionality
if (helper.current_invoice.source === 'existing') {
    console.log('Processing existing invoice');
} else {
    console.log('Processing new OCR invoice');
}
// But both execute same button logic
```

**Testing All Buttons Work**:
- Export PDF button → reads helper.current_invoice
- Send to Make.com → reads helper.current_invoice
- Delete button → uses helper.current_invoice.invoice_id
- All function identically

---

## Technical Implementation Checklist

### Database Schema Verification:
- [ ] Verify `invoices` table has `case_uuid` column
- [ ] Verify `invoices` table has `plate_number` column
- [ ] Verify `invoices` table has `garage_name` column
- [ ] Verify `invoices` table has `storage_url` column
- [ ] Verify `invoices` table has `deleted_at` column (if using soft deletes)
- [ ] Check if composite index exists: `(case_uuid, plate_number)`
- [ ] If index doesn't exist, consider creating for query performance
- [ ] Test query speed with sample data

### JavaScript Implementation:
- [ ] Create `validateInvoiceLoadContext()` function
- [ ] Create `loadExistingInvoices()` function
- [ ] Create `populateInvoiceDropdown(invoices)` function
- [ ] Create `populateOcrSectionFromInvoice(invoiceData)` function
- [ ] Create dropdown change event listener
- [ ] Create view invoice button click handler
- [ ] Modify existing save function to handle UPDATE vs INSERT
- [ ] Update helper object structure to include:
  - `current_invoice.invoice_id`
  - `current_invoice.case_uuid`
  - `current_invoice.source`
  - `current_invoice.storage_url`

### HTML/UI Implementation:
- [ ] Add section before "העלאת חשבונית"
- [ ] Add "טען חשבוניות ממאגר" button
- [ ] Add dropdown container (initially hidden)
- [ ] Add invoice dropdown with placeholder option
- [ ] Add "צפה בחשבונית" button (initially hidden)
- [ ] Add loading spinner element
- [ ] Ensure RTL text rendering for Hebrew
- [ ] Match existing module styling
- [ ] Test responsive design

### Integration Testing:

**Context Validation Tests**:
- [ ] Test with missing `case_uuid` in helper → should show error "לא נמצא מזהה תיק"
- [ ] Test with missing `plate_number` in helper → should show error "לא נמצא מספר רישוי"
- [ ] Verify error messages display in Hebrew properly

**Data Loading Tests**:
- [ ] Test with no existing invoices → should show "לא נמצאו חשבוניות"
- [ ] Test with 1 invoice → dropdown populates correctly
- [ ] Test with multiple invoices → all appear in dropdown
- [ ] Test with 50+ invoices → only first 50 load (limit works)
- [ ] Verify dropdown displays garage_name + date format correctly
- [ ] Test loading spinner appears/disappears correctly

**Invoice Selection Tests**:
- [ ] Select invoice → OCR section fields populate correctly
- [ ] Verify all fields map properly (amounts, dates, parts, labor)
- [ ] Check helper object updated with invoice_id and case_uuid
- [ ] Verify "צפה בחשבונית" button appears after selection
- [ ] Test clicking view button → opens in new tab
- [ ] Verify correct invoice URL opens

**Data Editing & Save Tests**:
- [ ] Edit loaded invoice fields → saves to correct Supabase record
- [ ] Verify UPDATE query includes case_uuid in WHERE clause
- [ ] Check updated_at timestamp changes on save
- [ ] Test save error handling
- [ ] Verify success message displays

**Existing Button Functionality Tests**:
- [ ] Export PDF button works with loaded invoice
- [ ] Send to Make.com button works with loaded invoice
- [ ] Delete button works with loaded invoice
- [ ] Any custom buttons work with loaded invoice
- [ ] Verify no errors in console during button operations

**Flow Switching Tests**:
- [ ] Load existing invoice, then upload new one → both flows work
- [ ] Upload new invoice, then load existing one → both flows work
- [ ] Switch between multiple existing invoices → data updates correctly
- [ ] Verify helper object state remains consistent during switches

**Case Isolation Tests**:
- [ ] CRITICAL: Verify invoices from different cases don't appear
- [ ] Test with same plate_number in different cases → only current case invoices show
- [ ] Verify case_uuid is always included in queries

**Hebrew Text & RTL Tests**:
- [ ] All Hebrew labels display correctly
- [ ] Dropdown text aligns right-to-left
- [ ] Error messages display in Hebrew
- [ ] Success messages display in Hebrew
- [ ] Invoice data with Hebrew characters displays correctly

---

## Critical Implementation Notes

### 1. Composite Key Enforcement
**ALWAYS** use both `case_uuid` AND `plate_number` together for queries. Never query by plate_number alone, as this could leak data across cases.

### 2. Helper Object Dependencies
System assumes these exist before invoice module loads:
- `helper.case_info.supabase_case_id`
- `helper.case_info.plate_number`

If either is missing, treat as initialization error and prevent invoice loading.

### 3. Invoice ID Tracking
Store THREE pieces of metadata when loading existing invoice:
- `invoice_id` → identifies which record to update
- `case_uuid` → validates update belongs to correct case
- `source` → tracks whether invoice came from OCR or Supabase (for debugging)

### 4. Update vs Insert Detection
Save function uses presence of `helper.current_invoice.invoice_id` to determine operation:
- Present → UPDATE existing invoice
- Absent → INSERT new invoice

### 5. Database-Level Safety
Always include `case_uuid` in UPDATE queries:
```javascript
.eq('invoice_id', helper.current_invoice.invoice_id)
.eq('case_uuid', helper.case_info.supabase_case_id)
```
This prevents accidental updates to wrong case's invoice if helper gets corrupted.

### 6. Bidirectional Sync Consideration
Your system has known bidirectional sync issues where:
- Builders can write back to damage centers wizard
- Automatic refresh doesn't happen

For this feature:
- Consider adding explicit refresh trigger after save operations
- Log sync events for debugging: `console.log('Invoice saved, sync triggered')`
- If auto-refresh isn't implemented yet, consider adding manual "רענן נתונים" button

### 7. Field Mapping Must Match Exactly
When populating OCR section from loaded invoice, field IDs must match exactly:
- Review actual HTML field IDs in your invoice module
- Adjust `populateOcrSectionFromInvoice()` function accordingly
- Test that all fields populate correctly

### 8. Storage URL Format
Verify your Supabase storage URLs are in format:
```
https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
```
If using Cloudinary instead, adjust URL handling accordingly.

---

## User Experience & Error Messages

### Loading States:
- "טוען חשבוניות..." → While querying database
- Button disabled during load → Prevent duplicate clicks

### Success Messages:
- "נמצאו X חשבוניות" → After successful load
- "חשבונית נטענה בהצלחה" → After selection
- "חשבונית עודכנה בהצלחה" → After save
- "חשבונית נשמרה בהצלחה" → After new invoice save

### Error Messages:
- "שגיאה: לא נמצא מזהה תיק במערכת" → Missing case_uuid
- "שגיאה: לא נמצא מספר רישוי במערכת" → Missing plate_number
- "לא נמצאו חשבוניות קיימות לתיק זה" → No results from query
- "שגיאה בטעינת חשבוניות מהמאגר" → Database error
- "שגיאה: חשבונית לא שייכת לתיק זה" → UUID mismatch on selection
- "שגיאה: לא נמצא קישור לחשבונית" → Missing storage_url
- "שגיאה בשמירת חשבונית" → Save operation failed

All messages in Hebrew, concise, clear about what went wrong.

---

## Performance Considerations

### Query Optimization:
- Limit results to 50 invoices (prevents dropdown overflow)
- If composite index `(case_uuid, plate_number)` doesn't exist, create it:
```sql
CREATE INDEX idx_invoices_case_plate ON invoices(case_uuid, plate_number);
```

### Dropdown Performance:
- Store full invoice object in `data-` attribute to avoid second query
- If more than 50 invoices exist, consider pagination or search functionality

### Helper Object Size:
- Store only necessary invoice data in helper
- Avoid storing full images or large binary data
- Keep helper lean for sessionStorage limits

---

## Future Enhancement Ideas

### Phase 2 Features (Not in Current Scope):
- Search/filter dropdown by date range
- Bulk operations (select multiple invoices)
- Invoice comparison view (side-by-side)
- Invoice history/audit trail
- Duplicate detection
- Auto-merge similar invoices

---

## Summary

This feature adds the ability to load and edit existing invoices from Supabase into the invoice processing module. It maintains data isolation through composite key queries (case_uuid + plate_number), reuses existing UI and processing logic, and ensures all existing functionality continues to work without modification.

The implementation follows your system's existing patterns: sessionStorage-based helper objects, Supabase JavaScript client, Hebrew RTL interface, and unified data flows.