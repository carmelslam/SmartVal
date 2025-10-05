-- BATCH 3: Extract PART FAMILY and PART NAME

-- Add part_name column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- Extract part family
UPDATE catalog_items
SET part_family = CASE
    WHEN lower(cat_num_desc) LIKE '%פנס%' OR lower(cat_num_desc) LIKE '%סנפ%' THEN 'פנס'
    WHEN lower(cat_num_desc) LIKE '%מראה%' OR lower(cat_num_desc) LIKE '%הארמ%' OR 
         lower(cat_num_desc) LIKE '%ראי%' OR lower(cat_num_desc) LIKE '%יאר%' THEN 'מראה'
    WHEN lower(cat_num_desc) LIKE '%מגן%' OR lower(cat_num_desc) LIKE '%ןגמ%' OR 
         lower(cat_num_desc) LIKE '%פגוש%' OR lower(cat_num_desc) LIKE '%שוגפ%' THEN 'פגוש'
    WHEN lower(cat_num_desc) LIKE '%דלת%' OR lower(cat_num_desc) LIKE '%תלד%' OR
         lower(cat_num_desc) LIKE '%כנף%' OR lower(cat_num_desc) LIKE '%ףנכ%' THEN 'פח'
    ELSE part_family
END
WHERE (part_family IS NULL OR part_family = '')
  AND id IN (
    SELECT id FROM catalog_items 
    WHERE (part_family IS NULL OR part_family = '')
    LIMIT 50000
  );

-- Extract part name
UPDATE catalog_items
SET part_name = CASE
    WHEN lower(cat_num_desc) LIKE '%דלת%' OR lower(cat_num_desc) LIKE '%תלד%' THEN 'דלת'
    WHEN lower(cat_num_desc) LIKE '%כנף%' OR lower(cat_num_desc) LIKE '%ףנכ%' THEN 'כנף'
    WHEN lower(cat_num_desc) LIKE '%מגן%' OR lower(cat_num_desc) LIKE '%ןגמ%' THEN 'מגן'
    WHEN lower(cat_num_desc) LIKE '%פנס%' OR lower(cat_num_desc) LIKE '%סנפ%' THEN 'פנס'
    WHEN lower(cat_num_desc) LIKE '%מראה%' OR lower(cat_num_desc) LIKE '%הארמ%' OR 
         lower(cat_num_desc) LIKE '%ראי%' OR lower(cat_num_desc) LIKE '%יאר%' THEN 'מראה'
    ELSE part_name
END
WHERE (part_name IS NULL OR part_name = '')
  AND id IN (
    SELECT id FROM catalog_items 
    WHERE (part_name IS NULL OR part_name = '')
    LIMIT 50000
  );

-- Check progress
SELECT 
    COUNT(*) as total,
    COUNT(part_family) as with_family,
    COUNT(part_name) as with_part_name
FROM catalog_items;