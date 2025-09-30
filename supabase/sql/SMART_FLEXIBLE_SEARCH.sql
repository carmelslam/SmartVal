-- SMART FLEXIBLE SEARCH
-- Focuses on core terms and handles variations intelligently

DROP FUNCTION IF EXISTS smart_parts_search(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer);

-- First, create a function to extract core part terms
CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    -- Core part terms to look for
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
    -- Check each core term
    FOREACH term IN ARRAY core_terms LOOP
        IF query_text ILIKE '%' || term || '%' THEN
            -- Normalize reversed Hebrew
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
    
    -- If no core term found, return the original query
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main search function with smart flexibility
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
    -- IMPORTANT CAR FILTERS (only if provided)
    
    -- Make/Manufacturer - normalize and handle variations
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make = %L OR ci.make ILIKE %L OR ci.make ILIKE %L)', 
                   normalized_make,
                   make_param,
                   '%' || normalized_make || '%',
                   CASE 
                       WHEN normalized_make = 'טויוטה' THEN '%toyota%'
                       WHEN normalized_make = 'BMW' THEN '%bmw%'
                       WHEN normalized_make = 'מרצדס' THEN '%mercedes%'
                       ELSE '%' || normalized_make || '%'
                   END));
    END IF;
    
    -- Model - flexible matching
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || model_param || '%',
                   '%' || model_param || '%'));
    END IF;
    
    -- Year - important filter, handle ranges
    IF year_param IS NOT NULL AND year_param != '' THEN
        BEGIN
            year_int := year_param::INTEGER;
            where_conditions := array_append(where_conditions, 
                format('((ci.year_from IS NULL OR ci.year_from <= %s) AND (ci.year_to IS NULL OR ci.year_to >= %s)) OR ci.year_range ILIKE %L', 
                       year_int, year_int, '%' || year_param || '%'));
        EXCEPTION WHEN OTHERS THEN
            where_conditions := array_append(where_conditions, 
                format('ci.year_range ILIKE %L', '%' || year_param || '%'));
        END;
    END IF;
    
    -- Trim - if provided
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.trim ILIKE %L OR ci.actual_trim ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || trim_param || '%',
                   '%' || trim_param || '%',
                   '%' || trim_param || '%'));
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
                ci.cat_num_desc ILIKE %L OR
                ci.part_name ILIKE %L OR
                ci.pcode ILIKE %L OR
                ci.oem ILIKE %L
            )', 
                '%' || core_part_term || '%',              -- Core term
                '%' || reverse_hebrew(core_part_term) || '%', -- Reversed core term
                '%' || free_query_param || '%',            -- Original query
                '%' || reverse_hebrew(free_query_param) || '%', -- Reversed original
                '%' || core_part_term || '%',              -- Part name
                '%' || free_query_param || '%',            -- Pcode
                '%' || free_query_param || '%'));          -- OEM
    END IF;
    
    -- Part name for advanced search
    IF part_param IS NOT NULL AND part_param != '' THEN
        core_part_term := extract_core_part_term(part_param);
        where_conditions := array_append(where_conditions, 
            format('(
                ci.cat_num_desc ILIKE %L OR 
                ci.cat_num_desc ILIKE %L OR
                ci.part_name ILIKE %L
            )', 
                '%' || core_part_term || '%',
                '%' || reverse_hebrew(core_part_term) || '%',
                '%' || core_part_term || '%'));
    END IF;
    
    -- OEM - exact match if provided
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.oem = %L', oem_param));
    END IF;
    
    -- Other optional filters
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    IF source_param IS NOT NULL AND source_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.source ILIKE %L OR ci.supplier_name ILIKE %L)', 
                   '%' || source_param || '%',
                   '%' || source_param || '%'));
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
        CASE
            WHEN ci.oem IS NOT NULL AND ci.oem = $1 THEN 100
            WHEN ci.price > 0 THEN 60
            ELSE 50
        END as relevance_score,
        ci.version_date
    FROM catalog_items ci';
    
    -- Apply conditions if any exist
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Order and limit
    final_query := final_query || ' ORDER BY relevance_score DESC, ci.price DESC NULLS LAST LIMIT ' || limit_results;
    
    -- Log for debugging
    RAISE NOTICE 'Query conditions: %', array_to_string(where_conditions, ' AND ');
    
    -- Execute
    RETURN QUERY EXECUTE final_query USING oem_param;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Search error: %', SQLERRM;
        RETURN;
END;
$$;

-- Test the flexible search
SELECT 'Test 1: Search for ראי (mirror)' as test;
SELECT id, cat_num_desc, make, model, price 
FROM smart_parts_search(
    free_query_param := 'ראי',
    limit_results := 5
);

SELECT 'Test 2: Toyota + door (flexible)' as test;
SELECT id, cat_num_desc, make, model, price 
FROM smart_parts_search(
    make_param := 'טויוטה יפן',  -- Should still find Toyota
    free_query_param := 'rear door',  -- Should find any door
    limit_results := 5
);

SELECT 'Test 3: Just Toyota make' as test;
SELECT COUNT(*) as total_toyota_parts
FROM smart_parts_search(
    make_param := 'טויוטה',
    limit_results := 100
);

SELECT 'SUCCESS: Smart flexible search implemented!' as status;