-- CHECK YEAR ISSUES
-- 1. How many records show "לא מוגדר" for year but have year_range?
-- 2. Check if year_range is reversed (910 instead of 019)

SELECT 'Records with year_range but undefined extracted_year:' as issue;
SELECT COUNT(*) as count
FROM catalog_items
WHERE year_range IS NOT NULL 
  AND year_range != ''
  AND (extracted_year IS NULL OR extracted_year = '' OR extracted_year = 'לא מוגדר');

-- Sample records showing the year issue
SELECT 'Sample records with year issue:' as info;
SELECT 
    cat_num_desc,
    year_range,
    year_from,
    year_to,
    extracted_year
FROM catalog_items
WHERE year_range IS NOT NULL AND year_range != ''
LIMIT 10;

-- Check how many have reversed year_range (first number > second number)
SELECT 'Reversed year ranges (910-810 instead of 10-19):' as issue;
SELECT COUNT(*) as reversed_count
FROM catalog_items
WHERE year_range IS NOT NULL 
  AND year_range ~ '^\d+-\d+$'
  AND split_part(year_range, '-', 1)::INT > split_part(year_range, '-', 2)::INT;

-- Check test row specifically
SELECT 'Test row year data:' as test;
SELECT pcode, cat_num_desc, year_range, year_from, year_to, extracted_year
FROM catalog_items
WHERE pcode = 'TEST-12345';
