-- EXTRACT ALL RECORDS - SIMPLE AND FAST
-- This uses simpler logic to process all records without timeouts

-- 1. Add part_name column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- 2. Extract SIDE POSITION for ALL records (simple patterns)
UPDATE catalog_items
SET side_position = 
    CASE 
        WHEN cat_num_desc ILIKE '%שמאל%' THEN 'שמאל'
        WHEN cat_num_desc ILIKE '%ימין%' THEN 'ימין'
        WHEN cat_num_desc ILIKE '%left%' THEN 'שמאל'
        WHEN cat_num_desc ILIKE '%right%' THEN 'ימין'
        ELSE NULL
    END
WHERE side_position IS NULL;

-- 3. Extract FRONT/REAR for ALL records (simple patterns)
UPDATE catalog_items
SET front_rear = 
    CASE 
        WHEN cat_num_desc ILIKE '%קדמי%' THEN 'קדמי'
        WHEN cat_num_desc ILIKE '%אחורי%' THEN 'אחורי'
        WHEN cat_num_desc ILIKE '%front%' THEN 'קדמי'
        WHEN cat_num_desc ILIKE '%rear%' THEN 'אחורי'
        ELSE NULL
    END
WHERE front_rear IS NULL;

-- 4. Extract PART FAMILY for ALL records (simple patterns)
UPDATE catalog_items
SET part_family = 
    CASE 
        WHEN cat_num_desc ILIKE '%פנס%' THEN 'פנס'
        WHEN cat_num_desc ILIKE '%מראה%' OR cat_num_desc ILIKE '%ראי%' THEN 'מראה'
        WHEN cat_num_desc ILIKE '%מגן%' OR cat_num_desc ILIKE '%פגוש%' THEN 'פגוש'
        WHEN cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%כנף%' THEN 'פח'
        WHEN cat_num_desc ILIKE '%גריל%' THEN 'גריל'
        ELSE NULL
    END
WHERE part_family IS NULL;

-- 5. Extract PART NAME for ALL records (simple patterns)
UPDATE catalog_items
SET part_name = 
    CASE 
        WHEN cat_num_desc ILIKE '%דלת%' THEN 'דלת'
        WHEN cat_num_desc ILIKE '%כנף%' THEN 'כנף'
        WHEN cat_num_desc ILIKE '%מגן%' THEN 'מגן'
        WHEN cat_num_desc ILIKE '%פנס%' THEN 'פנס'
        WHEN cat_num_desc ILIKE '%מראה%' OR cat_num_desc ILIKE '%ראי%' THEN 'מראה'
        WHEN cat_num_desc ILIKE '%גלגל%' THEN 'גלגל'
        WHEN cat_num_desc ILIKE '%שמשה%' THEN 'שמשה'
        WHEN cat_num_desc ILIKE '%גריל%' THEN 'גריל'
        ELSE NULL
    END
WHERE part_name IS NULL;

-- 6. Check results
SELECT 
    'EXTRACTION COMPLETE' as status,
    COUNT(*) as total_records,
    COUNT(side_position) as with_side,
    COUNT(front_rear) as with_position,
    COUNT(part_family) as with_family,
    COUNT(part_name) as with_part_name,
    ROUND(COUNT(side_position) * 100.0 / COUNT(*), 1) as side_percent,
    ROUND(COUNT(front_rear) * 100.0 / COUNT(*), 1) as position_percent,
    ROUND(COUNT(part_family) * 100.0 / COUNT(*), 1) as family_percent,
    ROUND(COUNT(part_name) * 100.0 / COUNT(*), 1) as part_name_percent
FROM catalog_items;

-- 7. Show sample extracted data
SELECT 
    'SAMPLE RESULTS:' as check_type,
    cat_num_desc,
    make,
    side_position,
    front_rear,
    part_family,
    part_name
FROM catalog_items
WHERE side_position IS NOT NULL OR front_rear IS NOT NULL
LIMIT 10;

-- 8. Test search function
SELECT 'SEARCH TEST:' as check_type;
SELECT COUNT(*) as door_search_results
FROM smart_parts_search(free_query_param := 'דלת', limit_results := 100);