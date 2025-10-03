-- DEBUG: Check what WHERE clause is being generated and if data exists

-- First, verify data exists
SELECT 'Data exists check' as test;
SELECT COUNT(*) as total_with_knaf
FROM catalog_items 
WHERE cat_num_desc ILIKE '%כנף%' OR part_family ILIKE '%כנף%';

-- Test the search function with debug output
DO $$
DECLARE
    search_term TEXT := 'ביטנה כנף קד';
    terms TEXT[];
    part_conditions TEXT[];
    i INT;
    test_where TEXT;
    result_count INT;
BEGIN
    RAISE NOTICE 'Testing search for: %', search_term;
    
    terms := string_to_array(search_term, ' ');
    RAISE NOTICE 'Split into % terms: %', array_length(terms, 1), terms;
    
    -- Build cascading conditions like the function does
    FOR i IN REVERSE array_length(terms, 1)..1 LOOP
        part_conditions := array_append(part_conditions,
            format('(ci.cat_num_desc ILIKE %L OR ci.part_family ILIKE %L)',
                '%' || array_to_string(terms[1:i], ' ') || '%',
                '%' || array_to_string(terms[1:i], ' ') || '%'));
        
        RAISE NOTICE 'Iteration %: searching for "%"', i, array_to_string(terms[1:i], ' ');
    END LOOP;
    
    test_where := '(' || array_to_string(part_conditions, ' OR ') || ')';
    RAISE NOTICE 'Final WHERE clause: %', test_where;
    
    -- Test the where clause
    EXECUTE 'SELECT COUNT(*) FROM catalog_items ci WHERE ' || test_where INTO result_count;
    RAISE NOTICE 'Results found: %', result_count;
END $$;

-- Now test the actual function
SELECT 'Actual function test' as test;
SELECT COUNT(*) as function_results
FROM smart_parts_search(free_query_param := 'ביטנה כנף קד');

-- Test with just one word
SELECT 'Single word test: כנף' as test;
SELECT COUNT(*) as single_word_results
FROM smart_parts_search(free_query_param := 'כנף');

-- Show actual results
SELECT 'Show actual results for כנף' as test;
SELECT cat_num_desc, make, model, part_family
FROM smart_parts_search(free_query_param := 'כנף')
LIMIT 5;
