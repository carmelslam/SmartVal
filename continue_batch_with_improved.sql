-- CONTINUE BATCH PROCESSING WITH IMPROVED DETECTION
-- Process remaining items with enhanced Hebrew detection

-- ============================================================================
-- 1. CHECK CURRENT PROGRESS
-- ============================================================================

-- Show current extraction statistics
SELECT 
    'CURRENT PROGRESS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as processed_items,
    COUNT(CASE WHEN model_code IS NULL OR model_code = '' THEN 1 END) as remaining_items,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as completion_percentage
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Show improved part family statistics
SELECT 
    'IMPROVED PART FAMILIES' as stats_type,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- ============================================================================
-- 2. PROCESS NEXT BATCH WITH IMPROVED EXTRACTION
-- ============================================================================

-- Process next 5000 unprocessed items with improved functions
UPDATE catalog_items SET
    oem = extract_oem_from_desc(cat_num_desc),
    model = extract_model_from_desc(cat_num_desc),
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc),
    side_position = extract_side_from_desc(cat_num_desc),
    front_rear = extract_position_from_desc(cat_num_desc),
    year_range = extract_year_range_as_text(cat_num_desc),
    actual_trim = extract_trim_from_desc(cat_num_desc)
WHERE id IN (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND (model_code IS NULL OR model_code = '')
    LIMIT 5000
);

-- ============================================================================
-- 3. CHECK PROGRESS AFTER BATCH
-- ============================================================================

-- Show updated progress
SELECT 
    'AFTER BATCH PROGRESS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as processed_items,
    COUNT(CASE WHEN model_code IS NULL OR model_code = '' THEN 1 END) as remaining_items,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as completion_percentage
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Show comprehensive extraction statistics
SELECT 
    'COMPREHENSIVE STATS' as stats_type,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN front_rear IS NOT NULL AND front_rear != '' THEN 1 END) as has_front_rear,
    COUNT(CASE WHEN year_range IS NOT NULL AND year_range != '' THEN 1 END) as has_year_range,
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- Show sample of newly processed items with improved categorization
SELECT 
    'NEWLY PROCESSED WITH IMPROVED DETECTION' as sample_type,
    cat_num_desc,
    model_code,
    part_family,
    side_position,
    year_range
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND model_code IS NOT NULL 
AND model_code != ''
AND part_family IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Show breakdown by part family and model code
SELECT 
    'PART FAMILY + MODEL CODE COMBINATIONS' as combination_stats,
    part_family,
    model_code,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL 
AND model_code IS NOT NULL
AND part_family != ''
AND model_code != ''
GROUP BY part_family, model_code
ORDER BY count DESC
LIMIT 15;

-- ============================================================================
-- 4. ESTIMATE REMAINING WORK
-- ============================================================================

-- Calculate remaining batches needed
WITH remaining_calc AS (
    SELECT COUNT(*) as remaining_count
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND (model_code IS NULL OR model_code = '')
)
SELECT 
    'REMAINING WORK ESTIMATE' as estimate_type,
    remaining_count as items_remaining,
    CEIL(remaining_count / 5000.0) as batches_remaining,
    ROUND(remaining_count / 5000.0 * 2, 1) as estimated_minutes_remaining
FROM remaining_calc;

-- ============================================================================
-- 5. INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== BATCH PROCESSING WITH IMPROVED DETECTION ===';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE 'Run this script again to process next 5000 items';
    RAISE NOTICE 'OR';
    RAISE NOTICE 'Proceed to test parts search integration';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPROVED DETECTION NOW INCLUDES:';
    RAISE NOTICE '- Cooling: רוטאידר, םימ, קירור, קונדנסר';
    RAISE NOTICE '- Engine: מנוע, שמן, מלחץ';
    RAISE NOTICE '- Transmission: הילוכים, אוטומט, מצמד';
    RAISE NOTICE '- And 7 more categories!';
    RAISE NOTICE '';
END $$;