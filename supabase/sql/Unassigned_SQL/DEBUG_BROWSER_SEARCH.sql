-- DEBUG BROWSER SEARCH ISSUE
-- Let's create a wrapper that logs what's being searched

-- 1. Create a debug version of the search that logs parameters
CREATE OR REPLACE FUNCTION debug_parts_search(search_params JSONB)
RETURNS TABLE(
    debug_info TEXT,
    result_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    free_query TEXT;
    make_query TEXT;
    reversed_query TEXT;
    result_count BIGINT;
BEGIN
    -- Extract parameters
    free_query := search_params->>'free_query';
    make_query := search_params->>'make';
    
    -- Show what we received
    RETURN QUERY SELECT 
        format('Received - free_query: %s, make: %s', free_query, make_query),
        0::BIGINT;
    
    -- If we have Hebrew text, show both normal and reversed
    IF free_query IS NOT NULL THEN
        -- Try to reverse it
        reversed_query := reverse_hebrew(free_query);
        RETURN QUERY SELECT 
            format('Reversed query would be: %s', reversed_query),
            0::BIGINT;
    END IF;
    
    -- Count results for the query as-is
    SELECT COUNT(*) INTO result_count
    FROM catalog_items
    WHERE cat_num_desc ILIKE '%' || COALESCE(free_query, '') || '%';
    
    RETURN QUERY SELECT 
        format('Results found with original query: %s', result_count),
        result_count;
    
    -- Count results for reversed query
    IF reversed_query IS NOT NULL THEN
        SELECT COUNT(*) INTO result_count
        FROM catalog_items
        WHERE cat_num_desc ILIKE '%' || reversed_query || '%';
        
        RETURN QUERY SELECT 
            format('Results found with reversed query: %s', result_count),
            result_count;
    END IF;
END;
$$;

-- 2. Test with different queries
SELECT * FROM debug_parts_search('{"free_query": "דלת"}'::jsonb);
SELECT * FROM debug_parts_search('{"free_query": "תלד"}'::jsonb);
SELECT * FROM debug_parts_search('{"make": "טויוטה"}'::jsonb);

-- 3. Check if simple_parts_search is using the correct function
SELECT 'Checking simple_parts_search definition:' as check;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'simple_parts_search'
LIMIT 1;