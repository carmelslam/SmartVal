-- DIAGNOSE WHY SEARCH RETURNS 0

-- 1. Check if data exists
SELECT '=== DATA EXISTS ===' as step;
SELECT COUNT(*) as total_records FROM catalog_items;

-- 2. Check if we have any doors in Hebrew (both ways)
SELECT '=== DOOR SEARCH DIRECT ===' as step;
SELECT COUNT(*) as doors_normal FROM catalog_items WHERE cat_num_desc ILIKE '%דלת%';
SELECT COUNT(*) as doors_reversed FROM catalog_items WHERE cat_num_desc ILIKE '%תלד%';

-- 3. Check what the search function actually returns
SELECT '=== SEARCH FUNCTION TEST ===' as step;
SELECT COUNT(*) as function_result FROM smart_parts_search(free_query_param := 'דלת');

-- 4. Check if functions exist
SELECT '=== FUNCTIONS CHECK ===' as step;
SELECT proname FROM pg_proc WHERE proname IN ('smart_parts_search', 'reverse_hebrew', 'extract_core_part_term', 'normalize_make');

-- 5. Test basic SQL search
SELECT '=== BASIC SQL SEARCH ===' as step;
SELECT id, cat_num_desc, make, price 
FROM catalog_items 
WHERE cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%תלד%'
LIMIT 5;

-- 6. Test reverse Hebrew function
SELECT '=== HEBREW REVERSAL TEST ===' as step;
SELECT 
    'דלת' as original,
    reverse_hebrew('דלת') as reversed;

-- 7. Test extract core term function
SELECT '=== CORE TERM EXTRACTION ===' as step;
SELECT extract_core_part_term('דלת ימין') as should_be_door;

-- 8. Check what makes exist
SELECT '=== MAKES IN DATA ===' as step;
SELECT DISTINCT make, COUNT(*) 
FROM catalog_items 
WHERE make IS NOT NULL 
GROUP BY make 
ORDER BY COUNT(*) DESC 
LIMIT 10;

-- 9. Test Toyota search
SELECT '=== TOYOTA SEARCH ===' as step;
SELECT COUNT(*) as toyota_direct FROM catalog_items WHERE make ILIKE '%טויוטה%';
SELECT COUNT(*) as toyota_function FROM smart_parts_search(make_param := 'טויוטה');

-- 10. Show actual search function code
SELECT '=== FUNCTION DEFINITION ===' as step;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'smart_parts_search';