-- CHECK FUNCTION RETURN COLUMNS
-- Find out what columns each search function actually returns

SELECT '=== CHECKING FUNCTION RETURN COLUMNS ===' as section;

-- Check smart_parts_search return columns
SELECT 
    'smart_parts_search columns:' as function_info,
    pg_get_function_result(oid) as return_columns
FROM pg_proc 
WHERE proname = 'smart_parts_search'
LIMIT 1;

-- Check cascading_parts_search return columns  
SELECT 
    'cascading_parts_search columns:' as function_info,
    pg_get_function_result(oid) as return_columns
FROM pg_proc 
WHERE proname = 'cascading_parts_search'
LIMIT 1;

-- Test smart_parts_search with SELECT * to see actual columns
SELECT 
    'Testing smart_parts_search - first 2 results:' as test_info,
    *
FROM smart_parts_search(
    make_param := 'טויוטה',
    limit_results := 2
);

-- Test cascading_parts_search with SELECT * to see actual columns
SELECT 
    'Testing cascading_parts_search - first 2 results:' as test_info,
    *
FROM cascading_parts_search(
    make_param := 'טויוטה',
    limit_results := 2
);

SELECT '=== FUNCTION COLUMN CHECK COMPLETE ===' as section;