-- ANALYZE CATNUMDESC FIELD TO UNDERSTAND THE DATA
-- This will show us what data looks like and what needs to be extracted

-- 1. Show sample catnumdesc for doors (דלת)
SELECT 'Sample door parts:' as analysis;
SELECT id, cat_num_desc, make, model, year_range, part_family
FROM catalog_items
WHERE cat_num_desc ILIKE '%דלת%'
LIMIT 10;

-- 2. Show sample for right front (ימין קדמי or ימי קד or 'מי 'דק)
SELECT 'Sample right front parts:' as analysis;
SELECT id, cat_num_desc, make, model, year_range, part_family
FROM catalog_items
WHERE cat_num_desc ILIKE '%ימי%' AND cat_num_desc ILIKE '%קד%'
LIMIT 10;

-- 3. Show what's in the fields we expect to use
SELECT 'Field population analysis:' as analysis;
SELECT 
    COUNT(*) as total,
    COUNT(DISTINCT make) as unique_makes,
    COUNT(DISTINCT model) as unique_models,
    COUNT(DISTINCT part_family) as unique_families,
    COUNT(year_range) as has_year_range,
    COUNT(side_position) as has_side_position,
    COUNT(front_rear) as has_front_rear
FROM catalog_items;

-- 4. Show distinct part families to understand categorization
SELECT 'Distinct part families:' as analysis;
SELECT DISTINCT part_family, COUNT(*) as count
FROM catalog_items
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC
LIMIT 20;

-- 5. Look for door in different variations
SELECT 'Door variations in data:' as analysis;
SELECT id, cat_num_desc, supplier_name
FROM catalog_items
WHERE cat_num_desc ILIKE '%תלד%'  -- דלת reversed
   OR cat_num_desc ILIKE '%דלת%'   -- דלת normal
   OR cat_num_desc ILIKE '%door%'  -- English
LIMIT 10;

-- 6. Check a specific example with all fields
SELECT 'Full record example:' as analysis;
SELECT * FROM catalog_items
WHERE cat_num_desc ILIKE '%דלת%' AND cat_num_desc ILIKE '%ימי%'
LIMIT 1;