-- STEP 3: DEPLOY AUTO EXTRACT TRIGGERS

-- Run DEPLOY_REMAINING_ESSENTIALS.sql to get:
-- - auto_extract_catalog_data() function
-- - Automatic triggers

-- Or if that doesn't work, at minimum do this:

-- Add missing columns if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- Extract some data manually for now
UPDATE catalog_items
SET side_position = CASE
    WHEN cat_num_desc LIKE '%שמאל%' THEN 'שמאל'
    WHEN cat_num_desc LIKE '%ימין%' THEN 'ימין'
    ELSE side_position
END
WHERE side_position IS NULL;

UPDATE catalog_items
SET front_rear = CASE
    WHEN cat_num_desc LIKE '%קדמי%' THEN 'קדמי'
    WHEN cat_num_desc LIKE '%אחורי%' THEN 'אחורי'
    ELSE front_rear
END
WHERE front_rear IS NULL;