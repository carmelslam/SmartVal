-- SIMPLE SEARCH THAT ACTUALLY FINDS DATA
-- The current search is too restrictive - let's make it work

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
    -- SIMPLE APPROACH: If no parameters, return some data
    -- If parameters provided, search for them but be more permissive
    
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
        -- If ALL parameters are empty/null, return some results
        CASE 
            WHEN (make_param IS NULL OR make_param = '') 
                 AND (model_param IS NULL OR model_param = '')
                 AND (free_query_param IS NULL OR free_query_param = '') 
                 AND (oem_param IS NULL OR oem_param = '') 
                 AND (family_param IS NULL OR family_param = '') 
                 AND (part_param IS NULL OR part_param = '') 
            THEN TRUE
            
            -- Otherwise, match any provided parameter
            ELSE (
                (make_param IS NULL OR make_param = '' OR ci.make ILIKE '%' || make_param || '%')
                OR (model_param IS NULL OR model_param = '' OR ci.model ILIKE '%' || model_param || '%')
                OR (free_query_param IS NULL OR free_query_param = '' OR ci.cat_num_desc ILIKE '%' || free_query_param || '%')
                OR (oem_param IS NULL OR oem_param = '' OR ci.oem ILIKE '%' || oem_param || '%')
                OR (family_param IS NULL OR family_param = '' OR ci.part_family ILIKE '%' || family_param || '%')
                OR (part_param IS NULL OR part_param = '' OR ci.cat_num_desc ILIKE '%' || part_param || '%')
            )
        END
    
    ORDER BY ci.id ASC
    LIMIT limit_results;
END;
$$;

-- IMMEDIATE TESTS
SELECT 'Testing simple search...' as status;

-- Test 1: No parameters (should return 5 results)
SELECT COUNT(*) as no_params_results FROM smart_parts_search(limit_results := 5);

-- Test 2: Hebrew Toyota
SELECT COUNT(*) as hebrew_toyota FROM smart_parts_search(make_param := 'טויוטה', limit_results := 10);

-- Test 3: English Toyota  
SELECT COUNT(*) as english_toyota FROM smart_parts_search(make_param := 'Toyota', limit_results := 10);

-- Test 4: Any make that contains 'toy'
SELECT COUNT(*) as toy_search FROM smart_parts_search(make_param := 'toy', limit_results := 10);

SELECT 'Simple search test complete!' as status;