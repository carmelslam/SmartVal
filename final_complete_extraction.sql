-- FINAL COMPLETE EXTRACTION FOR ENTIRE CATALOG
-- This runs the complete extraction on your full catalog with all fixes applied
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
-- 2. COMPREHENSIVE RESULTS AND STATISTICS
-- ============================================================================

-- Final extraction results
SELECT 
    'FINAL EXTRACTION RESULTS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as had_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as extracted_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_part_family,
    COUNT(CASE WHEN engine_volume IS NOT NULL THEN 1 END) as extracted_side,
    COUNT(CASE WHEN engine_code IS NOT NULL THEN 1 END) as extracted_position,
    COUNT(CASE WHEN "trim" IS NOT NULL THEN 1 END) as extracted_years
FROM catalog_items;

-- Extraction success rates
SELECT 
    'SUCCESS RATES' as metric_type,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as oem_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as model_code_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as part_family_success_percent,
    ROUND(100.0 * COUNT(CASE WHEN engine_volume IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as side_success_percent
FROM catalog_items
WHERE cat_num_desc IS NOT NULL;

-- Model codes extracted (generation codes)
SELECT 
    'MODEL CODES EXTRACTED' as stat_type,
    model_code,
    COUNT(*) as count
FROM catalog_items 
WHERE model_code IS NOT NULL
GROUP BY model_code
ORDER BY count DESC
LIMIT 20;

-- Part families extracted
SELECT 
    'PART FAMILIES EXTRACTED' as stat_type,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- Vehicle models extracted
SELECT 
    'VEHICLE MODELS EXTRACTED' as stat_type,
    model,
    COUNT(*) as count
FROM catalog_items 
WHERE model IS NOT NULL
GROUP BY model
ORDER BY count DESC
LIMIT 15;

-- Side/position statistics
SELECT 
    'SIDE INFORMATION' as stat_type,
    engine_volume as side_info,
    COUNT(*) as count
FROM catalog_items 
WHERE engine_volume IS NOT NULL
GROUP BY engine_volume
ORDER BY count DESC;

SELECT 
    'POSITION INFORMATION' as stat_type,
    engine_code as position_info,
    COUNT(*) as count
FROM catalog_items 
WHERE engine_code IS NOT NULL
GROUP BY engine_code
ORDER BY count DESC;

-- Sample successful extractions
SELECT 
    'SAMPLE SUCCESSFUL EXTRACTIONS' as sample_type,
    cat_num_desc,
    oem,
    model,
    model_code,
    part_family,
    engine_volume as side_info,
    engine_code as position_info,
    "trim" as year_range
FROM catalog_items 
WHERE oem IS NOT NULL 
AND model_code IS NOT NULL 
AND part_family IS NOT NULL
LIMIT 10;

-- Complete extraction breakdown
SELECT 
    'COMPLETE EXTRACTION BREAKDOWN' as breakdown_type,
    part_family,
    model_code,
    COUNT(*) as parts_count
FROM catalog_items 
WHERE part_family IS NOT NULL AND model_code IS NOT NULL
GROUP BY part_family, model_code
ORDER BY parts_count DESC
LIMIT 20;

-- Year range statistics
SELECT 
    'YEAR RANGES EXTRACTED' as stat_type,
    "trim" as year_range,
    COUNT(*) as count
FROM catalog_items 
WHERE "trim" IS NOT NULL
GROUP BY "trim"
ORDER BY count DESC
LIMIT 15;

-- Final summary
DO $$
DECLARE
    total_items INT;
    total_extracted INT;
    model_codes_extracted INT;
    part_families_extracted INT;
    overall_success_rate NUMERIC;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN (oem IS NOT NULL OR model_code IS NOT NULL OR part_family IS NOT NULL) THEN 1 END),
        COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END),
        COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END),
        ROUND(100.0 * COUNT(CASE WHEN (oem IS NOT NULL OR model_code IS NOT NULL OR part_family IS NOT NULL) THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1)
    INTO total_items, total_extracted, model_codes_extracted, part_families_extracted, overall_success_rate
    FROM catalog_items;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== COMPLETE CATALOG EXTRACTION FINISHED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Total catalog items: %', total_items;
    RAISE NOTICE 'Items with extracted data: %', total_extracted;
    RAISE NOTICE 'Model codes extracted: %', model_codes_extracted;
    RAISE NOTICE 'Part families extracted: %', part_families_extracted;
    RAISE NOTICE 'Overall extraction success rate: %%', overall_success_rate;
    RAISE NOTICE '';
    RAISE NOTICE 'Your catalog now includes:';
    RAISE NOTICE '- OEM part numbers for precise matching';
    RAISE NOTICE '- Vehicle generation codes (MK6, C6, E90, F30, G20, etc.)';
    RAISE NOTICE '- Part family classifications (Lighting, Body, Mirrors, etc.)';
    RAISE NOTICE '- Side and position information (Left/Right, Front/Rear)';
    RAISE NOTICE '- Year range information for compatibility';
    RAISE NOTICE '';
    RAISE NOTICE 'READY FOR ENHANCED PARTS SEARCH TESTING!';
    RAISE NOTICE 'Your parts search now supports:';
    RAISE NOTICE '- Multi-level filtering (vehicle -> parts)';
    RAISE NOTICE '- Plate-based vehicle lookup';
    RAISE NOTICE '- Generation code filtering';
    RAISE NOTICE '- Part family categorization';
    RAISE NOTICE '- OEM number search';
    RAISE NOTICE '- Hebrew and English text search';
    RAISE NOTICE '';
END $$;