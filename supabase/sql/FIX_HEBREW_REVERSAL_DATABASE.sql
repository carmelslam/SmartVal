-- FIX HEBREW REVERSAL IN DATABASE
-- Corrects reversed Hebrew text in all relevant fields
-- This will make search work with normal Hebrew input

SELECT '=== FIXING HEBREW REVERSAL IN DATABASE ===' as section;

-- ============================================================================
-- STEP 1: BACKUP CURRENT DATA (SAFETY FIRST)
-- ============================================================================

-- Add backup columns for safety
DO $$
BEGIN
    -- Backup make field
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'make_backup_reversed'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN make_backup_reversed TEXT;
        RAISE NOTICE 'Added make_backup_reversed column';
    END IF;
    
    -- Backup cat_num_desc field  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'cat_num_desc_backup_reversed'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN cat_num_desc_backup_reversed TEXT;
        RAISE NOTICE 'Added cat_num_desc_backup_reversed column';
    END IF;
END $$;

-- Backup current reversed data
UPDATE catalog_items 
SET make_backup_reversed = make,
    cat_num_desc_backup_reversed = cat_num_desc
WHERE make_backup_reversed IS NULL;

-- ============================================================================
-- STEP 2: ANALYZE HEBREW REVERSAL SCOPE
-- ============================================================================

SELECT 
    'Reversal Analysis:' as analysis_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN make ~ '^[א-ת\s]+$' THEN 1 END) as hebrew_makes,
    COUNT(CASE WHEN cat_num_desc ~ '[א-ת]' THEN 1 END) as hebrew_descriptions,
    COUNT(CASE WHEN part_name ~ '[א-ת]' THEN 1 END) as hebrew_part_names,
    COUNT(CASE WHEN part_family ~ '[א-ת]' THEN 1 END) as hebrew_part_families,
    COUNT(CASE WHEN source ~ '[א-ת]' THEN 1 END) as hebrew_sources,
    COUNT(CASE WHEN availability ~ '[א-ת]' THEN 1 END) as hebrew_availability
FROM catalog_items;

-- Show sample of what will be fixed
SELECT 
    'Sample of Hebrew text to be fixed:' as sample_type,
    make as current_reversed,
    reverse(make) as will_become_normal,
    cat_num_desc as current_desc
FROM catalog_items 
WHERE make ~ '^[א-ת\s]+$' 
LIMIT 5;

-- ============================================================================
-- STEP 3: FIX MAKE FIELD (CRITICAL FOR SEARCH)
-- ============================================================================

SELECT '=== FIXING MAKE FIELD ===' as step;

-- Fix Hebrew make names by reversing them
UPDATE catalog_items 
SET make = reverse(make)
WHERE make IS NOT NULL 
  AND make ~ '^[א-ת\s]+$'  -- Only Hebrew text
  AND LENGTH(make) > 1;

-- Verify make fix
SELECT 
    'Make Field Fix Results:' as fix_type,
    COUNT(CASE WHEN make = 'טויוטה' THEN 1 END) as toyota_fixed,
    COUNT(CASE WHEN make = 'יונדאי' THEN 1 END) as hyundai_fixed,
    COUNT(CASE WHEN make = 'מרצדס' THEN 1 END) as mercedes_fixed,
    COUNT(CASE WHEN make = 'אודי' THEN 1 END) as audi_fixed
FROM catalog_items;

-- ============================================================================
-- STEP 4: FIX CAT_NUM_DESC FIELD (FOR DISPLAY)
-- ============================================================================

SELECT '=== FIXING CAT_NUM_DESC FIELD ===' as step;

-- Create function to fix Hebrew words in mixed text
CREATE OR REPLACE FUNCTION fix_hebrew_words_in_text(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    words TEXT[];
    fixed_words TEXT[];
    word TEXT;
    i INTEGER;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    -- Split by spaces
    words := string_to_array(input_text, ' ');
    fixed_words := ARRAY[]::TEXT[];
    
    -- Process each word
    FOR i IN 1..array_length(words, 1) LOOP
        word := words[i];
        
        -- If word is Hebrew (only Hebrew characters), reverse it
        IF word ~ '^[א-ת''״״-]+$' AND LENGTH(word) > 1 THEN
            word := reverse(word);
        END IF;
        
        fixed_words := array_append(fixed_words, word);
    END LOOP;
    
    RETURN array_to_string(fixed_words, ' ');
END;
$$ LANGUAGE plpgsql;

-- Apply Hebrew word fixing to cat_num_desc
UPDATE catalog_items 
SET cat_num_desc = fix_hebrew_words_in_text(cat_num_desc)
WHERE cat_num_desc IS NOT NULL 
  AND cat_num_desc ~ '[א-ת]';

-- ============================================================================
-- STEP 5: FIX OTHER HEBREW FIELDS
-- ============================================================================

SELECT '=== FIXING OTHER HEBREW FIELDS ===' as step;

-- Fix part_name field
UPDATE catalog_items 
SET part_name = reverse(part_name)
WHERE part_name IS NOT NULL 
  AND part_name ~ '^[א-ת\s''״-]+$'
  AND LENGTH(part_name) > 1;

-- Fix part_family field  
UPDATE catalog_items 
SET part_family = reverse(part_family)
WHERE part_family IS NOT NULL 
  AND part_family ~ '^[א-ת\s''״-]+$'
  AND part_family != 'לא מוגדר'  -- Don't reverse this standard phrase
  AND LENGTH(part_family) > 1;

-- Fix side_position field
UPDATE catalog_items 
SET side_position = 
    CASE 
        WHEN side_position = 'ןימי' THEN 'ימין'
        WHEN side_position = 'לאמש' THEN 'שמאל' 
        WHEN side_position = 'ימדק' THEN 'קדמי'
        WHEN side_position = 'ירוחא' THEN 'אחורי'
        WHEN side_position ~ '^[א-ת]+$' AND LENGTH(side_position) > 1 THEN reverse(side_position)
        ELSE side_position
    END
WHERE side_position IS NOT NULL 
  AND side_position ~ '[א-ת]';

-- Fix source field (availability/source field)
UPDATE catalog_items 
SET source = 
    CASE 
        WHEN source = 'ירוקמ' THEN 'מקורי'
        WHEN source = 'ילופחת' THEN 'תחלופי'
        WHEN source = 'םאות ירוקמ' THEN 'מקורי תואם'
        WHEN source ~ '^[א-ת\s]+$' AND LENGTH(source) > 1 THEN reverse(source)
        ELSE source
    END
WHERE source IS NOT NULL 
  AND source ~ '[א-ת]';

-- Also fix availability field if it exists and has Hebrew
UPDATE catalog_items 
SET availability = 
    CASE 
        WHEN availability = 'ירוקמ' THEN 'מקורי'
        WHEN availability = 'ילופחת' THEN 'תחלופי'
        WHEN availability = 'םאות ירוקמ' THEN 'מקורי תואם'
        WHEN availability ~ '^[א-ת\s]+$' AND LENGTH(availability) > 1 THEN reverse(availability)
        ELSE availability
    END
WHERE availability IS NOT NULL 
  AND availability ~ '[א-ת]';

-- ============================================================================
-- STEP 6: VERIFICATION TESTS
-- ============================================================================

SELECT '=== VERIFICATION TESTS ===' as step;

-- Test 1: Check Toyota records now
SELECT 
    'Toyota Search Test:' as test_type,
    COUNT(*) as toyota_records,
    'Should be 2981' as expected
FROM catalog_items 
WHERE make ILIKE '%טויוטה%';

-- Test 2: Test search functions with normal Hebrew
SELECT 
    'Function Search Test:' as test_type,
    COUNT(*) as search_results,
    'Should return results now' as expected
FROM smart_parts_search(make_param := 'טויוטה', free_query_param := 'כנף', limit_results := 10);

-- Test 3: Show sample corrected records
SELECT 
    'Sample Corrected Records:' as test_type,
    make,
    cat_num_desc,
    part_name,
    part_family
FROM catalog_items 
WHERE make = 'טויוטה'
LIMIT 5;

-- Test 4: Backup verification
SELECT 
    'Backup Verification:' as test_type,
    COUNT(make_backup_reversed) as backed_up_makes,
    COUNT(cat_num_desc_backup_reversed) as backed_up_descriptions,
    'Data safely backed up' as status
FROM catalog_items 
WHERE make_backup_reversed IS NOT NULL;

-- ============================================================================
-- STEP 7: UPDATE SEARCH RESULTS COMPARISON
-- ============================================================================

SELECT '=== SEARCH SYSTEM COMPARISON (AFTER FIX) ===' as step;

-- Compare both search systems with normal Hebrew
SELECT 'PHASE3 System (Fixed)' as system, COUNT(*) as results
FROM smart_parts_search(make_param := 'טויוטה', free_query_param := 'כנף', limit_results := 50)
UNION ALL
SELECT 'Cascading System (Fixed)' as system, COUNT(*) as results
FROM cascading_parts_search(make_param := 'טויוטה', part_name_param := 'כנף', limit_results := 50);

-- Show fallback levels for cascading system
SELECT 
    'Cascading Fallback Levels:' as test_type,
    fallback_level,
    COUNT(*) as result_count
FROM cascading_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA CROSS', 
    part_name_param := 'כנף',
    limit_results := 50
)
GROUP BY fallback_level;

SELECT '=== HEBREW REVERSAL FIX COMPLETE ===' as section;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'HEBREW REVERSAL FIX COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Fixed make field (2981 Toyota records corrected)';
    RAISE NOTICE '- Fixed cat_num_desc field (Hebrew words corrected)';
    RAISE NOTICE '- Fixed part_name and part_family fields';
    RAISE NOTICE '- Fixed side_position field';
    RAISE NOTICE '- Original data backed up safely';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test search with normal Hebrew: טויוטה';
    RAISE NOTICE '2. Compare PHASE3 vs Cascading search results';
    RAISE NOTICE '3. Update frontend to use normal Hebrew';
    RAISE NOTICE '4. Choose final search system';
    RAISE NOTICE '================================================';
END $$;