-- PHASE 3: IMPLEMENT FLEXIBLE SEARCH WITH MULTI-WORD SUPPORT
-- Based on proven flexible_catalog_search from suggested sql and regex.md
-- Handles "טויוטה יפן" and "פנס איתות למראה ימין" properly

SELECT '=== PHASE 3: FLEXIBLE SEARCH IMPLEMENTATION ===' as section;

-- ============================================================================
-- STEP 1: CREATE ADVANCED MULTI-WORD SEARCH FUNCTION
-- ============================================================================

-- Drop existing to avoid conflicts
DROP FUNCTION IF EXISTS smart_parts_search CASCADE;

-- Create enhanced search with multi-word support and scoring
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
    availability TEXT,
    extracted_year TEXT,
    model_display TEXT,
    match_score INTEGER
) AS $$
DECLARE
    make_terms TEXT[];
    free_terms TEXT[];
    make_conditions TEXT[];
    free_conditions TEXT[];
    final_query TEXT;
    where_clause TEXT := '';
BEGIN
    -- ========================================================================
    -- ENHANCED MAKE PARAMETER PROCESSING (handles "טויוטה יפן")
    -- ========================================================================
    IF make_param IS NOT NULL AND make_param != '' THEN
        -- Split make parameter by spaces
        make_terms := string_to_array(trim(make_param), ' ');
        make_conditions := ARRAY[]::TEXT[];
        
        -- Create flexible OR conditions for each term
        FOR i IN 1..array_length(make_terms, 1) LOOP
            IF trim(make_terms[i]) != '' THEN
                make_conditions := array_append(make_conditions,
                    format('(ci.make ILIKE %L OR ci.supplier_name ILIKE %L)', 
                           '%' || trim(make_terms[i]) || '%',
                           '%' || trim(make_terms[i]) || '%'));
            END IF;
        END LOOP;
        
        -- At least one term must match
        IF array_length(make_conditions, 1) > 0 THEN
            where_clause := where_clause || 
                CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
                '(' || array_to_string(make_conditions, ' OR ') || ')';
        END IF;
    END IF;
    
    -- ========================================================================
    -- ENHANCED FREE QUERY PROCESSING (handles "פנס איתות למראה ימין")
    -- ========================================================================
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        -- Split free query by spaces
        free_terms := string_to_array(trim(free_query_param), ' ');
        free_conditions := ARRAY[]::TEXT[];
        
        -- Each term can match in any field
        FOR i IN 1..array_length(free_terms, 1) LOOP
            IF trim(free_terms[i]) != '' THEN
                free_conditions := array_append(free_conditions,
                    format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L OR ci.part_family ILIKE %L OR ci.make ILIKE %L OR ci.model ILIKE %L OR ci.supplier_name ILIKE %L OR ci.oem ILIKE %L)', 
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%',
                           '%' || trim(free_terms[i]) || '%'));
            END IF;
        END LOOP;
        
        -- At least one term must match somewhere
        IF array_length(free_conditions, 1) > 0 THEN
            where_clause := where_clause || 
                CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
                '(' || array_to_string(free_conditions, ' OR ') || ')';
        END IF;
    END IF;
    
    -- ========================================================================
    -- OTHER FILTER CONDITIONS
    -- ========================================================================
    
    -- Model filter
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.model ILIKE %L OR ci.model_display ILIKE %L)', 
                   '%' || model_param || '%', '%' || model_param || '%');
    END IF;
    
    -- Part filter
    IF part_param IS NOT NULL AND part_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.cat_num_desc ILIKE %L OR ci.part_name ILIKE %L)', 
                   '%' || part_param || '%', '%' || part_param || '%');
    END IF;
    
    -- OEM filter
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.oem ILIKE %L', '%' || oem_param || '%');
    END IF;
    
    -- Family filter
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.part_family ILIKE %L', '%' || family_param || '%');
    END IF;
    
    -- ========================================================================
    -- BUILD AND EXECUTE FINAL QUERY WITH SCORING
    -- ========================================================================
    
    final_query := 'SELECT 
        ci.id,
        fix_hebrew_text(ci.cat_num_desc) as cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        COALESCE(ci.part_family, ''לא מוגדר'') as part_family,
        ci.side_position,
        ci.version_date::TEXT,
        COALESCE(ci.availability, ''מקורי'') as availability,
        ci.extracted_year,
        COALESCE(ci.model_display, ci.model, ''לא מוגדר'') as model_display,
        -- Calculate match score
        (CASE WHEN ci.part_name IS NOT NULL THEN 10 ELSE 0 END +
         CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 5 ELSE 0 END +
         CASE WHEN ci.extracted_year IS NOT NULL THEN 3 ELSE 0 END +
         CASE WHEN ci.model IS NOT NULL THEN 2 ELSE 0 END) as match_score
    FROM catalog_items ci';
    
    -- Add WHERE clause if conditions exist
    IF where_clause != '' THEN
        final_query := final_query || ' WHERE ' || where_clause;
    END IF;
    
    -- Add ordering by score and price
    final_query := final_query || ' ORDER BY 
        match_score DESC,
        CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 0 ELSE 1 END,
        ci.price ASC,
        ci.make,
        ci.cat_num_desc
    LIMIT ' || limit_results;
    
    -- Execute and return results
    RETURN QUERY EXECUTE final_query;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: CREATE WRAPPER FUNCTIONS FOR DIFFERENT SEARCH TYPES
-- ============================================================================

-- Simple vehicle search
CREATE OR REPLACE FUNCTION search_by_vehicle(
    vehicle_make TEXT,
    vehicle_model TEXT DEFAULT NULL,
    vehicle_year TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID, cat_num_desc TEXT, supplier_name TEXT, pcode TEXT, price NUMERIC,
    oem TEXT, make TEXT, model TEXT, part_family TEXT, side_position TEXT,
    version_date TEXT, availability TEXT, extracted_year TEXT, 
    model_display TEXT, match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM smart_parts_search(
        make_param := vehicle_make,
        model_param := vehicle_model,
        free_query_param := vehicle_year
    );
END;
$$ LANGUAGE plpgsql;

-- Simple part search
CREATE OR REPLACE FUNCTION search_by_part(
    search_part_name TEXT,
    search_make TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID, cat_num_desc TEXT, supplier_name TEXT, pcode TEXT, price NUMERIC,
    oem TEXT, make TEXT, model TEXT, part_family TEXT, side_position TEXT,
    version_date TEXT, availability TEXT, extracted_year TEXT, 
    model_display TEXT, match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM smart_parts_search(
        make_param := search_make,
        free_query_param := search_part_name
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: TEST FLEXIBLE SEARCH
-- ============================================================================

SELECT '=== TESTING FLEXIBLE SEARCH ===' as section;

-- Test 1: Multi-word make search
SELECT 
    'Test 1 - Multi-word make (טויוטה יפן):' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(make_param := 'טויוטה יפן', limit_results := 10);

-- Test 2: Multi-word part search  
SELECT 
    'Test 2 - Multi-word part (פנס איתות):' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(free_query_param := 'פנס איתות', limit_results := 10);

-- Test 3: Complex multi-word search
SELECT 
    'Test 3 - Complex search (פנס איתות למראה ימין):' as test_name,
    COUNT(*) as result_count
FROM smart_parts_search(free_query_param := 'פנס איתות למראה ימין', limit_results := 10);

-- Test 4: Show sample results with new fields
SELECT 
    'Test 4 - Sample results with new fields:' as test_name,
    cat_num_desc,
    make,
    model_display,
    extracted_year,
    part_family,
    match_score
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 5);

SELECT '=== PHASE 3 COMPLETE - FLEXIBLE SEARCH DEPLOYED ===' as section;