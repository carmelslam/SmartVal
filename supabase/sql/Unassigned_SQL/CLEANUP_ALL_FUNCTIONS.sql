-- CLEANUP ALL FUNCTIONS - Aggressive removal of all smart_parts_search variants
-- Run this FIRST before Phase 1

SELECT '=== AGGRESSIVE FUNCTION CLEANUP ===' as section;

-- Find all smart_parts_search functions with their exact signatures
SELECT 
    'Current smart_parts_search functions:' as info,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    'DROP FUNCTION ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;' as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'smart_parts_search'
AND n.nspname = 'public';

-- Drop all smart_parts_search functions using dynamic SQL
DO $$
DECLARE
    func_record RECORD;
    drop_cmd TEXT;
BEGIN
    -- Get all smart_parts_search functions and drop them
    FOR func_record IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'smart_parts_search'
        AND n.nspname = 'public'
    LOOP
        drop_cmd := 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ') CASCADE';
        EXECUTE drop_cmd;
        RAISE NOTICE 'Dropped function: %', drop_cmd;
    END LOOP;
END $$;

-- Verify cleanup
SELECT 
    'Functions after cleanup:' as info,
    COUNT(*) as remaining_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'smart_parts_search'
AND n.nspname = 'public';

SELECT '=== CLEANUP COMPLETE - Now run Phase 1 ===' as section;