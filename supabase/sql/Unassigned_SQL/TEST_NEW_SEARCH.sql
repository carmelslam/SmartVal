-- Check ALL smart_parts_search functions that exist
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'smart_parts_search'
ORDER BY oid;
