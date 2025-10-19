# Session 50: Parts Search Floating Screen - Complete Integration Summary

**Date**: 2025-10-19  
**Session**: 50 (Continuation of Sessions 49-50)  
**Status**: ✅ COMPLETED

---

## Executive Summary

Completed a comprehensive 3-tab floating screen for parts management (`parts-search-results-floating.js`) that works across all pages in the system. Fixed critical dual-save architecture where parts edits must update BOTH `window.helper.centers[].Parts.parts_required[]` AND Supabase `parts_required` table. Also fixed the same issue in `final-report-builder.html`.

---

## Critical Architecture Pattern: Dual-Save System

### The Problem
Parts data exists in TWO places:
1. **Browser Memory**: `window.helper.centers[].Parts.parts_required[]` (used by UI)
2. **Database**: Supabase `parts_required` table (persistent storage)

**If you only update ONE location, the system breaks:**
- Update only helper → Changes lost on page refresh
- Update only Supabase → UI doesn't update, user sees stale data
- Update helper without `total_cost` → Final report shows wrong totals

### The Solution Pattern
```javascript
// 1. Calculate all derived fields
const priceAfterReduction = price * (1 - reduction / 100);
const updatedPrice = priceAfterReduction * (1 - wear / 100);
const totalCost = updatedPrice * quantity;

// 2. Update Supabase (if available)
if (window.supabase) {
  await window.supabase
    .from('parts_required')
    .update({
      pcode: catalogCode,
      oem: catalogCode,
      part_name: name,
      quantity: quantity,
      price_per_unit: price,
      price: price,
      reduction_percentage: reduction,
      wear_percentage: wear,
      updated_price: updatedPrice,
      total_cost: totalCost  // CRITICAL!
    })
    .eq('plate', normalizedPlate)
    .eq('damage_center_code', centerId)
    .eq('part_name', originalPartName);
}

// 3. Update helper (ALL aliases)
part.pcode = catalogCode;
part.oem = catalogCode;
part.catalog_code = catalogCode;
part.part_name = name;
part.name = name;
part.quantity = quantity;
part.qty = quantity;
part.price_per_unit = price;
part.price = price;
part.cost = price;
part.expected_cost = price;
part.reduction_percentage = reduction;
part.reduction = reduction;
part.wear_percentage = wear;
part.wear = wear;
part.updated_price = updatedPrice;
part.total_cost = totalCost;  // CRITICAL!

// 4. Refresh UI
tabsLoaded.required = false;
loadRequiredParts();
```

---

## Files Modified

### 1. `parts-search-results-floating.js` (PRIMARY)

**Location**: Root directory  
**Purpose**: Floating screen module for parts management across all pages  
**Key Functions**:

#### Main Modal Creation
- `window.togglePartsSearchResults()` - Show/hide floating screen
- Dynamic Supabase loading via `loadSupabaseClient()` (makes module portable)

#### Tab Management
- 3-tab interface: Required Parts | Selected Parts | Search Results
- Tab persistence (`tabsLoaded` object prevents unnecessary reloads)
- `switchTab(tabName)` - Tab switching logic
- `loadTabData(tabName)` - Load specific tab data

#### Tab 1: Parts Required (חלקים נדרשים)
**Lines**: ~600-1200

**Data Sources**:
1. Supabase `parts_required` table
2. `helper.centers[].Parts.parts_required[]`

**Key Functions**:
- `loadRequiredParts()` - Loads and displays parts grouped by damage center
- `editRequiredPart(centerId, partIndex)` - Opens edit modal with form
- `savePartField(centerId, partIndex, fieldName, value)` - Inline field save (deprecated but kept)
- `deleteRequiredPart(centerId, partIndex)` - Deletes from both locations
- `toggleDamageCenterGroup(groupId)` - Collapse/expand damage centers

**Edit Modal Structure** (Lines 1052-1203):
```html
<input type="text" id="edit-code" />      <!-- Catalog code -->
<input type="text" id="edit-name" />      <!-- Part name -->
<input type="number" id="edit-qty" />     <!-- Quantity -->
<input type="number" id="edit-price" />   <!-- Unit price -->
<input type="number" id="edit-reduction" /> <!-- Reduction % -->
<input type="number" id="edit-wear" />    <!-- Wear % -->
```

**Critical Calculation** (Lines 1132-1135):
```javascript
const priceAfterReduction = newPrice * (1 - newReduction / 100);
const updatedPrice = priceAfterReduction * (1 - newWear / 100);
const totalCost = updatedPrice * newQuantity;
```

**Supabase Update** (Lines 1137-1163):
- Table: `parts_required`
- Filter: `plate` + `damage_center_code` + `part_name`
- Fields: `pcode`, `oem`, `part_name`, `quantity`, `price_per_unit`, `price`, `reduction_percentage`, `wear_percentage`, `updated_price`, `total_cost`

**Helper Update** (Lines 1165-1185):
- Updates ALL field aliases (pcode/oem/catalog_code, name/part_name, qty/quantity, etc.)
- **MUST include `total_cost`** or final report shows wrong values

**UI Refresh Triggers** (Lines 1191-1200):
```javascript
if (typeof window.updatePartsRequiredUI === 'function') {
  window.updatePartsRequiredUI();
}
if (typeof window.refreshFinalReportSections === 'function') {
  window.refreshFinalReportSections();
}
if (typeof window.recalculateAllTotals === 'function') {
  window.recalculateAllTotals();
}
```

#### Tab 2: Selected Parts (חלקים נבחרים)
**Lines**: ~1062-1290

**Data Source**: Supabase `selected_parts` table (exact copy of PiP logic)

**Key Functions**:
- `loadSelectedParts()` - Queries `selected_parts` by plate
- `deleteSelectedPartTab2(partId, plate)` - Delete selected part
- `toggleSelectAllTab2(checked)` - Select all checkbox

**Query Logic** (Lines 1094-1100):
```javascript
const { data, error } = await window.supabase
  .from('selected_parts')
  .select('*')
  .eq('plate', plate)  // No normalization needed
  .order('selected_at', { ascending: false });
```

**Table Structure** (11 columns):
- Checkbox | # | Code | Part Name | Source | Price | Qty | Total | Supplier | Date | Actions

**Reference**: Exact copy of `TEST_showAllSavedParts()` from `parts search.html:4678-4976`

#### Tab 3: Search Results (תוצאות חיפוש)
**Lines**: ~1294-1510

**Data Sources**: 
1. Supabase `cases` table → get case_id
2. Supabase `parts_search_sessions` table → get session IDs
3. Supabase `parts_search_results` table → get JSONB results

**Key Functions**:
- `loadSearchResults()` - 3-step Supabase query
- `displaySearchResults(results, container)` - Flatten JSONB and display

**3-Step Query Logic** (Lines 1322-1410):
```javascript
// Step 1: Get case_id from cases table
const { data: casesData } = await window.supabase
  .from('cases')
  .select('id, filing_case_id')
  .eq('plate', normalizedPlate)
  .order('created_at', { ascending: false });

const caseUuid = casesData?.[0]?.id;

// Step 2: Get sessions for this case
const { data: allSessions } = await window.supabase
  .from('parts_search_sessions')
  .select('id, plate, created_at')
  .eq('case_id', caseUuid);

// Step 3: Get results using OR filter
const sessionIds = sessions.map(s => s.id);
const orFilters = sessionIds.map(id => `session_id.eq.${id}`).join(',');
const { data: searchResults } = await window.supabase
  .from('parts_search_results')
  .select('*')
  .or(orFilters)
  .order('created_at', { ascending: false });
```

**JSONB Flattening** (Lines 1396-1407):
```javascript
searchResults.forEach(record => {
  const resultsArray = record.results || [];  // JSONB array
  resultsArray.forEach(partResult => {
    allResults.push({
      ...partResult,
      search_date: record.created_at,
      data_source: record.data_source
    });
  });
});
```

**Table Structure** (7 columns):
- Search Date | Data Source | Supplier | Catalog # | Description | Part Family | Price

**Reference**: Exact copy of `showAllSearchResults()` from `parts search.html:4979-5125`

#### Dynamic Supabase Loading (Lines 1-63)
**Why Critical**: Floating screen appears on MULTIPLE pages, not all have Supabase loaded

```javascript
function loadSupabaseClient() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = './services/supabaseClient.js';
    script.onload = () => {
      setTimeout(() => resolve(!!window.supabase), 100);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
```

#### Refresh Functionality (Lines 556-579)
```javascript
window.refreshPartsResults = function() {
  console.log('🔄 SESSION 50: Refreshing current tab:', currentTab);
  
  // Show loading indicator
  const container = currentTab === 'required' ? document.getElementById('requiredPartsContainer') :
                   currentTab === 'selected' ? document.getElementById('selectedPartsContainer') :
                   document.getElementById('searchResultsContainer');
  
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
```

---

### 2. `final-report-builder.html` (CRITICAL FIX)

**Location**: Root directory  
**Purpose**: Final report editing page  
**Issue**: Parts editing only updated helper, NOT Supabase

#### Problem
Line 11378 called `autoSaveDamageCenterChanges()` which didn't exist, causing errors:
```
ReferenceError: autoSaveDamageCenterChanges is not defined
```

#### Solution: Created `autoSaveDamageCenterChanges()` function
**Lines**: 11381-11459

**Function Purpose**: Auto-save part edits to BOTH helper AND Supabase

**Triggered By**: 
- `calculatePartPriceFields(partRow)` (line 11341)
- Called whenever user edits: price, reduction%, wear%, quantity

**Implementation**:
```javascript
async function autoSaveDamageCenterChanges(partRow) {
  if (!partRow) return;
  
  const centerIndex = parseInt(partRow.dataset.center);
  const partIndex = parseInt(partRow.dataset.part);
  
  // Get all values from form fields
  const pcode = partRow.querySelector('.part-code')?.value || '';
  const partName = partRow.querySelector('.part-name')?.value || '';
  const quantity = parseInt(partRow.querySelector('.part-quantity')?.value) || 1;
  const pricePerUnit = parseFloat(partRow.querySelector('.part-price-per-unit')?.value) || 0;
  const reduction = parseFloat(partRow.querySelector('.part-reduction')?.value) || 0;
  const wear = parseFloat(partRow.querySelector('.part-wear')?.value) || 0;
  const updatedPrice = parseFloat(partRow.querySelector('.part-updated-price')?.value) || 0;
  const totalCostText = partRow.querySelector('.part-total-cost')?.value || '₪0';
  const totalCost = parseFloat(totalCostText.replace(/[₪,]/g, '')) || 0;
  
  // 1. Update helper.centers[].Parts.parts_required[]
  if (window.helper?.centers?.[centerIndex]?.Parts?.parts_required?.[partIndex]) {
    const part = window.helper.centers[centerIndex].Parts.parts_required[partIndex];
    
    part.pcode = pcode;
    part.oem = pcode;
    part.catalog_code = pcode;
    part.part_name = partName;
    part.name = partName;
    part.quantity = quantity;
    part.qty = quantity;
    part.price_per_unit = pricePerUnit;
    part.price = pricePerUnit;
    part.cost = pricePerUnit;
    part.expected_cost = pricePerUnit;
    part.reduction_percentage = reduction;
    part.reduction = reduction;
    part.wear_percentage = wear;
    part.wear = wear;
    part.updated_price = updatedPrice;
    part.total_cost = totalCost;  // CRITICAL!
  }
  
  // 2. Update Supabase
  if (window.supabase && window.helper?.meta?.plate && window.helper?.centers?.[centerIndex]) {
    const plate = window.helper.meta.plate;
    const center = window.helper.centers[centerIndex];
    const centerId = center.Id || center.id;
    
    const supabaseData = {
      pcode: pcode,
      oem: pcode,
      part_name: partName,
      quantity: quantity,
      price_per_unit: pricePerUnit,
      price: pricePerUnit,
      reduction_percentage: reduction,
      wear_percentage: wear,
      updated_price: updatedPrice,
      total_cost: totalCost  // CRITICAL!
    };
    
    await window.supabase
      .from('parts_required')
      .update(supabaseData)
      .eq('plate', plate.replace(/-/g, ''))
      .eq('damage_center_code', centerId)
      .eq('part_name', partName);
  }
}
```

**Critical Fields**:
- `total_cost` - MUST be saved or final report shows wrong totals
- `updated_price` - Price after reductions
- Field aliases - pcode/oem/catalog_code, name/part_name, qty/quantity, etc.

---

### 3. `estimate-builder.html` (NEEDS SAME FIX)

**Status**: ⚠️ NOT YET FIXED  
**Issue**: Likely has same problem as final-report-builder.html  
**Action Required**: Apply same `autoSaveDamageCenterChanges()` fix

**Expected Location**: Search for `calculatePartPriceFields` function  
**Expected Fix**: Add same dual-save function as final-report-builder.html

---

## Supabase Schema Reference

### `parts_required` Table
**Columns Used**:
- `id` (uuid, primary key)
- `plate` (text, indexed) - License plate (normalized, no dashes)
- `damage_center_code` (text, indexed) - NOT `damage_center_id`
- `pcode` (text, indexed) - Catalog code
- `oem` (text, indexed) - OEM code (same as pcode)
- `part_name` (text) - Part name
- `quantity` (integer, default 1)
- `price_per_unit` (numeric)
- `price` (numeric) - Same as price_per_unit
- `reduction_percentage` (numeric, default 0)
- `wear_percentage` (numeric, default 0)
- `updated_price` (numeric) - Price after reductions
- `total_cost` (numeric) - Final cost (updated_price × quantity)

**Common Mistakes**:
❌ `catalog_code` column doesn't exist (use `pcode`)  
❌ `damage_center_id` column doesn't exist (use `damage_center_code`)  
❌ Forgetting to save `total_cost` breaks final report  
❌ Forgetting to save `updated_price` loses calculation

### `selected_parts` Table
**Columns Used**:
- `id` (uuid)
- `plate` (text)
- `pcode`, `oem` (text)
- `part_family`, `part_name` (text)
- `source` (text: מקורי/חליפי/משומש)
- `price`, `cost`, `expected_cost` (numeric)
- `quantity`, `qty` (integer)
- `supplier`, `supplier_name` (text)
- `selected_at` (timestamp)

### `parts_search_results` Table
**Columns Used**:
- `id` (uuid)
- `session_id` (uuid, foreign key)
- `results` (JSONB array) - Array of part objects
- `data_source` (text: catalog/web/ocr)
- `created_at` (timestamp)

---

## Common Patterns & Utilities

### Plate Normalization
```javascript
const normalizedPlate = plate.replace(/-/g, '');
// "221-84-003" → "22184003"
```

**When to Normalize**:
- ✅ Querying Supabase (all tables use normalized format)
- ❌ Displaying to user (keep dashes for readability)
- ❌ Tab 2 query (selected_parts stores plates WITH dashes)

### Price Formatting
```javascript
// Display
price.toLocaleString('he-IL', {minimumFractionDigits: 2})
// 1500 → "1,500.00"

// Parse from display
parseFloat(priceText.replace(/[₪,]/g, ''))
// "₪1,500.00" → 1500
```

### Date Formatting
```javascript
new Date(dateString).toLocaleDateString('he-IL', {
  year: '2-digit', month: '2-digit', day: '2-digit'
})
// "2025-10-19" → "19/10/25"
```

### Field Aliases Pattern
Many parts have multiple field names for same data:
```javascript
part.pcode = value;
part.oem = value;
part.catalog_code = value;

part.part_name = value;
part.name = value;

part.quantity = value;
part.qty = value;

part.price_per_unit = value;
part.price = value;
part.cost = value;
part.expected_cost = value;
```

**Why**: Different modules use different naming conventions. Update ALL aliases to ensure compatibility.

---

## Styling Standards

### Modal Structure
```css
position: fixed;
top: 50%; left: 50%;
transform: translate(-50%, -50%);
z-index: 10000;
background: white;
border-radius: 12px;
box-shadow: 0 10px 40px rgba(0,0,0,0.3);
```

### Color Scheme
- **Tab 1 (Required)**: Green theme (#28a745, #10b981, #059669)
- **Tab 2 (Selected)**: Green theme (#10b981)
- **Tab 3 (Search)**: Blue theme (#3b82f6, #2563eb)
- **Edit Button**: Orange (#f59e0b)
- **Delete Button**: Red (#ef4444)
- **Success**: Green backgrounds (#d1fae5, #f0fdf4)
- **Warning**: Yellow backgrounds (#fff3cd, #fef3c7)

### Headers
- Background: Transparent (was #28a745, changed per user request)
- Text: Strong green (#28a745)
- Font: Bold, 15px
- No borders on cells (user explicitly rejected borders)

### Mobile Responsive
```css
@media (max-width: 768px) {
  #partsSearchResultsModal {
    top: 10px;
    left: 5px;
    right: 5px;
    width: calc(100% - 10px);
    max-height: 90vh;
  }
  
  .damage-center-parts-table {
    font-size: 11px !important;
  }
}
```

---

## Troubleshooting Guide

### Issue 1: "Supabase לא זמין" Error
**Symptom**: Tabs show "Supabase not available"  
**Cause**: Supabase client not loaded on page  
**Solution**: Module auto-loads via `loadSupabaseClient()` - wait a few seconds  
**Fallback**: Uses `window.helper` data if Supabase unavailable

### Issue 2: Tab Shows "No Data" But Data Exists
**Symptom**: Tab 2 or Tab 3 shows empty when data exists in Supabase  
**Causes**:
1. **Plate mismatch**: Check normalized vs non-normalized plate
2. **Case ID missing**: Tab 3 requires case in `cases` table
3. **Wrong field names**: Check exact column names in schema

**Debug**:
```javascript
// Check plate format
console.log('Query plate:', plate);
console.log('Normalized:', plate.replace(/-/g, ''));

// Check available plates
const { data } = await window.supabase
  .from('selected_parts')
  .select('plate')
  .limit(20);
console.log('Available plates:', data.map(p => p.plate));
```

### Issue 3: Edit Saves But UI Doesn't Update
**Symptom**: Edit modal saves successfully but table shows old data  
**Causes**:
1. Missing `total_cost` update in helper
2. UI refresh functions not called
3. Tab marked as loaded (`tabsLoaded[tab] = true`)

**Solution**:
```javascript
// Force refresh
tabsLoaded.required = false;
loadRequiredParts();

// Trigger UI updates
if (typeof window.updatePartsRequiredUI === 'function') {
  window.updatePartsRequiredUI();
}
```

### Issue 4: Total Cost Wrong in Final Report
**Symptom**: Helper shows correct data but final report shows ₪0 or wrong total  
**Cause**: `total_cost` field not calculated/saved  
**Solution**: ALWAYS calculate and save `total_cost`:
```javascript
const priceAfterReduction = price * (1 - reduction / 100);
const updatedPrice = priceAfterReduction * (1 - wear / 100);
const totalCost = updatedPrice * quantity;

part.total_cost = totalCost;  // Helper
supabaseData.total_cost = totalCost;  // Supabase
```

### Issue 5: "Could not find column 'catalog_code'" Error
**Symptom**: Supabase update fails with PGRST204 error  
**Cause**: Using wrong column name  
**Solution**: Use correct schema column names:
- ❌ `catalog_code` → ✅ `pcode` or `oem`
- ❌ `damage_center_id` → ✅ `damage_center_code`
- ❌ `name` → ✅ `part_name` (for Supabase, both work in helper)

### Issue 6: Refresh Button Does Nothing
**Symptom**: Click refresh but no visual feedback  
**Cause**: Missing loading indicator  
**Solution**: Already implemented (lines 556-579) - shows "מרענן נתונים..." spinner

### Issue 7: Table Headers White/Invisible
**Symptom**: Can't see column headers  
**Cause**: White text on white/transparent background  
**Solution**: Use strong green color:
```css
th {
  background: transparent;
  color: #28a745;
  font-weight: bold;
}
```

---

## Testing Checklist

### Tab 1: Parts Required
- [ ] Loads parts from Supabase
- [ ] Loads parts from helper.centers
- [ ] Groups by damage center correctly
- [ ] Collapse/expand groups works
- [ ] Edit button opens modal
- [ ] Edit saves to Supabase
- [ ] Edit saves to helper with `total_cost`
- [ ] Delete removes from both locations
- [ ] Statistics show correct totals
- [ ] Mobile view responsive

### Tab 2: Selected Parts
- [ ] Loads from selected_parts table
- [ ] Shows correct plate (with/without dashes)
- [ ] Select all checkbox works
- [ ] Individual checkboxes work
- [ ] Delete button removes part
- [ ] Subtotal calculates correctly
- [ ] Mobile view responsive

### Tab 3: Search Results
- [ ] Finds case by plate
- [ ] Gets sessions for case
- [ ] Loads results from sessions
- [ ] Flattens JSONB arrays correctly
- [ ] Shows data source badges
- [ ] Dates format correctly
- [ ] Total count correct
- [ ] Mobile view responsive

### Final Report Builder
- [ ] Editing price triggers auto-save
- [ ] Editing reduction triggers auto-save
- [ ] Editing wear triggers auto-save
- [ ] Editing quantity triggers auto-save
- [ ] Changes save to helper
- [ ] Changes save to Supabase
- [ ] `total_cost` updates correctly
- [ ] UI refreshes automatically
- [ ] No console errors

### Estimate Builder (After Fix)
- [ ] Same tests as Final Report Builder

---

## Key Lessons Learned

### 1. ALWAYS Update Both Locations
Every part edit MUST update:
1. `window.helper.centers[].Parts.parts_required[]`
2. Supabase `parts_required` table

Missing either breaks the system.

### 2. ALWAYS Calculate total_cost
The `total_cost` field is NOT auto-calculated. You MUST:
```javascript
const totalCost = updatedPrice * quantity;
part.total_cost = totalCost;
```

### 3. Field Aliases Are Critical
Parts have multiple names for same data. Update ALL aliases:
- pcode/oem/catalog_code
- part_name/name
- quantity/qty
- price/cost/expected_cost/price_per_unit

### 4. Supabase Column Names Are Exact
Using wrong column name = 400 error. Always check schema.

### 5. Portable Modules Need Dynamic Loading
Floating screen appears on multiple pages. Can't rely on script tags in HTML. Must load Supabase dynamically.

### 6. UI Refresh Must Be Explicit
Saving data doesn't auto-refresh UI. Must call:
- `loadTabData()`
- `window.updatePartsRequiredUI()`
- `window.refreshFinalReportSections()`

### 7. User Preferences Matter
- No borders on table cells (user rejected)
- Green text headers, not white (visibility)
- No massive input fields (breaks layout)
- Clean modal forms, not window prompts

---

## Future Work

### Estimate Builder Fix (High Priority)
Apply same `autoSaveDamageCenterChanges()` pattern:
1. Find `calculatePartPriceFields` function
2. Add dual-save function (copy from final-report-builder.html:11381-11459)
3. Test all part editing scenarios

### Potential Enhancements
1. Bulk edit functionality (edit multiple parts at once)
2. Export tab data to Excel/PDF
3. Part search within tabs (filter/search box)
4. Undo/redo for edits
5. Real-time sync between tabs
6. Drag-and-drop to reorder parts

---

## References

### Source Files
- `parts-search-results-floating.js` - Main floating screen module
- `final-report-builder.html:11341-11459` - Auto-save implementation
- `parts search.html:4678-4976` - Tab 2 PiP reference
- `parts search.html:4979-5125` - Tab 3 PiP reference

### Related Sessions
- Session 49: Initial floating screen creation
- Session 50: Completion + dual-save fixes

### Database Schema
- Table: `parts_required` (lines 1-40 in schema)
- Table: `selected_parts`
- Table: `parts_search_results`
- Table: `parts_search_sessions`
- Table: `cases`

---

## Quick Copy-Paste Solutions

### Dual-Save Pattern (Copy This)
```javascript
// Calculate
const priceAfterReduction = price * (1 - reduction / 100);
const updatedPrice = priceAfterReduction * (1 - wear / 100);
const totalCost = updatedPrice * quantity;

// Update Supabase
if (window.supabase) {
  await window.supabase
    .from('parts_required')
    .update({
      pcode: code,
      oem: code,
      part_name: name,
      quantity: quantity,
      price_per_unit: price,
      price: price,
      reduction_percentage: reduction,
      wear_percentage: wear,
      updated_price: updatedPrice,
      total_cost: totalCost
    })
    .eq('plate', plate.replace(/-/g, ''))
    .eq('damage_center_code', centerId)
    .eq('part_name', originalName);
}

// Update helper
part.pcode = code;
part.oem = code;
part.catalog_code = code;
part.part_name = name;
part.name = name;
part.quantity = quantity;
part.qty = quantity;
part.price_per_unit = price;
part.price = price;
part.cost = price;
part.expected_cost = price;
part.reduction_percentage = reduction;
part.reduction = reduction;
part.wear_percentage = wear;
part.wear = wear;
part.updated_price = updatedPrice;
part.total_cost = totalCost;
```

### Dynamic Supabase Load (Copy This)
```javascript
function loadSupabaseClient() {
  return new Promise((resolve) => {
    if (window.supabase) {
      resolve(true);
      return;
    }
    
    if (document.querySelector('script[src*="supabaseClient.js"]')) {
      const checkInterval = setInterval(() => {
        if (window.supabase) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
      return;
    }
    
    const script = document.createElement('script');
    script.src = './services/supabaseClient.js';
    script.onload = () => setTimeout(() => resolve(!!window.supabase), 100);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
```

---

**End of Session 50 Integration Summary**
