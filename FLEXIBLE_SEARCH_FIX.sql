-- FLEXIBLE SEARCH FIX - Handle Multiple Terms
-- Fix the issue where "טויוטה יפן" returns 0 results while "טויוטה" works

SELECT '=== FLEXIBLE SEARCH FIX ===' as section;

-- Create enhanced search function that handles multiple terms
CREATE OR REPLACE FUNCTION enhanced_smart_parts_search(
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
    make_conditions TEXT[] := ARRAY[]::TEXT[];
    free_conditions TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Enhanced Make filter - handle multiple terms
    IF make_param IS NOT NULL AND make_param != '' THEN
        -- Split make_param by spaces to handle multiple terms
        search_terms := string_to_array(trim(make_param), ' ');
        
        FOR i IN 1..array_length(search_terms, 1) LOOP
            term := trim(search_terms[i]);
            IF term != '' THEN
                make_conditions := array_append(make_conditions,
                    format('ci.make ILIKE %L', '%' || term || '%'));
            END IF;
        END LOOP;
        
        -- All make terms must match (AND logic)
        IF array_length(make_conditions, 1) > 0 THEN
            where_conditions := array_append(where_conditions,
                '(' || array_to_string(make_conditions, ' AND ') || ')');
        END IF;
    END IF;
    
    -- Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.model ILIKE %L', '%' || model_param || '%'));
    END IF;
    
    -- Enhanced Free query - handle multiple terms and search everywhere
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        search_terms := string_to_array(trim(free_query_param), ' ');
        
        FOR i IN 1..array_length(search_terms, 1) LOOP
            term := trim(search_terms[i]);
            IF term != '' THEN
                free_conditions := array_append(free_conditions,
                    format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.make ILIKE %L OR ci.model ILIKE %L OR ci.part_family ILIKE %L OR ci.supplier_name ILIKE %L OR ci.oem ILIKE %L)',
                        '%' || term || '%',
                        '%' || reverse_hebrew(term) || '%',
                        '%' || term || '%',
                        '%' || term || '%', 
                        '%' || term || '%',
                        '%' || term || '%',
                        '%' || term || '%'));
            END IF;
        END LOOP;
        
        -- All free query terms must match somewhere (AND logic)
        IF array_length(free_conditions, 1) > 0 THEN
            where_conditions := array_append(where_conditions,
                '(' || array_to_string(free_conditions, ' AND ') || ')');
        END IF;
    END IF;
    
    -- Other filters (unchanged)
    IF part_param IS NOT NULL AND part_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.cat_num_desc ILIKE %L', '%' || part_param || '%'));
    END IF;
    
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.oem ILIKE %L', '%' || oem_param || '%'));
    END IF;
    
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_conditions := array_append(where_conditions,
            format('ci.part_family ILIKE %L', '%' || family_param || '%'));
    END IF;
    
    -- Build final query
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

-- Update the main smart_parts_search function to use enhanced logic
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
BEGIN
    -- Use the enhanced search function
    RETURN QUERY SELECT * FROM enhanced_smart_parts_search(
        make_param, model_param, free_query_param, 
        part_param, oem_param, family_param, limit_results
    );
END;
$$ LANGUAGE plpgsql;

-- Test the enhanced search
SELECT '=== TESTING ENHANCED SEARCH ===' as section;

-- Test 1: Single term (should work as before)
SELECT 
    'Test 1 - Single term (טויוטה):' as test_name,
    COUNT(*) as result_count
FROM enhanced_smart_parts_search(make_param := 'טויוטה', limit_results := 10);

-- Test 2: Multiple terms (should now work)
SELECT 
    'Test 2 - Multiple terms (טויוטה יפן):' as test_name,
    COUNT(*) as result_count
FROM enhanced_smart_parts_search(make_param := 'טויוטה יפן', limit_results := 10);

-- Test 3: Free query with multiple terms
SELECT 
    'Test 3 - Free query (טויוטה פנס):' as test_name,
    COUNT(*) as result_count
FROM enhanced_smart_parts_search(free_query_param := 'טויוטה פנס', limit_results := 10);

-- Test 4: Sample results for verification
SELECT 
    'Test 4 - Sample results (טויוטה יפן):' as test_name,
    make,
    model,
    cat_num_desc,
    supplier_name
FROM enhanced_smart_parts_search(make_param := 'טויוטה יפן', limit_results := 5);

SELECT '=== FLEXIBLE SEARCH FIX COMPLETE ===' as section;