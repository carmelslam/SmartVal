-- FIX PART FAMILY EXTRACTION
-- The Hebrew text appears to be written backwards/RTL

-- ============================================================================
-- 1. IMPROVED PART FAMILY EXTRACTION WITH BACKWARDS HEBREW
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_part_family_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    family_result TEXT;
BEGIN
    -- Hebrew patterns (both normal and backwards due to RTL)
    
    -- Headlight patterns
    IF position('פנס' in desc_text) > 0 OR position('סנפ' in desc_text) > 0 THEN
        RETURN 'Lighting';
    END IF;
    
    -- Rear light patterns  
    IF position('זנב' in desc_text) > 0 OR position('בנז' in desc_text) > 0 THEN
        RETURN 'Lighting';
    END IF;
    
    -- Door patterns
    IF position('דלת' in desc_text) > 0 OR position('תלד' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    
    -- Fender/Wing patterns
    IF position('כנף' in desc_text) > 0 OR position('ףנכ' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    
    -- Mirror patterns
    IF position('מראה' in desc_text) > 0 OR position('הארם' in desc_text) > 0 THEN
        RETURN 'Mirrors';
    END IF;
    
    -- Bumper patterns
    IF position('פגוש' in desc_text) > 0 OR position('שוגפ' in desc_text) > 0 THEN
        RETURN 'Body';
    END IF;
    
    -- Reflector patterns
    IF position('רפלקטור' in desc_text) > 0 OR position('רוטקלפר' in desc_text) > 0 THEN
        RETURN 'Lighting';
    END IF;
    
    -- English patterns
    IF UPPER(desc_text) LIKE '%HEADLIGHT%' OR UPPER(desc_text) LIKE '%LIGHT%' THEN
        RETURN 'Lighting';
    END IF;
    
    IF UPPER(desc_text) LIKE '%DOOR%' THEN
        RETURN 'Body';
    END IF;
    
    IF UPPER(desc_text) LIKE '%MIRROR%' THEN
        RETURN 'Mirrors';
    END IF;
    
    -- Check dictionary for other terms
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
-- 2. TEST THE FIXED PART FAMILY FUNCTION
-- ============================================================================

-- Test with your actual descriptions
SELECT 
    'PART FAMILY TEST' as test_type,
    'C5 11- רפסמ סנפ' as desc1,
    extract_part_family_from_desc('C5 11- רפסמ סנפ') as family1,
    'G20 -018 - )דל( ''מש ישאר סנפ' as desc2,
    extract_part_family_from_desc('G20 -018 - )דל( ''מש ישאר סנפ') as family2;

-- ============================================================================
-- 3. UPDATE THE TEST ROWS AGAIN WITH FIXED FUNCTION
-- ============================================================================

-- Update the same test rows with the fixed part family function
UPDATE catalog_items SET
    part_family = extract_part_family_from_desc(cat_num_desc)
WHERE id IN (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    LIMIT 10
);

-- Check results again
SELECT 
    'FIXED PART FAMILY RESULTS' as result_type,
    cat_num_desc,
    model_code,
    part_family
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND (model_code IS NOT NULL OR part_family IS NOT NULL)
LIMIT 10;

-- ============================================================================
-- 4. NOW UPDATE THE ENTIRE CATALOG
-- ============================================================================

-- If the test works, update all rows
UPDATE catalog_items SET
    oem = extract_oem_from_desc(cat_num_desc),
    model = extract_model_from_desc(cat_num_desc),
    model_code = extract_model_code_from_desc(cat_num_desc),
    part_family = extract_part_family_from_desc(cat_num_desc),
    engine_volume = extract_side_from_desc(cat_num_desc),
    engine_code = extract_position_from_desc(cat_num_desc),
    "trim" = extract_year_range_as_text(cat_num_desc)
WHERE cat_num_desc IS NOT NULL;

-- Final results
SELECT 
    'FINAL EXTRACTION RESULTS' as status,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as had_descriptions,
    COUNT(CASE WHEN oem IS NOT NULL THEN 1 END) as extracted_oem,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as extracted_model,
    COUNT(CASE WHEN model_code IS NOT NULL THEN 1 END) as extracted_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL THEN 1 END) as extracted_family
FROM catalog_items;

-- Model code statistics
SELECT 
    'MODEL CODES EXTRACTED' as stat_type,
    model_code,
    COUNT(*) as count
FROM catalog_items 
WHERE model_code IS NOT NULL
GROUP BY model_code
ORDER BY count DESC;

-- Part family statistics
SELECT 
    'PART FAMILIES EXTRACTED' as stat_type,
    part_family,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL
GROUP BY part_family
ORDER BY count DESC;