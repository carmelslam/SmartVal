-- ADD MODEL CODE EXTRACTION FUNCTION
-- Extracts body/generation codes like MK6, C6, F30, etc.

-- ============================================================================
-- 1. MODEL CODE EXTRACTION FUNCTION
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
-- 2. ENHANCED TEST FUNCTION WITH MODEL CODE
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
-- 3. ENHANCED BATCH EXTRACTION WITH MODEL CODE
-- ============================================================================

CREATE OR REPLACE PROCEDURE enhanced_extract_batch(batch_limit INT DEFAULT 100)
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting enhanced extraction for % items...', batch_limit;
    
    UPDATE catalog_items SET
        oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),
        model = COALESCE(model, extract_model_from_desc(cat_num_desc)),
        model_code = COALESCE(model_code, extract_model_code_from_desc(cat_num_desc)),
        part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),
        -- Store extracted data in available fields
        engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),
        engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc)),
        -- Store year range in trim field temporarily (as text)
        "trim" = COALESCE("trim", 
            CASE 
                WHEN extract_year_range_from_desc(cat_num_desc)[1] IS NOT NULL 
                THEN extract_year_range_from_desc(cat_num_desc)[1]::TEXT || '-' || extract_year_range_from_desc(cat_num_desc)[2]::TEXT
                ELSE NULL 
            END
        )
    WHERE id IN (
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        LIMIT batch_limit
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Enhanced extraction complete! Updated % rows.', processed_count;
END;
$$;

-- ============================================================================
-- 4. ADD MORE MODEL CODES TO DICTIONARY
-- ============================================================================

-- Add more body codes for better detection
INSERT INTO dict_models (synonym, canonical, body_code) VALUES
-- Volkswagen Golf generations
('MK1', 'Golf', 'MK1'),
('MK2', 'Golf', 'MK2'),
('MK3', 'Golf', 'MK3'),
('MK4', 'Golf', 'MK4'),
('MK5', 'Golf', 'MK5'),
('MK6', 'Golf', 'MK6'),
('MK7', 'Golf', 'MK7'),
('MK8', 'Golf', 'MK8'),

-- Audi A6 generations
('C4', 'A6', 'C4'),
('C5', 'A6', 'C5'),
('C6', 'A6', 'C6'),
('C7', 'A6', 'C7'),
('C8', 'A6', 'C8'),

-- Audi A4 generations
('B5', 'A4', 'B5'),
('B6', 'A4', 'B6'),
('B7', 'A4', 'B7'),
('B8', 'A4', 'B8'),
('B9', 'A4', 'B9'),

-- Audi A3 generations
('8L', 'A3', '8L'),
('8P', 'A3', '8P'),
('8V', 'A3', '8V'),

-- BMW 3 Series
('E30', '3 Series', 'E30'),
('E36', '3 Series', 'E36'),
('E46', '3 Series', 'E46'),
('E90', '3 Series', 'E90'),
('E91', '3 Series', 'E91'),
('E92', '3 Series', 'E92'),
('F30', '3 Series', 'F30'),
('G20', '3 Series', 'G20'),

-- BMW 5 Series
('E39', '5 Series', 'E39'),
('E60', '5 Series', 'E60'),
('F10', '5 Series', 'F10'),
('G30', '5 Series', 'G30'),

-- BMW X5
('E53', 'X5', 'E53'),
('E70', 'X5', 'E70'),
('F15', 'X5', 'F15'),
('G05', 'X5', 'G05'),

-- VW Passat
('B3', 'Passat', 'B3'),
('B4', 'Passat', 'B4'),
('B5', 'Passat', 'B5'),
('B6', 'Passat', 'B6'),
('B7', 'Passat', 'B7'),
('B8', 'Passat', 'B8'),

-- Ford Focus
('MK1', 'Focus', 'MK1'),
('MK2', 'Focus', 'MK2'),
('MK3', 'Focus', 'MK3'),
('MK4', 'Focus', 'MK4')

ON CONFLICT (synonym) DO UPDATE SET
    canonical = EXCLUDED.canonical,
    body_code = EXCLUDED.body_code;

-- ============================================================================
-- 5. TEST THE ENHANCED EXTRACTION
-- ============================================================================

-- Test with the original example
SELECT * FROM test_extraction_enhanced('כנף ימין פולקסווגן גולף MK6 2009-2013 5K0821106B');

-- Test with more examples
SELECT * FROM test_extraction_enhanced('פנס אחורי שמאל אאודי A6 C6 2008-2011 8E0945095CG');
SELECT * FROM test_extraction_enhanced('דלת קדמית ימין BMW 3 Series E90 2005-2012 41517202146');
SELECT * FROM test_extraction_enhanced('מראה שמאל פורד פוקוס MK3 2011-2018 BM5117682');

-- ============================================================================
-- 6. FINAL EXTRACTION SUMMARY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_extraction_summary()
RETURNS TABLE(
    total_items BIGINT,
    has_descriptions BIGINT,
    has_oem BIGINT,
    has_model BIGINT,
    has_model_code BIGINT,
    has_part_family BIGINT,
    extraction_percentage NUMERIC
)
LANGUAGE sql
AS $$
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as has_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as has_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as has_part_family,
    ROUND(100.0 * COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) / NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as extraction_percentage
FROM catalog_items;
$$;

-- Show instructions
DO $$
BEGIN
    RAISE NOTICE '=== ENHANCED MODEL CODE EXTRACTION READY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Added model_code extraction for generation codes like MK6, C6, F30, etc.';
    RAISE NOTICE '';
    RAISE NOTICE 'Test with:';
    RAISE NOTICE 'SELECT * FROM test_extraction_enhanced(''כנף ימין פולקסווגן גולף MK6 2009-2013 5K0821106B'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Extract data with:';
    RAISE NOTICE 'CALL enhanced_extract_batch(100);';
    RAISE NOTICE '';
    RAISE NOTICE 'Check results with:';
    RAISE NOTICE 'SELECT * FROM get_extraction_summary();';
END $$;