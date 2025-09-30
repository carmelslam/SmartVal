-- CHECK CATALOG DATA AND TEST SEARCH
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if catalog_items table has data
SELECT 'Checking catalog_items table...' as check_step;
SELECT COUNT(*) as total_records FROM catalog_items;

-- 2. Check sample data structure
SELECT 'Sample catalog items:' as check_step;
SELECT id, supplier_name, pcode, cat_num_desc, price, make, model, part_family
FROM catalog_items 
LIMIT 5;

-- 3. Check if Hebrew text exists and how it's stored
SELECT 'Checking Hebrew text in cat_num_desc:' as check_step;
SELECT id, cat_num_desc, supplier_name
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL
LIMIT 10;

-- 4. Test search for common Hebrew words
SELECT 'Testing Hebrew search for פנס:' as check_step;
SELECT id, cat_num_desc, supplier_name, pcode, price
FROM catalog_items
WHERE cat_num_desc ILIKE '%פנס%'
LIMIT 5;

-- 5. Test reverse Hebrew (in case text is reversed)
SELECT 'Testing reverse Hebrew search for סנפ:' as check_step;
SELECT id, cat_num_desc, supplier_name, pcode, price
FROM catalog_items
WHERE cat_num_desc ILIKE '%סנפ%'
LIMIT 5;

-- 6. Check if make/model fields are populated
SELECT 'Checking make/model fields:' as check_step;
SELECT DISTINCT make, COUNT(*) as count
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
LIMIT 10;

-- 7. Test the actual search function with debug
SELECT 'Testing smart_parts_search function:' as check_step;
SELECT * FROM smart_parts_search(
    free_query_param := 'test',
    limit_results := 5
);

-- 8. Test with Hebrew
SELECT 'Testing smart_parts_search with Hebrew:' as check_step;
SELECT * FROM smart_parts_search(
    free_query_param := 'פנס',
    limit_results := 5
);

-- 9. Check if any field has non-null data
SELECT 'Fields with data:' as check_step;
SELECT 
    COUNT(*) FILTER (WHERE cat_num_desc IS NOT NULL) as has_cat_num_desc,
    COUNT(*) FILTER (WHERE make IS NOT NULL) as has_make,
    COUNT(*) FILTER (WHERE model IS NOT NULL) as has_model,
    COUNT(*) FILTER (WHERE supplier_name IS NOT NULL) as has_supplier_name,
    COUNT(*) FILTER (WHERE pcode IS NOT NULL) as has_pcode,
    COUNT(*) FILTER (WHERE price IS NOT NULL) as has_price,
    COUNT(*) FILTER (WHERE part_family IS NOT NULL) as has_part_family
FROM catalog_items;