# SESSION 6 - Fix Extraction After Python Import Fix
**Date**: October 5, 2025  
**Problem**: Python import is NOW FIXED (data correct), but old reversal functions are BREAKING correct Hebrew

---

## DEPLOYMENT ORDER (CRITICAL - Run in this exact order\!)

### Step 1: Remove All Reversal Logic
**File**: `REMOVE_ALL_REVERSAL_2025-10-05.sql`

**What it does**:
- Drops 3 reversal triggers that are breaking correct Hebrew
- Drops 8+ reversal functions (reverse_hebrew, auto_fix_hebrew_reversal, etc.)
- Drops old auto_fix_and_extract with wrong family categories
- Keeps safe triggers: trigger_01_set_supplier_name, trigger_extract_model_and_year

**Run this first\!**

---

### Step 2: Deploy Clean Extraction
**File**: `DEPLOY_CORRECT_EXTRACTION_2025-10-05.sql`

**What it does**:
- Creates `auto_extract_catalog_data()` function with:
  - ✅ NO REVERSAL (Python import is fixed)
  - ✅ Correct 18 part families (from parts.js/PARTS_BANK)
  - ✅ Side/position extraction (שמ', ימ', קד', אח')
  - ✅ Year extraction (09-13, 016-018 patterns)
  - ✅ Make normalization (removes יפן, ארהב suffixes)

- Creates 2 auto-triggers:
  - `auto_process_catalog_on_insert` → fires on catalog upload
  - `auto_process_catalog_on_update` → fires on UI updates

**This ensures all new data will be extracted correctly\!**

---

### Step 3: Fix Existing Data
**File**: `FIX_EXISTING_DATA_2025-10-05.sql`

**What it does**:
- Fixes reversed makes: ןגווסקלופ → פולקסווגן, טאיפ → פיאט, etc.
- Removes country suffixes from make
- Triggers auto-extraction for ALL records with:
  - NULL side_position
  - NULL front_rear
  - NULL/wrong part_family

**This fixes all existing broken data\!**

---

## Expected Results After Deployment

### Before (BROKEN):
```
make: "ןגווסקלופ" (reversed\!)
part_family: "פנסים ותאורה" (old category)
side_position: NULL (not extracted)
front_rear: NULL (not extracted)
```

### After (FIXED):
```
make: "פולקסווגן" (correct\!)
part_family: "פנסים" (correct 18 categories)
side_position: "שמאל" (extracted from שמ')
front_rear: "אחורי" (extracted from אח')
```

---

## Verification Queries

After deployment, run these to verify:

```sql
-- Check no reversal triggers remain
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'catalog_items'::regclass
  AND tgname LIKE '%revers%';
-- Should return 0 rows

-- Check correct triggers are active
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'catalog_items'::regclass
  AND tgname NOT LIKE 'RI_Constraint%';
-- Should show: auto_process_catalog_on_insert, auto_process_catalog_on_update, trigger_01_set_supplier_name, trigger_extract_model_and_year

-- Check makes are correct (not reversed)
SELECT make, COUNT(*) FROM catalog_items 
GROUP BY make ORDER BY COUNT(*) DESC LIMIT 10;
-- Should show: פולקסווגן, פיאט, פורד, NOT reversed

-- Check part families match UI (18 categories)
SELECT part_family, COUNT(*) FROM catalog_items 
GROUP BY part_family ORDER BY COUNT(*) DESC;
-- Should show: פנסים, חלונות ומראות, חלקי מרכב, NOT old categories

-- Check extraction rates improved
SELECT 
    COUNT(*) as total,
    COUNT(side_position) as has_side,
    COUNT(front_rear) as has_position,
    ROUND(COUNT(side_position)::NUMERIC / COUNT(*) * 100, 1) as side_pct,
    ROUND(COUNT(front_rear)::NUMERIC / COUNT(*) * 100, 1) as position_pct
FROM catalog_items;
-- side_pct and position_pct should be > 50%
```

---

## 18 Part Family Categories (Correct)

1. **אביזרים נלווים** (Accessories)
2. **גלגלים וצמיגים** (Wheels & Tires)
3. **חיישני מנוע** (Engine Sensors)
4. **חלונות ומראות** (Windows & Mirrors)
5. **חלקי מרכב** (Body Parts)
6. **חלקי פנים** (Interior Parts)
7. **חשמל** (Electrical)
8. **כריות אוויר** (Airbags)
9. **ממסרים** (Relays)
10. **מנוע - יחידת בקרת ECU** (Engine - ECU)
11. **מנוע וחלקי מנוע** (Engine & Parts)
12. **מערכות בלימה והיגוי** (Braking & Steering)
13. **מערכות חימום וקירור** (Heating & Cooling)
14. **מערכת ABS** (ABS System)
15. **מערכת דלק** (Fuel System)
16. **מערכת הפליטה** (Exhaust System)
17. **מתגים/מפסקים/סוויצ'ים** (Switches)
18. **פנסים** (Lights)
19. **תיבת הילוכים וחלקים** (Transmission)

---

## Critical Notes

1. **NO MORE REVERSAL** - Python import is fixed, all reversal breaks correct Hebrew
2. **Auto-triggers work** - New catalog uploads will auto-extract correctly
3. **UI updates work** - Any UPDATE from UI will re-extract with correct logic
4. **18 categories** - Part families now match exactly what UI expects

---

## What to Document in Task File

After running all 3 SQL files, document:

1. **Functions/Triggers Removed**: List all reversal functions/triggers dropped
2. **Functions/Triggers Deployed**: auto_extract_catalog_data() + 2 triggers
3. **Test Results**: Extraction rates, sample data, makes/families verified
4. **Actual Result**: "Extraction now works correctly, families match UI, side/position extracted"

