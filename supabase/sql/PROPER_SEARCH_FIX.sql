-- PROPER SEARCH THAT RESPECTS PARAMETERS
-- Fix the logic to actually filter by Toyota when selected

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
    relevance_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price,
        ci.oem,
        ci.make,
        ci.model,
        ci.part_family,
        ci.side_position,
        ci.front_rear,
        ci.year_range,
        ci.availability,
        1 as relevance_score
    FROM catalog_items ci 
    WHERE 
        -- MAKE filter (if provided, must match)
        (make_param IS NULL OR make_param = '' OR ci.make ILIKE '%' || make_param || '%')
        
        -- MODEL filter (if provided, must match)
        AND (model_param IS NULL OR model_param = '' OR ci.model ILIKE '%' || model_param || '%')
        
        -- FREE TEXT search (if provided, search in multiple fields)
        AND (free_query_param IS NULL OR free_query_param = '' OR 
             ci.cat_num_desc ILIKE '%' || free_query_param || '%' OR
             ci.make ILIKE '%' || free_query_param || '%' OR
             ci.model ILIKE '%' || free_query_param || '%' OR
             ci.part_family ILIKE '%' || free_query_param || '%')
        
        -- OEM filter (if provided, must match)
        AND (oem_param IS NULL OR oem_param = '' OR ci.oem ILIKE '%' || oem_param || '%')
        
        -- FAMILY filter (if provided, must match)
        AND (family_param IS NULL OR family_param = '' OR ci.part_family ILIKE '%' || family_param || '%')
        
        -- PART filter (if provided, must match)
        AND (part_param IS NULL OR part_param = '' OR ci.cat_num_desc ILIKE '%' || part_param || '%')
    
    ORDER BY 
        -- Prioritize exact matches
        CASE WHEN ci.make ILIKE make_param THEN 10 ELSE 0 END +
        CASE WHEN ci.model ILIKE model_param THEN 5 ELSE 0 END DESC,
        ci.id ASC
        
    LIMIT limit_results;
END;
$$;

-- TEST TOYOTA SPECIFICALLY
SELECT 'Testing proper Toyota search...' as status;

-- Test: Hebrew Toyota should return only Toyota parts
SELECT COUNT(*) as hebrew_toyota_count, 
       ARRAY_AGG(DISTINCT make) as makes_found 
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 10);

-- Test: English Toyota should return only Toyota parts  
SELECT COUNT(*) as english_toyota_count,
       ARRAY_AGG(DISTINCT make) as makes_found
FROM smart_parts_search(make_param := 'Toyota', limit_results := 10);

-- Test: Show actual Toyota results
SELECT make, model, cat_num_desc 
FROM smart_parts_search(make_param := 'Toyota', limit_results := 5);

SELECT 'Toyota search test complete!' as status;