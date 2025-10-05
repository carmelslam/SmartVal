-- ============================================================================
-- FIX REMAINING HEBREW REVERSAL - Complete the fix
-- Date: 2025-10-05
-- Problem: 2,700 records still reversed (5.59%) - missing patterns
-- Solution: Enhanced detection with all reversed patterns
-- ============================================================================

SELECT '=== FIXING REMAINING 2,700 REVERSED RECORDS ===' as section;

-- ============================================================================
-- STEP 1: Update detection function with ALL reversed patterns
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
    
    -- Check for ALL reversed patterns (original + newly discovered)
    RETURN (
        -- Original patterns
        input_text LIKE '%ןגמ%' OR      -- מגן
        input_text LIKE '%תלד%' OR      -- דלת
        input_text LIKE '%סנפ%' OR      -- פנס
        input_text LIKE '%ףנכ%' OR      -- כנף
        input_text LIKE '%הארמ%' OR     -- מראה
        input_text LIKE '%הלורוק%' OR   -- קורולה
        input_text LIKE '%ךמות%' OR     -- תומך
        input_text LIKE '%לירג%' OR     -- גריל
        input_text LIKE '%הסכמ%' OR     -- מכסה
        input_text LIKE '%ריצ%' OR      -- ציר
        input_text LIKE '%תידי%' OR     -- ידית
        
        -- Newly discovered patterns
        input_text LIKE '%עונמ%' OR     -- מנוע (reversed "engine")
        input_text LIKE '%טושיק%' OR    -- קישוט (reversed "trim/decoration")
        input_text LIKE '%לקינ%' OR     -- ניקל (reversed "nickel")
        input_text LIKE '%חפ%' OR       -- פח (reversed "sheet metal")
        input_text LIKE '%הנופכ%' OR    -- כנפה (reversed wing/fender)
        input_text LIKE '%רפוב%' OR     -- בופר (reversed bumper)
        input_text LIKE '%םוינימולא%' OR -- אלומיניום (reversed aluminum)
        input_text LIKE '%חת%' OR       -- תח (reversed "lower")
        input_text LIKE '%לע%' OR       -- על (reversed "upper")
        input_text LIKE '%ציח%' OR      -- חיצ (reversed "external")
        input_text LIKE '%ימינפ%' OR    -- פנימי (reversed "internal")
        input_text LIKE '%שפריצר%'      -- רציפרש (reversed "spritzer/washer")
    );
END;
$$;

-- ============================================================================
-- STEP 2: Count before final fix
-- ============================================================================

SELECT 'Before final fix:' as info;

SELECT 
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as reversed_count,
    COUNT(*) as total_records
FROM catalog_items;

-- ============================================================================
-- STEP 3: Fix ALL remaining reversed records
-- ============================================================================

SELECT 'Fixing remaining reversed cat_num_desc...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew_smart(cat_num_desc)
WHERE is_hebrew_reversed(cat_num_desc) = TRUE
  AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- STEP 4: Fix remaining reversed makes (if any)
-- ============================================================================

SELECT 'Fixing remaining reversed makes...' as step;

UPDATE catalog_items
SET make = reverse_hebrew_smart(make)
WHERE is_hebrew_reversed(make) = TRUE
  AND make IS NOT NULL;

-- ============================================================================
-- STEP 5: Fix remaining reversed models (if any)
-- ============================================================================

SELECT 'Fixing remaining reversed models...' as step;

UPDATE catalog_items
SET model = reverse_hebrew_smart(model)
WHERE is_hebrew_reversed(model) = TRUE
  AND model IS NOT NULL;

-- ============================================================================
-- STEP 6: Final verification
-- ============================================================================

SELECT '=== FINAL VERIFICATION ===' as section;

SELECT 
    'After final fix:' as info,
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as still_reversed,
    COUNT(CASE WHEN cat_num_desc ~ '[\u0590-\u05FF]' THEN 1 END) as has_hebrew,
    COUNT(*) as total_records,
    CASE 
        WHEN COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) = 0 THEN '✅ PERFECT - ALL FIXED'
        WHEN COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) < 50 THEN '✅ EXCELLENT - <50 REMAINING'
        WHEN COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) < 500 THEN '⚠️ GOOD - <500 REMAINING'
        ELSE '❌ STILL HAS ISSUES'
    END as status
FROM catalog_items;

-- Sample of NOW-FIXED records
SELECT 
    'Sample of NOW-FIXED records:' as info,
    cat_num_desc,
    make,
    model
FROM catalog_items
WHERE cat_num_desc ~ '[\u0590-\u05FF]'
  AND (cat_num_desc LIKE '%מכסה%' OR cat_num_desc LIKE '%ציר%' OR cat_num_desc LIKE '%מנוע%')
LIMIT 10;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
    reversed_count INTEGER;
BEGIN
    SELECT COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END)
    INTO reversed_count
    FROM catalog_items;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FINAL HEBREW FIX SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Started with: 11,590 reversed (24 percent)';
    RAISE NOTICE 'After first fix: 2,700 reversed (5.59 percent)';
    RAISE NOTICE 'After final fix: % reversed', reversed_count;
    
    IF reversed_count = 0 THEN
        RAISE NOTICE 'STATUS: ✅ PERFECT - 100 percent Hebrew text fixed!';
    ELSIF reversed_count < 50 THEN
        RAISE NOTICE 'STATUS: ✅ EXCELLENT - 99.9 percent fixed';
    ELSIF reversed_count < 500 THEN
        RAISE NOTICE 'STATUS: ⚠️ GOOD - 99 percent fixed';
    ELSE
        RAISE NOTICE 'STATUS: ⚠️ % still need fixing', reversed_count;
    END IF;
    
    RAISE NOTICE '==========================================';
END $$;

SELECT '=== FINAL FIX COMPLETE ===' as section;
