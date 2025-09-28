-- FIX ARRAY SYNTAX ERROR
-- PostgreSQL-compatible version without array indexing issues

-- ============================================================================
-- 1. FIXED MODEL CODE EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_model_code_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    model_code_result TEXT;
BEGIN
    -- Check dictionary for body codes first
    SELECT body_code INTO model_code_result
    FROM dict_models dm
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'
    AND dm.body_code IS NOT NULL
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    IF model_code_result IS NOT NULL THEN
        RETURN model_code_result;
    END IF;
    
    -- Look for common VW/Audi generation codes
    SELECT (regexp_match(UPPER(desc_text), '\b(MK[1-9]|C[4-8]|B[5-9]|8[A-Z]|F[0-9]{2}|E[0-9]{2}|G[0-9]{2})\b'))[1] INTO model_code_result;
    
    IF model_code_result IS NOT NULL THEN
        RETURN model_code_result;
    END IF;
    
    -- Look for BMW generation codes (E90, F30, G20, etc.)
    SELECT (regexp_match(UPPER(desc_text), '\b([EFG][0-9]{2})\b'))[1] INTO model_code_result;
    
    IF model_code_result IS NOT NULL THEN
        RETURN model_code_result;
    END IF;
    
    -- Look for other common patterns
    SELECT (regexp_match(UPPER(desc_text), '\b(T[5-7]|W[0-9]{3}|A[0-9])\b'))[1] INTO model_code_result;
    
    RETURN model_code_result;
END;
$$;

-- ============================================================================
-- 2. FIXED ENHANCED TEST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION test_extraction_enhanced(test_desc TEXT)
RETURNS TABLE(
    description TEXT,
    extracted_oem TEXT,
    extracted_model TEXT,
    extracted_model_code TEXT,
    extracted_years INT[],
    extracted_side TEXT,
    extracted_position TEXT,
    extracted_family TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT
        test_desc,
        extract_oem_from_desc(test_desc),
        extract_model_from_desc(test_desc),
        extract_model_code_from_desc(test_desc),
        extract_year_range_from_desc(test_desc),
        extract_side_from_desc(test_desc),
        extract_position_from_desc(test_desc),
        extract_part_family_from_desc(test_desc);
END;
$$;

-- ============================================================================
-- 3. FIXED BATCH EXTRACTION WITHOUT ARRAY INDEXING
-- ============================================================================

CREATE OR REPLACE PROCEDURE enhanced_extract_batch_fixed(batch_limit INT DEFAULT 100)
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
    year_range_text TEXT;
    year_array INT[];
BEGIN
    RAISE NOTICE 'Starting enhanced extraction for % items...', batch_limit;
    
    -- Process each item individually to avoid array indexing issues
    FOR year_range_text IN 
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        LIMIT batch_limit
    LOOP
        UPDATE catalog_items SET
            oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),
            model = COALESCE(model, extract_model_from_desc(cat_num_desc)),
            model_code = COALESCE(model_code, extract_model_code_from_desc(cat_num_desc)),
            part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),
            engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),
            engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc))
        WHERE id = year_range_text::UUID;
        
        processed_count := processed_count + 1;
        
        -- Progress update every 50 items
        IF processed_count % 50 = 0 THEN
            RAISE NOTICE 'Processed % items so far...', processed_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Enhanced extraction complete! Updated % rows.', processed_count;
END;
$$;

-- ============================================================================
-- 4. SIMPLE YEAR EXTRACTION AS TEXT (NO ARRAYS)
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_year_range_as_text(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT[];
    y1 INT;
    y2 INT;
BEGIN
    -- Look for year range pattern
    SELECT regexp_match(desc_text, '(\d{2,4})-(\d{2,4})') INTO year_match;
    
    IF year_match IS NOT NULL THEN
        y1 := year_match[1]::INT;
        y2 := year_match[2]::INT;
        
        -- Convert 2-3 digit years to full years
        IF y1 < 50 THEN y1 := y1 + 2000; END IF;
        IF y1 >= 50 AND y1 < 100 THEN y1 := y1 + 1900; END IF;
        IF y1 >= 100 AND y1 < 2000 THEN y1 := y1 + 2000; END IF;
        
        IF y2 < 50 THEN y2 := y2 + 2000; END IF;
        IF y2 >= 50 AND y2 < 100 THEN y2 := y2 + 1900; END IF;
        IF y2 >= 100 AND y2 < 2000 THEN y2 := y2 + 2000; END IF;
        
        RETURN y1::TEXT || '-' || y2::TEXT;
    END IF;
    
    -- Look for single year
    SELECT regexp_match(desc_text, '(20\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN year_match[1];
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 5. SIMPLE TEST FUNCTION (NO ARRAYS)
-- ============================================================================

CREATE OR REPLACE FUNCTION test_extraction_simple_fixed(test_desc TEXT)
RETURNS TABLE(
    description TEXT,
    extracted_oem TEXT,
    extracted_model TEXT,
    extracted_model_code TEXT,
    extracted_year_range TEXT,
    extracted_side TEXT,
    extracted_position TEXT,
    extracted_family TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT
        test_desc,
        extract_oem_from_desc(test_desc),
        extract_model_from_desc(test_desc),
        extract_model_code_from_desc(test_desc),
        extract_year_range_as_text(test_desc),
        extract_side_from_desc(test_desc),
        extract_position_from_desc(test_desc),
        extract_part_family_from_desc(test_desc);
END;
$$;

-- ============================================================================
-- 6. SUPER SIMPLE BATCH UPDATE (MOST RELIABLE)
-- ============================================================================

CREATE OR REPLACE PROCEDURE simple_batch_update(batch_limit INT DEFAULT 100)
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting simple batch update for % items...', batch_limit;
    
    UPDATE catalog_items SET
        oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),
        model = COALESCE(model, extract_model_from_desc(cat_num_desc)),
        model_code = COALESCE(model_code, extract_model_code_from_desc(cat_num_desc)),
        part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),
        engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),
        engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc)),
        "trim" = COALESCE("trim", extract_year_range_as_text(cat_num_desc))
    WHERE id IN (
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        LIMIT batch_limit
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Simple batch update complete! Updated % rows.', processed_count;
END;
$$;

-- ============================================================================
-- 7. TEST THE FIXED FUNCTIONS
-- ============================================================================

-- Test with the problematic example
SELECT * FROM test_extraction_simple_fixed('כנף ימין פולקסווגן גולף MK6 2009-2013 5K0821106B');

-- Test other examples
SELECT * FROM test_extraction_simple_fixed('פנס אחורי שמאל אאודי A6 C6 2008-2011 8E0945095CG');

-- ============================================================================
-- 8. INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== FIXED ARRAY SYNTAX ERRORS ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All array indexing issues resolved';
    RAISE NOTICE '✅ Added model_code extraction';
    RAISE NOTICE '✅ Year ranges as text (no arrays)';
    RAISE NOTICE '';
    RAISE NOTICE 'Test with:';
    RAISE NOTICE 'SELECT * FROM test_extraction_simple_fixed(''your description'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Extract data with:';
    RAISE NOTICE 'CALL simple_batch_update(100);  -- Safe and reliable';
    RAISE NOTICE '';
    RAISE NOTICE 'Check results:';
    RAISE NOTICE 'SELECT COUNT(*) FROM catalog_items WHERE model_code IS NOT NULL;';
END $$;