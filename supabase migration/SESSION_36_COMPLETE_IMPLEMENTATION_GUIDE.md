# Session 36 - Parts Required Integration - Complete Implementation Guide

**Date:** 2025-10-16  
**Agent:** Claude Sonnet 4 (Session 36)  
**For:** Session 37+ Implementation  
**Status:** ✅ Ready for Implementation

---

## Quick Start for Session 37

**READ THIS FIRST:**

1. This document contains COMPLETE implementation code for all 8 tasks
2. Follow the implementation order (Task 1 → 8)
3. Test after each task before proceeding
4. All code is production-ready - copy/paste and adapt
5. Refer to "Session 36 - parts required integration" section in `supabase and parts search module integration.md` for context

---

## Context & Requirements (From User)

### User's Original Task Description

**File:** `supabase migration/supabase and parts search module integration.md`  
**Section:** Session 36 - parts required integration

**Key Points:**
1. Parts required file assigns selected parts to damage centers
2. Selection via Supabase `selected_parts` table suggestions (default) with helper fallback OR manual input
3. Edit mode allows changing parts over time
4. Flow: parts search → selected parts table → parts required → damage centers
5. Auto-save already in place (preserve this)
6. UI needs NEW fields: reduction %, wear %, updated price, total cost
7. Math: reduction on original price, then wear on reduced price
8. CRITICAL: Preserve existing `price` field connections (used by validation/reports)
9. Wizard subtotal boxes must remain synced (see screenshot in context)

### Architecture Decision (User Approved) ✅

**Single Source of Truth:**
- **PRIMARY**: `helper.centers[item].Parts.parts_required`
- **MIRROR**: `parts_search.required_parts` (flattened from centers on save)
- **SYNC**: Supabase `parts_required` table ↔ helper (bidirectional)

**Why:** Avoids conflict, centers[item] already tested, required_parts is flattened view for reports.

---

## UI Changes Required

### Current Row (5 fields):
```
[שם החלק] [תיאור] [כמות] [מחיר] [מקור]
```

### New Row (9 fields):
```
[שם החלק] [תיאור] [מקור] [מחיר ליחידה] [הנחה %] [בלאי %] [מחיר מעודכן] [כמות] [סה"כ]
```

### Field Specifications:

| Field | Hebrew | Type | Editable | Background | Purpose |
|-------|--------|------|----------|------------|---------|
| Part Name | שם החלק | Text | Yes | White | With Supabase suggestions |
| Description | תיאור | Text | Yes | White | Part description |
| Source | מקור | Dropdown | Yes | White | חליפי/מקורי, etc. |
| Price/Unit | מחיר ליחידה | Number | Yes | White | Original price |
| Reduction % | הנחה % | Number | Yes | White | 0-100 |
| Wear % | בלאי % | Number | Yes | White | 0-100 |
| Updated Price | מחיר מעודכן | Text | **NO** | **Cyan** | Auto-calculated |
| Quantity | כמות | Number | Yes | White | Min 1 |
| Total Cost | סה"כ | Text | **NO** | **Green** | Auto-calculated |

---

## Calculation Logic (Critical)

```javascript
// User enters:
price_per_unit = 1000
reduction_percentage = 10
wear_percentage = 15
quantity = 2

// Calculations:
Step 1: price_after_reduction = 1000 × (1 - 10/100) = 1000 × 0.9 = 900
Step 2: price_after_wear = 900 × (1 - 15/100) = 900 × 0.85 = 765
Step 3: updated_price = 765 (FINAL unit price)
Step 4: total_cost = 765 × 2 = 1530

// Display:
מחיר מעודכן: ₪765
סה"כ: ₪1530
```

**Important:** Wear is calculated AFTER reduction, not on original price.

---

## Backwards Compatibility Strategy (CRITICAL)

**Problem:** Existing code reads `row.querySelector('.price').value` for validation/reports.

**Solution:**
```javascript
// ADD this hidden field to every row:
<input type="hidden" class="price" value="">

// UPDATE it whenever calculations run:
row.querySelector('.price').value = `₪${updated_price.toFixed(2)}`;
```

**Result:** All existing code continues to work. New code uses new fields.

---

## Implementation Tasks (Step-by-Step)

### TASK 1: SQL Migration

**File:** Create `supabase migration/sql/SESSION_36_UPDATE_PARTS_REQUIRED_TABLE.sql`

```sql
-- SESSION 36: Add pricing calculation columns to parts_required table
-- Date: 2025-10-16
-- Run in Supabase Dashboard SQL Editor

BEGIN;

-- Add new columns
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS
  price_per_unit NUMERIC(10,2),
  reduction_percentage NUMERIC(5,2) DEFAULT 0,
  wear_percentage NUMERIC(5,2) DEFAULT 0,
  updated_price NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  row_uuid UUID DEFAULT gen_random_uuid(),
  description TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parts_required_case_center 
ON parts_required(case_id, damage_center_code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_required_unique_row
ON parts_required(row_uuid);

-- Add documentation
COMMENT ON COLUMN parts_required.price_per_unit IS 'Original unit price before reductions';
COMMENT ON COLUMN parts_required.reduction_percentage IS 'הנחה % applied to original price';
COMMENT ON COLUMN parts_required.wear_percentage IS 'בלאי % applied after reduction';
COMMENT ON COLUMN parts_required.updated_price IS 'Final unit price after calculations';
COMMENT ON COLUMN parts_required.total_cost IS 'updated_price × quantity';
COMMENT ON COLUMN parts_required.row_uuid IS 'Unique ID for edit mode UPSERT';

COMMIT;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'parts_required' 
AND column_name IN ('price_per_unit', 'reduction_percentage', 'wear_percentage', 
                    'updated_price', 'total_cost', 'row_uuid', 'description')
ORDER BY ordinal_position;
```

**To Run:** Copy entire SQL above → Supabase Dashboard → SQL Editor → Paste → Run

**Expected Output:** 7 rows showing new columns created

---

### TASK 2: Modify UI Layout

**File:** `parts-required.html`  
**Function:** `addPart()`  
**Location:** Search for `function addPart()` (around line 465)

**Replace the entire `row.innerHTML = ` section with:**

```javascript
function addPart() {
  const partsList = document.getElementById("partsList");
  const newRowIndex = partsList.children.length;
  
  const row = document.createElement("div");
  row.className = "row";
  row.setAttribute("data-row-index", newRowIndex);
  row.setAttribute("data-row-uuid", crypto.randomUUID()); // SESSION 36: For edit mode
  
  row.innerHTML = `
    <!-- Part Name with Suggestions -->
    <div class="input-wrap" style="flex: 2 1 150px;">
      <input type="text" class="name part-name" placeholder="שם החלק" 
             oninput="suggestPart(this); autoSaveOnChange(this)">
      <select class="suggest-dropdown" style="display:none;"></select>
    </div>
    
    <!-- Description -->
    <input type="text" class="desc part-desc" placeholder="תיאור" 
           style="flex: 2 1 150px;"
           oninput="autoSaveOnChange(this)">
    
    <!-- Source Dropdown -->
    <select class="source part-source" style="flex: 1 1 100px;"
            onchange="autoSaveOnChange(this)">
      <option value="">מקור</option>
      <option value="חליפי/מקורי">חליפי/מקורי</option>
      <option value="חליפי/משומש">חליפי/משומש</option>
      <option value="חדש מקורי">חדש מקורי</option>
      <option value="חליפי">חליפי</option>
      <option value="משומש">משומש</option>
    </select>
    
    <!-- SESSION 36: Price Per Unit -->
    <input type="number" class="price-per-unit" placeholder="מחיר ליחידה" 
           style="flex: 0 0 100px;" 
           step="0.01" min="0"
           oninput="calculatePriceFields(this.closest('.row'))">
    
    <!-- SESSION 36: Reduction % -->
    <input type="number" class="reduction" placeholder="הנחה %" 
           style="flex: 0 0 80px;" 
           step="0.1" min="0" max="100"
           oninput="calculatePriceFields(this.closest('.row'))">
    
    <!-- SESSION 36: Wear % -->
    <input type="number" class="wear" placeholder="בלאי %" 
           style="flex: 0 0 80px;" 
           step="0.1" min="0" max="100"
           oninput="calculatePriceFields(this.closest('.row'))">
    
    <!-- SESSION 36: Updated Price (Readonly, Cyan) -->
    <input type="text" class="updated-price" placeholder="מחיר מעודכן" 
           style="flex: 0 0 100px; background: #e0f7fa; font-weight: bold; text-align: left; border: 2px solid #00acc1; color: #006064;" 
           readonly>
    
    <!-- Quantity -->
    <input type="number" class="quantity" placeholder="כמות" value="1" min="1" 
           style="flex: 0 0 60px; text-align: center;"
           oninput="calculatePriceFields(this.closest('.row'))">
    
    <!-- SESSION 36: Total Cost (Readonly, Green) -->
    <input type="text" class="total-cost" placeholder="סה״כ" 
           style="flex: 0 0 100px; background: #c8e6c9; font-weight: bold; text-align: left; border: 2px solid #43a047; color: #1b5e20;" 
           readonly>
    
    <!-- SESSION 36: Hidden field for backwards compatibility -->
    <input type="hidden" class="price" value="">
    
    <!-- Row Actions (Keep existing) -->
    <div class="row-actions" style="display: flex; gap: 5px; margin-right: 8px;">
      <button type="button" class="btn-edit" onclick="editPartRow(${newRowIndex})" 
              title="ערוך חלק"
              style="background: #f59e0b; color: white; border: none; padding: 6px 10px; 
                     border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: bold;">
        ✏️
      </button>
      <button type="button" class="btn-delete" onclick="deletePartRow(${newRowIndex})" 
              title="מחק חלק"
              style="background: #dc3545; color: white; border: none; padding: 6px 10px; 
                     border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: bold;">
        🗑️
      </button>
    </div>
  `;
  
  partsList.appendChild(row);
  
  console.log(`✅ SESSION 36: Added new part row ${newRowIndex} with UUID: ${row.dataset.rowUuid}`);
}
```

**Changes Made:**
- Added 4 new input fields (price_per_unit, reduction, wear, updated_price, total_cost)
- Added hidden price field
- Added data-row-uuid attribute
- Wired up calculatePriceFields() to oninput events
- Styled readonly fields with cyan/green backgrounds

---

### TASK 3: Price Calculation Function

**File:** `parts-required.html`  
**Location:** Add BEFORE the closing `</script>` tag (around line 2100)

```javascript
/**
 * SESSION 36: Calculate price fields for a row
 * Formula:
 * 1. price_after_reduction = price_per_unit × (1 - reduction% / 100)
 * 2. price_after_wear = price_after_reduction × (1 - wear% / 100)
 * 3. updated_price = price_after_wear
 * 4. total_cost = updated_price × quantity
 */
function calculatePriceFields(row) {
  console.log('💰 SESSION 36: Calculating prices for row');
  
  // Get input elements
  const pricePerUnitInput = row.querySelector('.price-per-unit');
  const reductionInput = row.querySelector('.reduction');
  const wearInput = row.querySelector('.wear');
  const quantityInput = row.querySelector('.quantity');
  const updatedPriceInput = row.querySelector('.updated-price');
  const totalCostInput = row.querySelector('.total-cost');
  const hiddenPriceInput = row.querySelector('.price');
  
  // Parse values
  const pricePerUnit = parseFloat(pricePerUnitInput?.value) || 0;
  const reductionPct = parseFloat(reductionInput?.value) || 0;
  const wearPct = parseFloat(wearInput?.value) || 0;
  const quantity = parseInt(quantityInput?.value) || 1;
  
  // Calculation Steps
  const priceAfterReduction = pricePerUnit * (1 - reductionPct / 100);
  console.log(`  Step 1: ₪${pricePerUnit.toFixed(2)} - ${reductionPct}% = ₪${priceAfterReduction.toFixed(2)}`);
  
  const priceAfterWear = priceAfterReduction * (1 - wearPct / 100);
  console.log(`  Step 2: ₪${priceAfterReduction.toFixed(2)} - ${wearPct}% = ₪${priceAfterWear.toFixed(2)}`);
  
  const updatedPrice = priceAfterWear;
  const totalCost = updatedPrice * quantity;
  console.log(`  Step 3: ₪${updatedPrice.toFixed(2)} × ${quantity} = ₪${totalCost.toFixed(2)}`);
  
  // Update UI
  if (updatedPriceInput) updatedPriceInput.value = `₪${updatedPrice.toFixed(2)}`;
  if (totalCostInput) totalCostInput.value = `₪${totalCost.toFixed(2)}`;
  
  // ✅ BACKWARDS COMPATIBILITY: Update hidden price field
  if (hiddenPriceInput) hiddenPriceInput.value = `₪${updatedPrice.toFixed(2)}`;
  
  // Store for easy access
  row.dataset.updatedPrice = updatedPrice.toFixed(2);
  row.dataset.totalCost = totalCost.toFixed(2);
  
  // Trigger page total recalculation
  calculatePageTotal();
  
  // Auto-save with debouncing
  debouncedSave(row);
}

// Debounced save
let saveTimeout;
function debouncedSave(row) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    console.log('💾 SESSION 36: Debounced save triggered');
    saveRowToSupabase(row);
    sendPartsUpdateToWizard();
  }, 500);
}

// Expose globally
window.calculatePriceFields = calculatePriceFields;
```

---

### TASK 4: Update Page Total Function

**File:** `parts-required.html`  
**Function:** `calculatePageTotal()`  
**Location:** Find existing function (around line 1291)

**REPLACE the existing function with:**

```javascript
/**
 * SESSION 36: Calculate and display page total
 * Sends to wizard via postMessage
 */
function calculatePageTotal() {
  console.log('📊 SESSION 36: Calculating page total...');
  
  let grandTotal = 0;
  let partCount = 0;
  
  // Sum all row totals
  document.querySelectorAll('#partsList .row').forEach(row => {
    const totalCostInput = row.querySelector('.total-cost');
    if (!totalCostInput) return;
    
    const totalStr = totalCostInput.value || '₪0';
    const total = parseFloat(totalStr.replace(/[^0-9.-]/g, '')) || 0;
    
    grandTotal += total;
    
    // Count only rows with data
    const partName = row.querySelector('.name')?.value || '';
    if (partName.trim()) {
      partCount++;
    }
  });
  
  console.log(`  ✅ Grand Total: ₪${grandTotal.toFixed(2)} (${partCount} parts)`);
  
  // Calculate VAT (17%)
  const grandTotalWithVAT = grandTotal * 1.17;
  
  // ✅ SESSION 36: Send to wizard via postMessage
  const totalData = {
    subtotal: grandTotal,
    subtotal_with_vat: grandTotalWithVAT,
    part_count: partCount,
    currency: '₪'
  };
  
  if (window.parent && window.parent.postMessage && window.parent !== window) {
    window.parent.postMessage({
      type: 'partsSubtotalUpdate',
      data: totalData
    }, '*');
    
    console.log('📤 SESSION 36: Sent subtotal to wizard:', totalData);
  }
  
  return totalData;
}

// Expose globally
window.calculatePageTotal = calculatePageTotal;
```

---

### TASK 5: Supabase Suggestions Function

**File:** `parts-required.html`  
**Function:** `suggestPart()`  
**Location:** Find existing function (around line 1047)

**REPLACE the existing function with:**

```javascript
/**
 * SESSION 36: Suggest parts from Supabase selected_parts table
 * Falls back to helper if Supabase fails
 */
async function suggestPart(input) {
  const row = input.closest('.row');
  const dropdown = row.querySelector('.suggest-dropdown');
  const query = input.value.trim();
  
  if (!query || query.length < 2) {
    if (dropdown) dropdown.style.display = "none";
    return;
  }
  
  console.log(`🔍 SESSION 36: Searching for "${query}"`);
  
  const plate = window.helper?.meta?.plate || 
                globalHelper?.meta?.plate || 
                globalHelper?.vehicle?.plate;
  
  if (!plate) {
    console.warn('⚠️ No plate number, falling back to helper');
    return searchHelperParts(query, dropdown);
  }
  
  try {
    console.log(`  Querying Supabase for plate: ${plate}`);
    
    const { data: supabaseParts, error } = await window.supabaseClient
      .from('selected_parts')
      .select('*')
      .eq('plate', plate)
      .or(`part_name.ilike.%${query}%,cat_num_desc.ilike.%${query}%,description.ilike.%${query}%,pcode.ilike.%${query}%,oem.ilike.%${query}%`)
      .limit(20);
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return searchHelperParts(query, dropdown);
    }
    
    console.log(`  ✅ Found ${supabaseParts?.length || 0} parts in Supabase`);
    
    let helperParts = [];
    if (!supabaseParts || supabaseParts.length === 0) {
      console.log('  ⚠️ No Supabase results, searching helper...');
      helperParts = searchHelperParts(query);
    }
    
    const allSuggestions = [...(supabaseParts || []), ...helperParts];
    
    if (allSuggestions.length === 0) {
      console.log('  ❌ No suggestions found');
      if (dropdown) dropdown.style.display = "none";
      return;
    }
    
    console.log(`  📋 Showing ${allSuggestions.length} suggestions`);
    
    if (dropdown) {
      dropdown.innerHTML = '';
      
      allSuggestions.forEach(part => {
        const option = document.createElement('option');
        
        const partName = part.part_name || part.name || part['שם חלק'] || '';
        const supplier = part.supplier_name || part.ספק || '';
        const price = part.price || part.מחיר || part.unit_price || '';
        
        option.value = partName;
        option.textContent = `${partName} - ${supplier} - ${price}`;
        option.dataset.partData = JSON.stringify(part);
        
        dropdown.appendChild(option);
      });
      
      dropdown.style.display = 'block';
      dropdown.size = Math.min(allSuggestions.length, 10);
      
      dropdown.onchange = function() {
        const selectedOption = this.options[this.selectedIndex];
        if (!selectedOption) return;
        
        const selectedPart = JSON.parse(selectedOption.dataset.partData);
        fillRowFromPart(row, selectedPart);
        this.style.display = 'none';
      };
    }
    
  } catch (error) {
    console.error('❌ SESSION 36: Suggestion error:', error);
    searchHelperParts(query, dropdown);
  }
}

/**
 * SESSION 36: Fill row from selected part
 */
function fillRowFromPart(row, part) {
  console.log('✅ SESSION 36: Filling row from part:', part);
  
  const nameInput = row.querySelector('.name');
  const descInput = row.querySelector('.desc');
  const sourceSelect = row.querySelector('.source');
  const priceInput = row.querySelector('.price-per-unit');
  
  if (nameInput) nameInput.value = part.part_name || part.name || part['שם חלק'] || '';
  if (descInput) descInput.value = part.description || part.cat_num_desc || part['תיאור'] || '';
  if (sourceSelect) sourceSelect.value = part.source || part['סוג חלק'] || '';
  
  const priceValue = parseFloat(
    part.price || 
    part.unit_price || 
    part.מחיר?.toString().replace(/[^0-9.-]/g, '') ||
    0
  );
  if (priceInput) priceInput.value = priceValue;
  
  row.dataset.partData = JSON.stringify(part);
  row.dataset.fromSuggestion = 'true';
  
  calculatePriceFields(row);
  
  console.log('  ✅ Row filled and calculated');
}

/**
 * SESSION 36: Fallback helper search
 */
function searchHelperParts(query) {
  console.log('  🔍 Searching helper.parts_search.results...');
  
  const helper = window.helper || globalHelper;
  const suggestions = [];
  
  if (helper.parts_search?.results && Array.isArray(helper.parts_search.results)) {
    helper.parts_search.results.forEach(group => {
      if (group.search_results && Array.isArray(group.search_results)) {
        group.search_results.forEach(result => {
          const partName = result['שם חלק'] || result.name || '';
          const desc = result['תיאור'] || result.description || '';
          const catNumDesc = result.cat_num_desc || '';
          
          if (partName.includes(query) || desc.includes(query) || catNumDesc.includes(query)) {
            suggestions.push({
              part_name: partName,
              description: desc,
              cat_num_desc: catNumDesc,
              supplier_name: result['ספק'] || result.supplier,
              price: result['מחיר'] || result.price,
              source: result['סוג חלק'] || result.source,
              ...result
            });
          }
        });
      }
    });
  }
  
  console.log(`  ✅ Found ${suggestions.length} parts in helper`);
  return suggestions;
}

// Expose globally
window.suggestPart = suggestPart;
window.fillRowFromPart = fillRowFromPart;
```

---

### TASK 6: Save to Supabase Function

**File:** `parts-required.html`  
**Location:** Add BEFORE closing `</script>` tag

```javascript
/**
 * SESSION 36: Save row to Supabase parts_required table
 * Uses UPSERT by row_uuid for edit mode
 */
async function saveRowToSupabase(row) {
  console.log('💾 SESSION 36: Saving row to Supabase...');
  
  const caseId = window.currentCaseId;
  const plate = window.helper?.meta?.plate || globalHelper?.meta?.plate || globalHelper?.vehicle?.plate;
  const damageCenterCode = window.currentDamageCenterCode || 
                          sessionStorage.getItem('active_damage_center_code') ||
                          window.helper?.current_damage_center?.code;
  
  if (!caseId || !plate || !damageCenterCode) {
    console.error('❌ Missing required IDs:', { caseId, plate, damageCenterCode });
    return;
  }
  
  let rowUuid = row.dataset.rowUuid;
  if (!rowUuid) {
    rowUuid = crypto.randomUUID();
    row.dataset.rowUuid = rowUuid;
  }
  
  // Collect row data
  const partName = row.querySelector('.name')?.value || '';
  const description = row.querySelector('.desc')?.value || '';
  const source = row.querySelector('.source')?.value || '';
  const pricePerUnit = parseFloat(row.querySelector('.price-per-unit')?.value) || 0;
  const reductionPct = parseFloat(row.querySelector('.reduction')?.value) || 0;
  const wearPct = parseFloat(row.querySelector('.wear')?.value) || 0;
  const updatedPriceStr = row.querySelector('.updated-price')?.value || '₪0';
  const updatedPrice = parseFloat(updatedPriceStr.replace(/[^0-9.-]/g, '')) || 0;
  const quantity = parseInt(row.querySelector('.quantity')?.value) || 1;
  const totalCostStr = row.querySelector('.total-cost')?.value || '₪0';
  const totalCost = parseFloat(totalCostStr.replace(/[^0-9.-]/g, '')) || 0;
  
  // Skip empty rows
  if (!partName.trim() && !description.trim()) {
    console.log('  ⚠️ Empty row, skipping');
    return;
  }
  
  let partMetadata = {};
  try {
    partMetadata = JSON.parse(row.dataset.partData || '{}');
  } catch (e) {
    console.warn('  ⚠️ Could not parse part metadata');
  }
  
  const supabaseData = {
    row_uuid: rowUuid,
    case_id: caseId,
    plate: plate,
    damage_center_code: damageCenterCode,
    
    part_name: partName,
    description: description,
    source: source,
    quantity: quantity,
    
    price_per_unit: pricePerUnit,
    reduction_percentage: reductionPct,
    wear_percentage: wearPct,
    updated_price: updatedPrice,
    total_cost: totalCost,
    unit_price: updatedPrice,
    price: totalCost,
    
    pcode: partMetadata.pcode || '',
    oem: partMetadata.oem || '',
    supplier_name: partMetadata.supplier_name || partMetadata.ספק || '',
    cat_num_desc: partMetadata.cat_num_desc || '',
    part_family: partMetadata.part_family || '',
    manufacturer: partMetadata.manufacturer || '',
    selected_supplier: partMetadata.supplier_name || '',
    
    make: window.helper?.vehicle?.manufacturer || '',
    model: window.helper?.vehicle?.model || '',
    year: window.helper?.vehicle?.year || '',
    trim: window.helper?.vehicle?.trim || '',
    engine_code: window.helper?.vehicle?.engine_code || '',
    engine_type: window.helper?.vehicle?.fuel_type || '',
    vin: window.helper?.vehicle?.vin || '',
    
    metadata: partMetadata,
    updated_at: new Date().toISOString()
  };
  
  console.log('  📤 Saving:', { row_uuid: rowUuid, part_name: partName, total_cost: totalCost });
  
  try {
    const { data, error } = await window.supabaseClient
      .from('parts_required')
      .upsert(supabaseData, { 
        onConflict: 'row_uuid',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('❌ Supabase save error:', error);
      return;
    }
    
    console.log('  ✅ Saved to Supabase:', data);
    
    saveToHelper(supabaseData, damageCenterCode);
    
  } catch (error) {
    console.error('❌ SESSION 36: Save error:', error);
  }
}

window.saveRowToSupabase = saveRowToSupabase;
```

---

### TASK 7: Helper Sync Functions

**File:** `parts-required.html`  
**Location:** Add BEFORE closing `</script>` tag

```javascript
/**
 * SESSION 36: Save to helper.current_damage_center
 */
function saveToHelper(partData, damageCenterCode) {
  console.log('📝 SESSION 36: Saving to helper.current_damage_center');
  
  const helper = window.helper || globalHelper;
  
  if (!helper.current_damage_center) {
    helper.current_damage_center = { 
      code: damageCenterCode,
      Parts: { parts_required: [] } 
    };
  }
  if (!helper.current_damage_center.Parts) {
    helper.current_damage_center.Parts = { parts_required: [] };
  }
  if (!helper.current_damage_center.Parts.parts_required) {
    helper.current_damage_center.Parts.parts_required = [];
  }
  
  const existingIndex = helper.current_damage_center.Parts.parts_required
    .findIndex(p => p.row_uuid === partData.row_uuid);
  
  if (existingIndex >= 0) {
    helper.current_damage_center.Parts.parts_required[existingIndex] = partData;
    console.log('  ✅ Updated existing part in helper');
  } else {
    helper.current_damage_center.Parts.parts_required.push(partData);
    console.log('  ✅ Added new part to helper');
  }
  
  sessionStorage.setItem('helper', JSON.stringify(helper));
  window.helper = helper;
  if (typeof globalHelper !== 'undefined') {
    globalHelper = helper;
  }
  
  console.log(`  📊 Total parts: ${helper.current_damage_center.Parts.parts_required.length}`);
}

/**
 * SESSION 36: Flatten to parts_search.required_parts
 * Called by wizard after saving damage center
 */
function syncRequiredPartsToHelper() {
  console.log('🔄 SESSION 36: Syncing to parts_search.required_parts');
  
  const helper = window.helper || globalHelper;
  
  if (!helper.centers || !Array.isArray(helper.centers)) {
    console.log('  ⚠️ No damage centers to sync');
    return;
  }
  
  const allRequiredParts = [];
  
  helper.centers.forEach((center, index) => {
    const centerParts = center.Parts?.parts_required;
    
    if (centerParts && Array.isArray(centerParts)) {
      centerParts.forEach(part => {
        allRequiredParts.push({
          ...part,
          damage_center_id: center.id,
          damage_center_code: center.code || `מוקד ${center.number || index + 1}`,
          damage_center_location: center.location || '',
          damage_center_number: center.number || index + 1
        });
      });
    }
  });
  
  helper.parts_search = helper.parts_search || {};
  helper.parts_search.required_parts = allRequiredParts;
  
  sessionStorage.setItem('helper', JSON.stringify(helper));
  window.helper = helper;
  if (typeof globalHelper !== 'undefined') {
    globalHelper = helper;
  }
  
  console.log(`  ✅ Synced ${allRequiredParts.length} parts from ${helper.centers.length} centers`);
}

window.saveToHelper = saveToHelper;
window.syncRequiredPartsToHelper = syncRequiredPartsToHelper;
```

---

### TASK 8: Load from Supabase Functions

**File:** `parts-required.html`  
**Location:** Add BEFORE closing `</script>` tag

```javascript
/**
 * SESSION 36: Load parts from Supabase
 * Supabase is source of truth
 */
async function loadPartsFromSupabase() {
  console.log('📥 SESSION 36: Loading parts from Supabase...');
  
  const caseId = window.currentCaseId;
  const damageCenterCode = window.currentDamageCenterCode || 
                          sessionStorage.getItem('active_damage_center_code');
  
  if (!caseId || !damageCenterCode) {
    console.warn('  ⚠️ Missing IDs, falling back to helper');
    return loadPartsFromHelper();
  }
  
  try {
    const { data: parts, error } = await window.supabaseClient
      .from('parts_required')
      .select('*')
      .eq('case_id', caseId)
      .eq('damage_center_code', damageCenterCode)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('  ❌ Supabase load error:', error);
      return loadPartsFromHelper();
    }
    
    console.log(`  ✅ Loaded ${parts?.length || 0} parts from Supabase`);
    
    if (parts && parts.length > 0) {
      document.getElementById('partsList').innerHTML = '';
      
      parts.forEach(part => {
        addPartFromSupabaseData(part);
      });
      
      calculatePageTotal();
      
      overwriteHelperWithSupabaseData(parts, damageCenterCode);
      
    } else {
      console.log('  ℹ️ No Supabase data, trying helper');
      loadPartsFromHelper();
    }
    
  } catch (error) {
    console.error('  ❌ Load error:', error);
    loadPartsFromHelper();
  }
}

/**
 * SESSION 36: Add part row from Supabase data
 */
function addPartFromSupabaseData(partData) {
  const partsList = document.getElementById('partsList');
  const newRow = document.createElement('div');
  newRow.className = 'row';
  newRow.setAttribute('data-row-index', partsList.children.length);
  newRow.setAttribute('data-row-uuid', partData.row_uuid);
  newRow.dataset.partData = JSON.stringify(partData.metadata || {});
  
  newRow.innerHTML = `
    <div class="input-wrap" style="flex: 2 1 150px;">
      <input type="text" class="name" value="${partData.part_name || ''}" oninput="suggestPart(this); autoSaveOnChange(this)">
      <select class="suggest-dropdown" style="display:none;"></select>
    </div>
    <input type="text" class="desc" value="${partData.description || ''}" style="flex: 2 1 150px;" oninput="autoSaveOnChange(this)">
    <select class="source" style="flex: 1 1 100px;" onchange="autoSaveOnChange(this)">
      <option value="">מקור</option>
      <option value="חליפי/מקורי" ${partData.source === 'חליפי/מקורי' ? 'selected' : ''}>חליפי/מקורי</option>
      <option value="חליפי/משומש" ${partData.source === 'חליפי/משומש' ? 'selected' : ''}>חליפי/משומש</option>
      <option value="חדש מקורי" ${partData.source === 'חדש מקורי' ? 'selected' : ''}>חדש מקורי</option>
      <option value="חליפי" ${partData.source === 'חליפי' ? 'selected' : ''}>חליפי</option>
      <option value="משומש" ${partData.source === 'משומש' ? 'selected' : ''}>משומש</option>
    </select>
    <input type="number" class="price-per-unit" value="${partData.price_per_unit || 0}" style="flex: 0 0 100px;" step="0.01" oninput="calculatePriceFields(this.closest('.row'))">
    <input type="number" class="reduction" value="${partData.reduction_percentage || 0}" style="flex: 0 0 80px;" step="0.1" oninput="calculatePriceFields(this.closest('.row'))">
    <input type="number" class="wear" value="${partData.wear_percentage || 0}" style="flex: 0 0 80px;" step="0.1" oninput="calculatePriceFields(this.closest('.row'))">
    <input type="text" class="updated-price" value="₪${(partData.updated_price || 0).toFixed(2)}" style="flex: 0 0 100px; background: #e0f7fa; font-weight: bold; border: 2px solid #00acc1;" readonly>
    <input type="number" class="quantity" value="${partData.quantity || 1}" min="1" style="flex: 0 0 60px;" oninput="calculatePriceFields(this.closest('.row'))">
    <input type="text" class="total-cost" value="₪${(partData.total_cost || 0).toFixed(2)}" style="flex: 0 0 100px; background: #c8e6c9; font-weight: bold; border: 2px solid #43a047;" readonly>
    <input type="hidden" class="price" value="₪${(partData.updated_price || 0).toFixed(2)}">
    <div class="row-actions" style="display: flex; gap: 5px;">
      <button type="button" class="btn-edit" onclick="editPartRow(${partsList.children.length})" style="background: #f59e0b; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer;">✏️</button>
      <button type="button" class="btn-delete" onclick="deletePartRow(${partsList.children.length})" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer;">🗑️</button>
    </div>
  `;
  
  partsList.appendChild(newRow);
}

/**
 * SESSION 36: Overwrite helper with Supabase data
 */
function overwriteHelperWithSupabaseData(parts, damageCenterCode) {
  console.log('  📝 Overwriting helper with Supabase data');
  
  const helper = window.helper || globalHelper;
  
  if (!helper.current_damage_center) {
    helper.current_damage_center = { code: damageCenterCode, Parts: {} };
  }
  if (!helper.current_damage_center.Parts) {
    helper.current_damage_center.Parts = {};
  }
  
  helper.current_damage_center.Parts.parts_required = parts;
  
  sessionStorage.setItem('helper', JSON.stringify(helper));
  window.helper = helper;
  if (typeof globalHelper !== 'undefined') {
    globalHelper = helper;
  }
  
  console.log(`  ✅ Helper overwritten with ${parts.length} parts`);
}

window.loadPartsFromSupabase = loadPartsFromSupabase;
window.addPartFromSupabaseData = addPartFromSupabaseData;
```

**Also update `handleWizardContext()` to call load:**

Find the `handleWizardContext()` function and add this at the end (after line 420):

```javascript
// SESSION 36: Load parts from Supabase
await loadPartsFromSupabase();
```

---

## Testing Checklist

### Test 1: New Part Entry
- [ ] Add part manually
- [ ] Add via Supabase suggestion
- [ ] Enter: price 1000, reduction 10%, wear 15%, qty 2
- [ ] Verify updated price = ₪765
- [ ] Verify total = ₪1530
- [ ] Check Supabase dashboard - row exists
- [ ] Check console - no errors

### Test 2: Edit Mode
- [ ] Create part, save
- [ ] Change quantity from 1 to 3
- [ ] Check Supabase - same row updated (not new row)
- [ ] Verify calculations recalculate

### Test 3: Multiple Centers
- [ ] Create center 1, add 3 parts, save
- [ ] Create center 2, add 2 parts, save
- [ ] Edit center 1 - shows 3 parts only
- [ ] Edit center 2 - shows 2 parts only

### Test 4: Case Restore
- [ ] Save case with parts
- [ ] Logout
- [ ] Login, restore case
- [ ] Edit damage center
- [ ] Parts load from Supabase correctly

### Test 5: Wizard Subtotal
- [ ] Add 3 parts
- [ ] Green box shows correct total
- [ ] Green box shows correct VAT
- [ ] Green box shows correct count

### Test 6: Backwards Compatibility
- [ ] Save parts with new fields
- [ ] Open validation page
- [ ] Open final report
- [ ] Generate PDF
- [ ] All work correctly

---

## Troubleshooting

**Problem:** Calculations not working  
**Solution:** Check browser console for errors, verify calculatePriceFields is defined

**Problem:** Supabase save fails  
**Solution:** Check console for missing case_id/plate/damage_center_code

**Problem:** Green box not updating  
**Solution:** Check postMessage is sent, verify wizard is parent window

**Problem:** Parts not loading on restore  
**Solution:** Check loadPartsFromSupabase is called in handleWizardContext

**Problem:** Duplicates in Supabase  
**Solution:** Verify row_uuid is set and unique index exists

---

## Success Criteria (Final Checklist)

Before marking complete:

- [ ] All 9 fields display correctly
- [ ] Calculations accurate (manual calculator verification)
- [ ] Readonly fields cannot be edited
- [ ] Cyan/green backgrounds visible
- [ ] Supabase saves without errors
- [ ] Edit mode updates (no duplicates)
- [ ] Multiple centers isolated
- [ ] Subtotal updates real-time
- [ ] Case restore works
- [ ] Validation/reports work
- [ ] No console errors
- [ ] Page loads < 2 seconds

---

## Files Summary

**Created:**
- `supabase migration/sql/SESSION_36_UPDATE_PARTS_REQUIRED_TABLE.sql`

**Modified:**
- `parts-required.html` (13 functions added/modified)

**Functions:**
1. `addPart()` - Modified
2. `calculatePriceFields(row)` - NEW
3. `debouncedSave(row)` - NEW
4. `calculatePageTotal()` - Modified
5. `suggestPart(input)` - Replaced
6. `fillRowFromPart(row, part)` - NEW
7. `searchHelperParts(query)` - NEW
8. `saveRowToSupabase(row)` - NEW
9. `saveToHelper(partData, code)` - NEW
10. `syncRequiredPartsToHelper()` - NEW
11. `loadPartsFromSupabase()` - NEW
12. `addPartFromSupabaseData(partData)` - NEW
13. `overwriteHelperWithSupabaseData(parts, code)` - NEW

---

**End of Session 36 Implementation Guide**

Session 37: Start with Task 1 (SQL migration), then proceed in order through Task 8. Test thoroughly after each task. Good luck!

**SESSION 57 TASK**
ESTIMATOR BUILDER - CRITICAL BUG FIX TASK
⚠️ CRITICAL WARNINGS & CONSTRAINTS
ABSOLUTE DO NOTS:
* ❌ DO NOT modify any code from sessions 36-56 these sessions built working functionality
* ❌ DO NOT change page structure or UI layout (except the width overflow fix)
* ❌ DO NOT refactor or "improve" working logic
* ❌ This is a RESTORATION task, not a development task
THIS IS A DEBUGGING MISSION - PRESERVE WHAT WORKS, FIX WHAT BROKE

📚 Required Reading (MANDATORY BEFORE STARTING)
You MUST read these sessions to understand the system:
1. Sessions 36-56 - Full session summaries
2. Location: supabase migration folder
3. Key document: supabase and parts search module integration.md
4. Critical reference: Session 55-56 files about damage center ID handling
Why this matters: The estimator and final report are TWO SEPARATE PATHS that both write to damage centers. Understanding how they were designed to coexist is essential.

🔴 CRITICAL ISSUE #1: Parts Data Deletion Bug
Problem Description
SEVERE: Adding a new part in the estimator UI DELETES ALL EXISTING PARTS in the damage center and replaces them with only the newly added part.
What Happened (Timeline)
1. User worked on estimator
2. "Parts required" HTML was cleared (lost costs and details)
3. Final report was also cleared
4. User restored "parts required" section → final report auto-restored ✅
5. BUT estimator broke ❌
6. Now: Adding any part = deletes all existing parts
Root Cause Hypothesis
JSON structure mismatch between:
* Final report builder's "add part" JSON structure
* Estimator's "add part" JSON structure
* Damage centers id problem 
When estimator sends differently structured JSON, it OVERWRITES instead of APPENDS.

Investigation Steps for Issue #1
Step 1: Capture & Compare JSON Structures
Create a comparison table:
Source	Action	JSON Structure	Damage Center ID	Behavior
Final Report Builder	Add Part	{...}	dc_xxx	✅ Appends correctly
Estimator	Add Part	{...}	dc_???	❌ Overwrites/deletes
How to capture:
// Add console.log to both modules before sending to damage centers
console.log('JSON being sent:', JSON.stringify(partData, null, 2));
console.log('Target damage center ID:', damageCenterId);
Step 2: Verify Damage Center ID Consistency
CRITICAL REFERENCE: Check sessions documentation about damage center ID handling
Verify:
* [ ] Estimator receives correct damage center ID when loading parts
* [ ] Estimator preserves the same damage center ID when adding new parts
* [ ] New part is added to the same damage center displayed in UI
* [ ] No accidental creation of new damage center IDs
Common mistakes:
* Creating a new damage center instead of updating existing one
* Wrong ID reference causing write to different damage center
* ID not being passed through the add part function
Step 3: Check JSON Field Matching
The estimator's JSON must EXACTLY MATCH the final report's JSON structure, field by field:
// Required fields (example - verify from final report code):
{
    "row_uuid": "cd4296d8-1dde-4dbb-9624-b8c16534670f",
    "case_id": "c52af5d6-3b78-47b8-88a2-d2553ee3e1af",
    "plate": "221-84-003",
    "damage_center_code": "dc_1760973785017_1",
    "part_name": "כנף קד' שמ' - קורולה קרוס 022-",
    "description": "כנף קד' שמ' - קורולה קרוס 022-",
    "pcode": "VB42074012",
    "oem": "",
    "supplier_name": "מ.פינס בע",
    "part_family": "",
    "manufacturer": "",
    "price_per_unit": 5998.96,
    "reduction_percentage": 0,
    "wear_percentage": 4,
    "updated_price": 5759,
    "total_cost": 11518,
    "source": "חליפי",
    "quantity": 2,
    "make": "",
    "model": "COROLLA CROSS",
    "year": "2022",
    "trim": "ADVENTURE",
    "engine_code": "",
    "engine_type": "בנזין",
    "vin": "",
    "metadata": {},
    "updated_at": "2025-10-20T16:28:47.539Z",
    "מחיר": 5759,
    "מיקום": "ישראל",
    "הערות": "",
    "זמינות": "זמין"
}
If fields are missing or named differently → data corruption

Required Fix for Issue #1
CORRECT BEHAVIOR:
1. On Import from Centers:
    * Estimator receives complete JSON from damage centers
    * Captures entire JSON structure
    * Displays only needed fields in UI (hide unnecessary ones)
    * Stores complete data in memory
2. On Add New Part:
    * Constructs JSON matching final report's exact structure
    * Includes same damage center ID from imported data
    * Sends to helper.estimator AND damage centers
    * APPENDS to existing parts (does not replace)
    * Sends to Supabase with correct damage center ID
3. Verification:
    * Part appears in estimator UI ✅
    * Part appears in damage centers ✅
    * Part appears in final report ✅
    * Existing parts remain intact ✅
    * Part is usable system-wide ✅

🔴 CRITICAL ISSUE #2: Import Problem
Problem Description
The import of required parts to "estimator damage section" is broken - parts stopped importing details properly.
Investigation Checklist
* [ ] Read the import approach documentation from sessions 36-56
* [ ] Check if data exists in damage centers (verify in Supabase)
* [ ] Verify damage center ID is correct when importing
* [ ] Check if import function is reading all required fields
* [ ] Verify mapping between damage center data and UI fields
* [ ] Test with known working damage center data
Required Fix for Issue #2
Change the mapping to capture original costs per item:
Current (broken): May be importing calculated totals or missing price data
Required:
// For each part, capture:
{
  original_price_per_unit: part.price,  // Individual item price
  quantity: part.quantity,
  discount_percent: part.discount || 0,
  wear_percent: part.wear || 0
  // Do NOT import pre-calculated total
}
Change total cost to ON-PAGE calculation:
// Calculate in UI, not from imported data
total_cost = price_per_unit × quantity × (1 - discount%) × (1 - wear%)
Why: Total cost from damage centers may be outdated or calculated differently. Always recalculate on page to ensure accuracy.

🔴 ISSUE #3: UI Width Overflow
Problem
Parts floating section slides outside page boundaries.
Required Fix
/* Apply to parts container */
.parts-container {
  max-width: 100%;
  overflow-x: auto;  /* Allow horizontal scroll if needed */
  box-sizing: border-box;
}

/* Or make content responsive */
.parts-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;  /* Wrap to next line if too wide */
}
Test on:
* Desktop wide screen
* Laptop (1366px)
* Tablet landscape
* Ensure no horizontal page scroll

🔍 Debugging Methodology
Phase 1: Understanding (30 min)
1. Read sessions 36-56 summaries
2. Read supabase integration docs
3. Map out data flow: Damage Centers ↔ Estimator ↔ Final Report
4. Identify separation between two paths
Phase 2: Data Investigation (45 min)
1. Check Supabase: Verify damage center data structure
2. Inspect helper.estimator object structure
3. Console.log all JSON being sent/received
4. Compare with final report's JSON structure
5. Verify damage center IDs match across operations
Phase 3: Code Analysis (60 min)
1. Locate "add part" function in estimator
2. Locate "import parts" function in estimator
3. Compare with final report's equivalent functions
4. Identify structural differences
5. Check for overwrite vs append logic
Phase 4: Targeted Fixes (90 min)
1. Fix JSON structure to match final report
2. Fix damage center ID handling
3. Fix import mapping for original prices
4. Change total to on-page calculation
5. Fix width overflow
6. Test each fix individually
Phase 5: Integration Testing (30 min)
1. Test: Import parts from damage center
2. Test: Add new part in estimator
3. Test: Verify existing parts remain
4. Test: Check Supabase data
5. Test: Verify in final report
6. Test: UI responsiveness

✅ Success Criteria
Issue #1 Fixed:
* [ ] Adding part in estimator does NOT delete existing parts
* [ ] New part appears alongside existing parts
* [ ] Correct damage center ID preserved
* [ ] Data properly saved to Supabase
* [ ] Part visible in final report
Issue #2 Fixed:
* [ ] Parts import with all details from damage centers
* [ ] Original price per unit correctly displayed
* [ ] Total cost calculated on page (price × quantity)
* [ ] Discount and wear percentages imported correctly
Issue #3 Fixed:
* [ ] Parts section fits within page boundaries
* [ ] No horizontal page overflow
* [ ] Responsive on all screen sizes
System Integrity:
* [ ] Final report still works independently
* [ ] Estimator works independently
* [ ] Both can read/write to damage centers without conflict
* [ ] No regression in sessions 47-51 functionality

🚨 Red Flags to Watch For
If you see any of these, STOP and investigate:
1. New damage center created when adding part → ID handling broken
2. Empty arrays in Supabase after add → Overwrite instead of append
3. Missing fields in imported data → Mapping incomplete
4. Different JSON structure than final report → Will cause conflicts
5. Total costs not matching calculations → Using imported totals instead of calculating

📝 Suggested Testing Sequence
1. Start with clean damage center with 3 existing parts
2. Open estimator
3. Verify 3 parts import correctly with all details
4. Add 4th part via estimator UI
5. Check: All 4 parts visible in estimator ✅
6. Check Supabase: damage center has 4 parts ✅
7. Open final report: see all 4 parts ✅
8. Add 5th part via final report
9. Refresh estimator: see all 5 parts ✅
10. Verify width fits on different screens ✅

💡 Key Insights from Architecture
The System Design:
* Two separate paths: Estimator & Final Report
* Shared storage: Both write to damage centers
* Independence: Neither should break the other
* Data flow: Centers → Helper → UI → Centers (round trip)
Why it broke:
* Something in sessions 47-51 changed how estimator writes to centers
* JSON structure diverged from final report's structure
* Likely an overwrite operation instead of append/merge
The fix:
* Align JSON structures between both paths
* Ensure append behavior, not overwrite
* Preserve damage center ID consistency
* Calculate totals on page, not from import

