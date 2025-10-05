-- MANUAL EXTRACTION EXECUTION
-- Run this step-by-step to extract data from your CatNumDesc fields

-- ============================================================================
-- STEP 1: Check your current data state
-- ============================================================================

-- See what descriptions you have
SELECT COUNT(*) as total_with_descriptions
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- See a few examples of your descriptions
SELECT cat_num_desc, make, supplier_name
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
LIMIT 5;

-- ============================================================================
-- STEP 2: Test extraction on one item
-- ============================================================================

-- Get one description to test with
DO $$
DECLARE
    sample_desc TEXT;
    sample_id UUID;
BEGIN
    SELECT cat_num_desc, id INTO sample_desc, sample_id
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    LIMIT 1;
    
    RAISE NOTICE 'Testing extraction on: %', sample_desc;
    
    -- Test each extraction function
    RAISE NOTICE 'OEM: %', extract_oem_from_desc(sample_desc);
    RAISE NOTICE 'Model: %', extract_model_from_desc(sample_desc);
    RAISE NOTICE 'Years: %', extract_year_range_from_desc(sample_desc);
    RAISE NOTICE 'Side: %', extract_side_from_desc(sample_desc);
    RAISE NOTICE 'Position: %', extract_position_from_desc(sample_desc);
    RAISE NOTICE 'Family: %', extract_part_family_from_desc(sample_desc);
END $$;

-- ============================================================================
-- STEP 3: Extract data for first 100 items (test batch)
-- ============================================================================

-- Update first 100 items to test extraction
UPDATE catalog_items SET
    oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),
    model = COALESCE(model, extract_model_from_desc(cat_num_desc)),
    part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),
    -- Store side in engine_volume field temporarily (since we don't have a side field)
    engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),
    -- Store position in engine_code field temporarily  
    engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc))
WHERE id IN (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    LIMIT 100
);

-- ============================================================================
-- STEP 4: Check results of test batch
-- ============================================================================

-- See how many fields were populated
SELECT 
    COUNT(*) as processed_items,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as items_with_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as items_with_model,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as items_with_family,
    COUNT(CASE WHEN engine_volume IS NOT NULL THEN 1 END) as items_with_side,
    COUNT(CASE WHEN engine_code IS NOT NULL THEN 1 END) as items_with_position
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- Show some examples of extracted data
SELECT 
    cat_num_desc,
    oem,
    model,
    part_family,
    engine_volume as side_info,
    engine_code as position_info
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND (oem IS NOT NULL OR model IS NOT NULL OR part_family IS NOT NULL)
LIMIT 10;

-- ============================================================================
-- STEP 5: If test looks good, process all remaining items
-- ============================================================================

-- Uncomment and run this to process ALL your catalog items:

/*
DO $$
DECLARE
    batch_size INT := 1000;
    processed_count INT := 0;
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO total_count 
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL;
    
    RAISE NOTICE 'Processing % total items in batches of %', total_count, batch_size;
    
    LOOP
        UPDATE catalog_items SET
            oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),
            model = COALESCE(model, extract_model_from_desc(cat_num_desc)),
            model_code = COALESCE(model_code, 
                CASE 
                    WHEN extract_model_from_desc(cat_num_desc) IS NOT NULL 
                    THEN (SELECT body_code FROM dict_models WHERE canonical = extract_model_from_desc(cat_num_desc) LIMIT 1)
                    ELSE NULL 
                END
            ),
            part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),
            engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),
            engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc))
        WHERE id IN (
            SELECT id FROM catalog_items 
            WHERE cat_num_desc IS NOT NULL 
            AND (oem IS NULL OR model IS NULL OR part_family IS NULL)
            LIMIT batch_size
        );
        
        IF NOT FOUND THEN
            EXIT;
        END IF;
        
        processed_count := processed_count + batch_size;
        RAISE NOTICE 'Processed % items so far', processed_count;
        
        -- Commit every batch to avoid long transactions
        COMMIT;
    END LOOP;
    
    RAISE NOTICE 'Extraction complete! Processed % items total', processed_count;
END $$;
*/

-- ============================================================================
-- STEP 6: Final verification
-- ============================================================================

-- Check final results
SELECT 
    'Final Results' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_part_family,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / COUNT(*), 1) as oem_percentage
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- Show some successful extractions
SELECT 
    'Sample extracted data' as example,
    cat_num_desc,
    oem,
    model,
    part_family
FROM catalog_items 
WHERE oem IS NOT NULL 
AND model IS NOT NULL 
LIMIT 5;