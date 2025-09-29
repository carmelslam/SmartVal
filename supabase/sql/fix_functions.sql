-- FIX EXTRACTION FUNCTIONS
-- The functions exist but the regex patterns need fixing

-- ============================================================================
-- 1. IMPROVED MODEL CODE EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_model_code_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    model_code_result TEXT;
BEGIN
    -- Look for BMW generation codes first (E70, F30, G20, etc.)
    SELECT (regexp_match(desc_text, '\b([EFG][0-9]{2})\b', 'i'))[1] INTO model_code_result;
    
    IF model_code_result IS NOT NULL THEN
        RETURN UPPER(model_code_result);
    END IF;
    
    -- Look for VW/Audi generation codes (MK6, C6, B8, etc.)
    SELECT (regexp_match(desc_text, '\b(MK[1-9]|C[4-8]|B[5-9]|8[A-Z])\b', 'i'))[1] INTO model_code_result;
    
    IF model_code_result IS NOT NULL THEN
        RETURN UPPER(model_code_result);
    END IF;
    
    -- Check dictionary for body codes
    SELECT body_code INTO model_code_result
    FROM dict_models dm
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dm.synonym) || '%'
    AND dm.body_code IS NOT NULL
    ORDER BY LENGTH(dm.synonym) DESC
    LIMIT 1;
    
    RETURN model_code_result;
END;
$$;

-- ============================================================================
-- 2. IMPROVED OEM EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_oem_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    oem_result TEXT;
BEGIN
    -- Look for alphanumeric codes 8-14 characters at end of string
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,14})\s*$'))[1] INTO oem_result;
    
    IF oem_result IS NOT NULL THEN
        RETURN oem_result;
    END IF;
    
    -- Look for alphanumeric codes 8+ characters anywhere
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,})'))[1] INTO oem_result;
    
    RETURN oem_result;
END;
$$;

-- ============================================================================
-- 3. IMPROVED PART FAMILY EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_part_family_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    family_result TEXT;
BEGIN
    -- Hebrew patterns first (most common in your data)
    IF position('פנס' in desc_text) > 0 THEN
        RETURN 'Lighting';
    END IF;
    IF position('דלת' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    IF position('כנף' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    IF position('מראה' in desc_text) > 0 THEN
        RETURN 'Mirrors';
    END IF;
    IF position('פגוש' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    IF position('רוטקלפר' in desc_text) > 0 THEN
        RETURN 'Lighting'; -- reflector in Hebrew (backwards)
    END IF;
    
    -- Check dictionary for English terms
    SELECT part_family INTO family_result
    FROM dict_parts dp
    WHERE UPPER(desc_text) LIKE '%' || UPPER(dp.synonym) || '%'
    AND dp.part_family IS NOT NULL
    ORDER BY LENGTH(dp.synonym) DESC
    LIMIT 1;
    
    RETURN family_result;
END;
$$;

-- ============================================================================
-- 4. TEST THE FIXED FUNCTIONS
-- ============================================================================

-- Test with the actual description from your catalog
SELECT 
    'FIXED FUNCTION TEST' as test_type,
    'X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר' as test_description,
    extract_model_code_from_desc('X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר') as extracted_model_code,
    extract_part_family_from_desc('X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר') as extracted_part_family;

-- Test with more examples
SELECT 
    'MORE TESTS' as test_type,
    'BMW 3 Series E90' as description1,
    extract_model_code_from_desc('BMW 3 Series E90') as code1,
    'Audi A6 C6' as description2,
    extract_model_code_from_desc('Audi A6 C6') as code2,
    'Golf MK6' as description3,
    extract_model_code_from_desc('Golf MK6') as code3;

-- ============================================================================
-- 5. NOW UPDATE THE CATALOG WITH FIXED FUNCTIONS
-- ============================================================================

-- Update just a few rows first to test
UPDATE catalog_items SET
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc)
WHERE id IN (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    LIMIT 10
);

-- Check results
SELECT 
    'TEST UPDATE RESULTS' as result_type,
    cat_num_desc,
    model_code,
    part_family
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND (model_code IS NOT NULL OR part_family IS NOT NULL)
LIMIT 5;