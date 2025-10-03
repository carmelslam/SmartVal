# CRITICAL INSTRUCTIONS FOR NEXT AGENT - Supabase Parts Search

## CURRENT STATE (as of Oct 3, 2025 - 5:00 PM)

### ✅ WHAT'S WORKING
1. **Search Order Fixed** - `FIX_SEARCH_ORDER_FAMILY_THEN_PART.sql` deployed
   - Search order: FAMILY → PART → MAKE → MODEL → YEAR
   - Part filtering works correctly (no more test row appearing for wrong parts)
   - Simple search and advanced search both work
   - No timeouts

### ❌ WHAT'S BROKEN (DISPLAY ISSUES)
1. **Part Family displays reversed Hebrew** - Shows "םישוגפו םינגמ" instead of "מגנים ופגושים"
2. **Year displays "לא מוגדר"** instead of year range from cat_num_desc (e.g., "220-" or "910-")

### 🔍 DIAGNOSIS NEEDED
**DO THIS FIRST:** Run `/supabase/sql/CHECK_WHAT_IS_DEPLOYED.sql` in Supabase SQL editor

This will show:
1. Current trigger state
2. Current search function
3. Actual data in database
4. What search function returns

**Expected outputs:**
- If `part_family` in database is reversed → Data issue
- If `part_family` in search output is reversed → Function issue
- If `extracted_year` is NULL → Need to run year extraction

---

## THE ROOT PROBLEM

**INCONSISTENT DATA PROCESSING** across different layers:
- Some rows have reversed Hebrew (processed by old trigger)
- Some rows have normal Hebrew (newer data)
- Trigger may or may not be reversing part_family
- Year extraction may not have run on all rows

---

## FIX STRATEGY (DO NOT CREATE NEW FUNCTIONS!)

### Step 1: Identify Current State
Run `CHECK_WHAT_IS_DEPLOYED.sql` and analyze:

**If part_family is reversed in DATABASE:**
- Problem: Trigger or old data
- Fix: Run `/supabase/sql/FIX_TRIGGER_ONLY.sql` to fix trigger
- Then: Manually un-reverse existing data with batch UPDATE

**If part_family is reversed in SEARCH OUTPUT only:**
- Problem: Search function is reversing it
- Fix: Check if search function has reverse() call on part_family
- Remove any reverse() on part_family in return query

**If extracted_year is NULL:**
- Problem: Year extraction hasn't run
- Fix: Extract year from cat_num_desc patterns (e.g., "220-", "910-")

### Step 2: Fix What's Broken

**For reversed part_family:**
```sql
-- Fix trigger first
-- Deploy: /supabase/sql/FIX_TRIGGER_ONLY.sql

-- Then un-reverse existing data in batches (avoid timeout)
UPDATE catalog_items
SET part_family = reverse(part_family)
WHERE id IN (
    SELECT id FROM catalog_items
    WHERE part_family ~ '[א-ת]' AND part_family IS NOT NULL
    LIMIT 10000
);
-- Run this 5 times to fix all 48K rows
```

**For missing year_range/extracted_year:**
```sql
-- Extract from cat_num_desc patterns
UPDATE catalog_items
SET extracted_year = substring(cat_num_desc from '(\d{3})-')
WHERE cat_num_desc ~ '\d{3}-'
  AND (extracted_year IS NULL OR extracted_year = '');
```

---

## CRITICAL FILES TO REFERENCE

### Currently Deployed (as of 5:00 PM):
- `/supabase/sql/FIX_SEARCH_ORDER_FAMILY_THEN_PART.sql` - **Main search function** (WORKING)

### Diagnostic Tool:
- `/supabase/sql/CHECK_WHAT_IS_DEPLOYED.sql` - **Run this FIRST**

### Available Fixes (use as needed):
- `/supabase/sql/FIX_TRIGGER_ONLY.sql` - Fix trigger to stop reversing part_family
- `/supabase/sql/FIX_REVERSED_FAMILY_BATCH.sql` - Un-reverse existing data
- `/supabase/sql/FIX_YEAR_DISPLAY.sql` - Extract year_range

---

## EXISTING FUNCTIONS - DO NOT RECREATE

### Search Function: `smart_parts_search()`
**Location:** Currently deployed in Supabase (from `FIX_SEARCH_ORDER_FAMILY_THEN_PART.sql`)

**Parameters (17 total):**
1. make_param
2. model_param  
3. free_query_param
4. part_param
5. oem_param
6. family_param
7. limit_results
8. car_plate
9. engine_code_param
10. engine_type_param
11. engine_volume_param
12. model_code_param
13. quantity_param
14. source_param
15. trim_param
16. vin_number_param
17. year_param

**Search Order (DO NOT CHANGE):**
1. FAMILY (if provided)
2. PART/FREE_QUERY (required)
3. MAKE (with cascading)
4. MODEL (with cascading)
5. YEAR (optional)
6. ENGINE params (optional)
7. OEM, SOURCE (optional)

**Returns:** 16 columns including cat_num_desc, part_family, extracted_year, etc.

### Trigger: `hebrew_reversal_trigger`
**Function:** `process_hebrew_before_insert()`

**Current behavior (check with diagnostic):**
- Should reverse ONLY cat_num_desc
- Should NOT reverse part_family, make, model

### Helper Function: `reverse_hebrew()`
**Purpose:** Reverses Hebrew words while preserving English
**Used by:** Trigger function

---

## WHAT USER TESTED

### Last Successful State (before display issues):
- Search for "פנס" (headlight) → Returns headlight parts only ✅
- Search for "דלת" (door) → Returns door parts only ✅
- Advanced search with family dropdown → Works ✅
- Simple search with free text → Works ✅

### Current Issues:
- Same searches return correct parts BUT:
  - part_family shows reversed Hebrew
  - year shows "לא מוגדר" instead of year range

---

## DEBUGGING CHECKLIST

1. ✅ Run `CHECK_WHAT_IS_DEPLOYED.sql`
2. ✅ Compare database data vs search output
3. ✅ Check if trigger is reversing part_family
4. ✅ Check if year_range/extracted_year exists in data
5. ✅ Fix ONLY what's broken (don't recreate working functions)
6. ✅ Test with user's searches: "פנס", "דלת"
7. ✅ Verify display shows correct Hebrew and year

---

## USER EXPECTATIONS

**Search Results Should Display:**
- Part description (cat_num_desc): Hebrew text (may be reversed based on storage)
- Part family: **NORMAL Hebrew** (not reversed) - e.g., "מגנים ופגושים"
- Year: **Year range** from cat_num_desc - e.g., "220", "910-"
- Make, Model: Normal text
- Price: Numeric

**If you see:**
- "םישוגפו םינגמ" in part_family → Data is reversed, needs fixing
- "לא מוגדר" in year → extracted_year is NULL, needs extraction

---

## CONTACT PRESERVATION

**DO NOT:**
- Create new search functions
- Change search order (FAMILY → PART → MAKE is correct)
- Remove cascading logic
- Change parameter handling

**DO:**
- Fix data inconsistencies (reversed Hebrew, missing years)
- Fix trigger if it's causing issues
- Keep search function intact (it works!)
- Run fixes in batches to avoid timeouts

---

## QUICK FIX SUMMARY

If diagnostic shows:
1. **part_family reversed in DB** → Deploy `FIX_TRIGGER_ONLY.sql` + batch UPDATE to un-reverse
2. **extracted_year is NULL** → Run year extraction UPDATE
3. **Search function reversing output** → Remove reverse() from function return query

That's it. Fix the data, not the logic.

---

## FILES LOCATION
- All SQL files: `/supabase/sql/`
- Documentation: `/supabase/supabase migration/`
- UI files: `/services/simplePartsSearchService.js`, `/parts search.html`

**Database:** Supabase PostgreSQL
**Table:** `catalog_items` (48,273 rows)
**Function:** `smart_parts_search()` (already deployed and working)
