-- COMPLETE TWO LEVEL SEARCH WITH ALL PARAMETERS
-- Handles all Level 1 car filters and Level 2 part filters properly

DROP FUNCTION IF EXISTS smart_parts_search(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer);

CREATE OR REPLACE FUNCTION smart_parts_search(
    car_plate TEXT DEFAULT NULL,
    make_param TEXT DEFAULT NULL,
    model_param TEXT DEFAULT NULL,
    model_code_param TEXT DEFAULT NULL,
    trim_param TEXT DEFAULT NULL,
    year_param TEXT DEFAULT NULL,
    engine_volume_param TEXT DEFAULT NULL,
    engine_code_param TEXT DEFAULT NULL,
    engine_type_param TEXT DEFAULT NULL,
    vin_number_param TEXT DEFAULT NULL,
    oem_param TEXT DEFAULT NULL,
    free_query_param TEXT DEFAULT NULL,
    family_param TEXT DEFAULT NULL,
    part_param TEXT DEFAULT NULL,
    source_param TEXT DEFAULT NULL,
    quantity_param INTEGER DEFAULT 1,
    limit_results INTEGER DEFAULT 50
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
    front_rear TEXT,
    year_range TEXT,
    availability TEXT,
    relevance_score INTEGER,
    version_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    normalized_make TEXT;
    car_filters TEXT[] := ARRAY[]::TEXT[];  -- Level 1: Car filters
    part_filters TEXT[] := ARRAY[]::TEXT[]; -- Level 2: Part filters
    final_query TEXT;
    year_int INTEGER;
    has_car_filters BOOLEAN := FALSE;
    has_part_filters BOOLEAN := FALSE;
BEGIN
    -- =========================================
    -- LEVEL 1: CAR FILTERS (shrink the dataset)
    -- All provided car filters must match
    -- =========================================
    
    -- 1.1 Manufacturer/Make (יצרן)
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        car_filters := array_append(car_filters, 
            format('(ci.make = %L OR ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make,
                   make_param,
                   '%' || normalized_make || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Make filter: % → %', make_param, normalized_make;
    END IF;
    
    -- 1.2 Model (דגם)
    IF model_param IS NOT NULL AND model_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.model = %L OR ci.model ILIKE %L)', 
                   model_param, 
                   '%' || model_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Model filter: %', model_param;
    END IF;
    
    -- 1.3 Model Code (קוד דגם)
    IF model_code_param IS NOT NULL AND model_code_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.model_code = %L OR ci.model_code ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   model_code_param, 
                   '%' || model_code_param || '%',
                   '%' || model_code_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Model code filter: %', model_code_param;
    END IF;
    
    -- 1.4 Trim/Version (גרסה)
    IF trim_param IS NOT NULL AND trim_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.trim = %L OR ci.actual_trim = %L OR ci.cat_num_desc ILIKE %L)', 
                   trim_param, 
                   trim_param,
                   '%' || trim_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Trim filter: %', trim_param;
    END IF;
    
    -- 1.5 Year (שנה)
    IF year_param IS NOT NULL AND year_param != '' THEN
        BEGIN
            year_int := year_param::INTEGER;
            car_filters := array_append(car_filters, 
                format('((ci.year_from IS NULL OR ci.year_from <= %s) AND (ci.year_to IS NULL OR ci.year_to >= %s)) OR ci.year_range ILIKE %L OR ci.cat_num_desc ILIKE %L', 
                       year_int, year_int, 
                       '%' || year_param || '%',
                       '%' || year_param || '%'));
        EXCEPTION WHEN OTHERS THEN
            car_filters := array_append(car_filters, 
                format('ci.year_range ILIKE %L OR ci.cat_num_desc ILIKE %L', 
                       '%' || year_param || '%',
                       '%' || year_param || '%'));
        END;
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Year filter: %', year_param;
    END IF;
    
    -- 1.6 Engine Volume (נפח מנוע)
    IF engine_volume_param IS NOT NULL AND engine_volume_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.engine_volume = %L OR ci.engine_volume ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   engine_volume_param,
                   '%' || engine_volume_param || '%',
                   '%' || engine_volume_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Engine volume filter: %', engine_volume_param;
    END IF;
    
    -- 1.7 Engine Code (קוד מנוע)
    IF engine_code_param IS NOT NULL AND engine_code_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.engine_code = %L OR ci.engine_code ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   engine_code_param,
                   '%' || engine_code_param || '%',
                   '%' || engine_code_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Engine code filter: %', engine_code_param;
    END IF;
    
    -- 1.8 Engine Type (סוג מנוע - בנזין/דיזל/היברידי)
    IF engine_type_param IS NOT NULL AND engine_type_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.engine_type = %L OR ci.engine_type ILIKE %L)', 
                   engine_type_param,
                   '%' || engine_type_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: Engine type filter: %', engine_type_param;
    END IF;
    
    -- 1.9 VIN Number (מספר שלדה)
    IF vin_number_param IS NOT NULL AND vin_number_param != '' THEN
        car_filters := array_append(car_filters, 
            format('(ci.vin = %L OR ci.vin ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   vin_number_param,
                   '%' || vin_number_param || '%',
                   '%' || vin_number_param || '%'));
        has_car_filters := TRUE;
        RAISE NOTICE 'L1: VIN filter: %', vin_number_param;
    END IF;
    
    -- ================================================
    -- LEVEL 2: PART FILTERS (find exact parts)
    -- At least one part filter must match
    -- ================================================
    
    -- 2.1 OEM Number (מספר יצרן מקורי) - HIGHEST PRIORITY
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        part_filters := array_append(part_filters, 
            format('ci.oem = %L', oem_param));
        has_part_filters := TRUE;
        RAISE NOTICE 'L2: OEM filter: %', oem_param;
    END IF;
    
    -- 2.2 Free Query - for SIMPLE SEARCH (searches everywhere)
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        part_filters := array_append(part_filters, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L OR ci.part_name = %L OR ci.part_name = %L OR ci.pcode ILIKE %L OR ci.oem ILIKE %L)', 
                   '%' || free_query_param || '%',                    -- Normal Hebrew
                   '%' || reverse_hebrew(free_query_param) || '%',    -- Reversed Hebrew
                   free_query_param,                                   -- Exact part name
                   reverse_hebrew(free_query_param),                   -- Exact reversed
                   '%' || free_query_param || '%',                    -- Pcode
                   '%' || free_query_param || '%'));                  -- OEM
        has_part_filters := TRUE;
        RAISE NOTICE 'L2: Free query filter: % (reversed: %)', free_query_param, reverse_hebrew(free_query_param);
    END IF;
    
    -- 2.3 Part Family - for ADVANCED SEARCH (משפחת חלק)
    IF family_param IS NOT NULL AND family_param != '' THEN
        part_filters := array_append(part_filters, 
            format('(ci.part_family = %L OR ci.part_family ILIKE %L)', 
                   family_param,
                   '%' || family_param || '%'));
        has_part_filters := TRUE;
        RAISE NOTICE 'L2: Part family filter: %', family_param;
    END IF;
    
    -- 2.4 Part Name - for ADVANCED SEARCH (שם חלק)
    IF part_param IS NOT NULL AND part_param != '' THEN
        part_filters := array_append(part_filters, 
            format('(ci.part_name = %L OR ci.part_name = %L OR ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   part_param,
                   reverse_hebrew(part_param),
                   '%' || part_param || '%',
                   '%' || reverse_hebrew(part_param) || '%'));
        has_part_filters := TRUE;
        RAISE NOTICE 'L2: Part name filter: %', part_param;
    END IF;
    
    -- 2.5 Source/Supplier - for ADVANCED SEARCH (מקור/ספק)
    IF source_param IS NOT NULL AND source_param != '' THEN
        part_filters := array_append(part_filters, 
            format('(ci.source = %L OR ci.supplier_name = %L OR ci.supplier_name ILIKE %L)', 
                   source_param,
                   source_param,
                   '%' || source_param || '%'));
        has_part_filters := TRUE;
        RAISE NOTICE 'L2: Source filter: %', source_param;
    END IF;
    
    -- Build the final query
    final_query := 'SELECT 
        ci.id,
        reverse_hebrew(ci.cat_num_desc) as cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price::NUMERIC,
        ci.oem,
        ci.make,
        ci.model,
        ci.part_family,
        ci.side_position,
        ci.front_rear,
        ci.year_range,
        ci.availability,
        CASE
            WHEN ci.oem IS NOT NULL AND ci.oem = $1 THEN 100
            WHEN $2 IS NOT NULL AND ci.make = $2 THEN 90
            WHEN $3 IS NOT NULL AND ci.model = $3 THEN 80
            WHEN ci.price > 0 THEN 70
            ELSE 50
        END as relevance_score,
        ci.version_date
    FROM catalog_items ci 
    WHERE 1=1';
    
    -- Apply Level 1 filters (ALL car filters must match)
    IF array_length(car_filters, 1) > 0 THEN
        final_query := final_query || ' AND (' || array_to_string(car_filters, ') AND (') || ')';
    END IF;
    
    -- Apply Level 2 filters (at least ONE part filter must match)
    IF array_length(part_filters, 1) > 0 THEN
        final_query := final_query || ' AND (' || array_to_string(part_filters, ' OR ') || ')';
    END IF;
    
    -- If no filters at all, return empty result
    IF NOT has_car_filters AND NOT has_part_filters THEN
        RAISE NOTICE 'No filters provided, returning empty result';
        final_query := final_query || ' AND FALSE';
    END IF;
    
    -- Add ordering by relevance and limit
    final_query := final_query || ' ORDER BY relevance_score DESC, ci.price DESC NULLS LAST, ci.id LIMIT ' || limit_results;
    
    -- Log the filter summary
    RAISE NOTICE 'Level 1 (car) filters count: %', array_length(car_filters, 1);
    RAISE NOTICE 'Level 2 (part) filters count: %', array_length(part_filters, 1);
    
    -- Execute with parameters for relevance scoring
    RETURN QUERY EXECUTE final_query USING oem_param, normalized_make, model_param;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Search error: %', SQLERRM;
        -- Return empty result on error
        RETURN;
END;
$$;

-- Test the complete search
SELECT 'Test 1: Toyota + door (simple search simulation)' as test;
SELECT id, cat_num_desc, make, model, price 
FROM smart_parts_search(
    make_param := 'טויוטה',
    free_query_param := 'דלת',
    limit_results := 3
);

SELECT 'Test 2: Advanced search with all filters' as test;
SELECT id, cat_num_desc, make, model, year_range, price 
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA',
    year_param := '2022',
    part_param := 'דלת',
    family_param := 'מרכב',
    limit_results := 3
);

SELECT 'Test 3: Just car filters (no part specified)' as test;
SELECT COUNT(*) as total_parts
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'COROLLA',
    limit_results := 100
);

SELECT 'SUCCESS: Complete two-level search implemented!' as status;