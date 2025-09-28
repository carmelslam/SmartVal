-- SIMPLE BATCH PROCESSING BY ID RANGE
-- Process unprocessed items in batches using ID ranges

-- ============================================================================
-- 1. FIND THE ID RANGE OF UNPROCESSED ITEMS
-- ============================================================================

-- Check the ID range of unprocessed items
SELECT 
    'UNPROCESSED ID RANGE' as info,
    MIN(id) as min_unprocessed_id,
    MAX(id) as max_unprocessed_id,
    COUNT(*) as total_unprocessed
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND (model_code IS NULL OR model_code = '');

-- ============================================================================
-- 2. PROCESS NEXT BATCH OF 1000 ITEMS BY ID
-- ============================================================================

-- Get the first unprocessed ID to start from
WITH first_unprocessed AS (
    SELECT MIN(id) as start_id 
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND (model_code IS NULL OR model_code = '')
)
UPDATE catalog_items SET
    oem = extract_oem_from_desc(cat_num_desc),
    model = extract_model_from_desc(cat_num_desc),
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc),
    side_position = extract_side_from_desc(cat_num_desc),
    front_rear = extract_position_from_desc(cat_num_desc),
    year_range = extract_year_range_as_text(cat_num_desc),
    actual_trim = extract_trim_from_desc(cat_num_desc)
WHERE cat_num_desc IS NOT NULL 
AND (model_code IS NULL OR model_code = '')
AND id >= (SELECT start_id FROM first_unprocessed)
AND id < (SELECT start_id + 1000 FROM first_unprocessed);

-- ============================================================================
-- 3. CHECK PROGRESS AFTER BATCH
-- ============================================================================

-- Check how many we processed
SELECT 
    'BATCH RESULTS' as status,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND (model_code IS NULL OR model_code = '') THEN 1 END) as remaining_unprocessed,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL AND model_code != '' THEN 1 END) as total_processed,
    ROUND(100.0 * COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL AND model_code != '' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as percent_complete
FROM catalog_items;

-- Show sample of newly processed items
SELECT 
    'NEWLY PROCESSED SAMPLE' as info,
    id,
    cat_num_desc,
    model_code,
    part_family,
    side_position,
    year_range
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND model_code IS NOT NULL 
AND model_code != ''
ORDER BY id DESC
LIMIT 5;

-- Show progress breakdown
SELECT 
    'EXTRACTION PROGRESS' as progress_type,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN year_range IS NOT NULL AND year_range != '' THEN 1 END) as has_year_range
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;