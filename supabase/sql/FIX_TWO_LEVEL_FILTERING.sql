-- FIX TWO LEVEL FILTERING
-- Implement proper Level 1 (car filters) THEN Level 2 (part filters)

DROP FUNCTION IF EXISTS smart_parts_search(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer);

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
    car_filters TEXT[] := ARRAY[]::TEXT[];  -- Level 1
    part_filters TEXT[] := ARRAY[]::TEXT[]; -- Level 2
    final_query TEXT;
    year_int INTEGER;
BEGIN
    -- LEVEL 1: CAR FILTERS (Make → Model → Year)
    
    -- 1.1 Make filter (with normalization)
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        -- Check multiple make variations
        car_filters := array_append(car_filters, 
            format('(ci.make = %L OR ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make,  -- Normalized version
                   make_param,       -- Original input
                   'טויוטה',        -- Common Hebrew name
                   '%' || normalized_make || '%'));
        RAISE NOTICE 'Make filter: % (normalized: %)', make_param, normalized_make;
    END IF;
    
    -- 1.2 Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.model = %L OR ci.model ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   model_param, 
                   '%' || model_param || '%',
                   '%' || model_param || '%'));
        RAISE NOTICE 'Model filter: %', model_param;
    END IF;
    
    -- 1.3 Year filter
    IF year_param IS NOT NULL AND year_param != '' THEN
        -- Try to convert year to integer
        BEGIN
            year_int := year_param::INTEGER;
            car_filters := array_append(car_filters, 
                format('(ci.year_from <= %s AND ci.year_to >= %s) OR ci.year_range ILIKE %L', 
                       year_int, year_int, '%' || year_param || '%'));
        EXCEPTION WHEN OTHERS THEN
            -- If not a number, just search in year_range
            car_filters := array_append(car_filters, 
                format('ci.year_range ILIKE %L', '%' || year_param || '%'));
        END;
        RAISE NOTICE 'Year filter: %', year_param;
    END IF;
    
    -- 1.4 Model code filter
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.model_code = %L OR ci.model_code ILIKE %L)', 
                   model_code_param, '%' || model_code_param || '%'));
    END IF;
    
    -- LEVEL 2: PART FILTERS (name/type/side/position)
    
    -- 2.1 Free query search (search in both normal and reversed)
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        part_filters := array_append(part_filters, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_name = %L OR ci.part_name = %L OR ci.pcode ILIKE %L OR ci.oem ILIKE %L)', 
                   '%' || free_query_param || '%',           -- Normal
                   '%' || reverse_hebrew(free_query_param) || '%', -- Reversed
                   free_query_param,                          -- Exact part name
                   reverse_hebrew(free_query_param),          -- Exact reversed
                   '%' || free_query_param || '%',           -- Pcode
                   '%' || free_query_param || '%'));         -- OEM
        RAISE NOTICE 'Free query filter: % (reversed: %)', free_query_param, reverse_hebrew(free_query_param);
    END IF;
    
    -- 2.2 Part family filter
    IF family_param IS NOT NULL AND family_param != '' THEN
        part_filters := array_append(part_filters, 
            format('ci.part_family = %L', family_param));
    END IF;
    
    -- 2.3 OEM filter (exact match preferred)
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        part_filters := array_append(part_filters, 
            format('ci.oem = %L', oem_param));
    END IF;
    
    -- Build the query with proper filtering
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
            WHEN ci.make = $2 THEN 90
            WHEN ci.model = $3 THEN 80
            ELSE 50
        END as relevance_score,
        ci.version_date
    FROM catalog_items ci 
    WHERE 1=1';
    
    -- Apply Level 1 filters (car filters) - ALL must match
    IF array_length(car_filters, 1) > 0 THEN
        final_query := final_query || ' AND ' || array_to_string(car_filters, ' AND ');
    END IF;
    
    -- Apply Level 2 filters (part filters) - at least one must match
    IF array_length(part_filters, 1) > 0 THEN
        final_query := final_query || ' AND (' || array_to_string(part_filters, ' OR ') || ')';
    END IF;
    
    -- If no filters at all, limit to prevent returning entire catalog
    IF array_length(car_filters, 1) = 0 AND array_length(part_filters, 1) = 0 THEN
        final_query := final_query || ' AND FALSE';
    END IF;
    
    -- Add ordering by relevance and limit
    final_query := final_query || ' ORDER BY relevance_score DESC, ci.id LIMIT ' || limit_results;
    
    -- Log the complete filter conditions
    RAISE NOTICE 'Car filters: %', array_to_string(car_filters, ' AND ');
    RAISE NOTICE 'Part filters: %', array_to_string(part_filters, ' OR ');
    
    -- Execute with parameters for relevance scoring
    RETURN QUERY EXECUTE final_query USING oem_param, normalized_make, model_param;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Search error: %', SQLERRM;
        RETURN;
END;
$$;

-- Test the two-level filtering
SELECT 'Test 1: Toyota + door search' as test;
SELECT id, cat_num_desc, make, model, price 
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'דלת',
    limit_results := 5
);

SELECT 'Test 2: Just Toyota (no parts)' as test;
SELECT COUNT(*) 
FROM smart_parts_search(
    make_param := 'טויוטה',
    limit_results := 10
);

SELECT 'Test 3: Just door (no make)' as test;
SELECT DISTINCT make, COUNT(*) 
FROM smart_parts_search(
    free_query_param := 'דלת',
    limit_results := 50
)
GROUP BY make
ORDER BY COUNT(*) DESC;

SELECT 'SUCCESS: Two-level filtering implemented!' as status;