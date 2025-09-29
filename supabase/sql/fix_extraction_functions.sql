-- FIX EXTRACTION FUNCTIONS - PostgreSQL Compatible
-- Fixes the regexp_match 'global' flag error

-- ============================================================================
-- 1. FIXED OEM EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_oem_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    oem_result TEXT;
BEGIN
    -- Look for OEM pattern: alphanumeric block of 8-14 characters at end (no 'g' flag)
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,14})(?:\s|$)'))[1] INTO oem_result;
    
    IF oem_result IS NOT NULL THEN
        RETURN oem_result;
    END IF;
    
    -- Alternative pattern: look for common OEM prefixes (no 'g' flag)
    SELECT (regexp_match(desc_text, '((?:8E|4F|8K|8J|8P|8V|1K|5K|3C|7L|7P|4B|4D|8D|8H|A6|A4|A3|Q5|Q7)[A-Z0-9]{6,12})', 'i'))[1] INTO oem_result;
    
    IF oem_result IS NOT NULL THEN
        RETURN UPPER(oem_result);
    END IF;
    
    -- Look for any alphanumeric sequence of 8+ chars
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,})'))[1] INTO oem_result;
    
    RETURN UPPER(oem_result);
END;
$$;

-- ============================================================================
-- 2. SIMPLIFIED YEAR EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_year_range_from_desc(desc_text TEXT)
RETURNS INT[]
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT[];
    year_result INT[] := ARRAY[NULL::INT, NULL::INT];
    y1 INT;
    y2 INT;
BEGIN
    -- Check dictionary patterns first
    SELECT ARRAY[year_from, year_to] INTO year_result
    FROM dict_year_patterns dyp
    WHERE desc_text ~ dyp.pattern
    LIMIT 1;
    
    IF year_result[1] IS NOT NULL THEN
        RETURN year_result;
    END IF;
    
    -- Look for pattern like "016-018" or "16-18" or "2016-2018"
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
        
        RETURN ARRAY[y1, y2];
    END IF;
    
    -- Look for single 4-digit year
    SELECT regexp_match(desc_text, '(20\d{2})') INTO year_match;
    
    IF year_match IS NOT NULL THEN
        y1 := year_match[1]::INT;
        RETURN ARRAY[y1, y1];
    END IF;
    
    RETURN ARRAY[NULL::INT, NULL::INT];
END;
$$;

-- ============================================================================
-- 3. SIMPLIFIED MODEL EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_model_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    model_result TEXT;
BEGIN
    -- Check dictionary models (case insensitive)
    SELECT canonical INTO model_result
    FROM dict_models dm
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    RETURN model_result;
END;
$$;

-- ============================================================================
-- 4. SIMPLE SIDE EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Check for Hebrew side indicators (case insensitive)
    IF UPPER(desc_text) ~ 'שמאל|שמ''|ל''' THEN
        RETURN 'שמאל';
    ELSIF UPPER(desc_text) ~ 'ימין|ימ''|ר''' THEN
        RETURN 'ימין';
    END IF;
    
    -- Check for English side indicators
    IF UPPER(desc_text) ~ '\bLEFT\b|\bL\b' THEN
        RETURN 'שמאל';
    ELSIF UPPER(desc_text) ~ '\bRIGHT\b|\bR\b' THEN
        RETURN 'ימין';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 5. SIMPLE POSITION EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_position_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Check for common position patterns (case insensitive)
    IF UPPER(desc_text) ~ 'קדמי|קד''' THEN
        RETURN 'קדמי';
    ELSIF UPPER(desc_text) ~ 'אחורי|אח''' THEN
        RETURN 'אחורי';
    ELSIF UPPER(desc_text) ~ 'כנף' THEN
        RETURN 'כנף';
    ELSIF UPPER(desc_text) ~ 'דלת' THEN
        RETURN 'דלת';
    ELSIF UPPER(desc_text) ~ 'מראה' THEN
        RETURN 'מראה';
    ELSIF UPPER(desc_text) ~ 'פגוש' THEN
        RETURN 'פגוש';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 6. SIMPLE PART FAMILY EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_part_family_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Light components (case insensitive)
    IF UPPER(desc_text) ~ 'פנס|לד|איתות|רפלקטור|LIGHT|LAMP' THEN
        RETURN 'light';
    -- Body panels
    ELSIF UPPER(desc_text) ~ 'כנף|דלת|פגוש|קאפוט|מכסה|FENDER|DOOR|BUMPER|PANEL' THEN
        RETURN 'panel';
    -- Mirrors
    ELSIF UPPER(desc_text) ~ 'מראה|MIRROR' THEN
        RETURN 'mirror';
    -- Glass
    ELSIF UPPER(desc_text) ~ 'זכוכית|שמשה|GLASS|WINDOW' THEN
        RETURN 'glass';
    -- Trim/Interior
    ELSIF UPPER(desc_text) ~ 'רשת|גריל|פנלים|עור|GRILLE|TRIM' THEN
        RETURN 'trim';
    -- Mechanical
    ELSIF UPPER(desc_text) ~ 'בולם|קפיץ|בלם|דיסק|SHOCK|SPRING|BRAKE|DISC' THEN
        RETURN 'mechanical';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 7. SIMPLE TEST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION test_extraction_simple(test_desc TEXT)
RETURNS TABLE(
    description TEXT,
    extracted_oem TEXT,
    extracted_model TEXT,
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
        extract_year_range_from_desc(test_desc),
        extract_side_from_desc(test_desc),
        extract_position_from_desc(test_desc),
        extract_part_family_from_desc(test_desc);
END;
$$;

-- ============================================================================
-- 8. SIMPLE BATCH UPDATE PROCEDURE
-- ============================================================================

CREATE OR REPLACE PROCEDURE simple_extract_batch(batch_limit INT DEFAULT 100)
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting simple extraction for % items...', batch_limit;
    
    UPDATE catalog_items SET
        oem = COALESCE(oem, extract_oem_from_desc(cat_num_desc)),
        model = COALESCE(model, extract_model_from_desc(cat_num_desc)),
        part_family = COALESCE(part_family, extract_part_family_from_desc(cat_num_desc)),
        -- Store extracted data in available fields
        engine_volume = COALESCE(engine_volume, extract_side_from_desc(cat_num_desc)),
        engine_code = COALESCE(engine_code, extract_position_from_desc(cat_num_desc))
    WHERE id IN (
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        LIMIT batch_limit
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RAISE NOTICE 'Simple extraction complete! Updated % rows.', processed_count;
END;
$$;

-- ============================================================================
-- 9. TEST THE FIXED FUNCTIONS
-- ============================================================================

-- Test with a sample description
SELECT * FROM test_extraction_simple('פנס אחורי שמאל אאודי A6 C6 2008-2011 8E0945095CG');

-- Test with another pattern
SELECT * FROM test_extraction_simple('כנף ימין פולקסווגן גולף MK6 2009-2013 5K0821106B');

-- Show instructions
DO $$
BEGIN
    RAISE NOTICE '=== FIXED EXTRACTION FUNCTIONS READY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions fixed to work with PostgreSQL regexp_match limitations.';
    RAISE NOTICE '';
    RAISE NOTICE 'To extract data from your catalog:';
    RAISE NOTICE '1. Test: SELECT * FROM test_extraction_simple(''your description here'');';
    RAISE NOTICE '2. Extract: CALL simple_extract_batch(100);  -- for 100 items';
    RAISE NOTICE '3. Extract: CALL simple_extract_batch(1000); -- for 1000 items';
    RAISE NOTICE '';
    RAISE NOTICE 'Check results with:';
    RAISE NOTICE 'SELECT COUNT(*) as has_oem FROM catalog_items WHERE oem IS NOT NULL;';
END $$;