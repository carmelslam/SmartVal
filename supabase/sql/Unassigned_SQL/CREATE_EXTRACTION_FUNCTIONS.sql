-- CREATE EXTRACTION AND NORMALIZATION FUNCTIONS
-- This will extract side, position, and part information from cat_num_desc

-- 1. Create function to extract side (ימין/שמאל)
CREATE OR REPLACE FUNCTION extract_side_from_desc(desc_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Check for right side variations
    IF desc_text ILIKE '%ימי%' OR desc_text ILIKE '%ימין%' OR desc_text ILIKE '%ימנ%' THEN
        RETURN 'ימין';
    -- Check for left side variations
    ELSIF desc_text ILIKE '%שמא%' OR desc_text ILIKE '%שמאל%' OR desc_text ILIKE '%שמ''%' THEN
        RETURN 'שמאל';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create function to extract position (קדמי/אחורי)
CREATE OR REPLACE FUNCTION extract_position_from_desc(desc_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Check for front variations
    IF desc_text ILIKE '%קד''%' OR desc_text ILIKE '%קדמ%' OR desc_text ILIKE '%דק%' THEN
        RETURN 'קדמי';
    -- Check for rear variations
    ELSIF desc_text ILIKE '%אח''%' OR desc_text ILIKE '%אחו%' OR desc_text ILIKE '%חא%' THEN
        RETURN 'אחורי';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create Hebrew part family mapping
CREATE OR REPLACE FUNCTION get_hebrew_part_family(desc_text TEXT, eng_family TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Check description for Hebrew part types
    IF desc_text ILIKE '%סנפ%' OR desc_text ILIKE '%פנס%' THEN
        RETURN 'תאורה';
    ELSIF desc_text ILIKE '%תלד%' OR desc_text ILIKE '%דלת%' THEN
        RETURN 'מרכב';
    ELSIF desc_text ILIKE '%ףנכ%' OR desc_text ILIKE '%כנף%' THEN
        RETURN 'מרכב';
    ELSIF desc_text ILIKE '%ןגמ%' OR desc_text ILIKE '%מגן%' OR desc_text ILIKE '%פגוש%' THEN
        RETURN 'מרכב';
    ELSIF desc_text ILIKE '%הארמ%' OR desc_text ILIKE '%מראה%' THEN
        RETURN 'מראות';
    ELSIF desc_text ILIKE '%תיכוכז%' OR desc_text ILIKE '%זכוכית%' OR desc_text ILIKE '%שמשה%' THEN
        RETURN 'זכוכית';
    ELSIF desc_text ILIKE '%עונמ%' OR desc_text ILIKE '%מנוע%' THEN
        RETURN 'מנוע';
    ELSIF desc_text ILIKE '%רוריק%' OR desc_text ILIKE '%קירור%' OR desc_text ILIKE '%מצנן%' THEN
        RETURN 'קירור';
    -- Map English families if no Hebrew found
    ELSIF eng_family = 'Lighting' THEN
        RETURN 'תאורה';
    ELSIF eng_family = 'Body' THEN
        RETURN 'מרכב';
    ELSIF eng_family = 'Engine' THEN
        RETURN 'מנוע';
    ELSIF eng_family = 'Cooling' THEN
        RETURN 'קירור';
    ELSIF eng_family = 'Glass' THEN
        RETURN 'זכוכית';
    ELSIF eng_family = 'Mirrors' THEN
        RETURN 'מראות';
    ELSIF eng_family = 'Braking' THEN
        RETURN 'בלמים';
    ELSIF eng_family = 'Electrical' THEN
        RETURN 'חשמל';
    ELSIF eng_family = 'Filters' THEN
        RETURN 'מסננים';
    ELSIF eng_family = 'Wheels' THEN
        RETURN 'גלגלים';
    ELSIF eng_family = 'Transmission' THEN
        RETURN 'תיבת הילוכים';
    ELSIF eng_family = 'Suspension' THEN
        RETURN 'מתלים';
    ELSE
        RETURN 'כללי';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Update catalog_items with extracted data
UPDATE catalog_items 
SET 
    side_position = extract_side_from_desc(cat_num_desc),
    front_rear = extract_position_from_desc(cat_num_desc),
    part_family = get_hebrew_part_family(cat_num_desc, part_family)
WHERE side_position IS NULL OR front_rear IS NULL OR part_family IN ('Lighting', 'Body', 'Engine', 'Cooling', 'Glass', 'Mirrors', 'Braking', 'Electrical', 'Filters', 'Wheels', 'Transmission', 'Suspension');

-- 5. Create improved search function that uses ALL fields
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
    relevance_score INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Start building the query
    base_query := 'SELECT 
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
        ci.front_rear,
        ci.year_range,
        ci.availability,
        0 as relevance_score
    FROM catalog_items ci 
    WHERE 1=1';

    -- Make search
    IF make_param IS NOT NULL AND make_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.make ILIKE %L', '%' || make_param || '%'));
    END IF;
    
    -- Free query search - search in cat_num_desc
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        where_conditions := array_append(where_conditions, 
            format('ci.cat_num_desc ILIKE %L', '%' || free_query_param || '%'));
    END IF;
    
    -- Build final query
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
    ELSE
        -- If no conditions, return some results
        final_query := base_query;
    END IF;
    
    -- Add ordering and limit
    final_query := final_query || format(' ORDER BY ci.id LIMIT %s', limit_results);
    
    -- Execute and return results
    RETURN QUERY EXECUTE final_query;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Search error: %', SQLERRM;
        RETURN;
END;
$$;

-- 6. Test the improved search
SELECT 'Testing search for דלת ימין קדמי:' as test;
SELECT * FROM smart_parts_search(free_query_param := 'דלת', limit_results := 5);

SELECT 'Testing with specific דלת ימי:' as test;
SELECT * FROM smart_parts_search(free_query_param := 'תלד ימי', limit_results := 5);

SELECT 'SUCCESS: Extraction functions created and search improved!' as status;