-- SIMPLE CATALOG ANALYSIS - NO COMPLEX SYNTAX
-- Run these queries one by one to understand your data

-- 1. Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'catalog_items'
ORDER BY ordinal_position;

-- 2. Count total items
SELECT count(*) as total_items FROM catalog_items;

-- 3. Check for existing part families
SELECT part_family, count(*) 
FROM catalog_items 
WHERE part_family IS NOT NULL 
GROUP BY part_family 
ORDER BY count DESC;

-- 4. Sample descriptions with Hebrew text
SELECT cat_num_desc, supplier_name, pcode, price
FROM catalog_items 
WHERE cat_num_desc LIKE '%פנס%'
LIMIT 5;

-- 5. Sample Toyota entries
SELECT cat_num_desc, supplier_name, make, model
FROM catalog_items 
WHERE cat_num_desc LIKE '%טויוטה%' OR make LIKE '%Toyota%'
LIMIT 5;

-- 6. Check field population
SELECT 
    count(*) as total,
    count(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem,
    count(CASE WHEN make IS NOT NULL THEN 1 END) as has_make,
    count(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_family
FROM catalog_items;

-- 7. Sample random entries to see format
SELECT cat_num_desc, supplier_name, pcode, oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL
LIMIT 10;

-- 8. Look for specific patterns from screenshot
SELECT cat_num_desc, pcode, price, oem
FROM catalog_items 
WHERE cat_num_desc LIKE '%T5%' 
   OR cat_num_desc LIKE '%016%'
   OR cat_num_desc LIKE '%שמאל%'
LIMIT 10;