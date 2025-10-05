-- FIX HEBREW REVERSAL IN BATCHES - TIMEOUT SAFE
-- Processes records in small batches to avoid timeouts
-- Run this section by section

SELECT '=== BATCHED HEBREW REVERSAL FIX ===' as section;

-- ============================================================================
-- BATCH 1: BACKUP AND ANALYZE (QUICK)
-- ============================================================================

-- Add backup columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'hebrew_fix_backup'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN hebrew_fix_backup JSONB;
        RAISE NOTICE 'Added hebrew_fix_backup column';
    END IF;
END $$;

-- Quick analysis
SELECT 
    'Hebrew Analysis:' as type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN make ~ '[א-ת]' THEN 1 END) as hebrew_makes,
    COUNT(CASE WHEN cat_num_desc ~ '[א-ת]' THEN 1 END) as hebrew_descriptions
FROM catalog_items;

-- ============================================================================
-- BATCH 2: FIX MAKE FIELD (MOST CRITICAL - 3000 records)
-- ============================================================================

-- Backup and fix make field in one operation
UPDATE catalog_items 
SET hebrew_fix_backup = jsonb_build_object('original_make', make),
    make = reverse(make)
WHERE make IS NOT NULL 
  AND make ~ '^[א-ת\s]+$'
  AND LENGTH(make) > 1
  AND hebrew_fix_backup IS NULL;

-- Check make fix results
SELECT 
    'Make Fix Results:' as fix_type,
    COUNT(CASE WHEN make = 'טויוטה' THEN 1 END) as toyota_normal,
    COUNT(CASE WHEN make = 'הטויוט' THEN 1 END) as toyota_still_reversed,
    COUNT(CASE WHEN make = 'יונדאי' THEN 1 END) as hyundai_normal
FROM catalog_items;

SELECT '=== MAKE FIELD FIXED - TEST SEARCH NOW ===' as checkpoint;

-- Quick test after make fix
SELECT 
    'Search Test After Make Fix:' as test,
    COUNT(*) as results
FROM catalog_items 
WHERE make ILIKE '%טויוטה%';

-- ============================================================================
-- BATCH 3: FIX PART_NAME FIELD (BATCH SIZE: 5000)
-- ============================================================================

-- Fix part_name in batches
UPDATE catalog_items 
SET part_name = reverse(part_name)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    WHERE part_name IS NOT NULL 
      AND part_name ~ '^[א-ת\s''״-]+$'
      AND LENGTH(part_name) > 1
      AND part_name != reverse(part_name)  -- Only if not already fixed
    LIMIT 5000
);

SELECT 'Part name batch completed' as status;

-- ============================================================================
-- BATCH 4: FIX PART_FAMILY FIELD (BATCH SIZE: 5000)
-- ============================================================================

-- Fix part_family in batches
UPDATE catalog_items 
SET part_family = reverse(part_family)
WHERE id IN (
    SELECT id 
    FROM catalog_items 
    WHERE part_family IS NOT NULL 
      AND part_family ~ '^[א-ת\s''״-]+$'
      AND part_family != 'לא מוגדר'
      AND LENGTH(part_family) > 1
      AND part_family != reverse(part_family)  -- Only if not already fixed
    LIMIT 5000
);

SELECT 'Part family batch completed' as status;

-- ============================================================================
-- BATCH 5: FIX SOURCE AND AVAILABILITY FIELDS
-- ============================================================================

-- Fix source field (smaller dataset)
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

-- Fix availability field
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

SELECT 'Source and availability fields fixed' as status;

-- ============================================================================
-- BATCH 6: FIX SIDE_POSITION FIELD
-- ============================================================================

-- Fix side_position (small dataset)
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

SELECT 'Side position field fixed' as status;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Test search functions
SELECT 
    'Final Search Test:' as test_type,
    COUNT(*) as toyota_search_results
FROM catalog_items 
WHERE make ILIKE '%טויוטה%';

-- Test both search systems
SELECT 'PHASE3 System Results' as system, COUNT(*) as results
FROM smart_parts_search(make_param := 'טויוטה', free_query_param := 'כנף', limit_results := 10)
UNION ALL
SELECT 'Cascading System Results' as system, COUNT(*) as results
FROM cascading_parts_search(make_param := 'טויוטה', part_name_param := 'כנף', limit_results := 10);

-- Sample corrected records
SELECT 
    'Sample Fixed Records:' as sample_type,
    make,
    part_name,
    part_family,
    source,
    availability
FROM catalog_items 
WHERE make = 'טויוטה'
LIMIT 3;

SELECT '=== BATCHED HEBREW FIX COMPLETE ===' as section;

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'BATCHED HEBREW REVERSAL FIX COMPLETED';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Fixed fields: make, part_name, part_family, source, availability, side_position';
    RAISE NOTICE 'Toyota records should now be searchable with: טויוטה';
    RAISE NOTICE 'Test both search systems to compare results';
    RAISE NOTICE '===============================================';
END $$;