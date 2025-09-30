-- DIAGNOSE WHY SEARCH RETURNS ZERO RESULTS
-- Run each section to find the problem

-- 1. CHECK IF DATA EXISTS
SELECT '=== 1. DATA CHECK ===' as step;
SELECT COUNT(*) as total_records FROM catalog_items;

-- 2. CHECK SAMPLE DATA
SELECT '=== 2. SAMPLE DATA ===' as step;
SELECT id, cat_num_desc, make, model, supplier_name, price
FROM catalog_items
LIMIT 5;

-- 3. CHECK IF FUNCTIONS EXIST
SELECT '=== 3. FUNCTIONS CHECK ===' as step;
SELECT proname as function_name
FROM pg_proc
WHERE proname IN ('reverse_hebrew', 'normalize_make', 'extract_core_part_term', 'smart_parts_search')
ORDER BY proname;

-- 4. TEST HEBREW REVERSAL DIRECTLY
SELECT '=== 4. TEST HEBREW REVERSAL ===' as step;
SELECT 
    'דלת' as original,
    reverse_hebrew('דלת') as reversed;

-- 5. TEST SEARCH FOR REVERSED HEBREW
SELECT '=== 5. SEARCH FOR תלד (reversed door) ===' as step;
SELECT COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc ILIKE '%תלד%';

-- 6. TEST SEARCH FOR NORMAL HEBREW
SELECT '=== 6. SEARCH FOR דלת (normal door) ===' as step;
SELECT COUNT(*) as count
FROM catalog_items
WHERE cat_num_desc ILIKE '%דלת%';

-- 7. TEST SMART SEARCH FUNCTION
SELECT '=== 7. TEST SMART SEARCH ===' as step;
SELECT COUNT(*) FROM smart_parts_search(free_query_param := 'דלת');

-- 8. CHECK MAKE VALUES
SELECT '=== 8. CHECK MAKE VALUES ===' as step;
SELECT DISTINCT make, COUNT(*) as count
FROM catalog_items
WHERE make IS NOT NULL
GROUP BY make
ORDER BY count DESC
LIMIT 10;

-- 9. TEST SEARCH WITH TOYOTA
SELECT '=== 9. TEST TOYOTA SEARCH ===' as step;
SELECT COUNT(*) FROM smart_parts_search(make_param := 'טויוטה');

-- 10. CHECK IF CAT_NUM_DESC HAS DATA
SELECT '=== 10. CHECK CAT_NUM_DESC ===' as step;
SELECT 
    COUNT(*) as total,
    COUNT(cat_num_desc) as has_desc,
    COUNT(CASE WHEN cat_num_desc != '' THEN 1 END) as non_empty_desc
FROM catalog_items;

-- 11. DIRECT SQL TEST (bypass function)
SELECT '=== 11. DIRECT SQL TEST ===' as step;
SELECT id, reverse_hebrew(cat_num_desc) as cat_num_desc, make, price
FROM catalog_items
WHERE cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%תלד%'
LIMIT 5;

-- 12. CHECK PART_NAME COLUMN
SELECT '=== 12. CHECK PART_NAME ===' as step;
SELECT 
    COUNT(*) as total,
    COUNT(part_name) as has_part_name,
    COUNT(DISTINCT part_name) as unique_parts
FROM catalog_items;

-- 13. CHECK FOR ANY HEBREW TEXT
SELECT '=== 13. ANY HEBREW TEXT? ===' as step;
SELECT COUNT(*) as has_hebrew
FROM catalog_items
WHERE cat_num_desc ~ '[א-ת]';

-- 14. SHOW ACTUAL FUNCTION CODE
SELECT '=== 14. SMART SEARCH FUNCTION CODE ===' as step;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'smart_parts_search';