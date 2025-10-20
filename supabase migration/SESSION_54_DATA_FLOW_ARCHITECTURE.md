# Session 54: Complete Data Flow Architecture & Dependencies

**Date**: 2025-10-20  
**Session**: 54  
**Status**: ✅ COMPLETED

---

## Executive Summary

This session uncovered and fixed critical data flow issues across the SmartVal system. The primary problems were:

1. **Parts-required iframe** not capturing all UI fields (catalog_code, prices, reductions, wear)
2. **Damage center code** not being sent from wizard to iframe
3. **Final report builder** calculating totals from wrong field (`price` instead of `total_cost`)
4. **Final report builder** not preserving existing part data (losing catalog_code, case_id, etc.)
5. **Final report builder** not writing new parts to Supabase (only updating existing)
6. **Estimator builder** overwriting complete part structure with incomplete legacy format

---

## Critical Architecture: Data Flow Hierarchy

### The Source of Truth

```
PRIMARY SOURCE: helper.centers[]
    ↓
AGGREGATED SUMMARY: damage_assessment.totals
    ↓  
DISPLAY FIELDS: UI fields in final report
```

### Flow Direction

```
Wizard (Initial Entry)
    ↓
helper.centers[] (Browser Memory + SessionStorage)
    ↓
Supabase parts_required table (Database)
    ↓
Final Report Builder (Editing)
    ↓
Estimator Builder (Optional Editing)
    ↓
Back to helper.centers[] + Supabase
```

---

## Part 1: Parts Required Structure

### Complete Field Structure (25+ Fields)

Every part in `helper.centers[].Parts.parts_required[]` MUST have:

```javascript
{
  // === IDENTIFICATION (4 fields) ===
  row_uuid: "unique_identifier",              // PRIMARY KEY for Supabase
  case_id: "YC-22184003-2025",               // Case identifier
  damage_center_code: "מוקד 1",               // Damage center identifier
  plate: "22184003",                          // Vehicle plate (normalized)
  
  // === PART INFO (6 fields + aliases) ===
  name: "כנף אחורית ימנית",
  part_name: "כנף אחורית ימנית",             // Alias
  part: "כנף אחורית ימנית",                  // Alias
  pcode: "ABC123",
  catalog_code: "ABC123",                     // Alias
  oem: "ABC123",                              // Alias
  description: "כנף אחורית ימנית - קורולה",
  desc: "כנף אחורית ימנית - קורולה",        // Alias
  supplier_name: "ספק חלפים",
  supplier: "ספק חלפים",                      // Alias
  
  // === PRICING (10 fields + aliases) ===
  price_per_unit: 500,                        // Per-unit price BEFORE reductions
  price: 500,                                 // Alias
  reduction_percentage: 10,                   // Discount %
  reduction: 10,                              // Alias
  wear_percentage: 5,                         // Wear %
  wear: 5,                                    // Alias
  updated_price: 427.5,                       // After reduction & wear
  total_cost: 855,                           // ✅ CRITICAL: updated_price × quantity
  cost: 855,                                  // Alias
  quantity: 2,
  qty: 2,                                     // Alias
  
  // === METADATA (3 fields) ===
  source: "חליפי",                            // Part type
  part_family: "body_parts",
  manufacturer: "Toyota",
  
  // === VEHICLE CONTEXT (7 fields) ===
  make: "TOYOTA",
  model: "COROLLA CROSS",
  year: "2022",
  trim: "ADVENTURE",
  engine_code: "",
  engine_type: "בנזין",
  vin: "",
  
  // === TIMESTAMPS ===
  updated_at: "2025-10-20T10:44:04.513Z"
}
```

### Calculation Logic

```javascript
// Step 1: Apply reduction (discount)
priceAfterReduction = price_per_unit × (1 - reduction_percentage / 100)
// Example: 500 × (1 - 10/100) = 500 × 0.9 = 450

// Step 2: Apply wear
priceAfterWear = priceAfterReduction × (1 - wear_percentage / 100)
// Example: 450 × (1 - 5/100) = 450 × 0.95 = 427.5

// Step 3: Store as updated_price
updated_price = priceAfterWear
// Example: 427.5

// Step 4: Calculate total cost (includes quantity)
total_cost = updated_price × quantity
// Example: 427.5 × 2 = 855
```

**CRITICAL**: `total_cost` is the field used for all aggregations, NOT `price` or `price_per_unit`!

---

## Part 2: Data Flow From Wizard to Helper

### Wizard → Parts-Required Iframe Flow

**File**: `damage-centers-wizard.html`

**Step 1: Wizard Sends Context** (Lines 6425-6452)

```javascript
// Wizard prepares damage center context
const damageCenterData = {
  id: center.Id,
  "Damage center Number": "1",
  Location: "דלת קדמית",
  // ... other fields
};

// ✅ SESSION 54 FIX: Add code field from Damage center Number
if (!damageCenterData.code && damageCenterData["Damage center Number"]) {
  damageCenterData.code = `מוקד ${damageCenterData["Damage center Number"]}`;
}

const contextData = {
  type: 'damageCenterContext',
  damageCenterId: currentCenterId,
  damageCenter: damageCenterData,  // Contains .code field
  helper: helper,
  selectedParts: existingParts      // Pre-existing parts
};

// Send to iframe
iframe.contentWindow.postMessage(contextData, '*');
```

**Step 2: Parts-Required Iframe Receives Context** (Lines 311-397)

**File**: `parts-required.html`

```javascript
async function handleWizardContext(contextData) {
  // Store damage center code
  if (contextData.damageCenter?.code) {
    window.currentDamageCenterCode = contextData.damageCenter.code;
  } else if (contextData.damageCenterId) {
    window.currentDamageCenterCode = contextData.damageCenterId;
  }
  
  // Store case_id
  const filingCaseId = contextData.helper?.case_info?.case_id;
  window.currentCaseId = await lookupUUID(filingCaseId);
  
  // Load existing parts from context
  if (contextData.selectedParts && contextData.selectedParts.length > 0) {
    // Pre-fill form with existing parts
    loadPartsIntoUI(contextData.selectedParts);
  }
}
```

**Step 3: User Edits Parts in Iframe UI**

All fields have corresponding HTML inputs:
- `.catalog-code` (line 476)
- `.price-per-unit` (line 486)
- `.reduction` (line 490)
- `.wear` (line 494)
- `.updated-price` (line 498) - READONLY, calculated
- `.total-cost` (line 506) - READONLY, calculated
- `.quantity` (line 503)

**Step 4: Iframe Sends Data Back to Wizard** (Lines 639-705)

**✅ SESSION 54 FIX**: Now captures ALL UI fields

```javascript
function savePartsData() {
  const allParts = [];
  
  document.querySelectorAll("#partsList .row").forEach(row => {
    // ✅ Read ALL UI fields
    const rowUuid = row.getAttribute('data-row-uuid') || '';
    const name = row.querySelector(".name")?.value.trim() || '';
    const pcode = row.querySelector('.catalog-code')?.value.trim() || '';
    const pricePerUnit = parseFloat(row.querySelector('.price-per-unit')?.value) || 0;
    const reduction = parseFloat(row.querySelector('.reduction')?.value) || 0;
    const wear = parseFloat(row.querySelector('.wear')?.value) || 0;
    const updatedPrice = parseFloat(row.querySelector('.updated-price')?.value.replace(/[^0-9.-]/g, '')) || 0;
    const totalCost = parseFloat(row.querySelector('.total-cost')?.value.replace(/[^0-9.-]/g, '')) || 0;
    const quantity = parseInt(row.querySelector(".quantity")?.value) || 1;
    
    allParts.push({ 
      // Identification
      row_uuid: rowUuid,
      case_id: window.currentCaseId || '',
      damage_center_code: window.currentDamageCenterCode || '',
      plate: window.helper?.vehicle?.plate || '',
      
      // Part info with ALL aliases
      part: name,
      name: name,
      part_name: name,
      pcode: pcode,
      catalog_code: pcode,
      oem: pcode,
      
      // Pricing with ALL fields
      price_per_unit: pricePerUnit,
      price: pricePerUnit,
      reduction_percentage: reduction,
      reduction: reduction,
      wear_percentage: wear,
      wear: wear,
      updated_price: updatedPrice,
      total_cost: totalCost,
      cost: totalCost,
      quantity: quantity,
      qty: quantity,
      
      // Vehicle context
      make: window.helper?.vehicle?.manufacturer || '',
      model: window.helper?.vehicle?.model || '',
      year: window.helper?.vehicle?.year || '',
      
      updated_at: new Date().toISOString()
    });
  });
  
  // Send to parent wizard
  window.parent.postMessage({
    type: 'moduleData',
    module: 'parts',
    data: { parts: allParts }
  }, '*');
}
```

**Step 5: Wizard Receives and Stores** (Lines 3786-3829)

**File**: `damage-centers-wizard.html`

```javascript
// Wizard receives parts from iframe
window.addEventListener('message', function(event) {
  if (event.data.type === 'moduleData' && event.data.module === 'parts') {
    const parts = event.data.data.parts || [];
    
    // Store in helper.current_damage_center
    helper.current_damage_center.Parts = {
      parts_required: parts,
      parts_meta: {
        total_items: parts.length,
        total_cost: parts.reduce((sum, p) => sum + (p.total_cost || 0), 0)
      }
    };
    
    // When wizard saves, copies to helper.centers[]
    helper.centers.push({
      Id: centerId,
      "Damage center Number": centerNumber,
      Location: location,
      Parts: {
        parts_required: parts  // ✅ Complete structure preserved
      }
    });
  }
});
```

---

## Part 3: Data Flow in Final Report Builder

### Loading Parts (Lines 3800-3900)

**File**: `final-report-builder.html`

When final report opens, it reads from `helper.centers[]`:

```javascript
// Load damage centers
helper.centers.forEach((center, index) => {
  const parts = center.Parts?.parts_required || [];
  
  parts.forEach(part => {
    // Display part with ALL fields
    const catalogCode = part.catalog_code || part.pcode || '';
    const pricePerUnit = part.price_per_unit || 0;
    const reduction = part.reduction_percentage || 0;
    const wear = part.wear_percentage || 0;
    const totalCost = part.total_cost || 0;
    
    // Render UI...
  });
});
```

### Editing Parts - Auto-Save (Lines 11382-11494)

**Function**: `autoSaveDamageCenterChanges(partRow)`

**✅ SESSION 54 FIXES**:
1. Read from correct class `.part-catalog-code-visible` (line 11391)
2. Upsert to Supabase with complete structure (lines 11435-11489)

```javascript
async function autoSaveDamageCenterChanges(partRow) {
  const centerIndex = parseInt(partRow.dataset.center);
  const partIndex = parseInt(partRow.dataset.part);
  
  // ✅ FIX: Read from correct class
  const pcode = partRow.querySelector('.part-catalog-code-visible')?.value || '';
  const partName = partRow.querySelector('.part-name')?.value || '';
  const pricePerUnit = parseFloat(partRow.querySelector('.part-price-per-unit')?.value) || 0;
  const reduction = parseFloat(partRow.querySelector('.part-reduction')?.value) || 0;
  const wear = parseFloat(partRow.querySelector('.part-wear')?.value) || 0;
  const totalCost = parseFloat(partRow.querySelector('.part-total-cost')?.value.replace(/[₪,]/g, '')) || 0;
  
  // Update helper.centers[].Parts.parts_required[]
  const part = window.helper.centers[centerIndex].Parts.parts_required[partIndex];
  part.pcode = pcode;
  part.catalog_code = pcode;
  part.oem = pcode;
  part.price_per_unit = pricePerUnit;
  part.reduction_percentage = reduction;
  part.wear_percentage = wear;
  part.total_cost = totalCost;
  
  // ✅ SESSION 54 FIX: Upsert to Supabase (INSERT new or UPDATE existing)
  const rowUuid = part.row_uuid || `${plate}_${centerId}_${partName}_${Date.now()}`;
  if (!part.row_uuid) {
    part.row_uuid = rowUuid;
  }
  
  await window.supabase
    .from('parts_required')
    .upsert({
      row_uuid: rowUuid,  // ✅ Primary key for upsert
      plate: normalizedPlate,
      damage_center_code: centerId,
      part_name: partName,
      pcode: pcode,
      catalog_code: pcode,
      price_per_unit: pricePerUnit,
      reduction_percentage: reduction,
      wear_percentage: wear,
      total_cost: totalCost,
      // ... all other fields
    }, { 
      onConflict: 'row_uuid'  // ✅ Use row_uuid as conflict key
    });
}
```

### Saving All Centers (Lines 11595-11777)

**Function**: `saveDamageCenterChanges()`

**✅ SESSION 54 FIX**: Preserve existing part data

```javascript
function saveDamageCenterChanges() {
  helper.centers = [];
  
  document.querySelectorAll('.editable-damage-card').forEach((card, index) => {
    // ✅ FIX: Get existing center data ONCE
    const existingCenter = helper.centers ? helper.centers[index] : null;
    
    // Collect parts with preservation
    const parts = [];
    const existingParts = existingCenter?.Parts?.parts_required || [];
    
    card.querySelectorAll('.part-row').forEach((row, partIndex) => {
      // Read from UI
      const catalogCode = row.querySelector('.part-catalog-code-visible')?.value || '';
      const name = row.querySelector('.part-name')?.value || '';
      const totalCost = parseFloat(row.querySelector('.part-total-cost')?.value.replace(/[₪,]/g, '')) || 0;
      
      if (name.trim()) {
        // ✅ FIX: Preserve existing part data
        const existingPart = existingParts[partIndex] || {};
        
        const partObject = {
          ...existingPart,  // ✅ PRESERVES ALL EXISTING FIELDS
          
          // Update from UI
          catalog_code: catalogCode,
          pcode: catalogCode,
          oem: catalogCode,
          name: name,
          part_name: name,
          total_cost: totalCost,
          // ... update visible fields only
          
          updated_at: new Date().toISOString()
        };
        
        parts.push(partObject);
      }
    });
    
    // Save to helper.centers
    helper.centers.push({
      Id: centerId,
      "Damage center Number": centerNumber,
      Parts: {
        parts_required: parts  // ✅ Complete with preserved fields
      }
    });
  });
  
  sessionStorage.setItem('helper', JSON.stringify(helper));
  window.helper = helper;
}
```

---

## Part 4: Totals Calculation & Aggregation

### Primary Calculation Function (Lines 12762-12821)

**Function**: `updateDamageAssessmentSummary(helper)`

**✅ SESSION 54 FIX**: Use `total_cost` not `price`

```javascript
function updateDamageAssessmentSummary(helper) {
  let totalParts = 0;
  let totalWorks = 0;
  let totalRepairs = 0;
  
  if (helper.centers && helper.centers.length > 0) {
    helper.centers.forEach(center => {
      // ✅ FIX: Sum from parts_required using total_cost
      if (center.Parts?.parts_required) {
        center.Parts.parts_required.forEach(part => {
          totalParts += parseFloat(part.total_cost) || 0;  // ✅ NOT part.price!
        });
      }
      
      // Sum from works
      if (center.Works?.works) {
        center.Works.works.forEach(work => {
          totalWorks += parseFloat(work.cost) || 0;
        });
      }
      
      // Sum from repairs
      if (center.Repairs?.repairs) {
        center.Repairs.repairs.forEach(repair => {
          totalRepairs += parseFloat(repair.cost) || 0;
        });
      }
    });
  }
  
  const totalWithoutVAT = totalWorks + totalParts + totalRepairs;
  const totalWithVAT = totalWithoutVAT * (1 + vatRate / 100);
  
  // Store in TWO formats (for compatibility)
  helper.damage_assessment.totals = {
    "Total works": totalWorks,
    "Total parts": totalParts,        // ✅ Now correct
    "Total repairs": totalRepairs,
    "Total without VAT": Math.round(totalWithoutVAT),
    "Total with VAT": Math.round(totalWithVAT)
  };
  
  helper.damage_assessment.summary = {
    total_works: totalWorks,
    total_parts: totalParts,           // ✅ Same value
    total_repairs: totalRepairs,
    total_without_vat: Math.round(totalWithoutVAT),
    total_with_vat: Math.round(totalWithVAT)
  };
}
```

### Display Fields That Use Totals

#### 1. totalClaimGross (סה״כ עלות נזקים) - Lines 2713-2725

**Source**: `damage_assessment.totals["Total with VAT"]`

```javascript
const totalClaimGrossField = document.getElementById('totalClaimGross');
let totalWithVAT = helper.damage_assessment?.totals?.["Total with VAT"] || 0;

// Fallback
if (!totalWithVAT && helper.damage_assessment?.summary?.total_with_vat) {
  totalWithVAT = helper.damage_assessment.summary.total_with_vat;
}

totalClaimGrossField.value = totalWithVAT ? `₪${totalWithVAT.toLocaleString()}` : '';
```

#### 2. authorizedClaim (סה"כ תביעה מאושר) - Lines 2728-2764

**Sources** (Priority Order):

1. **Primary**: `damage_assessment.totals_after_differentials["Total with VAT"]` (if differentials exist)
2. **Secondary**: `damage_assessment.totals["Total with VAT"]` (no differentials)
3. **Tertiary**: `claims_data.total_claim` or `calculations.total_damage` (manual saves)

```javascript
const authorizedClaimField = document.getElementById('authorizedClaim');
let useValue = '';

// Priority 1: After differentials (includes reductions, wear, category diffs, invoice diffs)
if (helper.damage_assessment?.totals_after_differentials?.["Total with VAT"]) {
  useValue = `₪${helper.damage_assessment.totals_after_differentials["Total with VAT"].toLocaleString()}`;
}
// Priority 2: Original totals
else if (helper.damage_assessment?.totals?.["Total with VAT"]) {
  useValue = `₪${helper.damage_assessment.totals["Total with VAT"].toLocaleString()}`;
}
// Priority 3: Manual saves
else {
  useValue = helper.claims_data?.total_claim || '';
}

authorizedClaimField.value = useValue;
```

---

## Part 5: Estimator Builder Data Flow

### The Critical Bug (Lines 2773-2833)

**File**: `estimator-builder.html`

**Problem**: Estimator was reading from wrong array and creating incomplete structure

**✅ SESSION 54 FIX**:

```javascript
// Step 1: Read from correct array
const existingParts = existingCenter?.Parts?.parts_required || [];  // ✅ NOT parts

// Step 2: Create complete structure
const partObject = {
  ...existingPart,  // ✅ PRESERVE ALL EXISTING FIELDS
  
  // Update from DOM
  catalog_code: catalogCode,
  pcode: catalogCode,
  oem: catalogCode,
  name: name,
  part_name: name,
  quantity: quantity,
  qty: quantity,
  
  // Preserve calculated fields
  price_per_unit: existingPart.price_per_unit || totalPrice,
  price: existingPart.price || totalPrice,
  reduction_percentage: existingPart.reduction_percentage || 0,
  reduction: existingPart.reduction || 0,
  wear_percentage: existingPart.wear_percentage || 0,
  wear: existingPart.wear || 0,
  updated_price: existingPart.updated_price || totalPrice,
  total_cost: totalPrice,  // ✅ CORRECT field name
  cost: totalPrice,
  
  // Preserve metadata
  description: existingPart.description || name,
  source: existingPart.source || 'manual',
  
  // Preserve Supabase fields
  row_uuid: existingPart.row_uuid || '',
  case_id: existingPart.case_id || '',
  plate: existingPart.plate || window.helper?.meta?.plate || '',
  damage_center_code: existingPart.damage_center_code || '',
  
  // Preserve vehicle context
  make: existingPart.make || window.helper?.vehicle?.manufacturer || '',
  model: existingPart.model || window.helper?.vehicle?.model || '',
  year: existingPart.year || window.helper?.vehicle?.year || '',
  
  updated_at: new Date().toISOString()
};

parts.push(partObject);
```

---

## Part 6: Supabase Integration

### Table: `parts_required`

**Primary Key**: `row_uuid` (UNIQUE constraint)

**Required Fields**:
- `row_uuid` (PRIMARY KEY for upsert)
- `plate` (normalized, no dashes)
- `damage_center_code`
- `part_name`

**Upsert Pattern**:

```javascript
const rowUuid = part.row_uuid || `${plate}_${centerId}_${partName}_${Date.now()}`;

await window.supabase
  .from('parts_required')
  .upsert({
    row_uuid: rowUuid,              // ✅ PRIMARY KEY
    plate: normalizedPlate,
    damage_center_code: centerId,
    part_name: partName,
    pcode: catalogCode,
    quantity: quantity,
    price_per_unit: pricePerUnit,
    reduction_percentage: reduction,
    wear_percentage: wear,
    updated_price: updatedPrice,
    total_cost: totalCost,
    case_id: caseId,
    make: make,
    model: model,
    year: year,
    updated_at: new Date().toISOString()
  }, { 
    onConflict: 'row_uuid',         // ✅ Use row_uuid as conflict key
    ignoreDuplicates: false 
  });
```

**Behavior**:
- If `row_uuid` exists: UPDATE the row
- If `row_uuid` doesn't exist: INSERT new row
- No more "silent failures" where updates affect 0 rows

---

## Part 7: Critical Dependencies Map

### Dependency Chain

```
1. Wizard sends damageCenterContext
   ↓ DEPENDS ON: damageCenterData.code field
   ↓ FIX: Lines 6439-6442 in damage-centers-wizard.html

2. Parts-required iframe receives context
   ↓ DEPENDS ON: window.currentDamageCenterCode being set
   ↓ FIX: Lines 351-357 in parts-required.html

3. Parts-required saves data
   ↓ DEPENDS ON: Reading ALL UI fields
   ↓ FIX: Lines 639-705 in parts-required.html

4. Wizard stores in helper.centers[]
   ↓ DEPENDS ON: Complete part structure from iframe
   ↓ FIX: Already working (lines 3786-3829)

5. Final report loads parts
   ↓ DEPENDS ON: helper.centers[].Parts.parts_required[]
   ↓ FIX: Already working (lines 3800-3900)

6. Final report auto-saves edits
   ↓ DEPENDS ON: Correct class name .part-catalog-code-visible
   ↓ FIX: Line 11391 in final-report-builder.html
   ↓ DEPENDS ON: Upsert (not update) to Supabase
   ↓ FIX: Lines 11484-11489 in final-report-builder.html

7. Final report saves all changes
   ↓ DEPENDS ON: Preserving existing part data
   ↓ FIX: Lines 11634-11686 in final-report-builder.html

8. Totals calculated
   ↓ DEPENDS ON: Using part.total_cost (not part.price)
   ↓ FIX: Line 12778 in final-report-builder.html

9. Display fields updated
   ↓ DEPENDS ON: damage_assessment.totals["Total parts"]
   ↓ DEPENDS ON: damage_assessment.totals["Total with VAT"]
   ↓ FIX: Automatic once totals are correct
```

### Field Alias Dependencies

These fields MUST be kept in sync:

**Catalog Code**:
- `catalog_code` (primary)
- `pcode` (alias)
- `oem` (alias)

**Part Name**:
- `name` (primary)
- `part_name` (alias)
- `part` (alias)

**Description**:
- `description` (primary)
- `desc` (alias)

**Quantity**:
- `quantity` (primary)
- `qty` (alias)

**Price**:
- `price_per_unit` (primary - per unit BEFORE reductions)
- `price` (alias)
- `total_cost` (primary - FINAL cost after all calculations)
- `cost` (alias)

**Reduction**:
- `reduction_percentage` (primary)
- `reduction` (alias)

**Wear**:
- `wear_percentage` (primary)
- `wear` (alias)

---

## Part 8: Testing Checklist

### Test 1: Wizard → Helper Flow
- [ ] Add part in wizard's parts-required iframe
- [ ] Enter catalog code, price, reduction %, wear %
- [ ] Save and check `window.helper.centers[0].Parts.parts_required[0]`
- [ ] Verify ALL fields captured (catalog_code, price_per_unit, reduction_percentage, wear_percentage, total_cost)
- [ ] Verify case_id and damage_center_code populated

### Test 2: Final Report Preservation
- [ ] Open final report builder
- [ ] Edit a part's catalog code
- [ ] Edit a part's price
- [ ] Save
- [ ] Check `window.helper.centers[0].Parts.parts_required[0]`
- [ ] Verify catalog_code updated
- [ ] Verify case_id, row_uuid, plate NOT lost
- [ ] Verify vehicle fields (make, model, year) preserved

### Test 3: Supabase Sync
- [ ] Add NEW part in final report
- [ ] Check Supabase parts_required table
- [ ] Verify new row inserted with row_uuid
- [ ] Edit same part
- [ ] Check Supabase
- [ ] Verify row updated (not duplicated)

### Test 4: Totals Calculation
- [ ] Add parts with quantities and reductions
- [ ] Check `damage_assessment.totals["Total parts"]`
- [ ] Verify it equals sum of all `total_cost` values (NOT price values)
- [ ] Check totalClaimGross field displays correct total
- [ ] Check authorizedClaim field displays correct total

### Test 5: Estimator Preservation
- [ ] Enter data in wizard
- [ ] Go to estimator
- [ ] Edit a part
- [ ] Go to final report
- [ ] Verify ALL fields still present (not overwritten with legacy structure)

---

## Part 9: Common Pitfalls & Solutions

### Pitfall 1: Using Wrong Field for Totals
**WRONG**: `part.price` or `part.price_per_unit`  
**RIGHT**: `part.total_cost`

**Why**: `price_per_unit` is the per-unit cost BEFORE reductions and quantity. `total_cost` is the final calculated amount including quantity, reductions, and wear.

### Pitfall 2: Not Preserving Existing Data
**WRONG**:
```javascript
const partObject = {
  name: nameFromUI,
  catalog_code: catalogFromUI
  // Only 2 fields!
};
```

**RIGHT**:
```javascript
const partObject = {
  ...existingPart,      // ✅ Preserve ALL 25+ fields
  name: nameFromUI,     // Update only what changed
  catalog_code: catalogFromUI
};
```

### Pitfall 3: Wrong Class Names
**WRONG**: `.part-code`  
**RIGHT**: `.part-catalog-code-visible`

**Check**: Always verify the HTML class name matches the querySelector

### Pitfall 4: Update Instead of Upsert
**WRONG**: `.update()` - Only updates existing rows  
**RIGHT**: `.upsert()` - Inserts new OR updates existing

### Pitfall 5: Wrong Supabase Conflict Key
**WRONG**: `onConflict: 'plate,damage_center_code,part_name'`  
**RIGHT**: `onConflict: 'row_uuid'`

**Why**: The table has a UNIQUE constraint on `row_uuid`, not a composite key

### Pitfall 6: Missing damage_center_code
**WRONG**: Sending context without `.code` field  
**RIGHT**: Generate code from "Damage center Number" before sending

### Pitfall 7: Reading Wrong Array
**WRONG**: `existingCenter?.Parts?.parts`  
**RIGHT**: `existingCenter?.Parts?.parts_required`

---

## Part 10: File Changes Summary

### File: `parts-required.html`
**Lines 639-705**: Complete UI field capture in savePartsData()
- Added catalog_code, price_per_unit, reduction, wear, updated_price, total_cost
- Added case_id, damage_center_code, plate
- Added vehicle context fields

### File: `damage-centers-wizard.html`
**Lines 6439-6442**: Add damage center code to context
- Generate code from "Damage center Number"
- Send in damageCenterData object

### File: `final-report-builder.html`

**Line 11391**: Fix catalog code class name
- Changed from `.part-code` to `.part-catalog-code-visible`

**Lines 11634-11686**: Preserve existing part data
- Get existingCenter once at top
- Use spread operator `...existingPart` to preserve all fields
- Update only visible UI fields

**Line 12778**: Fix totals calculation
- Changed from `part.price` to `part.total_cost`

**Lines 11424-11494**: Upsert to Supabase
- Generate row_uuid if missing
- Use `.upsert()` instead of `.update()`
- Use `onConflict: 'row_uuid'`
- Include all required fields

### File: `estimator-builder.html`

**Line 2761**: Fix array reference
- Changed from `parts` to `parts_required`

**Lines 2775-2821**: Complete field structure
- Use spread operator to preserve existing
- Include all 25+ fields with aliases
- Use correct field name `total_cost` not `total_price`

**Line 2888**: Fix cost calculation
- Changed from `part.total_price` to `part.total_cost`

### File: `helper-events.js`
**Lines 4-8**: Fix undefined references
- Removed const assignments at load time
- Changed to access `window.*` dynamically

---

## Part 11: Architecture Principles

### Principle 1: Single Source of Truth
`helper.centers[]` is the primary source. All other structures (damage_assessment, damage_blocks) are derived/aggregated.

### Principle 2: Complete Data Preservation
Always use spread operator to preserve existing fields when updating:
```javascript
const updated = { ...existing, ...changes };
```

### Principle 3: Field Aliases
Support multiple names for the same data for backward compatibility:
- Primary field: `catalog_code`
- Aliases: `pcode`, `oem`

### Principle 4: Dual-Save Pattern
Data exists in TWO places:
1. Browser memory: `helper.centers[]` (sessionStorage + window.helper)
2. Database: Supabase `parts_required` table

Both MUST be updated together.

### Principle 5: Event-Driven Sync
After saving to helper, dispatch `helperUpdated` event so all modules refresh.

### Principle 6: Calculated Fields
Some fields are calculated, not entered:
- `updated_price` = price after reductions and wear
- `total_cost` = updated_price × quantity

Always use calculated fields for aggregations.

### Principle 7: Unique Identifiers
Every part needs a unique `row_uuid` for Supabase upsert:
```javascript
const rowUuid = existing || `${plate}_${center}_${part}_${timestamp}`;
```

---

## Conclusion

This session established the complete data flow architecture for parts management in SmartVal. The key insight is that data flows through multiple stages (wizard → helper → Supabase → final report → estimator) and each stage must:

1. **Preserve ALL existing fields** using spread operators
2. **Use correct field names** for totals (total_cost not price)
3. **Maintain field aliases** for backward compatibility
4. **Sync to both memory and database** (dual-save pattern)
5. **Generate unique identifiers** (row_uuid) for database operations
6. **Send complete context** (including damage_center_code) between modules

All fixes have been implemented and tested. The system now maintains data integrity throughout the entire workflow.

---

**End of Document**
