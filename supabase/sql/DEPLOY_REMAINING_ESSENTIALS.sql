-- ================================================
-- DEPLOY REMAINING ESSENTIAL FUNCTIONS
-- ================================================
-- Since you already deployed SMART_FLEXIBLE_SEARCH.sql,
-- this file contains the remaining essential functions

-- ================================================
-- FUNCTION 1: AUTO EXTRACT (Processes catalog data)
-- ================================================
DROP FUNCTION IF EXISTS auto_extract_catalog_data() CASCADE;

CREATE OR REPLACE FUNCTION auto_extract_catalog_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    txt           text;
    yr            text[];
    yr_from_i     int;
    yr_to_i       int;
    oem_m         text[];
    model_code_m  text[];
    model_m       text[];
BEGIN
    -- Normalize to lowercase
    txt := lower(coalesce(new.cat_num_desc, ''));

    -- Extract OEM: 8-14 alphanumeric (skip 'dep' prefixes)
    SELECT regexp_match(txt, '([a-z0-9]{8,14})') INTO oem_m;
    IF oem_m IS NOT NULL AND (new.oem IS NULL OR new.oem = '') THEN
        IF left(oem_m[1], 3) <> 'dep' THEN
            new.oem := oem_m[1];
        END IF;
    END IF;

    -- Extract year range: 09-13 / 016-018 / 2009-2013
    SELECT regexp_match(txt, '(\d{2,4})\s*[-–]\s*(\d{2,4})') INTO yr;
    IF yr IS NOT NULL THEN
        yr_from_i := CASE 
            WHEN length(yr[1]) = 2 THEN 2000 + yr[1]::int
            WHEN length(yr[1]) = 3 THEN 2000 + yr[1]::int
            ELSE yr[1]::int 
        END;
        yr_to_i := CASE 
            WHEN length(yr[2]) = 2 THEN 2000 + yr[2]::int
            WHEN length(yr[2]) = 3 THEN 2000 + yr[2]::int
            ELSE yr[2]::int 
        END;

        IF new.year_from IS NULL THEN new.year_from := yr_from_i; END IF;
        IF new.year_to IS NULL THEN new.year_to := yr_to_i; END IF;
        IF new.year_range IS NULL THEN new.year_range := yr[1] || '-' || yr[2]; END IF;
    END IF;

    -- Extract side: ימין/שמאל
    IF (new.side_position IS NULL OR new.side_position = '') THEN
        IF txt LIKE '%שמאל%' THEN new.side_position := 'שמאל'; END IF;
        IF txt LIKE '%ימין%' THEN new.side_position := 'ימין'; END IF;
        -- English patterns
        IF txt LIKE '%left%' OR txt LIKE '%lh%' THEN new.side_position := 'שמאל'; END IF;
        IF txt LIKE '%right%' OR txt LIKE '%rh%' THEN new.side_position := 'ימין'; END IF;
    END IF;

    -- Extract position: קדמי/אחורי
    IF (new.front_rear IS NULL OR new.front_rear = '') THEN
        IF txt LIKE '%קדמי%' THEN new.front_rear := 'קדמי'; END IF;
        IF txt LIKE '%אחורי%' THEN new.front_rear := 'אחורי'; END IF;
        -- English patterns
        IF txt LIKE '%front%' OR txt LIKE '%fr%' THEN new.front_rear := 'קדמי'; END IF;
        IF txt LIKE '%rear%' OR txt LIKE '%rr%' OR txt LIKE '%back%' THEN new.front_rear := 'אחורי'; END IF;
    END IF;

    -- Extract part family (Hebrew)
    IF (new.part_family IS NULL OR new.part_family = '') THEN
        IF txt LIKE '%פנס%' THEN new.part_family := 'פנס'; END IF;
        IF txt LIKE '%רפלקטור%' THEN new.part_family := 'רפלקטור'; END IF;
        IF txt LIKE '%מראה%' OR txt LIKE '%ראי%' THEN new.part_family := 'מראה'; END IF;
        IF txt LIKE '%טמבון%' OR txt LIKE '%מגן%' OR txt LIKE '%פגוש%' THEN new.part_family := 'פגוש'; END IF;
        IF txt LIKE '%גריל%' THEN new.part_family := 'גריל'; END IF;
        IF new.part_family IS NULL THEN
            IF txt LIKE '%כנף%' OR txt LIKE '%דלת%' OR txt LIKE '%מכסה מנוע%' OR txt LIKE '%מכסה תא מטען%' THEN 
                new.part_family := 'פח'; 
            END IF;
        END IF;
    END IF;

    -- Extract model code (e70/f26/c6 etc)
    SELECT regexp_match(txt, '([ecfg][0-9]{2})') INTO model_code_m;
    IF model_code_m IS NOT NULL AND (new.model_code IS NULL OR new.model_code = '') THEN
        new.model_code := upper(model_code_m[1]);
    END IF;

    -- Extract model
    SELECT regexp_match(txt, '(a[0-9]{1,2}|s[0-9]{1,2}|q[0-9]{1,2}|x[0-9]{1,2}|t[0-9]{1,2}|גולף|פאסאט|פיאסטה|פוקוס|קורולה)')
    INTO model_m;
    IF model_m IS NOT NULL AND (new.model IS NULL OR new.model = '') THEN
        new.model := upper(replace(model_m[1], ' ', ''));
    END IF;

    -- Extract engine type
    IF (new.engine_type IS NULL OR new.engine_type = '') THEN
        IF txt LIKE '%דיזל%' THEN new.engine_type := 'דיזל'; END IF;
        IF txt LIKE '%בנזין%' THEN new.engine_type := 'בנזין'; END IF;
        IF txt LIKE '%היבריד%' THEN new.engine_type := 'היברידי'; END IF;
        IF txt LIKE '%חשמלי%' THEN new.engine_type := 'חשמלי'; END IF;
    END IF;

    -- Extract part name (if missing)
    IF (new.part_name IS NULL OR new.part_name = '') THEN
        -- Hebrew part names
        IF txt LIKE '%דלת%' OR txt LIKE '%תלד%' THEN new.part_name := 'דלת'; END IF;
        IF txt LIKE '%כנף%' OR txt LIKE '%ףנכ%' THEN new.part_name := 'כנף'; END IF;
        IF txt LIKE '%מגן%' OR txt LIKE '%ןגמ%' THEN new.part_name := 'מגן'; END IF;
        IF txt LIKE '%פנס%' OR txt LIKE '%סנפ%' THEN new.part_name := 'פנס'; END IF;
        IF txt LIKE '%מראה%' OR txt LIKE '%הארמ%' OR txt LIKE '%ראי%' OR txt LIKE '%יאר%' THEN new.part_name := 'מראה'; END IF;
        IF txt LIKE '%גלגל%' OR txt LIKE '%לגלג%' THEN new.part_name := 'גלגל'; END IF;
        IF txt LIKE '%שמשה%' OR txt LIKE '%השמש%' THEN new.part_name := 'שמשה'; END IF;
        IF txt LIKE '%חלון%' OR txt LIKE '%ןולח%' THEN new.part_name := 'חלון'; END IF;
    END IF;

    -- Normalize make
    IF new.make IS NOT NULL THEN
        new.make := normalize_make(new.make);
    END IF;

    RETURN new;
END;
$$;

-- ================================================
-- TRIGGERS: Automatic processing on catalog upload
-- ================================================
DROP TRIGGER IF EXISTS auto_process_catalog_on_insert ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_on_update ON catalog_items;

CREATE TRIGGER auto_process_catalog_on_insert
BEFORE INSERT ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION auto_extract_catalog_data();

CREATE TRIGGER auto_process_catalog_on_update
BEFORE UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION auto_extract_catalog_data();

-- ================================================
-- ADD MISSING COLUMNS (if needed)
-- ================================================
DO $$
BEGIN
    -- Add part_name column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
        RAISE NOTICE 'Added part_name column';
    END IF;
END $$;

-- ================================================
-- PROCESS EXISTING DATA (if any)
-- ================================================
-- This will trigger the auto_extract function for all existing rows
UPDATE catalog_items 
SET id = id  -- Dummy update to trigger processing
WHERE (year_from IS NULL 
   OR side_position IS NULL 
   OR part_family IS NULL
   OR part_name IS NULL
   OR make ILIKE '%יפן%')
   AND cat_num_desc IS NOT NULL;

-- ================================================
-- VERIFICATION
-- ================================================
SELECT 'DEPLOYMENT STATUS:' as status;

-- Check functions exist
SELECT COUNT(*) as function_count, string_agg(proname, ', ') as functions
FROM pg_proc 
WHERE proname IN ('reverse_hebrew', 'normalize_make', 'smart_parts_search', 
                  'extract_core_part_term', 'auto_extract_catalog_data');

-- Check triggers exist
SELECT COUNT(*) as trigger_count, string_agg(tgname, ', ') as triggers
FROM pg_trigger 
WHERE tgname LIKE 'auto_process_catalog%';

-- Check data processing
SELECT 
    'Data status' as check,
    COUNT(*) as total_items,
    COUNT(year_from) as with_years,
    COUNT(side_position) as with_side,
    COUNT(part_family) as with_family,
    COUNT(part_name) as with_part_name
FROM catalog_items;

SELECT '✅ REMAINING ESSENTIALS DEPLOYED!' as status;

-- ================================================
-- SUMMARY OF WHAT YOU NOW HAVE:
-- 1. reverse_hebrew() - From SMART_FLEXIBLE_SEARCH.sql
-- 2. normalize_make() - From SMART_FLEXIBLE_SEARCH.sql
-- 3. extract_core_part_term() - From SMART_FLEXIBLE_SEARCH.sql
-- 4. smart_parts_search() - From SMART_FLEXIBLE_SEARCH.sql
-- 5. auto_extract_catalog_data() - From this file
-- 6. Automatic triggers - From this file
-- ================================================