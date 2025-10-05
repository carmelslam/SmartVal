-- FIX SEARCH WITH ACTUAL HEBREW PATTERNS FROM USER DATA
-- Based on user sample: "09-12 4-באר ןימי 'חא סנפ" which shows reversed Hebrew

-- 1. Deploy missing extract_core_part_term function with ACTUAL patterns
DROP FUNCTION IF EXISTS extract_core_part_term CASCADE;

CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF query_text IS NULL THEN RETURN query_text; END IF;
    
    -- Check for light (actual pattern from user data: סנפ)
    IF query_text ILIKE '%סנפ%' OR query_text ILIKE '%פנס%' THEN
        RETURN 'סנפ';
    END IF;
    
    -- Check for door (reversed patterns)
    IF query_text ILIKE '%תלד%' OR query_text ILIKE '%דלת%' THEN
        RETURN 'תלד';
    END IF;
    
    -- Check for fender/wing
    IF query_text ILIKE '%ףנכ%' OR query_text ILIKE '%כנף%' THEN
        RETURN 'ףנכ';
    END IF;
    
    -- Check for bumper
    IF query_text ILIKE '%ןגמ%' OR query_text ILIKE '%מגן%' THEN
        RETURN 'ןגמ';
    END IF;
    
    -- Check for mirror
    IF query_text ILIKE '%הארמ%' OR query_text ILIKE '%מראה%' OR 
       query_text ILIKE '%יאר%' OR query_text ILIKE '%ראי%' THEN
        RETURN 'הארמ';
    END IF;
    
    -- Check for grille (from user data patterns)
    IF query_text ILIKE '%לירג%' OR query_text ILIKE '%גריל%' THEN
        RETURN 'לירג';
    END IF;
    
    -- Check for cover (from user data patterns)
    IF query_text ILIKE '%הסכמ%' OR query_text ILIKE '%מכסה%' THEN
        RETURN 'הסכמ';
    END IF;
    
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create reverse_hebrew function
DROP FUNCTION IF EXISTS reverse_hebrew CASCADE;

CREATE OR REPLACE FUNCTION reverse_hebrew(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN RETURN input_text; END IF;
    RETURN reverse(input_text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Fix smart_parts_search function to work with actual patterns
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
    search_term TEXT;
    reversed_term TEXT;
BEGIN
    -- Make filter (normalize common make variations)
    IF make_param IS NOT NULL AND make_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.make ILIKE %L', '%' || make_param || '%'));
    END IF;
    
    -- Free query - search with BOTH normal and reversed Hebrew
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        search_term := free_query_param;
        reversed_term := reverse_hebrew(search_term);
        
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || search_term || '%',
                   '%' || reversed_term || '%',
                   '%' || extract_core_part_term(search_term) || '%'));
    END IF;
    
    -- Part family filter
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    -- Part name filter  
    IF part_param IS NOT NULL AND part_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.part_name ILIKE %L', '%' || part_param || '%'));
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

-- 4. Test with actual patterns from user data
SELECT 'TESTING WITH ACTUAL PATTERNS:' as status;

-- Test light search (from user data sample: סנפ)
SELECT COUNT(*) as light_search_results
FROM smart_parts_search(free_query_param := 'פנס');

-- Test with Hebrew that should match user data patterns
SELECT COUNT(*) as door_search_results
FROM smart_parts_search(free_query_param := 'דלת');

-- Test direct pattern matching
SELECT COUNT(*) as lights_in_data
FROM catalog_items 
WHERE cat_num_desc ILIKE '%סנפ%';

-- Show sample results with the patterns we found
SELECT 'SAMPLE RESULTS WITH ACTUAL PATTERNS:' as status;
SELECT id, cat_num_desc, make, price
FROM catalog_items
WHERE cat_num_desc ILIKE '%סנפ%' OR cat_num_desc ILIKE '%לירג%' OR cat_num_desc ILIKE '%הסכמ%'
LIMIT 10;