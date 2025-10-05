-- FIX SEARCH FUNCTION TO RETURN SOURCE INSTEAD OF AVAILABILITY
-- Remove availability field and ensure source field is properly returned
-- UI displays source (original/aftermarket) not availability (stock status)

SELECT '=== FIXING SEARCH FUNCTION SOURCE COLUMN MAPPING ===' as section;

-- ============================================================================
-- STEP 1: CLEANUP REMAINING CORRUPTED SOURCE VALUES
-- ============================================================================

-- Clean up remaining corrupted source values
UPDATE catalog_items 
SET source = 'חליפי'
WHERE source LIKE '%יפיל%';

-- Verify cleanup
SELECT 
    'Source Values After Final Cleanup:' as cleanup_status,
    source,
    COUNT(*) as count
FROM catalog_items 
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC;

-- ============================================================================
-- STEP 2: UPDATE SMART_PARTS_SEARCH FUNCTION
-- ============================================================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS smart_parts_search(text,text,text,text,text,text,integer,text,text,text,text,text,integer,text,text,text,text);

-- Create function with correct column mapping
CREATE OR REPLACE FUNCTION smart_parts_search(
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    limit_results INTEGER DEFAULT 50,
    car_plate TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    quantity_param INTEGER DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL
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
    source TEXT,  -- FIXED: Now returns source instead of availability
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
        
        -- SIMPLE PRIORITY SEARCH - Extracted fields first, then fallback
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
    
    -- Additional parameter filters
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.model_code ILIKE %L', '%' || model_code_param || '%');
    END IF;
    
    IF year_param IS NOT NULL AND year_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('(ci.extracted_year ILIKE %L OR ci.year_range ILIKE %L)', 
                   '%' || year_param || '%', '%' || year_param || '%');
    END IF;
    
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.engine_code ILIKE %L', '%' || engine_code_param || '%');
    END IF;
    
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        where_clause := where_clause || 
            CASE WHEN where_clause != '' THEN ' AND ' ELSE '' END ||
            format('ci.trim ILIKE %L', '%' || trim_param || '%');
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
        ci.source,  -- FIXED: Now returns source column with actual data
        ci.extracted_year,
        COALESCE(ci.model_display, ci.model, ''לא מוגדר'') as model_display,
        -- SIMPLE SCORING - Basic prioritization
        (CASE WHEN ci.part_name IS NOT NULL AND ci.part_name != '''' THEN 10 ELSE 0 END +
         CASE WHEN ci.part_family IS NOT NULL AND ci.part_family != ''לא מוגדר'' THEN 8 ELSE 0 END +
         CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 5 ELSE 0 END +
         CASE WHEN ci.extracted_year IS NOT NULL THEN 3 ELSE 0 END +
         CASE WHEN ci.model IS NOT NULL THEN 2 ELSE 0 END) as match_score
    FROM catalog_items ci';
    
    -- Add WHERE clause if conditions exist
    IF where_clause != '' THEN
        final_query := final_query || ' WHERE ' || where_clause;
    END IF;
    
    -- SIMPLE ORDERING - Score first, then price
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
-- STEP 3: VERIFICATION TEST
-- ============================================================================

-- Test the fixed function
SELECT 
    'Fixed Function Test Results:' as test_type,
    make,
    part_family,
    source,  -- Should now return actual values like "חליפי"
    cat_num_desc
FROM smart_parts_search(make_param := 'טויוטה', free_query_param := 'כנף', limit_results := 5);

-- Count results by source to verify
SELECT 
    'Source Distribution in Search Results:' as analysis_type,
    source,
    COUNT(*) as count
FROM smart_parts_search(make_param := 'טויוטה', limit_results := 50)
WHERE source IS NOT NULL
GROUP BY source;

SELECT '=== SEARCH FUNCTION SOURCE COLUMN FIX COMPLETE ===' as section;

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'SEARCH FUNCTION SOURCE COLUMN FIX COMPLETED';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Removed availability column from function output';
    RAISE NOTICE '- Added source column to function output';
    RAISE NOTICE '- Cleaned up remaining corrupted source values';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected results:';
    RAISE NOTICE '- UI now receives source field with "חליפי"/"מקורי" values';
    RAISE NOTICE '- No more null values in source field';
    RAISE NOTICE '- Search results show proper original/aftermarket status';
    RAISE NOTICE '===============================================';
END $$;