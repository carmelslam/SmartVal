-- SINGLE BATCH PROCESSING - RUN AS NEEDED
-- Simple batch that you can run repeatedly until complete
-- Works within Supabase timeout limits

-- ============================================================================
-- 1. PROCESS ONE BATCH OF 5000 ITEMS
-- ============================================================================

-- Process next 5000 unprocessed items
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
-- 2. CHECK PROGRESS
-- ============================================================================

-- Show current progress
SELECT 
    'BATCH COMPLETE - PROGRESS UPDATE' as status,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND (model_code IS NULL OR model_code = '') THEN 1 END) as items_remaining,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL AND model_code != '' THEN 1 END) as items_processed,
    ROUND(100.0 * COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as completion_percentage,
    CASE 
        WHEN COUNT(CASE WHEN cat_num_desc IS NOT NULL AND (model_code IS NULL OR model_code = '') THEN 1 END) = 0 
        THEN 'EXTRACTION COMPLETE!' 
        ELSE 'RUN AGAIN TO CONTINUE' 
    END as next_action
FROM catalog_items;

-- ============================================================================
-- 3. SHOW EXTRACTION STATISTICS
-- ============================================================================

-- Current extraction stats
SELECT 
    'EXTRACTION STATISTICS' as stats_type,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN front_rear IS NOT NULL AND front_rear != '' THEN 1 END) as has_front_rear,
    COUNT(CASE WHEN year_range IS NOT NULL AND year_range != '' THEN 1 END) as has_year_range,
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- Part families with improved detection
SELECT 
    'PART FAMILIES DETECTED' as family_stats,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL AND part_family != ''
GROUP BY part_family
ORDER BY count DESC;

-- ============================================================================
-- 4. SIMPLE INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SINGLE BATCH PROCESSING COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'INSTRUCTIONS:';
    RAISE NOTICE '1. Check "next_action" above';
    RAISE NOTICE '2. If "RUN AGAIN TO CONTINUE" - run this script again';
    RAISE NOTICE '3. If "EXTRACTION COMPLETE!" - ready for testing';
    RAISE NOTICE '';
    RAISE NOTICE 'AUTOMATIC FOR FUTURE:';
    RAISE NOTICE 'New catalog uploads will auto-extract via triggers';
    RAISE NOTICE '';
END $$;