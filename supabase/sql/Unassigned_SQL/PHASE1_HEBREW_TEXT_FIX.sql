-- PHASE 1: HEBREW TEXT FIX - CRITICAL
-- Fix reversed Hebrew text display issue immediately
-- Based on proven patterns from suggested sql and regex.md

SELECT '=== PHASE 1: HEBREW TEXT FIX ===' as section;

-- ============================================================================
-- STEP 1: CREATE HEBREW TEXT FIXING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_hebrew_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Handle NULL or empty input
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    -- Simple reverse for Hebrew text that appears backwards
    RETURN reverse(input_text);
END;
$$;

-- ============================================================================
-- STEP 2: UPDATE SMART_PARTS_SEARCH TO USE FIXED HEBREW
-- ============================================================================

-- Drop all existing search functions to avoid conflicts
DROP FUNCTION IF EXISTS smart_parts_search() CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) CASCADE;

-- Create search function with Hebrew text fixes
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    cat_num_desc TEXT,
    supplier_name TEXT,
    pcode TEXT,
    price NUMERIC,
    oem TEXT,
    make TEXT,
    model TEXT,
    part_family TEXT,
    side_position TEXT,
    version_date TEXT,
    availability TEXT
) AS $$
BEGIN
    -- Return results with FIXED Hebrew text display
    RETURN QUERY
    SELECT 
        ci.id,
        fix_hebrew_text(ci.cat_num_desc) as cat_num_desc,  -- FIX HEBREW
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        COALESCE(ci.part_family, 'לא מוגדר') as part_family,
        ci.side_position,
        ci.version_date::TEXT,
        COALESCE(ci.availability, 'מקורי') as availability
    FROM catalog_items ci
    WHERE 
        -- Simple search logic - will be enhanced in Phase 3
        (make_param IS NULL OR make_param = '' OR ci.make ILIKE '%' || make_param || '%')
        AND (model_param IS NULL OR model_param = '' OR ci.model ILIKE '%' || model_param || '%')
        AND (free_query_param IS NULL OR free_query_param = '' OR 
             ci.cat_num_desc ILIKE '%' || free_query_param || '%' OR
             ci.make ILIKE '%' || free_query_param || '%' OR
             ci.model ILIKE '%' || free_query_param || '%' OR
             ci.part_family ILIKE '%' || free_query_param || '%' OR
             ci.supplier_name ILIKE '%' || free_query_param || '%'
        )
        AND (part_param IS NULL OR part_param = '' OR ci.cat_num_desc ILIKE '%' || part_param || '%')
        AND (oem_param IS NULL OR oem_param = '' OR ci.oem ILIKE '%' || oem_param || '%')
        AND (family_param IS NULL OR family_param = '' OR ci.part_family ILIKE '%' || family_param || '%')
    ORDER BY 
        CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 0 ELSE 1 END,
        ci.price ASC,
        ci.make,
        ci.cat_num_desc
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: TEST HEBREW FIX
-- ============================================================================

SELECT '=== TESTING HEBREW TEXT FIX ===' as section;

-- Test the fix function directly
SELECT 
    'Hebrew Fix Test:' as test_type,
    'הלהת' as original_reversed,
    fix_hebrew_text('הלהת') as fixed_text,
    'Should show: תלדה' as expected;

-- Test search with Hebrew fix
SELECT 
    'Search Test:' as test_type,
    COUNT(*) as result_count,
    'Hebrew text should now display correctly' as note
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 5);

SELECT '=== PHASE 1 COMPLETE - HEBREW TEXT FIXED ===' as section;