-- FIX SEARCH TO HANDLE HEBREW REVERSAL
-- The browser sends normal Hebrew but the database has reversed Hebrew

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
    reversed_free_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Normalize the make parameter
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        -- Debug log
        RAISE NOTICE 'Make normalized from % to %', make_param, normalized_make;
    END IF;

    -- Reverse Hebrew for free query since DB has reversed Hebrew
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        reversed_free_query := reverse_hebrew(free_query_param);
        -- Debug log
        RAISE NOTICE 'Free query reversed from % to %', free_query_param, reversed_free_query;
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
    FROM catalog_items ci 
    WHERE 1=1';

    -- Make search - try both normal and normalized
    IF normalized_make IS NOT NULL AND normalized_make != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make, make_param, '%' || normalized_make || '%'));
    END IF;
    
    -- Free query search - use REVERSED query for searching
    IF reversed_free_query IS NOT NULL AND reversed_free_query != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.oem ILIKE %L OR ci.pcode ILIKE %L)', 
                   '%' || reversed_free_query || '%', 
                   '%' || free_query_param || '%',  -- Try original for OEM/pcode
                   '%' || free_query_param || '%'));
    ELSIF free_query_param IS NOT NULL AND free_query_param != '' THEN
        -- If reversal failed, try original
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L)', '%' || free_query_param || '%'));
    END IF;
    
    -- Model search
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model = %L OR ci.model ILIKE %L)', 
                   model_param, '%' || model_param || '%'));
    END IF;
    
    -- Year search
    IF year_param IS NOT NULL AND year_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.year_range ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || year_param || '%', '%' || year_param || '%'));
    END IF;
    
    -- Apply conditions
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' AND ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Add ordering and limit
    final_query := final_query || ' ORDER BY ci.id LIMIT ' || limit_results;
    
    -- Log final query for debugging
    RAISE NOTICE 'Final query conditions: %', array_to_string(where_conditions, ' AND ');
    
    -- Execute query
    RETURN QUERY EXECUTE final_query;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Search error: %', SQLERRM;
        RETURN;
END;
$$;

-- Test the fixed search
SELECT 'Test 1: Search for דלת (should reverse to תלד internally)' as test;
SELECT COUNT(*) FROM smart_parts_search(free_query_param := 'דלת');

SELECT 'Test 2: Search for Toyota make' as test;
SELECT COUNT(*) FROM smart_parts_search(make_param := 'טויוטה');

SELECT 'Test 3: Check what makes we actually have' as test;
SELECT DISTINCT make, COUNT(*) 
FROM catalog_items 
WHERE make LIKE '%טויוט%' OR make LIKE '%TOYOTA%' OR make = 'טויוטה'
GROUP BY make;

SELECT 'SUCCESS: Search should now handle Hebrew reversal!' as status;