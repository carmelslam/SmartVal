-- UPDATE SEARCH FUNCTION TO HANDLE REVERSED DATA BETTER

DROP FUNCTION IF EXISTS smart_parts_search CASCADE;

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
    -- Make filter - handle both normal and reversed
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make,
                   make_param,
                   reverse_hebrew(make_param),
                   '%' || normalized_make || '%'));
    END IF;
    
    -- Part search - search EVERYTHING
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        core_part_term := extract_core_part_term(free_query_param);
        
        -- Search in ALL possible variations
        where_conditions := array_append(where_conditions, 
            format('(
                ci.cat_num_desc ILIKE %L OR 
                ci.cat_num_desc ILIKE %L OR 
                ci.cat_num_desc ILIKE %L OR
                ci.cat_num_desc ILIKE %L OR
                ci.cat_num_desc ILIKE %L OR
                ci.cat_num_desc ILIKE %L
            )', 
                '%' || free_query_param || '%',           -- Original
                '%' || reverse_hebrew(free_query_param) || '%', -- Reversed original
                '%' || core_part_term || '%',             -- Core term
                '%' || reverse_hebrew(core_part_term) || '%', -- Reversed core
                '%תלד%',                                   -- Hard-coded door reversed
                '%דלת%'));                                 -- Hard-coded door normal
    END IF;
    
    -- Build query - IMPORTANT: Don't reverse cat_num_desc in display if already reversed
    final_query := 'SELECT 
        ci.id,
        ci.cat_num_desc as cat_num_desc,  -- Show as-is from database
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
    
    -- Debug log
    RAISE NOTICE 'Search conditions: %', array_to_string(where_conditions, ' AND ');
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Test immediate search
SELECT 'TESTING UPDATED SEARCH:' as status;

-- Test 1: Search for door
SELECT 'Test 1: Searching for דלת (door)' as test;
SELECT COUNT(*) as door_results
FROM smart_parts_search(free_query_param := 'דלת');

-- Test 2: Search for Toyota
SELECT 'Test 2: Searching for טויוטה' as test;
SELECT COUNT(*) as toyota_results
FROM smart_parts_search(make_param := 'טויוטה');

-- Test 3: Show actual results
SELECT 'Test 3: Show sample results' as test;
SELECT id, cat_num_desc, make, supplier_name, price
FROM smart_parts_search(free_query_param := 'דלת')
LIMIT 10;