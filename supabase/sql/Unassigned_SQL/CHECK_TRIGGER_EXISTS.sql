-- Check if the extraction trigger exists

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'catalog_items'
  AND trigger_name = 'trigger_extract_model_and_year';

-- Check if the function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'extract_model_and_year';
