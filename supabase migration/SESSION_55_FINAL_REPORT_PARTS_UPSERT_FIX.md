# Session 55: Final Report Parts Upsert Fix

**Date**: 2025-10-20  
**Session**: 55  
**Status**: 🔄 IN PROGRESS

---

## Executive Summary

Fixed critical Supabase upsert errors in `final-report-builder.html` when adding or editing parts in damage centers. The issues were:

1. **Wrong column name**: Using `catalog_code` which doesn't exist (should be `pcode`)
2. **Wrong case_id type**: Sending filing case ID string instead of UUID from `cases` table
3. **Wrong row_uuid format**: Generating custom string instead of proper UUID format

---

## Problem Statement

When editing parts in the final report damage centers section, the auto-save function `autoSaveDamageCenterChanges()` was failing with Supabase 400 errors:

### Error 1: Invalid Column Name
```
❌ Supabase error 400: {"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'catalog_code' column of 'parts_required' in the schema cache"}
```

**Cause**: The Supabase `parts_required` table uses `pcode` and `oem` columns, NOT `catalog_code`.

**Reference**: Session 51 documentation clearly states the schema uses `pcode` for catalog codes.

### Error 2: Invalid UUID for case_id
```
❌ Supabase error 400: {"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type uuid: \"YC-22184003-2025\""}
```

**Cause**: The `case_id` column in `parts_required` is a UUID (foreign key to `cases.id`), but we were sending the filing case ID string `"YC-22184003-2025"`.

**Root Issue**: Helper object stores `helper.case_info.case_id = "YC-22184003-2025"` (filing ID) but never stores the actual UUID from `cases` table.

### Error 3: Invalid UUID for row_uuid
```
❌ Supabase error 400: {"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type uuid: \"22184003_1_fart_1760963035762\""}
```

**Cause**: The `row_uuid` column is the PRIMARY KEY with UUID type, but we were generating custom strings like `"22184003_1_fart_1760963035762"`.

---

## Solutions Implemented

### Fix 1: Remove Invalid Column Names
**File**: `final-report-builder.html`  
**Lines**: 11447-11470

**Changes**:
- ❌ Removed: `catalog_code`, `qty`, `cost` (don't exist in schema)
- ✅ Kept: `pcode`, `oem`, `quantity`, `price_per_unit`, `price`, `reduction_percentage`, `wear_percentage`, `updated_price`, `total_cost`

```javascript
const supabaseData = {
  row_uuid: rowUuid,
  plate: normalizedPlate,
  damage_center_code: centerId,
  part_name: partName,
  
  // Only columns that exist in Supabase schema
  pcode: pcode,
  oem: pcode,
  quantity: quantity,
  price_per_unit: pricePerUnit,
  price: pricePerUnit,
  reduction_percentage: reduction,
  wear_percentage: wear,
  updated_price: updatedPrice,
  total_cost: totalCost,
  
  description: part.description || part.desc || '',
  source: part.source || 'manual',
  case_id: caseUuid || null,  // ✅ Now UUID, not string
  
  make: window.helper?.vehicle?.manufacturer || '',
  model: window.helper?.vehicle?.model || '',
  year: window.helper?.vehicle?.year || '',
  
  updated_at: new Date().toISOString()
};
```

### Fix 2: Lookup Case UUID from Supabase
**File**: `final-report-builder.html`  
**Lines**: 11432-11447

**Solution**: Query the `cases` table to get the actual UUID using the plate number.

```javascript
// Get case UUID from Supabase cases table (not filing_case_id string)
let caseUuid = part.case_id || ''; // Preserve if already exists
if (!caseUuid) {
  try {
    const { data: caseData } = await window.supabase
      .from('cases')
      .select('id')
      .eq('plate', normalizedPlate)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    caseUuid = caseData?.id || '';
  } catch (err) {
    console.warn('Could not lookup case UUID, skipping case_id field');
  }
}
```

**Benefits**:
- Preserves existing `case_id` if part already has one (avoids redundant queries)
- Graceful fallback to `null` if no case found
- Uses normalized plate for query consistency

### Fix 3: Generate Proper UUID for row_uuid
**File**: `final-report-builder.html`  
**Lines**: 11449-11451

**Solution**: Use `crypto.randomUUID()` instead of custom string generation.

**Before**:
```javascript
const rowUuid = part.row_uuid || `${normalizedPlate}_${centerId}_${partName}_${Date.now()}`.replace(/\s+/g, '_');
// Generated: "22184003_1_fart_1760963035762" ❌ NOT A VALID UUID
```

**After**:
```javascript
const rowUuid = part.row_uuid || crypto.randomUUID();
// Generated: "550e8400-e29b-41d4-a716-446655440000" ✅ PROPER UUID
```

---

## Architecture Issue Identified: Missing Case UUID in Helper

### Current State
`window.helper` structure:
```javascript
{
  case_info: {
    case_id: "YC-22184003-2025"  // ❌ Filing ID string, NOT UUID
  },
  meta: {
    plate: "221-84-003",
    case_id: "YC-22184003-2025"  // ❌ Same filing ID string
  }
}
```

### Missing UUID
The actual case UUID from `cases.id` is NEVER stored in helper at initialization. Every function that needs it must:
1. Query Supabase `cases` table using plate
2. Extract `id` field
3. Use in foreign key references

### Recommended Future Fix
When a case is created or loaded, capture the UUID:

```javascript
// At case creation/load
const { data: caseData } = await supabase
  .from('cases')
  .select('id, filing_case_id')
  .eq('plate', normalizedPlate)
  .single();

window.helper.meta.case_uuid = caseData.id;  // ✅ Store UUID
window.helper.meta.filing_case_id = caseData.filing_case_id;  // ✅ Store filing ID
```

Then all modules can use `helper.meta.case_uuid` directly without repeated queries.

---

## Testing Results

### Test 1: Edit Existing Part
- ✅ No more `catalog_code` column error
- ✅ No more invalid UUID errors
- ✅ Supabase upsert succeeds
- ✅ Part data preserved in helper

### Test 2: Add New Part
- ✅ Generates proper UUID for `row_uuid`
- ✅ Looks up case UUID from `cases` table
- ✅ Inserts new row successfully
- ✅ Subsequent edits UPDATE (not duplicate)

---

## Files Modified

### `final-report-builder.html`

**Lines 11432-11451**: Case UUID lookup and row UUID generation
```javascript
// Get case UUID from Supabase cases table (not filing_case_id string)
let caseUuid = part.case_id || '';
if (!caseUuid) {
  try {
    const { data: caseData } = await window.supabase
      .from('cases')
      .select('id')
      .eq('plate', normalizedPlate)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    caseUuid = caseData?.id || '';
  } catch (err) {
    console.warn('Could not lookup case UUID, skipping case_id field');
  }
}

// Generate or preserve row_uuid (required for upsert)
// Use crypto.randomUUID() for proper UUID format
const rowUuid = part.row_uuid || crypto.randomUUID();
```

**Lines 11453-11484**: Supabase upsert data (removed invalid columns)
```javascript
const supabaseData = {
  row_uuid: rowUuid,
  plate: normalizedPlate,
  damage_center_code: centerId,
  part_name: partName,
  
  // Only columns that exist in Supabase schema
  pcode: pcode,
  oem: pcode,
  quantity: quantity,
  price_per_unit: pricePerUnit,
  price: pricePerUnit,
  reduction_percentage: reduction,
  wear_percentage: wear,
  updated_price: updatedPrice,
  total_cost: totalCost,
  
  description: part.description || part.desc || '',
  source: part.source || 'manual',
  case_id: caseUuid || null,
  
  make: window.helper?.vehicle?.manufacturer || '',
  model: window.helper?.vehicle?.model || '',
  year: window.helper?.vehicle?.year || '',
  
  updated_at: new Date().toISOString()
};
```

---

## Supabase Schema Reference

### `parts_required` Table

**Primary Key**: `row_uuid` (UUID)

**Foreign Keys**:
- `case_id` → `cases.id` (UUID)

**Columns Used**:
- `row_uuid` (uuid) - PRIMARY KEY, must use `crypto.randomUUID()`
- `plate` (text) - normalized, no dashes
- `damage_center_code` (text)
- `part_name` (text)
- `pcode` (text) - ✅ Catalog code
- `oem` (text) - ✅ Same as pcode
- `quantity` (integer)
- `price_per_unit` (numeric)
- `price` (numeric)
- `reduction_percentage` (numeric)
- `wear_percentage` (numeric)
- `updated_price` (numeric)
- `total_cost` (numeric)
- `description` (text)
- `source` (text)
- `case_id` (uuid) - ✅ Foreign key to cases.id
- `make`, `model`, `year` (text)
- `updated_at` (timestamp)

**Columns That DON'T Exist**:
- ❌ `catalog_code` (use `pcode` instead)
- ❌ `qty` (use `quantity` instead)
- ❌ `cost` (use `total_cost` instead)

---

## Common Patterns

### Proper UUID Generation
```javascript
// ✅ CORRECT - Use crypto.randomUUID()
const rowUuid = crypto.randomUUID();
// Result: "550e8400-e29b-41d4-a716-446655440000"

// ❌ WRONG - Custom string
const rowUuid = `${plate}_${center}_${Date.now()}`;
// Result: "22184003_1_1760963035762" (NOT A UUID)
```

### Case UUID Lookup Pattern
```javascript
// Query cases table by plate to get UUID
const { data: caseData } = await window.supabase
  .from('cases')
  .select('id')
  .eq('plate', normalizedPlate)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

const caseUuid = caseData?.id || null;
```

### Field Name Mapping
| Helper Field | Supabase Column | Notes |
|-------------|-----------------|-------|
| `catalog_code` | `pcode` | Helper uses alias |
| `catalog_code` | `oem` | Same value |
| `qty` | `quantity` | Helper uses alias |
| `cost` | `total_cost` | Helper uses alias |
| N/A | `price` | Same as price_per_unit |

---

## Next Steps (Future Work)

### 1. Add case_uuid to Helper Initialization
**Priority**: HIGH  
**Location**: Case creation/loading functions  
**Action**: Store `helper.meta.case_uuid` at the start instead of querying every time

### 2. Apply Same Fix to Other Files
**Priority**: HIGH  
**Files to Check**:
- `estimator-builder.html` - Likely has same issues
- `damage-centers-wizard.html` - Check parts save logic
- `parts-required.html` - Check Supabase writes

### 3. Verify row_uuid Preservation
**Priority**: MEDIUM  
**Issue**: Ensure `row_uuid` is preserved in helper when parts are edited/moved  
**Test**: Edit part, check `helper.centers[0].Parts.parts_required[0].row_uuid` is preserved

---

## Key Lessons Learned

### 1. Always Check Actual Schema
Documentation can be outdated. Always verify column names in Supabase dashboard or schema file.

### 2. UUID vs String Distinction
- `case_id` in helper = Filing ID string ("YC-22184003-2025")
- `case_id` in Supabase = UUID ("550e8400-...")
- These are DIFFERENT and must be mapped correctly

### 3. Field Aliases in Helper vs Supabase
Helper uses multiple names for same field (`catalog_code`, `pcode`, `oem`). Supabase only accepts exact column names.

### 4. Preserve Existing UUIDs
Always check if UUID already exists before generating new one to avoid breaking foreign key relationships.

---

## Related Sessions

- **Session 54**: Data flow architecture, fixed parts_required iframe data capture
- **Session 51**: Parts search floating screen, dual-save pattern
- **Session 39**: Original Supabase schema documentation

---
## CRITICAL OUTSTANDING ISSUE

### Problem: Adding parts in final-report-builder creates NEW damage centers

**Root Cause**: `window.helper.centers[]` is undefined or doesn't contain damage center IDs

**What Happens**:
1. User adds part in UI (damage center 1)
2. `autoSaveDamageCenterChanges()` tries to get `center.Id` from `helper.centers[0]`
3. But `helper.centers` is undefined → `center.Id` is undefined
4. Code generates NEW ID: `dc_${Date.now()}_1`
5. Part saves to Supabase with WRONG/NEW damage center ID
6. Floating screen shows "phantom" damage centers

**Current State**:
- ✅ Fixed: Use existing center ID (don't generate new)
- ✅ Fixed: Wizard sends correct ID to parts-required iframe  
- ✅ Fixed: Preserve center ID in `saveDamageCenterChanges()`
- ❌ **BROKEN**: `window.helper.centers[]` not populated with IDs on page load

**Solution Required**:
When final-report-builder.html loads, it MUST:
1. Load `window.helper` from sessionStorage
2. If `helper.centers[]` exists but lacks IDs, load IDs from Supabase `parts_required` table
3. Group parts by `damage_center_code` to get unique center IDs
4. Update `helper.centers[].Id` with the correct `dc_xxx` IDs
5. Save updated helper to sessionStorage and window.helper

**Code Location**: `DOMContentLoaded` handler around line 10966-10969

**Alternative Solution**:
Call `saveDamageCenterChanges()` immediately after loading UI to populate helper from DOM, ensuring IDs are preserved from existing parts.

---

## Additional Issues Found

### Issue 2: Delete Part doesn't remove from Supabase

**File**: `final-report-builder.html`  
**Function**: `removePartRow()`  
**Problem**: Only removes from DOM, doesn't delete from Supabase  
**Solution**: Add Supabase delete query using `row_uuid`

### Issue 3: Floating Screen shows duplicate centers

**Status**: ✅ FIXED (use Supabase only, not helper as fallback)

---

**Status**: ⚠️ PARTIALLY FIXED - Core upsert works but helper initialization broken  
**Next Session**: Fix `window.helper.centers[]` initialization with damage center IDs from Supabase

---

**End of Session 55 Summary**
