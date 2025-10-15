-- ============================================================================
-- SESSION 35: Fix RPC Timeout - PROPER FIX
-- Date: 2025-10-15
-- Problem: SET LOCAL inside function doesn't work for RPC calls
-- Solution: Set statement_timeout at function definition level
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT);

-- Recreate with timeout set at function level (not inside function body)
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INT DEFAULT 50,
    car_plate TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    quantity_param INT DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL
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
    version_date TEXT,
    availability TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INTEGER,
    year_from INTEGER,
    year_to INTEGER,
    search_message TEXT
)
LANGUAGE plpgsql
SET statement_timeout = '30s'  -- SESSION 35: Set at function level, not inside
AS $$
DECLARE
    result_count INT := 0;
    where_parts TEXT[] := ARRAY[]::TEXT[];
    final_where TEXT;
    final_query TEXT;
    
    make_terms TEXT[];
    model_terms TEXT[];
    part_terms TEXT[];
    free_terms TEXT[];
    year_formats TEXT[];
    
    current_search TEXT;
    normalized_search TEXT;
    search_message TEXT := '';
    i INT;
BEGIN
    -- ============================================================================
    -- REQUIREMENT: Either part_param OR free_query_param must be provided
    -- ============================================================================
    
    IF (part_param IS NULL OR part_param = '') AND (free_query_param IS NULL OR free_query_param = '') THEN
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STEP 1: MAKE (STRICT - must match, field cascade)
    -- ============================================================================
    
    IF make_param IS NOT NULL AND make_param != '' THEN
        make_terms := string_to_array(make_param, ' ');
        
        -- Try full make first
        where_parts := array_append(where_parts,
            format('ci.make ILIKE %L', '%' || make_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        -- Field cascade: try word-by-word
        IF result_count = 0 AND array_length(make_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(make_terms, 1) LOOP
                current_search := make_terms[i];
                where_parts := array_append(where_parts,
                    format('ci.make ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := 'יצרן: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            search_message := 'יצרן: ' || make_param;
        END IF;
        
        -- If no make found, return 0
        IF result_count = 0 THEN
            RETURN;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 2: MODEL (parameter cascade - continue without if not found)
    -- ============================================================================
    
    IF model_param IS NOT NULL AND model_param != '' THEN
        model_terms := string_to_array(model_param, ' ');
        
        -- Try full model
        where_parts := array_append(where_parts,
            format('ci.model ILIKE %L', '%' || model_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        -- Field cascade: try word-by-word
        IF result_count = 0 AND array_length(model_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(model_terms, 1) LOOP
                current_search := model_terms[i];
                where_parts := array_append(where_parts,
                    format('ci.model ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := search_message || ', דגם: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            search_message := search_message || ', דגם: ' || model_param;
        END IF;
        
        -- Parameter cascade: continue even if no model found
        IF result_count = 0 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            search_message := search_message || ' (דגם לא נמצא)';
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: FAMILY (preferred) - field cascade
    -- ============================================================================
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count > 0 THEN
            search_message := search_message || ', משפחה: ' || family_param;
        ELSE
            where_parts := where_parts[1:array_length(where_parts,1)-1];
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: PART NAME (if provided) - field cascade with normalization
    -- ============================================================================
    
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_terms := string_to_array(part_param, ' ');
        
        -- Try full part name
        where_parts := array_append(where_parts,
            format('ci.cat_num_desc ILIKE %L', '%' || part_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 AND array_length(part_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(part_terms, 1) LOOP
                current_search := part_terms[i];
                
                -- Try Hebrew spelling variations
                normalized_search := current_search;
                normalized_search := replace(normalized_search, 'י', '[יאו]');
                normalized_search := replace(normalized_search, 'ו', '[ווי]');
                normalized_search := replace(normalized_search, 'א', '[איו]');
                
                where_parts := array_append(where_parts,
                    format('ci.cat_num_desc ~* %L', normalized_search));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := search_message || ', חלק: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            search_message := search_message || ', חלק: ' || part_param;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 5: FREE QUERY (if provided and no part) - field cascade
    -- ============================================================================
    
    IF free_query_param IS NOT NULL AND free_query_param != '' AND (part_param IS NULL OR part_param = '') THEN
        free_terms := string_to_array(free_query_param, ' ');
        
        where_parts := array_append(where_parts,
            format('ci.cat_num_desc ILIKE %L', '%' || free_query_param || '%'));
        
        EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
        
        IF result_count = 0 AND array_length(free_terms, 1) > 1 THEN
            where_parts := where_parts[1:array_length(where_parts,1)-1];
            
            FOR i IN 1..array_length(free_terms, 1) LOOP
                current_search := free_terms[i];
                where_parts := array_append(where_parts,
                    format('ci.cat_num_desc ILIKE %L', '%' || current_search || '%'));
                
                EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || array_to_string(where_parts, ' AND ') INTO result_count;
                
                IF result_count > 0 THEN
                    search_message := search_message || ', חיפוש חופשי: ' || current_search;
                    EXIT;
                END IF;
                where_parts := where_parts[1:array_length(where_parts,1)-1];
            END LOOP;
        ELSE
            search_message := search_message || ', חיפוש חופשי: ' || free_query_param;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 6: OEM (if provided) - exact match
    -- ============================================================================
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_parts := array_append(where_parts,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
        search_message := search_message || ', OEM: ' || oem_param;
    END IF;
    
    -- ============================================================================
    -- FINAL QUERY: Execute with all filters
    -- ============================================================================
    
    IF array_length(where_parts, 1) = 0 THEN
        RETURN;
    END IF;
    
    final_where := array_to_string(where_parts, ' AND ');
    
    final_query := format('
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
            ci.version_date,
            ci.availability,
            ci.extracted_year,
            ci.model_display,
            1 as match_score,
            ci.year_from,
            ci.year_to,
            %L as search_message
        FROM catalog_items ci
        WHERE %s
        ORDER BY 
            ci.price ASC NULLS LAST,
            ci.version_date DESC NULLS LAST
        LIMIT %s
    ', search_message, final_where, limit_results);
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION smart_parts_search TO authenticated, anon;

-- ============================================================================
-- CRITICAL DIFFERENCE:
-- Line 42: SET statement_timeout = '30s'  <-- This is OUTSIDE the function body
-- This tells PostgreSQL to set the timeout BEFORE executing the function
-- ============================================================================
