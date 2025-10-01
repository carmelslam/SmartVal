-- FAST FLEXIBLE SEARCH FIX - Optimized for Performance
-- Fix timeout issues while handling multi-word queries

SELECT '=== FAST FLEXIBLE SEARCH FIX ===' as section;

-- Drop all existing smart_parts_search functions first
DROP FUNCTION IF EXISTS smart_parts_search() CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) CASCADE;

-- Create optimized search function
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
    -- Simple and fast approach - use direct SQL with basic ILIKE
    RETURN QUERY
    SELECT 
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
        COALESCE(ci.availability, 'מקורי') as availability
    FROM catalog_items ci
    WHERE 
        -- Make filter - handle "טויוטה יפן" by treating as flexible OR search
        (make_param IS NULL OR make_param = '' OR 
         ci.make ILIKE '%' || make_param || '%' OR
         -- Split on space and match either part
         (position(' ' in make_param) > 0 AND (
             ci.make ILIKE '%' || split_part(make_param, ' ', 1) || '%' OR
             ci.make ILIKE '%' || split_part(make_param, ' ', 2) || '%'
         ))
        )
        AND (model_param IS NULL OR model_param = '' OR ci.model ILIKE '%' || model_param || '%')
        AND (free_query_param IS NULL OR free_query_param = '' OR 
             ci.cat_num_desc ILIKE '%' || free_query_param || '%' OR
             ci.make ILIKE '%' || free_query_param || '%' OR
             ci.model ILIKE '%' || free_query_param || '%' OR
             ci.part_family ILIKE '%' || free_query_param || '%' OR
             ci.supplier_name ILIKE '%' || free_query_param || '%' OR
             ci.oem ILIKE '%' || free_query_param || '%'
        )
        AND (part_param IS NULL OR part_param = '' OR ci.cat_num_desc ILIKE '%' || part_param || '%')
        AND (oem_param IS NULL OR oem_param = '' OR ci.oem ILIKE '%' || oem_param || '%')
        AND (family_param IS NULL OR family_param = '' OR ci.part_family ILIKE '%' || family_param || '%')
    ORDER BY 
        CASE WHEN ci.price IS NOT NULL AND ci.price > 0 THEN 0 ELSE 1 END,
        ci.price ASC,
        ci.make,
        ci.cat_num_desc
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

SELECT '=== FAST FLEXIBLE SEARCH FIX COMPLETE ===' as section;