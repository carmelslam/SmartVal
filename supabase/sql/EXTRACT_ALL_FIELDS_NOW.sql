-- EXTRACT ALL MISSING FIELDS FROM EXISTING DATA
-- This will extract: side, front/rear, model, model code, trim, years, OEM

-- 1. Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- 2. Extract SIDE POSITION (ימין/שמאל)
UPDATE catalog_items
SET side_position = CASE
    -- Hebrew patterns
    WHEN lower(cat_num_desc) LIKE '%שמאל%' OR lower(cat_num_desc) LIKE '%לאמש%' THEN 'שמאל'
    WHEN lower(cat_num_desc) LIKE '%ימין%' OR lower(cat_num_desc) LIKE '%ןימי%' THEN 'ימין'
    -- English patterns
    WHEN lower(cat_num_desc) LIKE '%left%' OR lower(cat_num_desc) LIKE '%lh%' OR lower(cat_num_desc) LIKE '%l.h%' THEN 'שמאל'
    WHEN lower(cat_num_desc) LIKE '%right%' OR lower(cat_num_desc) LIKE '%rh%' OR lower(cat_num_desc) LIKE '%r.h%' THEN 'ימין'
    ELSE side_position
END
WHERE side_position IS NULL OR side_position = '';

-- 3. Extract FRONT/REAR (קדמי/אחורי)
UPDATE catalog_items
SET front_rear = CASE
    -- Hebrew patterns
    WHEN lower(cat_num_desc) LIKE '%קדמי%' OR lower(cat_num_desc) LIKE '%ימדק%' THEN 'קדמי'
    WHEN lower(cat_num_desc) LIKE '%אחורי%' OR lower(cat_num_desc) LIKE '%ירוחא%' THEN 'אחורי'
    -- English patterns
    WHEN lower(cat_num_desc) LIKE '%front%' OR lower(cat_num_desc) LIKE '%fr%' THEN 'קדמי'
    WHEN lower(cat_num_desc) LIKE '%rear%' OR lower(cat_num_desc) LIKE '%rr%' OR lower(cat_num_desc) LIKE '%back%' THEN 'אחורי'
    ELSE front_rear
END
WHERE front_rear IS NULL OR front_rear = '';

-- 4. Extract YEAR RANGE (e.g., 09-13, 2009-2013)
UPDATE catalog_items AS ci
SET 
    year_from = CASE 
        WHEN matches[1] IS NOT NULL THEN
            CASE 
                WHEN length(matches[1]) = 2 THEN 2000 + matches[1]::int
                WHEN length(matches[1]) = 3 THEN 2000 + matches[1]::int
                ELSE matches[1]::int 
            END
        ELSE year_from
    END,
    year_to = CASE 
        WHEN matches[2] IS NOT NULL THEN
            CASE 
                WHEN length(matches[2]) = 2 THEN 2000 + matches[2]::int
                WHEN length(matches[2]) = 3 THEN 2000 + matches[2]::int
                ELSE matches[2]::int 
            END
        ELSE year_to
    END,
    year_range = CASE
        WHEN matches[1] IS NOT NULL AND matches[2] IS NOT NULL THEN matches[1] || '-' || matches[2]
        ELSE year_range
    END
FROM (
    SELECT id, regexp_match(lower(cat_num_desc), '(\d{2,4})\s*[-–]\s*(\d{2,4})') as matches
    FROM catalog_items
) AS extracted
WHERE ci.id = extracted.id 
  AND extracted.matches IS NOT NULL
  AND (ci.year_from IS NULL OR ci.year_to IS NULL);

-- 5. Extract MODEL CODE (e.g., E70, F26, C6)
UPDATE catalog_items AS ci
SET model_code = upper(matches[1])
FROM (
    SELECT id, regexp_match(lower(cat_num_desc), '([ecfg][0-9]{2})') as matches
    FROM catalog_items
) AS extracted
WHERE ci.id = extracted.id 
  AND extracted.matches IS NOT NULL
  AND (ci.model_code IS NULL OR ci.model_code = '');

-- 6. Extract OEM (8-14 alphanumeric characters, skip 'dep' prefix)
UPDATE catalog_items AS ci
SET oem = matches[1]
FROM (
    SELECT id, regexp_match(lower(cat_num_desc), '([a-z0-9]{8,14})') as matches
    FROM catalog_items
) AS extracted
WHERE ci.id = extracted.id 
  AND extracted.matches IS NOT NULL
  AND left(matches[1], 3) <> 'dep'
  AND (ci.oem IS NULL OR ci.oem = '');

-- 7. Extract PART FAMILY (Hebrew)
UPDATE catalog_items
SET part_family = CASE
    WHEN lower(cat_num_desc) LIKE '%פנס%' OR lower(cat_num_desc) LIKE '%סנפ%' THEN 'פנס'
    WHEN lower(cat_num_desc) LIKE '%רפלקטור%' OR lower(cat_num_desc) LIKE '%רוטקלפר%' THEN 'רפלקטור'
    WHEN lower(cat_num_desc) LIKE '%מראה%' OR lower(cat_num_desc) LIKE '%הארמ%' OR 
         lower(cat_num_desc) LIKE '%ראי%' OR lower(cat_num_desc) LIKE '%יאר%' THEN 'מראה'
    WHEN lower(cat_num_desc) LIKE '%מגן%' OR lower(cat_num_desc) LIKE '%ןגמ%' OR 
         lower(cat_num_desc) LIKE '%פגוש%' OR lower(cat_num_desc) LIKE '%שוגפ%' OR
         lower(cat_num_desc) LIKE '%טמבון%' OR lower(cat_num_desc) LIKE '%ןובמט%' THEN 'פגוש'
    WHEN lower(cat_num_desc) LIKE '%גריל%' OR lower(cat_num_desc) LIKE '%לירג%' THEN 'גריל'
    WHEN lower(cat_num_desc) LIKE '%כנף%' OR lower(cat_num_desc) LIKE '%ףנכ%' OR 
         lower(cat_num_desc) LIKE '%דלת%' OR lower(cat_num_desc) LIKE '%תלד%' OR
         lower(cat_num_desc) LIKE '%מכסה מנוע%' OR lower(cat_num_desc) LIKE '%מכסה תא מטען%' THEN 'פח'
    ELSE part_family
END
WHERE part_family IS NULL OR part_family = '';

-- 8. Extract PART NAME
UPDATE catalog_items
SET part_name = CASE
    -- Doors
    WHEN lower(cat_num_desc) LIKE '%דלת%' OR lower(cat_num_desc) LIKE '%תלד%' THEN 'דלת'
    -- Fenders
    WHEN lower(cat_num_desc) LIKE '%כנף%' OR lower(cat_num_desc) LIKE '%ףנכ%' THEN 'כנף'
    -- Bumpers
    WHEN lower(cat_num_desc) LIKE '%מגן%' OR lower(cat_num_desc) LIKE '%ןגמ%' THEN 'מגן'
    -- Lights
    WHEN lower(cat_num_desc) LIKE '%פנס%' OR lower(cat_num_desc) LIKE '%סנפ%' THEN 'פנס'
    -- Mirrors
    WHEN lower(cat_num_desc) LIKE '%מראה%' OR lower(cat_num_desc) LIKE '%הארמ%' OR 
         lower(cat_num_desc) LIKE '%ראי%' OR lower(cat_num_desc) LIKE '%יאר%' THEN 'מראה'
    -- Wheels
    WHEN lower(cat_num_desc) LIKE '%גלגל%' OR lower(cat_num_desc) LIKE '%לגלג%' THEN 'גלגל'
    -- Windshield
    WHEN lower(cat_num_desc) LIKE '%שמשה%' OR lower(cat_num_desc) LIKE '%השמש%' THEN 'שמשה'
    -- Window
    WHEN lower(cat_num_desc) LIKE '%חלון%' OR lower(cat_num_desc) LIKE '%ןולח%' THEN 'חלון'
    -- Grille
    WHEN lower(cat_num_desc) LIKE '%גריל%' OR lower(cat_num_desc) LIKE '%לירג%' THEN 'גריל'
    ELSE part_name
END
WHERE part_name IS NULL OR part_name = '';

-- 9. Extract MODEL (basic patterns)
UPDATE catalog_items AS ci
SET model = upper(replace(matches[1], ' ', ''))
FROM (
    SELECT id, 
           regexp_match(lower(cat_num_desc), 
                       '(a[0-9]{1,2}|s[0-9]{1,2}|q[0-9]{1,2}|x[0-9]{1,2}|t[0-9]{1,2}|' ||
                       'golf|גולף|passat|פאסאט|fiesta|פיאסטה|focus|פוקוס|corolla|קורולה|' ||
                       'camry|קאמרי|accord|אקורד|civic|סיוויק|yaris|יאריס)') as matches
    FROM catalog_items
) AS extracted
WHERE ci.id = extracted.id 
  AND extracted.matches IS NOT NULL
  AND (ci.model IS NULL OR ci.model = '');

-- 10. Extract ENGINE TYPE
UPDATE catalog_items
SET engine_type = CASE
    WHEN lower(cat_num_desc) LIKE '%דיזל%' OR lower(cat_num_desc) LIKE '%לזיד%' THEN 'דיזל'
    WHEN lower(cat_num_desc) LIKE '%בנזין%' OR lower(cat_num_desc) LIKE '%ןיזנב%' THEN 'בנזין'
    WHEN lower(cat_num_desc) LIKE '%היבריד%' OR lower(cat_num_desc) LIKE '%דירביה%' THEN 'היברידי'
    WHEN lower(cat_num_desc) LIKE '%חשמלי%' OR lower(cat_num_desc) LIKE '%ילמשח%' THEN 'חשמלי'
    ELSE engine_type
END
WHERE engine_type IS NULL OR engine_type = '';

-- 11. VERIFICATION - Check what we extracted
SELECT 'EXTRACTION RESULTS:' as status;

-- Count extractions
SELECT 
    'Extraction Summary' as check_type,
    COUNT(*) as total_records,
    COUNT(side_position) as has_side,
    COUNT(front_rear) as has_position,
    COUNT(year_from) as has_years,
    COUNT(model_code) as has_model_code,
    COUNT(oem) as has_oem,
    COUNT(part_family) as has_family,
    COUNT(part_name) as has_part_name,
    COUNT(model) as has_model,
    COUNT(engine_type) as has_engine_type
FROM catalog_items;

-- Show sample of extracted data
SELECT 'SAMPLE EXTRACTED DATA:' as status;
SELECT 
    id,
    cat_num_desc,
    make,
    model,
    model_code,
    year_range,
    side_position,
    front_rear,
    part_family,
    part_name,
    oem
FROM catalog_items
WHERE side_position IS NOT NULL 
   OR front_rear IS NOT NULL 
   OR year_from IS NOT NULL
   OR model_code IS NOT NULL
LIMIT 10;

-- Test search again
SELECT 'SEARCH TEST AFTER EXTRACTION:' as status;
SELECT COUNT(*) as search_results
FROM smart_parts_search(free_query_param := 'דלת');