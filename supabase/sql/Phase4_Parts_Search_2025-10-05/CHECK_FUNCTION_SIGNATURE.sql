-- Quick check: What parameters does smart_parts_search actually have?

SELECT 
    'smart_parts_search signature:' as info,
    pg_get_function_arguments(oid) as actual_parameters
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- Also show the beginning of the function to see parameter names
SELECT 
    'Function source preview:' as info,
    substring(prosrc, 1, 1000) as first_1000_chars
FROM pg_proc 
WHERE proname = 'smart_parts_search';
