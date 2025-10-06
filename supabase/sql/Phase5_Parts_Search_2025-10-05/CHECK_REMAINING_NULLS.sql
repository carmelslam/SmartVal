-- Check what's in the remaining 24,008 NULL records

-- How many match the pattern?
SELECT 
    'Records matching year pattern but still NULL' as check,
    COUNT(*) as count
FROM catalog_items
WHERE year_from IS NULL
  AND cat_num_desc ~ '\d{2,3}-';

-- Sample of records with NULL years
SELECT 
    'Sample NULL year records' as check,
    cat_num_desc,
    'Does this have a year?' as question
FROM catalog_items
WHERE year_from IS NULL
LIMIT 20;
