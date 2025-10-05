-- FIX YEAR DISPLAY ISSUES
-- 1. Create year_range from year_from/year_to when missing
-- 2. Fix reversed year_range (910-810 → 10-19)
-- 3. Create extracted_year from year_range for display

-- Step 1: Create year_range from year_from/year_to when NULL
UPDATE catalog_items
SET year_range = 
    CASE 
        WHEN year_from IS NOT NULL AND year_to IS NOT NULL THEN
            substring(year_from::TEXT from 3) || '-' || substring(year_to::TEXT from 3)
        ELSE year_range
    END
WHERE year_range IS NULL 
  AND year_from IS NOT NULL 
  AND year_to IS NOT NULL;

-- Step 2: Fix reversed year_range (first number > second number means reversed)
UPDATE catalog_items
SET year_range = split_part(year_range, '-', 2) || '-' || split_part(year_range, '-', 1)
WHERE year_range IS NOT NULL 
  AND year_range ~ '^\d+-\d+$'
  AND split_part(year_range, '-', 1)::INT > split_part(year_range, '-', 2)::INT;

-- Step 3: Create extracted_year for display from year_range
UPDATE catalog_items
SET extracted_year = year_range
WHERE year_range IS NOT NULL 
  AND year_range != ''
  AND (extracted_year IS NULL OR extracted_year = '');

-- Verify test row
SELECT 'Test row after fix:' as test;
SELECT pcode, cat_num_desc, year_range, year_from, year_to, extracted_year
FROM catalog_items
WHERE pcode = 'TEST-12345';

-- Check overall results
SELECT 'Year field coverage:' as info;
SELECT 
    COUNT(*) FILTER (WHERE year_range IS NOT NULL AND year_range != '') as has_year_range,
    COUNT(*) FILTER (WHERE extracted_year IS NOT NULL AND extracted_year != '') as has_extracted_year,
    COUNT(*) FILTER (WHERE year_from IS NOT NULL) as has_year_from,
    COUNT(*) as total
FROM catalog_items;
