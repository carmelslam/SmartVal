-- UUID BATCH EXTRACTION
-- Process unprocessed items in batches using LIMIT/OFFSET

-- ============================================================================
-- 1. PROCESS BATCH OF 1000 UNPROCESSED ITEMS
-- ============================================================================

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
    AND (model_code IS NULL OR model_code = '' OR model_code IS NULL)
    LIMIT 1000
);

-- ============================================================================
-- 2. CHECK PROGRESS AFTER BATCH
-- ============================================================================

-- Check how many we processed this batch
SELECT 
    'BATCH PROGRESS' as status,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND (model_code IS NULL OR model_code = '') THEN 1 END) as remaining_unprocessed,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL AND model_code != '' THEN 1 END) as total_processed,
    ROUND(100.0 * COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as percent_complete
FROM catalog_items;

-- Show sample of newly processed items  
SELECT 
    'SAMPLE PROCESSED' as info,
    cat_num_desc,
    model_code,
    part_family,
    side_position,
    year_range
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND model_code IS NOT NULL 
AND model_code != ''
LIMIT 5;

-- Show extraction statistics
SELECT 
    'EXTRACTION STATS' as stats_type,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN year_range IS NOT NULL AND year_range != '' THEN 1 END) as has_year_range,
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;