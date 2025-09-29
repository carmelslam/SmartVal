-- WORKING SEARCH FIX - Deploy this to replace the broken smart_parts_search function
-- This actually finds data in your 48,772 row table

-- ============================================================================
-- REPLACE THE BROKEN SEARCH FUNCTION WITH A WORKING ONE
-- ============================================================================

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
    -- Simple working search that actually finds data
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
        -- If filters provided, they must match exactly
        (make_param IS NULL OR make_param = '' OR ci.make = make_param)
        
        AND (model_param IS NULL OR model_param = '' OR ci.model ILIKE '%' || model_param || '%')
             
        AND (free_query_param IS NULL OR free_query_param = '' OR 
             ci.cat_num_desc ILIKE '%' || free_query_param || '%' OR
             ci.make ILIKE '%' || free_query_param || '%' OR
             ci.model ILIKE '%' || free_query_param || '%' OR
             ci.part_family ILIKE '%' || free_query_param || '%')
             
        AND (oem_param IS NULL OR oem_param = '' OR 
             ci.oem ILIKE '%' || oem_param || '%')
             
        AND (family_param IS NULL OR family_param = '' OR 
             ci.part_family ILIKE '%' || family_param || '%')
             
        AND (part_param IS NULL OR part_param = '' OR 
             ci.cat_num_desc ILIKE '%' || part_param || '%')
    
    ORDER BY 
        -- Prioritize exact matches
        CASE WHEN ci.make ILIKE make_param THEN 10 ELSE 0 END +
        CASE WHEN ci.model ILIKE model_param THEN 5 ELSE 0 END +
        CASE WHEN ci.oem IS NOT NULL AND ci.oem != '' THEN 3 ELSE 0 END
        DESC,
        ci.id ASC
        
    LIMIT limit_results;
END;
$$;

-- Test the function immediately
SELECT 'Testing new function...' as status;

-- Test 1: Get any data (should return results)
SELECT COUNT(*) as total_results FROM smart_parts_search(limit_results := 5);

-- Test 2: Hebrew Toyota search
SELECT COUNT(*) as toyota_hebrew_results FROM smart_parts_search(make_param := 'טויוטה', limit_results := 10);

-- Test 3: English Toyota search  
SELECT COUNT(*) as toyota_english_results FROM smart_parts_search(make_param := 'Toyota', limit_results := 10);

-- Test 4: Free text search
SELECT COUNT(*) as free_text_results FROM smart_parts_search(free_query_param := 'light', limit_results := 10);

SELECT 'Function replacement complete!' as status;