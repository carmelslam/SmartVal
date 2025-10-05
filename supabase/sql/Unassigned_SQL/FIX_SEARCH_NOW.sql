-- FIX THE SEARCH FUNCTION - DEPLOY THE CORRECT VERSION

-- 1. Drop the old version
DROP FUNCTION IF EXISTS smart_parts_search CASCADE;

-- 2. Make sure extract_core_part_term exists
CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    core_terms TEXT[] := ARRAY[
        'דלת', 'תלד',           -- door
        'כנף', 'ףנכ',           -- fender
        'מגן', 'ןגמ',           -- bumper
        'פנס', 'סנפ',           -- light
        'ראי', 'יאר', 'מראה', 'הארמ',  -- mirror
        'גלגל', 'לגלג',         -- wheel
        'מנוע', 'עונמ',         -- engine
        'שמשה', 'השמש',         -- windshield
        'חלון', 'ןולח',         -- window
        'קישוט', 'טושיק',       -- trim
        'בולם', 'םלוב',         -- shock
        'כיסוי', 'יוסיכ',       -- cover
        'פח', 'חפ',             -- panel
        'זרוע', 'עורז',         -- arm
        'תושבת', 'תבשות',       -- bracket
        'איתות', 'תותיא',       -- signal
        'ערפל', 'לפרע'          -- fog
    ];
    term TEXT;
    normalized_term TEXT;
BEGIN
    IF query_text IS NULL THEN RETURN query_text; END IF;
    
    FOREACH term IN ARRAY core_terms LOOP
        IF query_text ILIKE '%' || term || '%' THEN
            CASE term
                WHEN 'תלד' THEN normalized_term := 'דלת';
                WHEN 'ףנכ' THEN normalized_term := 'כנף';
                WHEN 'ןגמ' THEN normalized_term := 'מגן';
                WHEN 'סנפ' THEN normalized_term := 'פנס';
                WHEN 'יאר' THEN normalized_term := 'ראי';
                WHEN 'הארמ' THEN normalized_term := 'מראה';
                WHEN 'לגלג' THEN normalized_term := 'גלגל';
                WHEN 'עונמ' THEN normalized_term := 'מנוע';
                WHEN 'השמש' THEN normalized_term := 'שמשה';
                WHEN 'ןולח' THEN normalized_term := 'חלון';
                WHEN 'טושיק' THEN normalized_term := 'קישוט';
                WHEN 'םלוב' THEN normalized_term := 'בולם';
                WHEN 'יוסיכ' THEN normalized_term := 'כיסוי';
                WHEN 'חפ' THEN normalized_term := 'פח';
                WHEN 'עורז' THEN normalized_term := 'זרוע';
                WHEN 'תבשות' THEN normalized_term := 'תושבת';
                WHEN 'תותיא' THEN normalized_term := 'איתות';
                WHEN 'לפרע' THEN normalized_term := 'ערפל';
                ELSE normalized_term := term;
            END CASE;
            RETURN normalized_term;
        END IF;
    END LOOP;
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create the CORRECT search function with flexible search
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
    core_part_term TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
    year_int INTEGER;
BEGIN
    -- Make/Manufacturer - normalize and handle variations
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make,
                   make_param,
                   '%' || normalized_make || '%'));
    END IF;
    
    -- PART SEARCH - Extract core term and search flexibly
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        -- Extract the core part term (door, mirror, etc.)
        core_part_term := extract_core_part_term(free_query_param);
        
        -- Search for the core term in both normal and reversed forms
        where_conditions := array_append(where_conditions, 
            format('(
                ci.cat_num_desc ILIKE %L OR 
                ci.cat_num_desc ILIKE %L OR 
                ci.cat_num_desc ILIKE %L OR
                ci.cat_num_desc ILIKE %L
            )', 
                '%' || core_part_term || '%',              -- Core term
                '%' || reverse_hebrew(core_part_term) || '%', -- Reversed core term
                '%' || free_query_param || '%',            -- Original query
                '%' || reverse_hebrew(free_query_param) || '%')); -- Reversed original
    END IF;
    
    -- Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || model_param || '%',
                   '%' || model_param || '%'));
    END IF;
    
    -- Year filter
    IF year_param IS NOT NULL AND year_param != '' THEN
        BEGIN
            year_int := year_param::INTEGER;
            where_conditions := array_append(where_conditions, 
                format('((ci.year_from IS NULL OR ci.year_from <= %s) AND (ci.year_to IS NULL OR ci.year_to >= %s))', 
                       year_int, year_int));
        EXCEPTION WHEN OTHERS THEN
            -- Skip year filter if not valid
        END;
    END IF;
    
    -- Build query
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

-- 4. TEST IT NOW
SELECT 'TEST 1: Search for דלת (should find תלד in database)' as test;
SELECT COUNT(*) as results FROM smart_parts_search(free_query_param := 'דלת');

SELECT 'TEST 2: Show actual results' as test;
SELECT id, cat_num_desc, make, price 
FROM smart_parts_search(free_query_param := 'דלת')
LIMIT 5;

SELECT '✅ SEARCH FIXED - Should now return results!' as status;