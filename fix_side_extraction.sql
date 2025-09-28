-- FIX SIDE EXTRACTION FUNCTION
-- Debug and fix side position extraction

-- ============================================================================
-- 1. TEST THE CURRENT SIDE EXTRACTION FUNCTION
-- ============================================================================

-- Test with sample descriptions that should have side info
SELECT 
    'SIDE FUNCTION TEST' as test_type,
    'G20 -018 - )דל( ''מש ישאר סנפ' as desc_with_left,
    extract_side_from_desc('G20 -018 - )דל( ''מש ישאר סנפ') as should_be_left,
    'X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר' as desc_with_right,
    extract_side_from_desc('X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר') as should_be_right;

-- ============================================================================
-- 2. CREATE IMPROVED SIDE EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Hebrew patterns for right (ימין, מי)
    IF position('ימין' in desc_text) > 0 OR position('מי' in desc_text) > 0 THEN
        RETURN 'Right';
    END IF;
    
    -- Hebrew patterns for left (שמאל, מש)
    IF position('שמאל' in desc_text) > 0 OR position('מש' in desc_text) > 0 THEN
        RETURN 'Left';
    END IF;
    
    -- English patterns
    IF UPPER(desc_text) LIKE '%RIGHT%' OR UPPER(desc_text) LIKE '%RH%' THEN
        RETURN 'Right';
    END IF;
    
    IF UPPER(desc_text) LIKE '%LEFT%' OR UPPER(desc_text) LIKE '%LH%' THEN
        RETURN 'Left';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 3. TEST THE IMPROVED FUNCTION
-- ============================================================================

-- Test again with the improved function
SELECT 
    'IMPROVED SIDE TEST' as test_type,
    'G20 -018 - )דל( ''מש ישאר סנפ' as desc1,
    extract_side_from_desc('G20 -018 - )דל( ''מש ישאר סנפ') as result1,
    'X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר' as desc2,
    extract_side_from_desc('X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר') as result2;

-- ============================================================================
-- 4. UPDATE ITEMS WITH SIDE INFO (USING SUBQUERY)
-- ============================================================================

-- Update items that contain left indicator
UPDATE catalog_items SET
    side_position = extract_side_from_desc(cat_num_desc)
WHERE id IN (
    SELECT id FROM catalog_items 
    WHERE cat_num_desc IS NOT NULL 
    AND (cat_num_desc LIKE '%מש%' OR cat_num_desc LIKE '%מי%')
    LIMIT 100
);

-- ============================================================================
-- 5. CHECK RESULTS
-- ============================================================================

-- Check if side extraction is now working
SELECT 
    'SIDE EXTRACTION RESULTS' as result_type,
    COUNT(CASE WHEN side_position = 'Left' THEN 1 END) as left_parts,
    COUNT(CASE WHEN side_position = 'Right' THEN 1 END) as right_parts,
    COUNT(CASE WHEN side_position IS NOT NULL THEN 1 END) as total_with_side
FROM catalog_items;

-- Show sample results
SELECT 
    'SIDE SAMPLE RESULTS' as sample_type,
    cat_num_desc,
    side_position
FROM catalog_items 
WHERE side_position IS NOT NULL 
LIMIT 5;

-- Check how many descriptions contain side indicators
SELECT 
    'SIDE INDICATORS FOUND' as indicator_check,
    COUNT(CASE WHEN cat_num_desc LIKE '%מש%' THEN 1 END) as contains_left_indicator,
    COUNT(CASE WHEN cat_num_desc LIKE '%מי%' THEN 1 END) as contains_right_indicator,
    COUNT(CASE WHEN cat_num_desc LIKE '%מש%' OR cat_num_desc LIKE '%מי%' THEN 1 END) as total_with_side_indicators
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;