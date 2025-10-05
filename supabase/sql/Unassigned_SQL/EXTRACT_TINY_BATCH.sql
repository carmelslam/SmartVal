-- EXTRACT TINY BATCH - 5000 records only
-- Run this multiple times until all records are processed

-- Add part_name column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- Process only 5000 records per run
WITH batch AS (
    SELECT id FROM catalog_items
    WHERE side_position IS NULL 
       OR front_rear IS NULL 
       OR part_family IS NULL 
       OR part_name IS NULL
    LIMIT 5000
)
UPDATE catalog_items
SET 
    side_position = CASE 
        WHEN side_position IS NULL AND cat_num_desc ILIKE '%שמאל%' THEN 'שמאל'
        WHEN side_position IS NULL AND cat_num_desc ILIKE '%ימין%' THEN 'ימין'
        WHEN side_position IS NULL AND cat_num_desc ILIKE '%left%' THEN 'שמאל'
        WHEN side_position IS NULL AND cat_num_desc ILIKE '%right%' THEN 'ימין'
        ELSE side_position
    END,
    front_rear = CASE 
        WHEN front_rear IS NULL AND cat_num_desc ILIKE '%קדמי%' THEN 'קדמי'
        WHEN front_rear IS NULL AND cat_num_desc ILIKE '%אחורי%' THEN 'אחורי'
        WHEN front_rear IS NULL AND cat_num_desc ILIKE '%front%' THEN 'קדמי'
        WHEN front_rear IS NULL AND cat_num_desc ILIKE '%rear%' THEN 'אחורי'
        ELSE front_rear
    END,
    part_family = CASE 
        WHEN part_family IS NULL AND cat_num_desc ILIKE '%פנס%' THEN 'פנס'
        WHEN part_family IS NULL AND (cat_num_desc ILIKE '%מראה%' OR cat_num_desc ILIKE '%ראי%') THEN 'מראה'
        WHEN part_family IS NULL AND (cat_num_desc ILIKE '%מגן%' OR cat_num_desc ILIKE '%פגוש%') THEN 'פגוש'
        WHEN part_family IS NULL AND (cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%כנף%') THEN 'פח'
        ELSE part_family
    END,
    part_name = CASE 
        WHEN part_name IS NULL AND cat_num_desc ILIKE '%דלת%' THEN 'דלת'
        WHEN part_name IS NULL AND cat_num_desc ILIKE '%כנף%' THEN 'כנף'
        WHEN part_name IS NULL AND cat_num_desc ILIKE '%מגן%' THEN 'מגן'
        WHEN part_name IS NULL AND cat_num_desc ILIKE '%פנס%' THEN 'פנס'
        WHEN part_name IS NULL AND (cat_num_desc ILIKE '%מראה%' OR cat_num_desc ILIKE '%ראי%') THEN 'מראה'
        ELSE part_name
    END
WHERE catalog_items.id IN (SELECT id FROM batch);

-- Check progress
SELECT 
    COUNT(*) as total_records,
    COUNT(side_position) as with_side,
    COUNT(front_rear) as with_position,
    COUNT(part_family) as with_family,
    COUNT(part_name) as with_part_name,
    COUNT(*) - COUNT(CASE WHEN side_position IS NULL AND front_rear IS NULL AND part_family IS NULL AND part_name IS NULL THEN 1 END) as processed,
    COUNT(CASE WHEN side_position IS NULL AND front_rear IS NULL AND part_family IS NULL AND part_name IS NULL THEN 1 END) as remaining_to_process
FROM catalog_items;

-- Test if search works now
SELECT COUNT(*) as door_search_results
FROM smart_parts_search(free_query_param := 'דלת', limit_results := 10);