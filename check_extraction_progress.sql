-- CHECK EXTRACTION PROGRESS
-- See if the extraction is still running or complete

-- Check current extraction status
SELECT 
    'CURRENT STATUS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_part_family,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem
FROM catalog_items;

-- Show a few sample rows to see current state
SELECT 
    'SAMPLE CURRENT DATA' as info,
    cat_num_desc,
    model_code,
    part_family,
    oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 5;

-- Check if extraction is complete by looking for mixed results
SELECT 
    'EXTRACTION PROGRESS CHECK' as check_type,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NULL THEN 1 END) as unprocessed_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL THEN 1 END) as processed_items
FROM catalog_items;