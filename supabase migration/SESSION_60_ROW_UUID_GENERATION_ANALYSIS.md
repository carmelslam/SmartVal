# row_uuid Generation & Preservation Analysis

## Critical Finding: The Root Cause of Duplicates

After analyzing all four files, I've identified the **exact mechanism causing duplicate parts in Supabase**.

---

## Executive Summary

**PROBLEM:** New `row_uuid` values are being generated when they should be preserved, causing the same part to appear multiple times with different UUIDs in Supabase.

**ROOT CAUSE:** The logic `part.row_uuid || crypto.randomUUID()` generates a new UUID whenever `part.row_uuid` is falsy, undefined, or missing - even for existing parts that should already have a UUID.

---

## Detailed Analysis by File

### 1. **parts-required.html** (Most Critical)

#### UUID Generation Points:

##### A. **New Row Creation** (Line 466)
```javascript
function addPart() {
  const row = document.createElement("div");
  row.setAttribute("data-row-uuid", crypto.randomUUID());  // ✅ CORRECT: New part = new UUID
}
```
**Status:** ✅ CORRECT - Creates new UUID for genuinely new parts

##### B. **Loading Existing Parts into UI** (Lines 1702, 2599-2602)
```javascript
// Line 1702: Loading part data into new row
newRow.setAttribute('data-row-uuid', partData.row_uuid || crypto.randomUUID());

// Lines 2597-2603: When adding part to UI
if (part.row_uuid) {
  row.setAttribute("data-row-uuid", part.row_uuid);  // ✅ Preserves UUID
  console.log(`🆔 SESSION 56: Stored row_uuid ${part.row_uuid} for part "${part.name}"`);
} else {
  console.warn(`⚠️ SESSION 56: Part "${part.name}" has no row_uuid - will generate new one on save`);
  // ❌ NO UUID SET - will generate new one on save!
}
```
**Status:** ⚠️ PARTIAL - Preserves if exists, but doesn't generate backup UUID for display

##### C. **Saving to Supabase** (Lines 2768-2772)
```javascript
let rowUuid = row.dataset.rowUuid;
if (!rowUuid) {
  rowUuid = crypto.randomUUID();  // ❌ PROBLEM: Generates NEW UUID for existing part!
  row.dataset.rowUuid = rowUuid;
}
```
**Status:** ❌ **CRITICAL BUG** - Generates new UUID even for parts that SHOULD have one

##### D. **Collecting Row Data for Helper** (Line 641)
```javascript
const rowUuid = row.getAttribute('data-row-uuid') || '';  // Gets from DOM attribute
```
**Status:** ⚠️ RISKY - If DOM attribute is missing/empty, part loses its UUID

##### E. **savePartsData Function** (Lines 640-660)
```javascript
document.querySelectorAll("#partsList .row").forEach(row => {
  const rowUuid = row.getAttribute('data-row-uuid') || '';  // ❌ Can be empty string!
  // ...
  allParts.push({ 
    row_uuid: rowUuid,  // ❌ May be empty, will trigger new UUID generation later
    // ...
  });
});
```
**Status:** ❌ **CRITICAL BUG** - Empty string is falsy, triggers UUID regeneration

---

### 2. **estimator-builder.html**

#### UUID Handling (Line 2914):
```javascript
row_uuid: existingPart.row_uuid || crypto.randomUUID(),
```

**Context:** This is inside a data collection loop where `existingPart` is from `helper.centers[centerIndex].Parts.parts_required[partIndex]`

**Status:** ⚠️ RISKY - If `existingPart.row_uuid` is missing/undefined, generates new UUID

#### Supabase Sync (Lines 3298-3356):
```javascript
if (!part.row_uuid || !part.damage_center_code) {
  console.warn('⚠️ SESSION 59: Skipping part without row_uuid or damage_center_code:', part);
  continue;  // ✅ GOOD: Skips parts without UUID
}

const supabaseData = {
  row_uuid: part.row_uuid,  // ✅ Uses existing UUID
  // ...
};

await window.supabase
  .from('parts_required')
  .upsert(supabaseData, {
    onConflict: 'row_uuid',  // ✅ CORRECT: Upserts by UUID
    ignoreDuplicates: false
  });
```

**Status:** ✅ GOOD - Validates UUID exists before syncing

---

### 3. **final-report-builder.html**

#### UUID Handling (Lines 11566-11608):
```javascript
// Generate or preserve row_uuid (required for upsert)
const rowUuid = part.row_uuid || crypto.randomUUID();  // ❌ PROBLEM!

const supabaseData = {
  row_uuid: rowUuid,  // Uses potentially NEW UUID
  // ...
};

// ✅ SESSION 54 FIX: Update helper with row_uuid
if (!part.row_uuid) {
  part.row_uuid = rowUuid;  // Updates helper with new UUID
  window.helper.centers[centerIndex].Parts.parts_required[partIndex].row_uuid = rowUuid;
}
```

**Status:** ❌ **CRITICAL BUG** - Generates new UUID for existing parts, then updates helper with the new UUID (orphaning the old record in Supabase!)

**Impact:** This is the WORST case - it:
1. Creates a NEW UUID for an existing part
2. Creates a NEW row in Supabase (duplicate)
3. Updates helper to reference the NEW UUID
4. Orphans the OLD record in Supabase (can't be updated anymore)

---

### 4. **damage-centers-wizard.html**

#### UUID Handling (Lines 3788, 6955):
```javascript
// Two identical locations with same logic
helper.current_damage_center.Parts.parts_required = partsData.map(part => ({
  row_uuid: part.row_uuid || crypto.randomUUID(),  // ❌ PROBLEM!
  // ...
}));
```

**Status:** ❌ **CRITICAL BUG** - Same issue as other files

**Location 1:** Line 3788 - In `saveCurrentStepData` function (case 5)
**Location 2:** Line 6955 - In `receiveFromParts` message handler

---

## The Duplication Mechanism

### How Duplicates Are Created:

1. **Initial Creation (parts-required.html):**
   - User adds a part → `addPart()` generates UUID → Part saved to Supabase with `row_uuid: "abc-123"`

2. **Edit/Navigate Flow:**
   - User navigates away → `savePartsData()` collects data
   - If DOM attribute is lost/missing → `row_uuid` becomes empty string `""`
   - Empty string is falsy → Next save generates NEW UUID `"xyz-789"`

3. **Result in Supabase:**
   - Original row: `row_uuid: "abc-123"` (orphaned, never updated)
   - Duplicate row: `row_uuid: "xyz-789"` (active, receives updates)
   - Same part appears twice with different UUIDs!

4. **Cascade Effect:**
   - `estimator-builder.html` collects data → missing UUID → generates new one
   - `final-report-builder.html` processes parts → missing UUID → generates new one + updates helper
   - `damage-centers-wizard.html` receives parts → missing UUID → generates new one

---

## Line Number Reference

### When NEW UUIDs are CORRECTLY Generated:
| File | Line | Function | Logic | Status |
|------|------|----------|-------|--------|
| parts-required.html | 466 | `addPart()` | `crypto.randomUUID()` for new row | ✅ Correct |

### When UUIDs SHOULD be Preserved (but aren't):
| File | Line | Function | Logic | Status |
|------|------|----------|-------|--------|
| parts-required.html | 641 | `savePartsData()` | `row.getAttribute('data-row-uuid') \|\| ''` | ❌ Bug |
| parts-required.html | 1702 | Loading parts | `partData.row_uuid \|\| crypto.randomUUID()` | ❌ Bug |
| parts-required.html | 2770 | Save to Supabase | `crypto.randomUUID()` if missing | ❌ Bug |
| estimator-builder.html | 2914 | Data collection | `existingPart.row_uuid \|\| crypto.randomUUID()` | ❌ Bug |
| final-report-builder.html | 11568 | Auto-save | `part.row_uuid \|\| crypto.randomUUID()` | ❌ Bug |
| damage-centers-wizard.html | 3788 | Save step data | `part.row_uuid \|\| crypto.randomUUID()` | ❌ Bug |
| damage-centers-wizard.html | 6955 | Receive from parts | `part.row_uuid \|\| crypto.randomUUID()` | ❌ Bug |

### Supabase Upsert Operations:
| File | Line | onConflict Key | Status |
|------|------|----------------|--------|
| parts-required.html | 2846 | `row_uuid` | ✅ Correct |
| estimator-builder.html | 3348 | `row_uuid` | ✅ Correct |
| final-report-builder.html | 11614 | `row_uuid` | ✅ Correct |

---

## Why This Happens

### Data Flow Breaks:
1. **DOM → Helper Sync Failure:**
   - DOM attribute `data-row-uuid` not reliably preserved during UI updates
   - Row recreation/reordering can lose attributes
   - `getAttribute()` returns `null` → falsy → triggers new UUID

2. **Helper → Module Sync Failure:**
   - Parts passed between modules (wizard → parts → estimator → report)
   - If any module strips/loses `row_uuid` field → next module generates new one

3. **Edit Mode Issues:**
   - `editPartRow()` changes UI but doesn't re-verify UUID preservation
   - `finishEditingRow()` doesn't ensure UUID persists

4. **No UUID Recovery:**
   - No logic to "recover" UUID from Supabase if DOM loses it
   - No validation: "Does this part already exist in Supabase? Use its UUID!"

---

## Risk Assessment

### High Risk (Causes Immediate Duplicates):
- ❌ **parts-required.html Line 2770** - Generates new UUID during save
- ❌ **final-report-builder.html Line 11568** - Generates new UUID + updates helper
- ❌ **savePartsData Line 641** - Empty string UUID propagates through system

### Medium Risk (Potential Duplication):
- ⚠️ **estimator-builder.html Line 2914** - Fallback UUID generation
- ⚠️ **damage-centers-wizard.html Lines 3788, 6955** - Maps without validation

### Low Risk (Correct Behavior):
- ✅ **parts-required.html Line 466** - New part creation (intended)
- ✅ All `onConflict: 'row_uuid'` upsert operations (correct Supabase usage)

---

## Recommendation Priority

### CRITICAL (Fix Immediately):
1. **parts-required.html Line 2770** - NEVER generate new UUID if part name/description exists in helper/Supabase
2. **final-report-builder.html Line 11568** - Lookup existing part in Supabase before generating UUID
3. **savePartsData Line 641** - Validate UUID exists, lookup from helper/Supabase if missing

### HIGH (Fix Soon):
4. **estimator-builder.html Line 2914** - Add UUID validation/lookup
5. **damage-centers-wizard.html Lines 3788, 6955** - Validate UUID before mapping
6. Add UUID recovery function: "Find part in Supabase by plate + damage_center + part_name → reuse UUID"

### MEDIUM (Prevent Future Issues):
7. Add console errors when UUID would be regenerated (force developers to notice)
8. Implement "UUID preservation verification" in debug mode
9. Add Supabase lookup: "Does this part already exist? Merge, don't duplicate"

---

## Next Steps

See `todo.md` for implementation plan to fix these issues systematically.
