-- COMPLETE EXTRACTION WITH COLUMN CREATION
-- Adds missing columns and processes entire catalog
-- Run this as a single complete script

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO CATALOG_ITEMS
-- ============================================================================

-- Add model_code column if it doesn't exist
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS model_code TEXT;

-- Add other columns that might be missing
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS part_family TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_catalog_model_code ON catalog_items(model_code);
CREATE INDEX IF NOT EXISTS idx_catalog_part_family ON catalog_items(part_family);

-- ============================================================================
-- 2. CHECK CURRENT DATA STATUS
-- ============================================================================

-- See current status (now with model_code column)
SELECT 
    'BEFORE EXTRACTION' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem_before,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model_before,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as has_model_code_before,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_family_before
FROM catalog_items;

-- Show sample of current data
SELECT 
    'Current data sample' as info,
    cat_num_desc,
    make,
    oem,
    model,
    model_code,
    part_family
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 5;

-- ============================================================================
-- 3. PROCESS CATALOG IN BATCHES
-- ============================================================================

-- Batch 1: First 1000 items (test batch)
DO $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Processing first 1000 items as test batch...';
    
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
WHERE model_code IS NOT NULL 
LIMIT 5;

-- Pause here to check if test batch worked well
-- If results look good, continue with larger batches

-- Batch 2: Next 4000 items (items 1001-5000)
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

-- Batch 3: Next 5000 items (items 5001-10000)
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

-- Batch 4: Next 10000 items (items 10001-20000)
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

-- Batch 5: Next 30000 items (items 20001-50000)
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

-- Batch 6: All remaining items (50000+)
DO $$
DECLARE
    processed_count INT := 0;
    total_items INT;
    remaining_items INT;
BEGIN
    -- Check how many items are left
    SELECT COUNT(*) INTO total_items FROM catalog_items WHERE cat_num_desc IS NOT NULL;
    remaining_items := GREATEST(total_items - 50000, 0);
    
    RAISE NOTICE 'Processing remaining % items (50000+)...', remaining_items;
    
    IF remaining_items > 0 THEN
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
    ELSE
        RAISE NOTICE 'No remaining items to process.';
    END IF;
END $$;

-- ============================================================================
-- 4. FINAL RESULTS AND STATISTICS
-- ============================================================================

-- Final comprehensive results
SELECT 
    'FINAL EXTRACTION RESULTS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as had_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as extracted_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_family,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as oem_success_rate,
    ROUND(100.0 * COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as model_code_success_rate
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

-- Part family statistics
SELECT 
    'Part Family Stats' as stats_type,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;

-- Model statistics
SELECT 
    'Model Stats' as stats_type,
    model,
    COUNT(*) as count,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as with_generation_code
FROM catalog_items 
WHERE model IS NOT NULL
GROUP BY model
ORDER BY count DESC
LIMIT 10;

-- Model code statistics
SELECT 
    'Generation Code Stats' as stats_type,
    model_code,
    COUNT(*) as count
FROM catalog_items 
WHERE model_code IS NOT NULL
GROUP BY model_code
ORDER BY count DESC
LIMIT 15;

-- ============================================================================
-- 5. COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
    total_processed INT;
    model_code_count INT;
    success_rate NUMERIC;
BEGIN
    SELECT 
        COUNT(CASE WHEN oem IS NOT NULL THEN 1 END),
        COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END),
        ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1)
    INTO total_processed, model_code_count, success_rate
    FROM catalog_items;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMPLETE CATALOG EXTRACTION WITH MODEL CODES FINISHED! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'Successfully extracted data from % items', total_processed;
    RAISE NOTICE 'Model codes (MK6, C6, E90, etc.) extracted from % items', model_code_count;
    RAISE NOTICE 'Overall extraction success rate: %% of items with descriptions', success_rate;
    RAISE NOTICE '';
    RAISE NOTICE 'Your catalog now includes:';
    RAISE NOTICE '✅ OEM part numbers';
    RAISE NOTICE '✅ Vehicle models and generation codes (MK6, C6, F30, etc.)';
    RAISE NOTICE '✅ Part families and classifications';
    RAISE NOTICE '✅ Side/position information (שמאל/ימין)';
    RAISE NOTICE '✅ Year ranges (2009-2013)';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enhanced parts search testing! 🚀';
END $$;