-- DROP ALL SMART_PARTS_SEARCH FUNCTIONS
-- Remove all existing function overloads to prevent conflicts

SELECT '=== DROPPING ALL SEARCH FUNCTIONS ===' as section;

-- Query to see all existing smart_parts_search functions
SELECT 
    'Existing functions:' as info,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'smart_parts_search'
AND n.nspname = 'public';

-- Drop all possible variations
DROP FUNCTION IF EXISTS smart_parts_search() CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) CASCADE;

-- Drop with specific parameter names (common variations)
DROP FUNCTION IF EXISTS smart_parts_search(
    make_param TEXT,
    model_param TEXT,
    free_query_param TEXT,
    part_param TEXT,
    oem_param TEXT,
    family_param TEXT,
    limit_results INTEGER
) CASCADE;

DROP FUNCTION IF EXISTS smart_parts_search(
    make_param TEXT,
    model_param TEXT,
    free_query_param TEXT,
    limit_results INTEGER
) CASCADE;

-- Verify all functions are dropped
SELECT 
    'Functions after cleanup:' as info,
    COUNT(*) as remaining_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'smart_parts_search'
AND n.nspname = 'public';

SELECT '=== ALL SEARCH FUNCTIONS DROPPED ===' as section;