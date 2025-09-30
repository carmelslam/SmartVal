-- DEPLOY MISSING FUNCTIONS - IMMEDIATE FIX

-- 1. Create extract_core_part_term function
CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF query_text IS NULL THEN RETURN query_text; END IF;
    
    -- Check for door (both normal and reversed)
    IF query_text ILIKE '%דלת%' OR query_text ILIKE '%תלד%' THEN
        RETURN 'דלת';
    END IF;
    
    -- Check for fender
    IF query_text ILIKE '%כנף%' OR query_text ILIKE '%ףנכ%' THEN
        RETURN 'כנף';
    END IF;
    
    -- Check for bumper
    IF query_text ILIKE '%מגן%' OR query_text ILIKE '%ןגמ%' THEN
        RETURN 'מגן';
    END IF;
    
    -- Check for light
    IF query_text ILIKE '%פנס%' OR query_text ILIKE '%סנפ%' THEN
        RETURN 'פנס';
    END IF;
    
    -- Check for mirror
    IF query_text ILIKE '%מראה%' OR query_text ILIKE '%הארמ%' OR 
       query_text ILIKE '%ראי%' OR query_text ILIKE '%יאר%' THEN
        RETURN 'מראה';
    END IF;
    
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create a SIMPLE search function that works
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
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Make filter
    IF make_param IS NOT NULL AND make_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.make ILIKE %L', '%' || make_param || '%'));
    END IF;
    
    -- Free query - search EVERYWHERE for the term
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || free_query_param || '%',
                   '%' || reverse_hebrew(free_query_param) || '%'));
    END IF;
    
    -- Build query
    final_query := 'SELECT 
        ci.id,
        ci.cat_num_desc,
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

-- 3. Test immediately
SELECT 'TESTING FUNCTIONS:' as status;

-- Test extract function
SELECT extract_core_part_term('דלת ימין') as door_test;

-- Test search function
SELECT COUNT(*) as door_search_results
FROM smart_parts_search(free_query_param := 'דלת');

-- Test direct door search
SELECT COUNT(*) as doors_in_data
FROM catalog_items 
WHERE cat_num_desc ILIKE '%דלת%' OR cat_num_desc ILIKE '%תלד%';

-- Show sample results if any
SELECT 'SAMPLE RESULTS:' as status;
SELECT id, cat_num_desc, make, price
FROM smart_parts_search(free_query_param := 'דלת')
LIMIT 5;