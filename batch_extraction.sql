-- BATCH EXTRACTION - PROCESS IN SMALLER CHUNKS
-- Process 5,000 items at a time to avoid timeouts

-- ============================================================================
-- BATCH 1: Process next 5,000 unprocessed items
-- ============================================================================

UPDATE catalog_items SET
    oem = extract_oem_from_desc(cat_num_desc),
    model = extract_model_from_desc(cat_num_desc),
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc),
    engine_volume = extract_side_from_desc(cat_num_desc),
    engine_code = extract_position_from_desc(cat_num_desc),
    "trim" = extract_year_range_as_text(cat_num_desc)
WHERE id IN (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND model_code IS NULL
    ORDER BY id
    LIMIT 5000
);

-- Check progress after this batch
SELECT 
    'AFTER BATCH 1' as status,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NULL THEN 1 END) as remaining_unprocessed,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL THEN 1 END) as total_processed,
    ROUND(100.0 * COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as percent_complete
FROM catalog_items;

-- Show sample from this batch
SELECT 
    'BATCH 1 SAMPLE' as info,
    cat_num_desc,
    model_code,
    part_family,
    oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND model_code IS NOT NULL
ORDER BY id DESC
LIMIT 3;