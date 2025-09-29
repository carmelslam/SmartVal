-- SIMPLE BATCH PROCESSING
-- Process existing catalog items in batches

-- ============================================================================
-- 1. TEST TRIGGER FIRST (WITH REQUIRED FIELDS)
-- ============================================================================

-- Test insert with all required fields
INSERT INTO catalog_items (cat_num_desc, make, supplier_name, version_date) 
VALUES ('BMW X5 E70 פנס ימין 2008-2012 TEST123', 'BMW', 'Test Supplier', CURRENT_DATE);

-- Check if extraction worked automatically
SELECT 
    'TRIGGER TEST RESULT' as test_type,
    cat_num_desc,
    oem,
    model_code,
    part_family,
    side_position,
    year_range
FROM catalog_items 
WHERE cat_num_desc LIKE '%TEST123%';

-- Clean up test data
DELETE FROM catalog_items 
WHERE cat_num_desc LIKE '%TEST123%';

-- ============================================================================
-- 2. PROCESS BATCH OF EXISTING ITEMS
-- ============================================================================

-- Process 5000 unprocessed items
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

-- Show progress
SELECT 
    'BATCH PROGRESS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as processed_items,
    COUNT(CASE WHEN model_code IS NULL OR model_code = '' THEN 1 END) as remaining_items,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as completion_percentage
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Show extraction statistics
SELECT 
    'EXTRACTION STATS' as stats_type,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN front_rear IS NOT NULL AND front_rear != '' THEN 1 END) as has_front_rear,
    COUNT(CASE WHEN year_range IS NOT NULL AND year_range != '' THEN 1 END) as has_year_range,
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- Show sample newly processed items
SELECT 
    'NEWLY PROCESSED SAMPLE' as sample_type,
    cat_num_desc,
    model_code,
    part_family,
    side_position,
    year_range
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND model_code IS NOT NULL 
AND model_code != ''
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- 4. INSTRUCTIONS FOR COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== BATCH PROCESSING COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'TO CONTINUE PROCESSING:';
    RAISE NOTICE 'Run this script again to process next 5000 items';
    RAISE NOTICE '';
    RAISE NOTICE 'AUTOMATIC TRIGGERS:';
    RAISE NOTICE 'New uploads will automatically extract data';
    RAISE NOTICE '';
END $$;