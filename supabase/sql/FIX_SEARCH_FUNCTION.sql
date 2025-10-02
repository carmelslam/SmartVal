-- Fix smart_parts_search to stop reversing Hebrew (it's already fixed in DB)
-- Also fix the supplier_name issue

CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
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
    version_date TEXT,
    source TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    make_terms TEXT[];
    free_terms TEXT[];
    make_conditions TEXT[];
    free_conditions TEXT[];
    final_query TEXT;
    where_clause TEXT := '';
BEGIN
    -- Make parameter processing
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(trim(make_param), ' ');
        make_conditions := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(make_terms, 1) LOOP
            IF trim(make_terms[i]) != '' THEN
                make_conditions := array_append(make_conditions,
                    format('(ci.make ILIKE %L OR ci.supplier_name ILIKE %L)', 
                           '%' || trim(make_terms[i]) || '%',
                           '%' || trim(make_terms[i]) || '%'));
            END IF;
        END LOOP;
        
        IF array_length(make_conditions, 1) > 0 THEN
            where_clause := where_clause || 
                CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
                '(' || array_to_string(make_conditions, ' OR ') || ')';
        END IF;
    END IF;
    
    -- Free query processing
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        free_terms := string_to_array(trim(free_query_param), ' ');
        free_conditions := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(free_terms, 1) LOOP
            IF trim(free_terms[i]) != '' THEN
                free_conditions := array_append(free_conditions,
                    format('(ci.part_name ILIKE %L OR ci.part_family ILIKE %L OR ci.make ILIKE %L OR ci.model ILIKE %L OR ci.supplier_name ILIKE %L OR ci.oem ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%'));
            END IF;
        END LOOP;
        
        IF array_length(free_conditions, 1) > 0 THEN
            where_clause := where_clause || 
                CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
                '(' || array_to_string(free_conditions, ' OR ') || ')';
        END IF;
    END IF;
    
    -- Other filters
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
                   '%' || model_param || '%', '%' || model_param || '%');
    END IF;
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)', 
                   '%' || part_param || '%', '%' || part_param || '%');
    END IF;
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.oem ILIKE %L', '%' || oem_param || '%');
    END IF;
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.part_family ILIKE %L', '%' || family_param || '%');
    END IF;
    
    -- Build final query - REMOVED fix_hebrew_text() call
    final_query := 'SELECT 
        ci.id,
        ci.cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        COALESCE(ci.part_family, ''לא מוגדר'') as part_family,
        ci.side_position,
        ci.version_date::TEXT,
        ci.source,
        ci.extracted_year,
        COALESCE(ci.model_display, ci.model, ''לא מוגדר'') as model_display,
        (CASE WHEN ci.part_name IS NOT NULL AND ci.part_name != '''' THEN 10 ELSE 0 END +
         CASE WHEN ci.part_family IS NOT NULL AND ci.part_family != ''לא מוגדר'' THEN 8 ELSE 0 END +
         CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 5 ELSE 0 END +
         CASE WHEN ci.extracted_year IS NOT NULL THEN 3 ELSE 0 END +
         CASE WHEN ci.model IS NOT NULL THEN 2 ELSE 0 END) as match_score
    FROM catalog_items ci';
    
    IF where_clause != '' THEN
        final_query := final_query || ' WHERE ' || where_clause;
    END IF;
    
    final_query := final_query || ' ORDER BY 
        match_score DESC,
        CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 0 ELSE 1 END,
        ci.price ASC,
        ci.make,
        ci.cat_num_desc
    LIMIT ' || limit_results;
    
    RETURN QUERY EXECUTE final_query;
END;
$$;
