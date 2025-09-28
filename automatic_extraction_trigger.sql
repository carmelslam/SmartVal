-- AUTOMATIC EXTRACTION TRIGGER
-- Automatically extract data when catalog items are inserted or updated

-- ============================================================================
-- 1. CREATE AUTOMATIC EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_extract_catalog_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only process if cat_num_desc has content
    IF NEW.cat_num_desc IS NOT NULL AND NEW.cat_num_desc != '' THEN
        
        -- Extract all data automatically
        NEW.oem = extract_oem_from_desc(NEW.cat_num_desc);
        NEW.model = extract_model_from_desc(NEW.cat_num_desc);
        NEW.model_code = extract_model_code_from_desc(NEW.cat_num_desc);
        NEW.part_family = extract_part_family_from_desc(NEW.cat_num_desc);
        NEW.side_position = extract_side_from_desc(NEW.cat_num_desc);
        NEW.front_rear = extract_position_from_desc(NEW.cat_num_desc);
        NEW.year_range = extract_year_range_as_text(NEW.cat_num_desc);
        NEW.actual_trim = extract_trim_from_desc(NEW.cat_num_desc);
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. CREATE TRIGGER FOR INSERT (NEW UPLOADS)
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_extract_on_insert ON catalog_items;

-- Create trigger for new inserts
CREATE TRIGGER trigger_auto_extract_on_insert
    BEFORE INSERT ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_extract_catalog_data();

-- ============================================================================
-- 3. CREATE TRIGGER FOR UPDATE (WHEN cat_num_desc CHANGES)
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_extract_on_update ON catalog_items;

-- Create trigger for updates to cat_num_desc
CREATE TRIGGER trigger_auto_extract_on_update
    BEFORE UPDATE OF cat_num_desc ON catalog_items
    FOR EACH ROW
    WHEN (OLD.cat_num_desc IS DISTINCT FROM NEW.cat_num_desc)
    EXECUTE FUNCTION auto_extract_catalog_data();

-- ============================================================================
-- 4. TEST THE AUTOMATIC EXTRACTION
-- ============================================================================

-- Test insert with automatic extraction
INSERT INTO catalog_items (cat_num_desc, make, supplier_name) 
VALUES ('BMW X5 E70 פנס ימין 2008-2012 63117304906', 'BMW', 'Test Supplier');

-- Check if extraction worked automatically
SELECT 
    'AUTO EXTRACTION TEST' as test_type,
    cat_num_desc,
    oem,
    model_code,
    part_family,
    side_position,
    year_range
FROM catalog_items 
WHERE cat_num_desc = 'BMW X5 E70 פנס ימין 2008-2012 63117304906';

-- Clean up test data
DELETE FROM catalog_items 
WHERE cat_num_desc = 'BMW X5 E70 פנס ימין 2008-2012 63117304906';

-- ============================================================================
-- 5. BULK PROCESSING FUNCTION FOR EXISTING DATA
-- ============================================================================

-- Function to process existing unprocessed items in batches
CREATE OR REPLACE FUNCTION process_existing_catalog_batch(batch_size INT DEFAULT 5000)
RETURNS TABLE(
    processed_count INT,
    remaining_count INT,
    completion_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    processed_rows INT;
    remaining_rows INT;
    total_rows INT;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_rows
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL;
    
    -- Process batch of unprocessed items
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
        LIMIT batch_size
    );
    
    GET DIAGNOSTICS processed_rows = ROW_COUNT;
    
    -- Get remaining count
    SELECT COUNT(*) INTO remaining_rows
    FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND (model_code IS NULL OR model_code = '');
    
    -- Return results
    RETURN QUERY SELECT 
        processed_rows,
        remaining_rows,
        ROUND(100.0 * (total_rows - remaining_rows) / total_rows, 1);
END;
$$;

-- ============================================================================
-- 6. USAGE INSTRUCTIONS
-- ============================================================================

-- Show how to use the system
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== AUTOMATIC EXTRACTION SYSTEM INSTALLED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'NEW CATALOG UPLOADS:';
    RAISE NOTICE '- All new items will automatically extract data on insert';
    RAISE NOTICE '- Any updates to cat_num_desc will re-extract data';
    RAISE NOTICE '';
    RAISE NOTICE 'EXISTING CATALOG PROCESSING:';
    RAISE NOTICE '- Run: SELECT * FROM process_existing_catalog_batch(5000);';
    RAISE NOTICE '- Repeat until remaining_count = 0';
    RAISE NOTICE '';
    RAISE NOTICE 'FEATURES AUTOMATICALLY EXTRACTED:';
    RAISE NOTICE '- OEM part numbers';
    RAISE NOTICE '- Vehicle model and generation codes';
    RAISE NOTICE '- Part families (Lighting, Body, etc.)';
    RAISE NOTICE '- Side information (Left/Right)';
    RAISE NOTICE '- Position information (Front/Rear)';
    RAISE NOTICE '- Year ranges and trim levels';
    RAISE NOTICE '';
END $$;