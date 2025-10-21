# SESSION 61: EMERGENCY RECOVERY & DUPLICATE FIX

**Priority**: CRITICAL - System creating 3x duplicates on every save
**Prerequisite**: READ SESSION_60_COMPLETE_FAILURE_REPORT.md first

---

## Pre-Session Requirements

**User must decide**:
- [ ] Option A: Git restore to before Session 60, then re-apply only TASK 1 & 2
- [ ] Option B: Keep Session 60 changes, fix UUID matching bugs
- [ ] Clean Supabase duplicates (required for either option)

---

## PHASE 1: CRITICAL - Stop the Bleeding

### Task 1.1: Clean Supabase Duplicates
**Why**: Current state has 3x of every part - must clean before fixing code

**Steps**:
1. Query parts_required table, group by: `plate + damage_center_code + part_name`
2. For each group with >1 row:
   - Keep row with highest `updated_at` or `created_at` timestamp
   - Delete older duplicate rows
3. Verify cleanup successful
4. Backup cleaned table

**SQL Example**:
```sql
-- Find duplicates
SELECT plate, damage_center_code, part_name, COUNT(*) as count
FROM parts_required
GROUP BY plate, damage_center_code, part_name
HAVING COUNT(*) > 1;

-- Delete duplicates (keep newest)
DELETE FROM parts_required p1
USING parts_required p2
WHERE p1.plate = p2.plate
  AND p1.damage_center_code = p2.damage_center_code
  AND p1.part_name = p2.part_name
  AND p1.created_at < p2.created_at;
```

---

### Task 1.2: Debug Why data-row-uuid is Empty
**Why**: Session 60 added attribute but it's empty string, breaking UUID matching

**Investigation**:
1. Add console.log in createEditablePartRow() to show `part.row_uuid` value
2. Add console.log in saveDamageCenterChanges() to show `rowUuidFromDOM` value
3. Test: Load estimator, check browser console for UUID values
4. Test: Inspect DOM element, check data-row-uuid attribute value

**Expected findings**:
- If `part.row_uuid` is undefined/null → helper.centers parts don't have UUID
- If `part.row_uuid` exists but DOM attribute empty → HTML rendering bug
- If DOM attribute has value but getAttribute() returns empty → selector bug

---

### Task 1.3: Fix Root Cause Based on Investigation
**Depends on Task 1.2 findings**

**Scenario A: Parts in helper.centers don't have row_uuid**
- Problem: Wizard or parts-required not setting UUID
- Fix: Ensure parts-required.html line 466 creates UUID
- Fix: Ensure wizard preserves UUID when receiving from iframe

**Scenario B: HTML rendering drops UUID**
- Problem: Template literal not interpolating correctly
- Fix: Change `data-row-uuid="${rowUuid}"` to use safer method
- Fix: Set attribute after DOM element created instead of in template

**Scenario C: getAttribute() not finding attribute**
- Problem: Wrong attribute name or selector
- Fix: Verify exact attribute name matches

---

## PHASE 2: Implement Correct UUID Matching

### Task 2.1: Add UUID Validation in createEditablePartRow()
**File**: estimator-builder.html line 9820

```javascript
function createEditablePartRow(part, centerIndex, partIndex) {
  // CRITICAL: Part MUST have row_uuid
  const rowUuid = part?.row_uuid;
  
  if (\!rowUuid) {
    console.error('❌ SESSION 61: Part without row_uuid - cannot render\!', part);
    console.error('  Center:', centerIndex, 'Part:', partIndex);
    console.error('  This indicates data corruption in helper.centers');
    return `<div class="part-row error">ERROR: Part missing UUID</div>`;
  }
  
  console.log(`✅ SESSION 61: Creating part row with UUID: ${rowUuid}`);
  
  // Rest of function...
  return `
    <div class="part-row" 
         data-center="${centerIndex}" 
         data-part="${partIndex}" 
         data-row-uuid="${rowUuid}"
         style="...">
      ...
    </div>
  `;
}
```

---

### Task 2.2: Add UUID Validation in saveDamageCenterChanges()
**File**: estimator-builder.html line 2863

```javascript
card.querySelectorAll('.part-row').forEach((row, partIndex) => {
  // Read from UI
  const name = row.querySelector('.part-name').value;
  if (\!name.trim()) return; // Skip empty rows
  
  // CRITICAL: Get UUID from DOM
  const rowUuidFromDOM = row.getAttribute('data-row-uuid');
  
  if (\!rowUuidFromDOM || rowUuidFromDOM === '') {
    console.error('❌ SESSION 61: DOM row missing UUID attribute\!');
    console.error('  Row HTML:', row.outerHTML.substring(0, 200));
    console.error('  Part name:', name);
    console.error('  SKIPPING this part - would create duplicate');
    return; // SKIP - don't save without UUID
  }
  
  console.log(`✅ SESSION 61: Processing part with UUID: ${rowUuidFromDOM}`);
  
  // Match by UUID
  const existingPart = existingParts.find(p => p.row_uuid === rowUuidFromDOM);
  
  if (\!existingPart) {
    console.warn('⚠️ SESSION 61: No existing part found for UUID:', rowUuidFromDOM);
    console.warn('  This is a NEW part - will generate fresh data');
  }
  
  const partObject = {
    ...(existingPart || {}),
    row_uuid: rowUuidFromDOM, // USE the UUID from DOM
    // ... rest of fields
  };
  
  parts.push(partObject);
});
```

---

### Task 2.3: Prevent Multiple Saves
**File**: estimator-builder.html

Add save guard to prevent duplicate saves:

```javascript
let isSaving = false;
let lastSaveTime = 0;

async function saveDamageCenterChanges() {
  // Prevent duplicate saves within 2 seconds
  const now = Date.now();
  if (isSaving || (now - lastSaveTime < 2000)) {
    console.warn('⚠️ SESSION 61: Save already in progress or too soon, skipping');
    return false;
  }
  
  isSaving = true;
  lastSaveTime = now;
  
  try {
    // ... existing save logic
    
    console.log('✅ SESSION 61: Save complete');
    return true;
  } finally {
    isSaving = false;
  }
}
```

---

## PHASE 3: Test & Verify

### Test 3.1: Load Estimator
**Expected**:
- Console shows "Creating part row with UUID: [actual-uuid]" for each part
- DOM inspection shows `data-row-uuid="[actual-uuid]"` on each .part-row
- NO error messages about missing UUIDs

**If fails**: Go back to Task 1.2, UUID not being set properly

---

### Test 3.2: Add New Part in Estimator
**Expected**:
- New row has empty data-row-uuid (it's new)
- On save, row gets NEW UUID generated
- Supabase INSERT one new row
- Console shows "No existing part found for UUID: [new-uuid]"

**If fails**: Check UUID generation logic in line 2914

---

### Test 3.3: Edit Existing Part
**Expected**:
- Row has data-row-uuid="[existing-uuid]"
- On save, UUID matching finds existing part
- Supabase UPDATE existing row (upsert with same UUID)
- NO new row created

**If fails**: Check UUID matching in Task 2.2

---

### Test 3.4: Full Flow Test
**Steps**:
1. Add part in wizard → Save
2. View in estimator → Should have UUID
3. Edit part in estimator → Save
4. Check Supabase → Should be 1 row, updated
5. Edit again → Save
6. Check Supabase → Still 1 row, updated again

**Expected**: ZERO duplicates created

---

## PHASE 4: Original Issues (If Time Permits)

### Task 4.1: Delete Operations
- Wizard delete should delete from Supabase
- Currently only removes from helper

### Task 4.2: Supplier Name Field
- Add hidden supplier field to final-report UI
- Preserve supplier_name when saving

### Task 4.3: Parts-Required OLD Template
- Replace addPartToUI() with complete template
- Ensure all 11 fields present

### Task 4.4: Decimal Rounding
- Round price_per_unit and total_cost to integers in estimator

---

## Success Criteria for Session 61

**MUST HAVE** (Session fails if these don't work):
- [ ] Supabase duplicates cleaned
- [ ] Parts have visible UUIDs in DOM data-row-uuid attribute
- [ ] UUID matching finds correct existing parts
- [ ] Adding part in estimator creates 1 row in Supabase (not 3)
- [ ] Editing part in estimator updates existing row (not creates duplicate)

**NICE TO HAVE** (Can defer to Session 62):
- [ ] Wizard delete works
- [ ] Supplier name preserved
- [ ] OLD template fixed
- [ ] Decimal rounding added

---

## Debugging Checklist

Before starting Session 61, verify:
- [ ] Read SESSION_60_COMPLETE_FAILURE_REPORT.md
- [ ] Understand why UUID matching failed
- [ ] Have database backup
- [ ] Have plan for cleaning duplicates
- [ ] Know which option (A: restore, B: fix) user chose

During Session 61:
- [ ] Test after EVERY change
- [ ] Don't make multiple changes before testing
- [ ] Add console.log liberally
- [ ] Check DOM inspector for attribute values
- [ ] Check Supabase after every save operation

---

**CRITICAL**: Do NOT proceed to Phase 2 until Phase 1 is complete and working.

**End of Session 61 Tasks**

