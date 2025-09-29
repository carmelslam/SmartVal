-- TEST SIDE EXTRACTION FUNCTION
-- Check why side_position extraction isn't working

-- ============================================================================
-- 1. TEST THE SIDE EXTRACTION FUNCTION MANUALLY
-- ============================================================================

-- Test with sample descriptions that should have side info
SELECT 
    'SIDE FUNCTION TEST' as test_type,
    'C5 11- רפסמ סנפ' as desc1,
    extract_side_from_desc('C5 11- רפסמ סנפ') as side1,
    'G20 -018 - )דל( ''מש ישאר סנפ' as desc2,
    extract_side_from_desc('G20 -018 - )דל( ''מש ישאר סנפ') as side2,
    'X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר' as desc3,
    extract_side_from_desc('X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר') as side3;

-- Check if the function exists
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name
FROM information_schema.routines 
WHERE routine_name = 'extract_side_from_desc';

-- ============================================================================
-- 2. CREATE/FIX THE SIDE EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Hebrew patterns for right/left (check both normal and reversed)
    IF position('ימין' in desc_text) > 0 OR position('ןימי' in desc_text) > 0 OR position('מי' in desc_text) > 0 THEN
        RETURN 'Right';
    END IF;
    
    IF position('שמאל' in desc_text) > 0 OR position('לאמש' in desc_text) > 0 OR position('מש' in desc_text) > 0 THEN
        RETURN 'Left';
    END IF;
    
    -- English patterns
    IF UPPER(desc_text) LIKE '%RIGHT%' OR UPPER(desc_text) LIKE '%RH%' OR UPPER(desc_text) LIKE '%R)%' THEN
        RETURN 'Right';
    END IF;
    
    IF UPPER(desc_text) LIKE '%LEFT%' OR UPPER(desc_text) LIKE '%LH%' OR UPPER(desc_text) LIKE '%L)%' THEN
        RETURN 'Left';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 3. TEST THE FIXED FUNCTION
-- ============================================================================

-- Test again with the fixed function
SELECT 
    'FIXED SIDE TEST' as test_type,
    'G20 -018 - )דל( ''מש ישאר סנפ' as desc_with_left,
    extract_side_from_desc('G20 -018 - )דל( ''מש ישאר סנפ') as should_be_left,
    'X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר' as desc_with_right,
    extract_side_from_desc('X5 E70 08-10 פי''ג ''חא ןגמל ''מי רוטקלפר') as should_be_right;

-- ============================================================================
-- 4. UPDATE A SAMPLE TO TEST
-- ============================================================================

-- Update a few items to test the fixed function
UPDATE catalog_items SET
    side_position = extract_side_from_desc(cat_num_desc),
    front_rear = extract_position_from_desc(cat_num_desc)
WHERE cat_num_desc IS NOT NULL 
AND cat_num_desc LIKE '%מש%'
LIMIT 100;

-- Check if it worked
SELECT 
    'SIDE TEST RESULTS' as result_type,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as found_side_info,
    COUNT(CASE WHEN front_rear IS NOT NULL AND front_rear != '' THEN 1 END) as found_position_info
FROM catalog_items 
WHERE cat_num_desc LIKE '%מש%';

-- Show sample results
SELECT 
    'SIDE SAMPLE RESULTS' as sample_type,
    cat_num_desc,
    side_position,
    front_rear
FROM catalog_items 
WHERE side_position IS NOT NULL 
AND side_position != ''
LIMIT 5;