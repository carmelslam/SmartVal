-- DIAGNOSE SEARCH ISSUE
-- Let's understand why search returns 0

-- 1. Check if we have data
SELECT 'Total records in catalog_items:' as check;
SELECT COUNT(*) FROM catalog_items;

-- 2. Check what's in cat_num_desc
SELECT 'Sample cat_num_desc values:' as check;
SELECT id, cat_num_desc, make, model, part_name
FROM catalog_items
LIMIT 10;

-- 3. Test searching for a specific part we know exists
SELECT 'Searching for דלת in cat_num_desc:' as check;
SELECT COUNT(*) 
FROM catalog_items 
WHERE cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%תלד%';

-- 4. Check if part_name was populated
SELECT 'Check part_name population:' as check;
SELECT COUNT(*) as total, 
       COUNT(part_name) as has_part_name,
       COUNT(DISTINCT part_name) as unique_part_names
FROM catalog_items;

-- 5. Show distinct part names if any
SELECT 'Distinct part names:' as check;
SELECT DISTINCT part_name, COUNT(*) as count
FROM catalog_items
WHERE part_name IS NOT NULL
GROUP BY part_name
ORDER BY count DESC
LIMIT 20;

-- 6. Test the core term extraction function
SELECT 'Testing extract_core_part_term function:' as check;
SELECT 
    extract_core_part_term('דלת') as test1,
    extract_core_part_term('ראי') as test2,
    extract_core_part_term('rear door') as test3,
    extract_core_part_term('מראה צד ימין') as test4;

-- 7. Test simple direct search
SELECT 'Direct search for תלד (reversed door):' as check;
SELECT id, cat_num_desc, make, model, price
FROM catalog_items
WHERE cat_num_desc ILIKE '%תלד%'
LIMIT 5;

-- 8. Test what happens when we call the search function
SELECT 'Test smart_parts_search with דלת:' as check;
SELECT COUNT(*) FROM smart_parts_search(free_query_param := 'דלת');

-- 9. Test with reversed
SELECT 'Test smart_parts_search with תלד:' as check;
SELECT COUNT(*) FROM smart_parts_search(free_query_param := 'תלד');

-- 10. Check if the functions exist
SELECT 'Check if functions exist:' as check;
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('smart_parts_search', 'extract_core_part_term', 'reverse_hebrew', 'normalize_make')
ORDER BY proname;