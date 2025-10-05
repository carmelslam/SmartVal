-- CASCADING PARTS SEARCH WITH HEBREW FALLBACK MESSAGES
-- Implements 6-level fallback with Hebrew user messages
-- 
-- Cascade Levels:
-- 1. make + model + year + part → "לא נמצאו תוצאות עבור [make] [model] [year] [part]"
-- 2. make + model + year → "מרחיב חיפוש ל-[make] [model] [year]"
-- 3. make + model → "מרחיב חיפוש ל-[make] [model]"
-- 4. make + part → "מרחיב חיפוש ל-[make] [part]"
-- 5. make only → "מרחיב חיפוש ל-[make] בלבד"
-- 6. part only → "מרחיב חיפוש ל-[part] בלבד"

CREATE OR REPLACE FUNCTION smart_parts_search_cascading(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    limit_results INT DEFAULT 50
)
RETURNS TABLE (
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
    year_from INT,
    source TEXT,
    model_display TEXT,
    match_score INT,
    fallback_level INT,
    fallback_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INT := 0;
    current_level INT := 1;
    current_message TEXT := '';
    where_clause TEXT := '';
    final_query TEXT;
BEGIN
    -- ============================================================================
    -- LEVEL 1: make + model + year + part (most specific)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND model_param IS NOT NULL AND year_param IS NOT NULL AND part_param IS NOT NULL THEN
        current_level := 1;
        current_message := 'חיפוש מלא: ' || make_param || ' ' || model_param || ' ' || year_param || ' - ' || part_param;
        
        where_clause := format('ci.make ILIKE %L AND ci.model ILIKE %L AND (ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L) AND (ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)',
            '%' || make_param || '%', '%' || model_param || '%', '%' || year_param || '%', '%' || year_param || '%', '%' || part_param || '%', '%' || part_param || '%');
        
        final_query := 'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC, ci.oem, ci.make, ci.model, 
                        ci.part_family, ci.side_position, ci.front_rear, ci.year_from, ci.source, ci.model_display, 
                        10 as match_score, ' || current_level || ' as fallback_level, ' || quote_literal(current_message) || ' as fallback_message
                        FROM catalog_items ci WHERE ' || where_clause || ' LIMIT ' || limit_results;
        
        RETURN QUERY EXECUTE final_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        IF result_count > 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- LEVEL 2: make + model + year (drop part requirement)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND model_param IS NOT NULL AND year_param IS NOT NULL THEN
        current_level := 2;
        current_message := 'מרחיב חיפוש ל-' || make_param || ' ' || model_param || ' ' || year_param;
        
        where_clause := format('ci.make ILIKE %L AND ci.model ILIKE %L AND (ci.year_from::TEXT ILIKE %L OR ci.extracted_year ILIKE %L)',
            '%' || make_param || '%', '%' || model_param || '%', '%' || year_param || '%', '%' || year_param || '%');
        
        final_query := 'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC, ci.oem, ci.make, ci.model, 
                        ci.part_family, ci.side_position, ci.front_rear, ci.year_from, ci.source, ci.model_display, 
                        8 as match_score, ' || current_level || ' as fallback_level, ' || quote_literal(current_message) || ' as fallback_message
                        FROM catalog_items ci WHERE ' || where_clause || ' LIMIT ' || limit_results;
        
        RETURN QUERY EXECUTE final_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        IF result_count > 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- LEVEL 3: make + model (drop year requirement)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND model_param IS NOT NULL THEN
        current_level := 3;
        current_message := 'מרחיב חיפוש ל-' || make_param || ' ' || model_param;
        
        where_clause := format('ci.make ILIKE %L AND ci.model ILIKE %L',
            '%' || make_param || '%', '%' || model_param || '%');
        
        final_query := 'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC, ci.oem, ci.make, ci.model, 
                        ci.part_family, ci.side_position, ci.front_rear, ci.year_from, ci.source, ci.model_display, 
                        6 as match_score, ' || current_level || ' as fallback_level, ' || quote_literal(current_message) || ' as fallback_message
                        FROM catalog_items ci WHERE ' || where_clause || ' LIMIT ' || limit_results;
        
        RETURN QUERY EXECUTE final_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        IF result_count > 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- LEVEL 4: make + part (drop model requirement, keep part)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND part_param IS NOT NULL THEN
        current_level := 4;
        current_message := 'מרחיב חיפוש ל-' || make_param || ' - ' || part_param;
        
        where_clause := format('ci.make ILIKE %L AND (ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)',
            '%' || make_param || '%', '%' || part_param || '%', '%' || part_param || '%');
        
        final_query := 'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC, ci.oem, ci.make, ci.model, 
                        ci.part_family, ci.side_position, ci.front_rear, ci.year_from, ci.source, ci.model_display, 
                        5 as match_score, ' || current_level || ' as fallback_level, ' || quote_literal(current_message) || ' as fallback_message
                        FROM catalog_items ci WHERE ' || where_clause || ' LIMIT ' || limit_results;
        
        RETURN QUERY EXECUTE final_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        IF result_count > 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- LEVEL 5: make only (most broad make search)
    -- ============================================================================
    
    IF make_param IS NOT NULL THEN
        current_level := 5;
        current_message := 'מרחיב חיפוש ל-' || make_param || ' בלבד';
        
        where_clause := format('ci.make ILIKE %L', '%' || make_param || '%');
        
        final_query := 'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC, ci.oem, ci.make, ci.model, 
                        ci.part_family, ci.side_position, ci.front_rear, ci.year_from, ci.source, ci.model_display, 
                        3 as match_score, ' || current_level || ' as fallback_level, ' || quote_literal(current_message) || ' as fallback_message
                        FROM catalog_items ci WHERE ' || where_clause || ' LIMIT ' || limit_results;
        
        RETURN QUERY EXECUTE final_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        IF result_count > 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- LEVEL 6: part only (fallback to part search)
    -- ============================================================================
    
    IF part_param IS NOT NULL THEN
        current_level := 6;
        current_message := 'מרחיב חיפוש ל-' || part_param || ' בלבד';
        
        where_clause := format('ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L',
            '%' || part_param || '%', '%' || part_param || '%');
        
        final_query := 'SELECT ci.id, ci.cat_num_desc, ci.supplier_name, ci.pcode, ci.price::NUMERIC, ci.oem, ci.make, ci.model, 
                        ci.part_family, ci.side_position, ci.front_rear, ci.year_from, ci.source, ci.model_display, 
                        2 as match_score, ' || current_level || ' as fallback_level, ' || quote_literal(current_message) || ' as fallback_message
                        FROM catalog_items ci WHERE ' || where_clause || ' LIMIT ' || limit_results;
        
        RETURN QUERY EXECUTE final_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        IF result_count > 0 THEN RETURN; END IF;
    END IF;
    
    -- ============================================================================
    -- NO RESULTS: Return empty with Hebrew message
    -- ============================================================================
    
    current_level := 7;
    current_message := 'לא נמצאו תוצאות';
    
    RETURN;
END;
$$;

-- Test cascading search
SELECT 
    fallback_level,
    fallback_message,
    COUNT(*) as results
FROM smart_parts_search_cascading(
    make_param := 'פולקסווגן',
    model_param := 'גולף',
    year_param := '2015',
    part_param := 'פנס'
)
GROUP BY fallback_level, fallback_message;
