-- FIX FIELD MAPPING FOR EXTRACTION
-- Check available fields and map data correctly

-- ============================================================================
-- 1. CHECK AVAILABLE FIELDS IN CATALOG_ITEMS
-- ============================================================================

SELECT 
    'AVAILABLE FIELDS' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'catalog_items'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. ADD MISSING FIELDS IF NEEDED
-- ============================================================================

-- Add year_range field if it doesn't exist
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS year_range TEXT;

-- Add actual_trim field if it doesn't exist (for real trim levels)
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS actual_trim TEXT;

-- Add side_position field for left/right info
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS side_position TEXT;

-- Add front_rear field for position info
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS front_rear TEXT;

-- ============================================================================
-- 3. CREATE PROPER TRIM EXTRACTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_trim_from_desc(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    -- Look for common trim levels in Hebrew/English
    IF position('בייסיק' in desc_text) > 0 OR UPPER(desc_text) LIKE '%BASIC%' THEN
        RETURN 'Basic';
    END IF;
    
    IF position('קומפורט' in desc_text) > 0 OR UPPER(desc_text) LIKE '%COMFORT%' THEN
        RETURN 'Comfort';
    END IF;
    
    IF position('ספורט' in desc_text) > 0 OR UPPER(desc_text) LIKE '%SPORT%' THEN
        RETURN 'Sport';
    END IF;
    
    IF position('יוקרה' in desc_text) > 0 OR UPPER(desc_text) LIKE '%LUXURY%' THEN
        RETURN 'Luxury';
    END IF;
    
    IF UPPER(desc_text) LIKE '%EXECUTIVE%' THEN
        RETURN 'Executive';
    END IF;
    
    IF UPPER(desc_text) LIKE '%PREMIUM%' THEN
        RETURN 'Premium';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 4. CORRECTED BATCH EXTRACTION WITH PROPER FIELD MAPPING
-- ============================================================================

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
    AND model_code IS NULL
    ORDER BY id
    LIMIT 5000
);

-- ============================================================================
-- 5. CHECK CORRECTED RESULTS
-- ============================================================================

-- Show corrected field mapping
SELECT 
    'CORRECTED FIELD MAPPING' as info,
    cat_num_desc,
    model_code,
    part_family,
    side_position,
    front_rear,
    year_range,
    actual_trim,
    oem
FROM catalog_items 
WHERE cat_num_desc IS NOT NULL 
AND model_code IS NOT NULL
ORDER BY id DESC
LIMIT 5;

-- Show statistics with correct fields
SELECT 
    'CORRECTED STATISTICS' as stats,
    COUNT(CASE WHEN year_range IS NOT NULL THEN 1 END) as has_year_range,
    COUNT(CASE WHEN actual_trim IS NOT NULL THEN 1 END) as has_actual_trim,
    COUNT(CASE WHEN side_position IS NOT NULL THEN 1 END) as has_side_position,
    COUNT(CASE WHEN front_rear IS NOT NULL THEN 1 END) as has_front_rear
FROM catalog_items;

-- Progress check
SELECT 
    'PROGRESS UPDATE' as status,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NULL THEN 1 END) as remaining_unprocessed,
    COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL THEN 1 END) as total_processed,
    ROUND(100.0 * COUNT(CASE WHEN cat_num_desc IS NOT NULL AND model_code IS NOT NULL THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN cat_num_desc IS NOT NULL THEN 1 END), 0), 1) as percent_complete
FROM catalog_items;