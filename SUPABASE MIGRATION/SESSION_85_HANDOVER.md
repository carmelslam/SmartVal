# Session 85: Parts Search & Required Parts - Database Schema Fix - HANDOVER

**Date**: 2025-10-28  
**Status**: ⏸️ AWAITING USER TESTING  
**Agent**: Claude Code Session 85

---

## 🎯 Original Problem

User reported:
1. **Selected parts list showing empty** - Button "🗂️ הצג רשימת חלקים נבחרים עדכנית" and floating screen Tab 2 both showed empty despite Supabase having data
2. **Parts required save errors** - Multiple schema cache errors when saving parts in damage centers wizard

---

## 🔍 Investigation Process

### Initial Hypothesis (WRONG)
- Suspected SESSION 34's `case_id` column addition broke the flow
- User corrected: "Parts flow worked perfectly until very recently"

### Actual Root Causes Found

#### **Problem 1: Plate Format Mismatch**
**Evidence from console logs:**
```
Query looking for: 22184003 (no dashes)
Supabase has: 221-84-003 (with dashes)
Result: 0 rows found
```

**Why it broke recently:**
- Supabase stores plates in BOTH formats (inconsistent data entry)
- Query was using single format only
- SESSION 24 logic clears helper when Supabase returns empty
- Result: Both Supabase AND helper appear empty

#### **Problem 2: Non-Existent Database Columns**
**Errors:**
```
"Could not find the 'manufacturer' column of 'parts_required' in the schema cache"
"Could not find the 'price' column of 'parts_required' in the schema cache"
```

**Root cause:**
- Code tried to save 9 columns that don't exist in `parts_required` table:
  - `price`, `unit_price` 
  - `manufacturer`
  - `make`, `model`, `year`, `trim`, `engine_code`, `engine_type`, `vin`
- Someone copied upsert logic from `selected_parts` table (which HAS these columns) to `parts_required` table (which DOESN'T)

---

## ✅ Solutions Implemented

### Fix 1: Plate Format Query - OR Logic

**Files Modified:**
1. `parts search.html` (lines 1444-1516)
2. `parts-search-results-floating.js` (lines 1329-1340)

**Change:**
```javascript
// OLD (broken):
.eq('plate', queryPlate)  // Only matches ONE format

// NEW (fixed):
const plateNoDashes = queryPlate.replace(/-/g, '');
const plateWithDashes = queryPlate.includes('-') ? queryPlate : 
                        queryPlate.replace(/(\d{3})(\d{2})(\d{3})/, '$1-$2-$3');

.or(`plate.eq.${plateNoDashes},plate.eq.${plateWithDashes}`)  // Matches BOTH
```

**Why OR query?**
- Supabase has BOTH formats inconsistently
- Can't predict which was used when saving
- OR catches everything

**Impact:**
- ✅ Parts search button now works (user confirmed)
- 🔄 Floating screen Tab 2 should work (needs testing)

---

### Fix 2: Remove Non-Existent Columns

**File Modified:**
`parts-required.html` (lines 2860-2894)

**Removed columns:**
```javascript
// SESSION 85: These columns don't exist in parts_required table
// price: totalCost,                           // ❌ Removed
// unit_price: updatedPrice,                   // ❌ Removed
// manufacturer: partMetadata.manufacturer,    // ❌ Removed
// make: window.helper?.vehicle?.manufacturer, // ❌ Removed
// model: window.helper?.vehicle?.model,       // ❌ Removed
// year: window.helper?.vehicle?.year,         // ❌ Removed
// trim: window.helper?.vehicle?.trim,         // ❌ Removed
// engine_code: window.helper?.vehicle?.engine_code, // ❌ Removed
// engine_type: window.helper?.vehicle?.fuel_type,   // ❌ Removed
// vin: window.helper?.vehicle?.vin,           // ❌ Removed
```

**Kept columns (these DO exist):**
```javascript
// ✅ These exist and are required
case_id: caseUuid,
plate: normalizedPlate,
damage_center_code: damageCenterCode,
price_per_unit: pricePerUnit,  // Note: price_per_unit, NOT price
```

**Vehicle data moved to metadata:**
```javascript
metadata: {
  ...partMetadata,
  vehicle: {
    manufacturer: window.helper?.vehicle?.manufacturer || '',
    make: window.helper?.vehicle?.manufacturer || '',
    model: window.helper?.vehicle?.model || '',
    year: window.helper?.vehicle?.year || '',
    // ... rest of vehicle fields
  }
}
```

**Impact:**
- 🔄 Should fix all schema cache errors (needs testing)
- ✅ `case_id`, `plate`, `damage_center_code` still saved correctly

---

## 📊 Schema Comparison (Critical Knowledge)

### `selected_parts` Table
**Created by:** SESSION 11  
**Purpose:** Store parts user selected in search results  
**Has vehicle columns:** ✅ YES (make, model, year, trim, engine_code, engine_type, vin)  
**Has price column:** ✅ YES (`price`)

### `parts_required` Table  
**Created by:** Original + SESSION 36  
**Purpose:** Store parts needed per damage center (with pricing calculations)  
**Has vehicle columns:** ❌ NO (stores in metadata JSONB instead)  
**Has price column:** ❌ NO (uses `price_per_unit` + `total_cost` instead)

**KEY DIFFERENCE:** These are TWO DIFFERENT TABLES with DIFFERENT SCHEMAS. Don't assume they're the same!

---

## 🧪 Testing Required (User Must Test)

### Test 1: Selected Parts Display
- [ ] Click "🗂️ הצג רשימת חלקים נבחרים עדכנית" button
  - **Expected:** Shows parts list ✅ (user confirmed working)
  - **Console:** Should show `🔧 SESSION 85: Plate formats - Original: "..." Without dashes: "..." With dashes: "..."`

- [ ] Open floating screen (parts-search-results-floating.js)
- [ ] Click Tab 2 "✅ חלקים נבחרים"
  - **Expected:** Shows selected parts (same as button above)
  - **Console:** Should show `🔍 SESSION 85: Querying Supabase for plate (both formats):`

### Test 2: Parts Required Save
- [ ] Open damage centers wizard
- [ ] Go to Step 4 (parts required)
- [ ] Add a part (from suggestive field or manual)
- [ ] Change quantity or price
- [ ] **Expected:** 
  - ✅ No "manufacturer column" errors
  - ✅ No "price column" errors
  - ✅ Console shows: `✅ SESSION 39: Saved to Supabase via upsert`
  - ✅ Part appears in table immediately

- [ ] Check Supabase `parts_required` table directly:
  - **Verify columns present:** `case_id`, `plate`, `damage_center_code`, `price_per_unit`, `total_cost`
  - **Verify metadata has:** `vehicle: { manufacturer, make, model, year, ... }`

---

## 🚨 Known Issues / Limitations

### Issue 1: Inconsistent Plate Storage Format
**Problem:** Supabase has BOTH `"22184003"` AND `"221-84-003"`  
**Root cause:** Different entry points save different formats  
**Current fix:** OR query handles both  
**Better fix (future):** Normalize ALL plates on save with trigger/function

### Issue 2: Schema Drift Between Tables
**Problem:** `selected_parts` and `parts_required` have different columns  
**Current state:** Code now respects differences  
**Prevention:** Document table schemas clearly before coding

---

## 🔮 Recommendations for Next Session

### Immediate Actions
1. **Test both fixes** (user testing required)
2. **If floating screen Tab 2 still empty:** Check if it's loading from wrong source (helper vs Supabase)
3. **If parts_required still errors:** Check actual table schema in Supabase dashboard

### Future Improvements
1. **Normalize plates on save** - Create Supabase function to auto-normalize all plates to one format
2. **Add schema validation** - Validate columns exist before upserting
3. **Centralize plate logic** - Create single `normalizePlate()` utility function used everywhere
4. **Document table schemas** - Add schema documentation to each table in Supabase

---

## 📝 Code Changes Summary

### Files Modified (3 files)

1. **parts search.html**
   - Lines 1444-1448: Added both plate format preparation
   - Lines 1468-1472: Changed to OR query
   - Lines 1481-1516: Updated console logs and debug output

2. **parts-search-results-floating.js**
   - Lines 1329-1340: Applied same OR query fix for Tab 2

3. **parts-required.html**
   - Lines 2860-2862: Removed `price` and `unit_price` columns
   - Lines 2868-2879: Removed `manufacturer` and vehicle columns
   - Lines 2881-2894: Added vehicle data to metadata JSONB

### No Database Changes
- ✅ All fixes are code-only
- ✅ No migrations needed
- ✅ Backward compatible with existing data

---

## 🎓 Key Learnings

### 1. Always Check Actual Schema
**Lesson:** Don't assume tables have columns just because similar code works elsewhere  
**Tool:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'X';`

### 2. Plate Format Inconsistency is Real
**Lesson:** Supabase can have multiple plate formats simultaneously  
**Solution:** Always use OR query or normalize on save (not on query)

### 3. Trust User's Timeline
**Lesson:** User said "it worked recently" - that eliminated SESSION 34 as root cause  
**Impact:** Saved hours of wrong investigation path

---

## 📞 Handover to Next Agent

### What's Done ✅
- Root cause identified (plate format mismatch + schema mismatch)
- Code fixes implemented in 3 files
- Documentation created
- First fix confirmed working by user (parts search button)

### What's Pending 🔄
- **User testing required** for:
  1. Floating screen Tab 2 (selected parts)
  2. Parts required save (damage centers wizard)
- **Possible additional issues** may emerge during testing

### Critical Context for Next Agent
1. **Two different tables:** `selected_parts` ≠ `parts_required` (different schemas!)
2. **Plate formats:** Supabase has BOTH formats, query must handle both
3. **SESSION 85 markers:** All my changes have `// SESSION 85:` comments
4. **User confirmed:** Parts search button works, waiting on rest

### If Issues Persist After Testing
1. **Check Supabase directly** - Verify actual column names
2. **Check browser console** - Look for SESSION 85 debug logs
3. **Check helper sync** - Verify helper.parts_search.selected_parts is populated
4. **Check RLS policies** - Might be blocking reads/writes

---

## 📂 Related Documentation

- **Full technical analysis:** `SESSION_85_PARTS_SEARCH_SELECTED_FIX.md`
- **Previous session (not root cause):** `SESSION_34_ADD_CASE_ID_TO_SELECTED_PARTS.sql`
- **Helper clearing logic:** `parts search.html:1053-1058` (SESSION 24)
- **Table creation:** `Phase5_Parts_Search_2025-10-05/CREATE_PARTS_SEARCH_TABLES_2025-10-06.sql`

---

**Session Status**: ⏸️ **AWAITING USER TESTING**  
**Next Step**: User tests floating screen + parts required save  
**Ready for Handover**: ✅ YES  

---

*End of Session 85 Handover*
