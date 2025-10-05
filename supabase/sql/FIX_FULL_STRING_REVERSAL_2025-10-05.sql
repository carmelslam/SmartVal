-- ============================================================================
-- FIX FULL STRING REVERSAL - Complete character reversal
-- Date: 2025-10-05
-- Problem: Entire strings reversed including spaces/punctuation
-- Example: "מ" יק' נרכ בקינ רוה - ימ" should be "חור ניקוב כרנב קד' מי"
-- ============================================================================

SELECT '=== FIXING FULL STRING REVERSAL ===' as section;

-- ============================================================================
-- STEP 1: Detect FULL string reversal (different from word reversal)
-- ============================================================================

DROP FUNCTION IF EXISTS is_full_string_reversed(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION is_full_string_reversed(input_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Detect patterns that indicate FULL string reversal
    -- Look for reversed patterns that appear at START of string
    RETURN (
        -- Pattern 1: Starts with reversed "גריל" = "לירג"
        input_text LIKE 'לירג %' OR
        -- Pattern 2: Starts with reversed "תומך" = "ךמות"
        input_text LIKE 'ךמות %' OR
        -- Pattern 3: Starts with reversed common words
        input_text LIKE 'ריצ %' OR        -- reversed "ציר"
        input_text LIKE 'טושיק %' OR      -- reversed "קישוט"
        input_text LIKE 'הסכמ %' OR       -- reversed "מכסה"
        -- Pattern 4: Has year at END (wrong - should be at start after model)
        input_text ~ '\d{2}-\d{2}$' OR
        -- Pattern 5: Ends with model name (wrong - model should be in middle)
        input_text ~ 'הלורוק \d{2}-\d{2}$' OR
        -- Pattern 6: Has "(reversed parentheses)" like "(םלשומ)" 
        input_text LIKE '%(םלשומ)%' OR     -- reversed "(מושלם)"
        input_text LIKE '%(ראופמ)%' OR     -- reversed "(מפואר)"
        -- Pattern 7: Contains reversed "ניקלים" = "םילקינ"
        input_text LIKE '%םילקינ%'
    );
END;
$$;

-- ============================================================================
-- STEP 2: Check how many need full reversal
-- ============================================================================

SELECT 'Checking for full string reversal:' as info;

SELECT 
    COUNT(CASE WHEN is_full_string_reversed(cat_num_desc) THEN 1 END) as needs_full_reversal,
    COUNT(*) as total_records
FROM catalog_items;

-- Sample of records needing full reversal
SELECT 
    'Sample needing FULL reversal:' as info,
    cat_num_desc as current_wrong,
    reverse(cat_num_desc) as will_become_correct
FROM catalog_items
WHERE is_full_string_reversed(cat_num_desc) = TRUE
LIMIT 10;

-- ============================================================================
-- STEP 3: Apply FULL reversal (simple reverse of entire string)
-- ============================================================================

SELECT 'Applying full string reversal...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse(cat_num_desc)
WHERE is_full_string_reversed(cat_num_desc) = TRUE
  AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

SELECT '=== VERIFICATION ===' as section;

SELECT 
    'After full string reversal:' as info,
    COUNT(CASE WHEN is_full_string_reversed(cat_num_desc) THEN 1 END) as still_needs_reversal,
    COUNT(*) as total_records
FROM catalog_items;

-- Sample of corrected records
SELECT 
    'Sample of corrected records:' as info,
    cat_num_desc
FROM catalog_items
WHERE cat_num_desc ~ '[\u0590-\u05FF]'
  AND cat_num_desc LIKE '%קורולה%'
LIMIT 10;

SELECT '=== FULL STRING REVERSAL FIX COMPLETE ===' as section;
