-- COMPLETE CATALOG EXTRACTION SQL
-- Processes ALL catalog items and extracts data from CatNumDesc
-- Run this as a single script to extract data from your entire catalog

-- ============================================================================
-- 1. FIRST CHECK YOUR DATA
-- ============================================================================

-- See current status
SELECT 
    'BEFORE EXTRACTION' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem_before,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model_before,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as has_model_code_before,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_family_before
FROM catalog_items;

-- ============================================================================
-- 2. PROCESS FIRST 1000 ITEMS (TEST BATCH)
-- ============================================================================

DO $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Processing first 1000 items as test batch...';
    
    -- Update first 1000 items with descriptions
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
        ORDER BY id
        LIMIT 1000
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Test batch complete! Updated % rows.', processed_count;
END $$;

-- Check test batch results
SELECT 
    'AFTER TEST BATCH' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_family
FROM catalog_items;

-- Show sample extracted data
SELECT 
    'Sample extracted data' as info,
    cat_num_desc,
    oem,
    model,
    model_code,
    part_family,
    engine_volume as side_extracted,
    engine_code as position_extracted,
    "trim" as year_range
FROM catalog_items 
WHERE oem IS NOT NULL 
LIMIT 5;

-- ============================================================================
-- 3. PROCESS REMAINING ITEMS IN BATCHES
-- ============================================================================

-- Batch 2: Items 1001-5000
DO $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Processing items 1001-5000...';
    
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
        ORDER BY id
        OFFSET 1000 LIMIT 4000
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Batch 2 complete! Updated % rows.', processed_count;
END $$;

-- Batch 3: Items 5001-10000
DO $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Processing items 5001-10000...';
    
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
        ORDER BY id
        OFFSET 5000 LIMIT 5000
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Batch 3 complete! Updated % rows.', processed_count;
END $$;

-- Batch 4: Items 10001-20000
DO $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Processing items 10001-20000...';
    
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
        ORDER BY id
        OFFSET 10000 LIMIT 10000
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Batch 4 complete! Updated % rows.', processed_count;
END $$;

-- Batch 5: Items 20001-50000
DO $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Processing items 20001-50000...';
    
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
        ORDER BY id
        OFFSET 20000 LIMIT 30000
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Batch 5 complete! Updated % rows.', processed_count;
END $$;

-- Batch 6: Remaining items (50000+)
DO $$
DECLARE
    processed_count INT := 0;
    total_items INT;
BEGIN
    -- Check how many items are left
    SELECT COUNT(*) INTO total_items 
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL;
    
    RAISE NOTICE 'Processing remaining items (50000+)... Total items: %', total_items;
    
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
        ORDER BY id
        OFFSET 50000
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Final batch complete! Updated % rows.', processed_count;
END $$;

-- ============================================================================
-- 4. FINAL RESULTS AND VERIFICATION
-- ============================================================================

-- Check final results
SELECT 
    'FINAL RESULTS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as had_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as extracted_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_family,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as extraction_success_rate
FROM catalog_items;

-- Show best extraction examples
SELECT 
    'Best extractions' as example_type,
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
AND model IS NOT NULL 
AND model_code IS NOT NULL 
AND part_family IS NOT NULL
LIMIT 10;

-- Count extractions by type
SELECT 
    'Extraction Statistics' as stats,
    part_family,
    COUNT(*) as count,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as with_model_code
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- Show extraction by model
SELECT 
    'Model Statistics' as stats,
    model,
    COUNT(*) as count,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as with_generation_code
FROM catalog_items 
WHERE model IS NOT NULL
GROUP BY model
ORDER BY count DESC
LIMIT 15;

-- ============================================================================
-- 5. COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
    total_processed INT;
    success_rate NUMERIC;
BEGIN
    SELECT 
        COUNT(CASE WHEN oem IS NOT NULL THEN 1 END),
        ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1)
    INTO total_processed, success_rate
    FROM catalog_items;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMPLETE CATALOG EXTRACTION FINISHED! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'Successfully extracted data from % items', total_processed;
    RAISE NOTICE 'Extraction success rate: %% of items with descriptions', success_rate;
    RAISE NOTICE '';
    RAISE NOTICE 'Extracted data includes:';
    RAISE NOTICE '- OEM part numbers';
    RAISE NOTICE '- Vehicle models and generation codes';
    RAISE NOTICE '- Part families and classifications';
    RAISE NOTICE '- Side/position information';
    RAISE NOTICE '- Year ranges';
    RAISE NOTICE '';
    RAISE NOTICE 'Your catalog is now ready for enhanced parts search! 🚀';
    RAISE NOTICE 'You can now test the parts search.html with Supabase integration.';
END $$;