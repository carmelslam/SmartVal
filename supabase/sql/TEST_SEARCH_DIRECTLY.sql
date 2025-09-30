-- TEST SEARCH DIRECTLY IN SUPABASE
-- Let's test if the function works when called directly

-- Test 1: Simple Hebrew search for פנס
SELECT 'Test 1: Searching for פנס' as test;
SELECT id, cat_num_desc, supplier_name, pcode, price, make
FROM smart_parts_search(free_query_param := 'פנס')
LIMIT 5;

-- Test 2: Try with the JSON wrapper
SELECT 'Test 2: JSON wrapper with פנס' as test;
SELECT id, cat_num_desc, supplier_name, pcode, price, make
FROM simple_parts_search('{"free_query": "פנס"}'::jsonb)
LIMIT 5;

-- Test 3: Direct table search to confirm data exists
SELECT 'Test 3: Direct search in catalog_items' as test;
SELECT id, cat_num_desc, supplier_name, pcode, price, make
FROM catalog_items
WHERE cat_num_desc ILIKE '%פנס%'
LIMIT 5;

-- Test 4: Check the actual parameters being sent
SELECT 'Test 4: Full parameter test' as test;
SELECT * FROM smart_parts_search(
    car_plate := '221-84-003',
    make_param := 'טויוטה',
    free_query_param := 'פנס',
    limit_results := 10
);

-- Test 5: Minimal search - just free query
SELECT 'Test 5: Minimal search' as test;
SELECT * FROM smart_parts_search(
    free_query_param := 'פנס'
);