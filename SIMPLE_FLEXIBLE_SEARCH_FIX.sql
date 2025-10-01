-- SIMPLE FLEXIBLE SEARCH FIX - No Hebrew Reversal Issues
-- Fix "טויוטה יפן" returning 0 results by handling multiple terms

SELECT '=== SIMPLE FLEXIBLE SEARCH FIX ===' as section;

-- Drop all existing smart_parts_search functions first
DROP FUNCTION IF EXISTS smart_parts_search() CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) CASCADE;

-- Replace the existing search function with a simpler one that handles multiple terms
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
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
    availability TEXT
) AS $$
DECLARE
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
    search_terms TEXT[];
    term TEXT;
    term_conditions TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Enhanced Make filter - handle multiple terms with OR logic for flexibility
    IF make_param IS NOT NULL AND make_param != '' THEN
        -- Split by spaces and create OR conditions for each term
        search_terms := string_to_array(trim(make_param), ' ');
        term_conditions := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(search_terms, 1) LOOP
            term := trim(search_terms[i]);
            IF term != '' THEN
                term_conditions := array_append(term_conditions,
                    format('ci.make ILIKE %L', '%' || term || '%'));
            END IF;
        END LOOP;
        
        -- At least one make term must match (OR logic for flexibility)
        IF array_length(term_conditions, 1) > 0 THEN
            where_conditions := array_append(where_conditions,
                '(' || array_to_string(term_conditions, ' OR ') || ')');
        END IF;
    END IF;
    
    -- Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.model ILIKE %L', '%' || model_param || '%'));
    END IF;
    
    -- Enhanced Free query - handle multiple terms across all fields
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        search_terms := string_to_array(trim(free_query_param), ' ');
        term_conditions := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(search_terms, 1) LOOP
            term := trim(search_terms[i]);
            IF term != '' THEN
                -- Each term can match in any field (flexible search)
                term_conditions := array_append(term_conditions,
                    format('(ci.cat_num_desc ILIKE %L OR ci.make ILIKE %L OR ci.model ILIKE %L OR ci.part_family ILIKE %L OR ci.supplier_name ILIKE %L OR ci.oem ILIKE %L OR ci.pcode ILIKE %L)',
                        '%' || term || '%',
                        '%' || term || '%',
                        '%' || term || '%', 
                        '%' || term || '%',
                        '%' || term || '%',
                        '%' || term || '%',
                        '%' || term || '%'));
            END IF;
        END LOOP;
        
        -- At least one term must match somewhere (OR logic)
        IF array_length(term_conditions, 1) > 0 THEN
            where_conditions := array_append(where_conditions,
                '(' || array_to_string(term_conditions, ' OR ') || ')');
        END IF;
    END IF;
    
    -- Part name filter
    IF part_param IS NOT NULL AND part_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.cat_num_desc ILIKE %L', '%' || part_param || '%'));
    END IF;
    
    -- OEM filter
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    -- Family filter
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    -- Build final query - simple, no Hebrew reversal
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
        ci.version_date::TEXT,
        COALESCE(ci.availability, ''מקורי'') as availability
    FROM catalog_items ci';
    
    -- Add WHERE clause if conditions exist
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Add ordering and limit
    final_query := final_query || ' ORDER BY 
        CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 0 ELSE 1 END,
        ci.price ASC,
        ci.make,
        ci.cat_num_desc
    LIMIT ' || limit_results;
    
    -- Execute and return
    RETURN QUERY EXECUTE final_query;
END;
$$ LANGUAGE plpgsql;

SELECT '=== SIMPLE FLEXIBLE SEARCH FIX COMPLETE ===' as section;

-- Function deployed successfully
-- Ready to test: smart_parts_search(make_param := 'טויוטה יפן') should now work