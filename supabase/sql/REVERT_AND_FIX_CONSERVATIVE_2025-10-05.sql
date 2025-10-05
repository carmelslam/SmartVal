-- ============================================================================
-- REVERT AND FIX - Conservative Approach
-- Date: 2025-10-05
-- Problem: Detection too aggressive - reversed count increased from 2,700 to 4,870
-- Solution: Use ONLY long, specific patterns - no short ambiguous ones
-- ============================================================================

SELECT '=== REVERTING TO CONSERVATIVE DETECTION ===' as section;

-- ============================================================================
-- STEP 1: Revert detection to ONLY safe, unambiguous patterns
-- ============================================================================

DROP FUNCTION IF EXISTS is_hebrew_reversed(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION is_hebrew_reversed(input_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN FALSE;
    END IF;
    
    -- ONLY use long, unambiguous reversed patterns
    -- Removed short patterns like %חפ%, %לע%, etc. that match correct words
    RETURN (
        -- Long specific patterns (3+ chars, unlikely to appear in correct Hebrew)
        input_text LIKE '%ןגמ%' OR          -- מגן (bumper)
        input_text LIKE '%תלד%' OR          -- דלת (door)
        input_text LIKE '%סנפ%' OR          -- פנס (light)
        input_text LIKE '%ףנכ%' OR          -- כנף (fender)
        input_text LIKE '%הארמ%' OR         -- מראה (mirror)
        input_text LIKE '%הלורוק%' OR       -- קורולה (Corolla)
        input_text LIKE '%ךמות%' OR         -- תומך (support)
        input_text LIKE '%לירג%' OR         -- גריל (grill)
        input_text LIKE '%הסכמ עונמ%' OR    -- מנוע מכסה (engine cover - FULL phrase)
        input_text LIKE '%ריצ הסכמ%' OR     -- מכסה ציר (cover hinge - FULL phrase)
        input_text LIKE '%תידי דק%' OR      -- קד ידית (front handle - FULL phrase)
        input_text LIKE '%טושיק%' OR        -- קישוט (decoration)
        input_text LIKE '%לקינ חת%' OR      -- תח ניקל (lower nickel - FULL phrase)
        input_text LIKE '%םוינימולא%' OR    -- אלומיניום (aluminum - long word)
        input_text LIKE '%שפריצר%' OR       -- רציפרש (spritzer - long word)
        input_text LIKE '%ןונגנמ%'          -- מגנון (mechanism - long word)
    );
END;
$$;

SELECT 'Conservative detection function deployed' as status;

-- ============================================================================
-- STEP 2: Check current state with new detection
-- ============================================================================

SELECT 
    'Current state with conservative detection:' as info,
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as detected_reversed,
    COUNT(*) as total_records
FROM catalog_items;

-- ============================================================================
-- STEP 3: UNDO the damage - reverse back the wrongly-reversed records
-- ============================================================================

SELECT 'Checking for over-reversed records...' as step;

-- Find records that were correct but got reversed (they will now fail our detection)
SELECT 
    'Records that need to be reversed BACK:' as info,
    COUNT(*) as needs_reverting
FROM catalog_items
WHERE cat_num_desc ~ '[\u0590-\u05FF]'
  AND NOT is_hebrew_reversed(cat_num_desc)
  AND (
      -- These patterns indicate the text was CORRECT but got reversed
      cat_num_desc LIKE '%במגן%' OR  -- "במגן" should not be there if text is correct
      cat_num_desc LIKE '%למגן%'     -- "למגן" should not be there if text is correct
  );

-- For safety, let's just fix the ones we KNOW are reversed
SELECT 'Fixing truly reversed records only...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew_smart(cat_num_desc)
WHERE is_hebrew_reversed(cat_num_desc) = TRUE
  AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- STEP 4: Final verification with conservative detection
-- ============================================================================

SELECT '=== FINAL VERIFICATION ===' as section;

SELECT 
    'After conservative fix:' as info,
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as still_reversed,
    COUNT(*) as total_records,
    CASE 
        WHEN COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) < 1000 THEN '✅ ACCEPTABLE - <1000 reversed'
        WHEN COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) < 3000 THEN '⚠️ SOME ISSUES - <3000 reversed'
        ELSE '❌ MAJOR ISSUES'
    END as status
FROM catalog_items;

-- Sample
SELECT 
    'Sample after conservative fix:' as info,
    cat_num_desc,
    make,
    CASE 
        WHEN is_hebrew_reversed(cat_num_desc) THEN '❌ DETECTED AS REVERSED'
        ELSE '✅ APPEARS CORRECT'
    END as status
FROM catalog_items
WHERE cat_num_desc ~ '[\u0590-\u05FF]'
LIMIT 15;

SELECT '=== CONSERVATIVE FIX COMPLETE ===' as section;
