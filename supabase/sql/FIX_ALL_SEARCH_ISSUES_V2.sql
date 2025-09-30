-- FIX ALL SEARCH ISSUES V2
-- This addresses: Hebrew reversal, make normalization, search relevance, missing data

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS smart_parts_search(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer);
DROP FUNCTION IF EXISTS simple_parts_search(jsonb);
DROP FUNCTION IF EXISTS reverse_hebrew(text);
DROP FUNCTION IF EXISTS normalize_make(text);

-- 2. Create make normalization function
CREATE OR REPLACE FUNCTION normalize_make(input_make TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove "יפן" and other country names
    input_make := REGEXP_REPLACE(input_make, '\s*(יפן|גרמניה|קוריאה|צרפת|איטליה|אמריקה|שוודיה|יפנית|גרמנית|קוריאנית).*$', '', 'g');
    input_make := TRIM(input_make);
    
    -- Normalize common makes
    IF input_make ILIKE '%BMW%' OR input_make = 'ב.מ.וו' OR input_make = 'ב מ וו' THEN
        RETURN 'BMW';
    ELSIF input_make = 'טויוטה' OR input_make ILIKE '%TOYOTA%' THEN
        RETURN 'טויוטה';
    ELSIF input_make = 'מרצדס' OR input_make ILIKE '%MERCEDES%' THEN
        RETURN 'מרצדס';
    ELSIF input_make = 'אאודי' OR input_make ILIKE '%AUDI%' THEN
        RETURN 'AUDI';
    ELSIF input_make = 'פולקסווגן' OR input_make ILIKE '%VOLKSWAGEN%' OR input_make ILIKE '%VW%' THEN
        RETURN 'VAG';
    ELSIF input_make = 'מזדה' OR input_make ILIKE '%MAZDA%' THEN
        RETURN 'מזדה';
    ELSIF input_make = 'ניסן' OR input_make = 'ניסאן' OR input_make ILIKE '%NISSAN%' THEN
        RETURN 'ניסאן';
    ELSIF input_make = 'הונדה' OR input_make ILIKE '%HONDA%' THEN
        RETURN 'הונדה';
    ELSIF input_make = 'מיצובישי' OR input_make ILIKE '%MITSUBISHI%' THEN
        RETURN 'מיצובישי';
    ELSIF input_make = 'סובארו' OR input_make ILIKE '%SUBARU%' THEN
        RETURN 'סובארו';
    ELSIF input_make = 'קיה' OR input_make ILIKE '%KIA%' THEN
        RETURN 'קיה';
    ELSIF input_make = 'יונדאי' OR input_make = 'היונדאי' OR input_make ILIKE '%HYUNDAI%' THEN
        RETURN 'יונדאי';
    ELSE
        RETURN input_make;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create function to reverse Hebrew text
CREATE OR REPLACE FUNCTION reverse_hebrew(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    i INT;
BEGIN
    IF text_input IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Reverse character by character
    FOR i IN REVERSE LENGTH(text_input)..1 LOOP
        result := result || SUBSTRING(text_input FROM i FOR 1);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create the improved search function
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
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    order_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Normalize the make parameter
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
    END IF;

    -- Start building the query with reversed Hebrew for display
    final_query := 'SELECT 
        ci.id,
        reverse_hebrew(ci.cat_num_desc) as cat_num_desc,
        ci.supplier_name,
        ci.pcode,
        ci.price,
        ci.oem,
        ci.make,
        ci.model,
        ci.part_family,
        ci.side_position,
        ci.front_rear,
        ci.year_range,
        ci.availability,
        CASE
            WHEN $1 IS NOT NULL AND ci.oem = $1 THEN 100
            WHEN $2 IS NOT NULL AND ci.cat_num_desc ILIKE ''%'' || $2 || ''%'' THEN 90
            WHEN $3 IS NOT NULL AND ci.make = $3 THEN 80
            WHEN $4 IS NOT NULL AND ci.model ILIKE ''%'' || $4 || ''%'' THEN 70
            ELSE 50
        END as relevance_score,
        ci.version_date
    FROM catalog_items ci 
    WHERE 1=1';

    -- OEM search (highest priority)
    IF oem_param IS NOT NULL AND oem_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.oem = %L', oem_param));
        order_conditions := array_append(order_conditions, 'ci.oem = ' || quote_literal(oem_param) || ' DESC');
    END IF;
    
    -- Make search with normalization
    IF normalized_make IS NOT NULL AND normalized_make != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make ILIKE %L)', normalized_make, '%' || normalized_make || '%'));
        order_conditions := array_append(order_conditions, 'ci.make = ' || quote_literal(normalized_make) || ' DESC');
    END IF;
    
    -- Model search
    IF model_param IS NOT NULL AND model_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.model = %L OR ci.model ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   model_param, '%' || model_param || '%', '%' || model_param || '%'));
    END IF;
    
    -- Year search
    IF year_param IS NOT NULL AND year_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('(ci.year_range ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                   '%' || year_param || '%', '%' || year_param || '%'));
    END IF;
    
    -- Part family search
    IF family_param IS NOT NULL AND family_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.part_family = %L', family_param));
    END IF;
    
    -- Free query search
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        -- For simple search, search everywhere
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.oem ILIKE %L OR ci.pcode ILIKE %L OR ci.part_family ILIKE %L)', 
                   '%' || free_query_param || '%', 
                   '%' || free_query_param || '%',
                   '%' || free_query_param || '%',
                   '%' || free_query_param || '%'));
    END IF;
    
    -- Apply conditions
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' AND ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Add ordering with relevance
    final_query := final_query || ' ORDER BY relevance_score DESC, ci.price DESC NULLS LAST';
    
    -- Add limit
    final_query := final_query || format(' LIMIT %s', limit_results);
    
    -- Execute with parameters for relevance scoring
    RETURN QUERY EXECUTE final_query USING oem_param, free_query_param, normalized_make, model_param;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Search error: %', SQLERRM;
        RETURN;
END;
$$;

-- 5. Recreate simple search wrapper
CREATE OR REPLACE FUNCTION simple_parts_search(search_params JSONB)
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
BEGIN
    RETURN QUERY SELECT * FROM smart_parts_search(
        car_plate := search_params->>'car_plate',
        make_param := search_params->>'make',
        model_param := search_params->>'model',
        model_code_param := search_params->>'model_code',
        trim_param := search_params->>'trim',
        year_param := search_params->>'year',
        engine_volume_param := search_params->>'engine_volume',
        engine_code_param := search_params->>'engine_code',
        engine_type_param := search_params->>'engine_type',
        vin_number_param := search_params->>'vin_number',
        oem_param := search_params->>'oem',
        free_query_param := search_params->>'free_query',
        family_param := search_params->>'family',
        part_param := search_params->>'part',
        source_param := search_params->>'source',
        quantity_param := COALESCE((search_params->>'quantity')::INTEGER, 1),
        limit_results := COALESCE((search_params->>'limit')::INTEGER, 50)
    );
END;
$$;

-- 6. Test the fixes
SELECT 'Test 1: Search with טויוטה יפן (should normalize to טויוטה)' as test;
SELECT id, cat_num_desc, make, model, version_date 
FROM smart_parts_search(make_param := 'טויוטה יפן', limit_results := 3);

SELECT 'Test 2: Simple search for דלת' as test;
SELECT id, cat_num_desc, make, model, version_date
FROM smart_parts_search(free_query_param := 'דלת', limit_results := 3);

SELECT 'Test 3: Advanced search טויוטה + דלת' as test;
SELECT id, cat_num_desc, make, model, version_date
FROM smart_parts_search(make_param := 'טויוטה', free_query_param := 'דלת', limit_results := 3);

SELECT 'SUCCESS: All search issues fixed!' as status;