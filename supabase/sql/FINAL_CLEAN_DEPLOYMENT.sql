-- ================================================
-- FINAL CLEAN DEPLOYMENT - ONLY ESSENTIAL FUNCTIONS
-- ================================================
-- This file contains ONLY what you need for parts search to work
-- NO DELETE statements, NO test data, NO duplicates
-- Safe to run multiple times

-- ================================================
-- CLEAN UP: Drop all old functions first
-- ================================================
DROP FUNCTION IF EXISTS reverse_hebrew(text) CASCADE;
DROP FUNCTION IF EXISTS normalize_make(text) CASCADE;
DROP FUNCTION IF EXISTS extract_core_part_term(text) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search CASCADE;
DROP FUNCTION IF EXISTS auto_extract_catalog_data() CASCADE;

-- ================================================
-- FUNCTION 1: HEBREW REVERSAL (Required for display)
-- ================================================
CREATE OR REPLACE FUNCTION reverse_hebrew(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    hebrew_chars TEXT := 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ';
    result TEXT := '';
    i INTEGER;
    char_pos INTEGER;
BEGIN
    IF input_text IS NULL THEN RETURN NULL; END IF;
    
    FOR i IN 1..length(input_text) LOOP
        char_pos := position(substring(input_text, i, 1) IN hebrew_chars);
        IF char_pos > 0 THEN
            result := substring(input_text, i, 1) || result;
        ELSE
            result := result || substring(input_text, i, 1);
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- FUNCTION 2: MAKE NORMALIZATION (Required for search)
-- ================================================
CREATE OR REPLACE FUNCTION normalize_make(make_input TEXT)
RETURNS TEXT AS $$
BEGIN
    IF make_input IS NULL THEN RETURN NULL; END IF;
    
    -- Remove country suffixes (יפן, ארהב, etc.)
    make_input := regexp_replace(make_input, '\s+(יפן|ארהב|גרמניה|קוריאה|צרפת|איטליה|אנגליה|שוודיה)$', '', 'gi');
    
    -- Normalize common makes
    CASE UPPER(TRIM(make_input))
        WHEN 'TOYOTA', 'טויוטה יפן' THEN RETURN 'טויוטה';
        WHEN 'BMW', 'במוו', 'בםוו' THEN RETURN 'BMW';
        WHEN 'MERCEDES', 'MERCEDES-BENZ', 'מרצדס', 'מרצדס בנץ' THEN RETURN 'מרצדס';
        ELSE RETURN TRIM(make_input);
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- FUNCTION 3: AUTO EXTRACT (Processes catalog data)
-- ================================================
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
    END IF;

    -- Extract position: קדמי/אחורי
    IF (new.front_rear IS NULL OR new.front_rear = '') THEN
        IF txt LIKE '%קדמי%' THEN new.front_rear := 'קדמי'; END IF;
        IF txt LIKE '%אחורי%' THEN new.front_rear := 'אחורי'; END IF;
    END IF;

    -- Extract part family (Hebrew)
    IF (new.part_family IS NULL OR new.part_family = '') THEN
        IF txt LIKE '%פנס%' THEN new.part_family := 'פנס'; END IF;
        IF txt LIKE '%רפלקטור%' THEN new.part_family := 'רפלקטור'; END IF;
        IF txt LIKE '%מראה%' THEN new.part_family := 'מראה'; END IF;
        IF txt LIKE '%טמבון%' OR txt LIKE '%מגן%' THEN new.part_family := 'פגוש'; END IF;
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

    -- Normalize make
    IF new.make IS NOT NULL THEN
        new.make := normalize_make(new.make);
    END IF;

    RETURN new;
END;
$$;

-- ================================================
-- FUNCTION 4: MAIN SEARCH (The only search function you need)
-- ================================================
CREATE OR REPLACE FUNCTION smart_parts_search(
    car_plate TEXT DEFAULT NULL,
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    quantity_param INTEGER DEFAULT 1,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    cat_num_desc TEXT,
    supplier_name TEXT,
    pcode TEXT,
    price NUMERIC,
    oem TEXT,
    make TEXT,
    model TEXT,
    part_family TEXT,
    side_position TEXT,
    front_rear TEXT,
    year_range TEXT,
    availability TEXT,
    relevance_score INTEGER,
    version_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    normalized_make TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
    year_int INTEGER;
BEGIN
    -- Make filter
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make, '%' || normalized_make || '%'));
    END IF;
    
    -- Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model ILIKE %L)', '%' || model_param || '%'));
    END IF;
    
    -- Year filter
    IF year_param IS NOT NULL AND year_param != '' THEN
        BEGIN
            year_int := year_param::INTEGER;
            where_conditions := array_append(where_conditions, 
                format('((ci.year_from IS NULL OR ci.year_from <= %s) AND (ci.year_to IS NULL OR ci.year_to >= %s))', 
                       year_int, year_int));
        EXCEPTION WHEN OTHERS THEN
            -- Skip if not valid integer
        END;
    END IF;
    
    -- Free query (searches in cat_num_desc both normal and reversed)
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || free_query_param || '%',
                   '%' || reverse_hebrew(free_query_param) || '%'));
    END IF;
    
    -- Build and execute query
    final_query := 'SELECT 
        ci.id,
        reverse_hebrew(ci.cat_num_desc) as cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        ci.part_family,
        ci.side_position,
        ci.front_rear,
        ci.year_range,
        ci.availability,
        50 as relevance_score,
        ci.version_date
    FROM catalog_items ci';
    
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    final_query := final_query || ' ORDER BY ci.price DESC NULLS LAST LIMIT ' || limit_results;
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- ================================================
-- TRIGGER: Automatic processing on catalog upload
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'catalog_items' AND column_name = 'part_name') THEN
        ALTER TABLE catalog_items ADD COLUMN part_name TEXT;
    END IF;
END $$;

-- ================================================
-- PROCESS EXISTING DATA
-- ================================================
-- This will trigger the auto_extract function for all existing rows
UPDATE catalog_items 
SET id = id  -- Dummy update to trigger processing
WHERE year_from IS NULL 
   OR side_position IS NULL 
   OR part_family IS NULL
   OR make ILIKE '%יפן%';

-- ================================================
-- VERIFICATION
-- ================================================
SELECT 'DEPLOYMENT COMPLETE' as status;

-- Check functions
SELECT COUNT(*) as function_count, string_agg(proname, ', ') as functions
FROM pg_proc 
WHERE proname IN ('reverse_hebrew', 'normalize_make', 'smart_parts_search', 'auto_extract_catalog_data');

-- Check triggers
SELECT COUNT(*) as trigger_count, string_agg(tgname, ', ') as triggers
FROM pg_trigger 
WHERE tgname LIKE 'auto_process_catalog%';

-- Check data
SELECT 
    COUNT(*) as total_items,
    COUNT(year_from) as with_years,
    COUNT(side_position) as with_side,
    COUNT(part_family) as with_family
FROM catalog_items;

-- Test search
SELECT COUNT(*) as search_test
FROM smart_parts_search(free_query_param := 'דלת', limit_results := 5);

-- ================================================
-- YOU NOW HAVE ONLY 4 FUNCTIONS:
-- 1. reverse_hebrew() - Fixes Hebrew display
-- 2. normalize_make() - Handles make variations
-- 3. auto_extract_catalog_data() - Extracts all data automatically
-- 4. smart_parts_search() - The search function
-- 
-- Plus 2 triggers that run auto_extract on insert/update
-- ================================================