-- Check which version of the function is currently deployed

-- Show the function definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'smart_parts_search'
AND n.nspname = 'public';

-- Test if it works with simple search
SELECT 'Test with כנף only' as test;
SELECT cat_num_desc, make, model
FROM smart_parts_search(free_query_param := 'כנף')
LIMIT 3;
