-- Get the EXACT parameter list for smart_parts_search

SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as parameters,
    pg_get_function_result(oid) as returns
FROM pg_proc 
WHERE proname = 'smart_parts_search';

-- Also get parameter names by parsing the function definition
SELECT 
    p.proname as function_name,
    p.pronargs as number_of_parameters,
    p.proargnames as parameter_names,
    p.proargtypes::regtype[] as parameter_types
FROM pg_proc p
WHERE p.proname = 'smart_parts_search';
