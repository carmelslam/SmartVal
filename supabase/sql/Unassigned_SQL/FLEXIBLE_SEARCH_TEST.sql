-- FLEXIBLE SEARCH ISSUE INVESTIGATION
-- Testing "טויוטה יפן" vs "טויוטה" search behavior

SELECT '=== FLEXIBLE SEARCH DIAGNOSTIC ===' as section;

-- Test 1: Single term "טויוטה" 
SELECT 
    'Test 1 - Single term (טויוטה):' as test_type,
    COUNT(*) as result_count
FROM catalog_items
WHERE make ILIKE '%טויוטה%';

-- Test 2: Full string "טויוטה יפן" in make field
SELECT 
    'Test 2 - Full string in make (טויוטה יפן):' as test_type,
    COUNT(*) as result_count
FROM catalog_items
WHERE make ILIKE '%טויוטה יפן%';

-- Test 3: Check if any makes contain "יפן"
SELECT 
    'Test 3 - Any makes with יפן:' as test_type,
    COUNT(*) as result_count
FROM catalog_items
WHERE make ILIKE '%יפן%';

-- Test 4: Sample makes to see actual content
SELECT 
    'Test 4 - Sample makes containing טויוטה:' as test_type,
    DISTINCT make,
    COUNT(*) as count
FROM catalog_items
WHERE make ILIKE '%טויוטה%'
GROUP BY make
ORDER BY count DESC
LIMIT 10;

-- Test 5: Check if "יפן" appears in other fields for Toyota
SELECT 
    'Test 5 - יפן in any field for Toyota:' as test_type,
    COUNT(*) as result_count
FROM catalog_items
WHERE make ILIKE '%טויוטה%' 
  AND (cat_num_desc ILIKE '%יפן%' 
    OR model ILIKE '%יפן%' 
    OR supplier_name ILIKE '%יפן%'
    OR comments ILIKE '%יפן%');

-- Test 6: Sample data where יפן appears
SELECT 
    'Test 6 - Sample records with יפן:' as test_type,
    id,
    make,
    model,
    cat_num_desc,
    supplier_name
FROM catalog_items
WHERE cat_num_desc ILIKE '%יפן%' 
   OR model ILIKE '%יפן%' 
   OR supplier_name ILIKE '%יפן%'
   OR make ILIKE '%יפן%'
   OR comments ILIKE '%יפן%'
LIMIT 5;

-- Test 7: Test current smart_parts_search function behavior
SELECT 
    'Test 7 - Current function single term:' as test_type,
    COUNT(*) as result_count
FROM smart_parts_search(make_param := 'טויוטה');

-- Test 8: Test current smart_parts_search function with both terms
SELECT 
    'Test 8 - Current function both terms:' as test_type,
    COUNT(*) as result_count  
FROM smart_parts_search(make_param := 'טויוטה יפן');

-- Test 9: Test split terms separately 
SELECT 
    'Test 9 - Split search (make=טויוטה, free=יפן):' as test_type,
    COUNT(*) as result_count
FROM smart_parts_search(make_param := 'טויוטה', free_query_param := 'יפן');

SELECT '=== ANALYSIS COMPLETE ===' as section;