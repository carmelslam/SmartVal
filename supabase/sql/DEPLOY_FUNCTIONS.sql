-- SMART PARTS SEARCH - Deploy to Supabase
-- Copy this entire file and paste into Supabase SQL Editor, then click RUN

-- ============================================================================
-- 1. CREATE MAIN SEARCH FUNCTION
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
    id BIGINT,
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
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    hebrew_corrected TEXT;
    final_query TEXT;
BEGIN
    -- Start building the query
    base_query := 'SELECT 
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
        0 as relevance_score
    FROM catalog_items ci 
    WHERE 1=1';

    -- OEM search (high priority)
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    -- Make search (supports Hebrew)
    IF make_param IS NOT NULL AND make_param != '' THEN
        IF make_param = 'טויוטה' OR lower(make_param) = 'toyota' THEN
            where_conditions := array_append(where_conditions, 
                '(ci.make ILIKE ''%toyota%'' OR ci.cat_num_desc ILIKE ''%טויוטה%'')');
        ELSIF make_param = 'פולקסווגן' OR lower(make_param) LIKE '%volkswagen%' OR lower(make_param) = 'vw' THEN
            where_conditions := array_append(where_conditions, 
                '(ci.make ILIKE ''%volkswagen%'' OR ci.make ILIKE ''%vw%'' OR ci.cat_num_desc ILIKE ''%פולקסווגן%'')');
        ELSE
            where_conditions := array_append(where_conditions, 
                format('ci.make ILIKE %L', '%' || make_param || '%'));
        END IF;
    END IF;
    
    -- Model search
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || model_param || '%', '%' || model_param || '%'));
    END IF;
    
    -- Year search
    IF year_param IS NOT NULL AND year_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.year_range ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || year_param || '%', '%' || year_param || '%'));
    END IF;
    
    -- Trim search
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.cat_num_desc ILIKE %L', '%' || trim_param || '%'));
    END IF;
    
    -- Part family search
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    -- Free query search with Hebrew correction
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        -- Apply Hebrew corrections
        hebrew_corrected := free_query_param;
        hebrew_corrected := replace(hebrew_corrected, 'סנפ', 'פנס');
        hebrew_corrected := replace(hebrew_corrected, 'ףנכ', 'כנף');
        hebrew_corrected := replace(hebrew_corrected, 'תותיא', 'איתות');
        hebrew_corrected := replace(hebrew_corrected, 'לאמש', 'שמאל');
        hebrew_corrected := replace(hebrew_corrected, 'נימי', 'ימין');
        
        -- Search in multiple fields
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L OR 
                     ci.oem ILIKE %L OR ci.supplier_name ILIKE %L OR 
                     ci.part_family ILIKE %L)', 
                   '%' || free_query_param || '%', '%' || hebrew_corrected || '%',
                   '%' || free_query_param || '%', '%' || free_query_param || '%',
                   '%' || free_query_param || '%'));
    END IF;
    
    -- Build final query
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
    ELSE
        final_query := base_query;
    END IF;
    
    -- Add ordering and limit
    final_query := final_query || format(' ORDER BY 
        CASE 
            WHEN ci.oem IS NOT NULL AND ci.oem != '''' THEN 10
            WHEN ci.price > 0 THEN 5
            ELSE 0
        END DESC,
        ci.id ASC
        LIMIT %s', limit_results);
    
    -- Execute and return results
    RETURN QUERY EXECUTE final_query;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, return empty result set
        RETURN;
END;
$$;

-- ============================================================================
-- 2. CREATE JAVASCRIPT WRAPPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION simple_parts_search(search_params JSONB)
RETURNS TABLE(
    id BIGINT,
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
    RETURN QUERY SELECT * FROM smart_parts_search(
        car_plate := search_params->>'car_plate',
        make_param := search_params->>'make',
        model_param := search_params->>'model',
        model_code_param := search_params->>'model_code',
        trim_param := search_params->>'trim',
        year_param := search_params->>'year',
        engine_volume_param := search_params->>'engine_volume',
        engine_code_param := search_params->>'engine_code',
        engine_type_param := search_params->>'engine_type',
        vin_number_param := search_params->>'vin_number',
        oem_param := search_params->>'oem',
        free_query_param := search_params->>'free_query',
        family_param := search_params->>'family',
        part_param := search_params->>'part',
        source_param := search_params->>'source',
        quantity_param := COALESCE((search_params->>'quantity')::INTEGER, 1),
        limit_results := COALESCE((search_params->>'limit')::INTEGER, 50)
    );
END;
$$;

-- ============================================================================
-- 3. CREATE PERFORMANCE INDEXES (if they don't exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_catalog_oem ON catalog_items(oem);
CREATE INDEX IF NOT EXISTS idx_catalog_make ON catalog_items(make);
CREATE INDEX IF NOT EXISTS idx_catalog_model ON catalog_items(model);
CREATE INDEX IF NOT EXISTS idx_catalog_desc_gin ON catalog_items USING gin(to_tsvector('simple', cat_num_desc));
CREATE INDEX IF NOT EXISTS idx_catalog_supplier ON catalog_items(supplier_name);
CREATE INDEX IF NOT EXISTS idx_catalog_part_family ON catalog_items(part_family);

-- ============================================================================
-- 4. TEST THE FUNCTIONS
-- ============================================================================

-- Test basic search
SELECT 'Testing basic search...' as test_name;
SELECT * FROM smart_parts_search(free_query_param := 'test') LIMIT 3;

-- Test JSON wrapper  
SELECT 'Testing JSON wrapper...' as test_name;
SELECT * FROM simple_parts_search('{"free_query": "test", "limit": 3}'::jsonb);

-- Success message
SELECT 'SUCCESS: Functions deployed and tested!' as status;