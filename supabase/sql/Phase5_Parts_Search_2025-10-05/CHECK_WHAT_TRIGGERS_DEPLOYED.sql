-- Check what triggers are actually deployed and what they do

-- Show all triggers on catalog_items
SELECT 
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status,
    pg_get_triggerdef(oid) as full_definition
FROM pg_trigger 
WHERE tgrelid = 'catalog_items'::regclass
ORDER BY tgname;

-- Show what functions exist for extraction
SELECT 
    proname as function_name,
    'EXISTS' as status
FROM pg_proc 
WHERE proname LIKE '%extract%' 
   OR proname LIKE '%auto_fix%'
   OR proname LIKE '%reverse%'
ORDER BY proname;
