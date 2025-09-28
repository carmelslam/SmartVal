-- SIMPLE COMPLETE EXTRACTION FOR ENTIRE CATALOG
-- No complex RAISE statements - maximum compatibility
-- Run this to process your entire catalog with the working extraction functions

-- ============================================================================
-- 1. EXTRACT DATA FROM ENTIRE CATALOG
-- ============================================================================

-- Update ALL catalog items with extracted data using the fixed functions
UPDATE catalog_items SET
    oem = extract_oem_from_desc(cat_num_desc),
    model = extract_model_from_desc(cat_num_desc),
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc),
    engine_volume = extract_side_from_desc(cat_num_desc),
    engine_code = extract_position_from_desc(cat_num_desc),
    "trim" = extract_year_range_as_text(cat_num_desc)
WHERE cat_num_desc IS NOT NULL;

-- ============================================================================
-- 2. RESULTS AND STATISTICS
-- ============================================================================

-- Final extraction results
SELECT 
    'FINAL RESULTS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as had_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_part_family
FROM catalog_items;

-- Success rates
SELECT 
    'SUCCESS RATES' as metric_type,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as oem_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as model_code_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as part_family_success_percent
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Model codes extracted
SELECT 
    'MODEL CODES' as stat_type,
    model_code,
    COUNT(*) as count
FROM catalog_items 
WHERE model_code IS NOT NULL
GROUP BY model_code
ORDER BY count DESC
LIMIT 15;

-- Part families extracted
SELECT 
    'PART FAMILIES' as stat_type,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- Sample successful extractions
SELECT 
    'SAMPLE EXTRACTIONS' as sample_type,
    cat_num_desc,
    oem,
    model_code,
    part_family
FROM catalog_items 
WHERE oem IS NOT NULL 
AND model_code IS NOT NULL 
AND part_family IS NOT NULL
LIMIT 5;

-- Side information
SELECT 
    'SIDE INFO' as stat_type,
    engine_volume as side_info,
    COUNT(*) as count
FROM catalog_items 
WHERE engine_volume IS NOT NULL
GROUP BY engine_volume
ORDER BY count DESC;

-- Position information
SELECT 
    'POSITION INFO' as stat_type,
    engine_code as position_info,
    COUNT(*) as count
FROM catalog_items 
WHERE engine_code IS NOT NULL
GROUP BY engine_code
ORDER BY count DESC;

-- Year ranges
SELECT 
    'YEAR RANGES' as stat_type,
    "trim" as year_range,
    COUNT(*) as count
FROM catalog_items 
WHERE "trim" IS NOT NULL
GROUP BY "trim"
ORDER BY count DESC
LIMIT 10;

-- Simple completion message
DO $$
BEGIN
    RAISE NOTICE 'EXTRACTION COMPLETE - CHECK RESULTS ABOVE';
    RAISE NOTICE 'Your catalog now has structured data for enhanced search';
END $$;