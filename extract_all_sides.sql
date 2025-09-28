-- EXTRACT SIDE INFORMATION FOR ALL ITEMS
-- Process all 27,452 items that have side indicators

-- ============================================================================
-- 1. EXTRACT SIDE INFO FOR ALL ITEMS WITH INDICATORS
-- ============================================================================

-- Update all items that have side indicators
UPDATE catalog_items SET
    side_position = extract_side_from_desc(cat_num_desc)
WHERE cat_num_desc IS NOT NULL 
AND (cat_num_desc LIKE '%מש%' OR cat_num_desc LIKE '%מי%');

-- ============================================================================
-- 2. CHECK EXTRACTION RESULTS
-- ============================================================================

-- Show side extraction results
SELECT 
    'SIDE EXTRACTION COMPLETE' as status,
    COUNT(CASE WHEN side_position = 'Left' THEN 1 END) as left_parts,
    COUNT(CASE WHEN side_position = 'Right' THEN 1 END) as right_parts,
    COUNT(CASE WHEN side_position IS NOT NULL THEN 1 END) as total_with_side,
    ROUND(100.0 * COUNT(CASE WHEN side_position IS NOT NULL THEN 1 END) / COUNT(*), 1) as side_coverage_percent
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL;

-- Show sample results
SELECT 
    'SIDE SAMPLE RESULTS' as sample_type,
    cat_num_desc,
    side_position,
    part_family
FROM catalog_items 
WHERE side_position IS NOT NULL 
LIMIT 10;

-- ============================================================================
-- 3. EXTRACT FRONT/REAR POSITION INFO
-- ============================================================================

-- Create improved position extraction function
CREATE OR REPLACE FUNCTION extract_position_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Hebrew patterns for front (קדמי, קדם)
    IF position('קדמי' in desc_text) > 0 OR position('קדם' in desc_text) > 0 OR position('ישאר' in desc_text) > 0 THEN
        RETURN 'Front';
    END IF;
    
    -- Hebrew patterns for rear (אחורי, אחור)
    IF position('אחורי' in desc_text) > 0 OR position('אחור' in desc_text) > 0 OR position('ירוחא' in desc_text) > 0 THEN
        RETURN 'Rear';
    END IF;
    
    -- English patterns
    IF UPPER(desc_text) LIKE '%FRONT%' OR UPPER(desc_text) LIKE '%FORWARD%' THEN
        RETURN 'Front';
    END IF;
    
    IF UPPER(desc_text) LIKE '%REAR%' OR UPPER(desc_text) LIKE '%BACK%' THEN
        RETURN 'Rear';
    END IF;
    
    RETURN NULL;
END;
$$;

-- Update position info for items
UPDATE catalog_items SET
    front_rear = extract_position_from_desc(cat_num_desc)
WHERE cat_num_desc IS NOT NULL;

-- ============================================================================
-- 4. COMPREHENSIVE EXTRACTION STATISTICS
-- ============================================================================

-- Final comprehensive statistics
SELECT 
    'COMPREHENSIVE EXTRACTION STATS' as final_stats,
    COUNT(*) as total_catalog_items,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END) as has_descriptions,
    COUNT(CASE WHEN model_code IS NOT NULL AND model_code != '' THEN 1 END) as has_model_code,
    COUNT(CASE WHEN part_family IS NOT NULL AND part_family != '' THEN 1 END) as has_part_family,
    COUNT(CASE WHEN side_position IS NOT NULL AND side_position != '' THEN 1 END) as has_side_position,
    COUNT(CASE WHEN front_rear IS NOT NULL AND front_rear != '' THEN 1 END) as has_front_rear,
    COUNT(CASE WHEN year_range IS NOT NULL AND year_range != '' THEN 1 END) as has_year_range,
    COUNT(CASE WHEN oem IS NOT NULL AND oem != '' THEN 1 END) as has_oem
FROM catalog_items;

-- Position statistics
SELECT 
    'POSITION STATS' as position_stats,
    front_rear as position,
    COUNT(*) as count
FROM catalog_items 
WHERE front_rear IS NOT NULL
GROUP BY front_rear
ORDER BY count DESC;

-- Side + Position combination statistics
SELECT 
    'SIDE + POSITION COMBINATIONS' as combination_stats,
    side_position,
    front_rear,
    COUNT(*) as count
FROM catalog_items 
WHERE side_position IS NOT NULL AND front_rear IS NOT NULL
GROUP BY side_position, front_rear
ORDER BY count DESC;

-- Part family + Side statistics (most useful for parts search)
SELECT 
    'PART FAMILY + SIDE STATS' as family_side_stats,
    part_family,
    side_position,
    COUNT(*) as count
FROM catalog_items 
WHERE part_family IS NOT NULL AND side_position IS NOT NULL
GROUP BY part_family, side_position
ORDER BY count DESC
LIMIT 10;