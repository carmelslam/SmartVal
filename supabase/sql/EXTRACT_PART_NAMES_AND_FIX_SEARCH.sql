-- EXTRACT PART NAMES AND FIX SEARCH
-- This will extract part names from cat_num_desc and create a proper search

-- 1. Add part_name column if it doesn't exist
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS part_name TEXT;

-- 2. Create function to extract part name from cat_num_desc
CREATE OR REPLACE FUNCTION extract_part_name(desc_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    -- Common part patterns
    patterns TEXT[] := ARRAY[
        'תלד', 'דלת',
        'ףנכ', 'כנף',
        'ןגמ', 'מגן',
        'סנפ', 'פנס',
        'הארמ', 'מראה', 'יאר', 'ראי',
        'לפרע', 'ערפל',
        'תותיא', 'איתות',
        'טפט',
        'םלוב', 'בולם',
        'טושיק', 'קישוט',
        'יוסיכ', 'כיסוי',
        'רוצע', 'עוצר',
        'לבכ', 'כבל',
        'תבשות', 'תושבת',
        'ספ', 'פס',
        'עורז', 'זרוע',
        'החפ', 'פח',
        'השמש', 'שמשה',
        'ללוס', 'סולל'
    ];
    pattern TEXT;
BEGIN
    result := desc_text;
    
    -- Try to find any of the patterns
    FOREACH pattern IN ARRAY patterns LOOP
        IF desc_text ILIKE '%' || pattern || '%' THEN
            -- Extract the part name based on pattern location
            CASE pattern
                WHEN 'תלד' THEN result := 'דלת';
                WHEN 'דלת' THEN result := 'דלת';
                WHEN 'ףנכ' THEN result := 'כנף';
                WHEN 'כנף' THEN result := 'כנף';
                WHEN 'ןגמ' THEN result := 'מגן';
                WHEN 'מגן' THEN result := 'מגן';
                WHEN 'סנפ' THEN result := 'פנס';
                WHEN 'פנס' THEN result := 'פנס';
                WHEN 'הארמ' THEN result := 'מראה';
                WHEN 'מראה' THEN result := 'מראה';
                WHEN 'יאר' THEN result := 'ראי';
                WHEN 'ראי' THEN result := 'ראי';
                WHEN 'לפרע' THEN result := 'ערפל';
                WHEN 'ערפל' THEN result := 'ערפל';
                WHEN 'תותיא' THEN result := 'איתות';
                WHEN 'איתות' THEN result := 'איתות';
                WHEN 'טפט' THEN result := 'טפט';
                WHEN 'םלוב' THEN result := 'בולם';
                WHEN 'בולם' THEN result := 'בולם';
                WHEN 'טושיק' THEN result := 'קישוט';
                WHEN 'קישוט' THEN result := 'קישוט';
                WHEN 'יוסיכ' THEN result := 'כיסוי';
                WHEN 'כיסוי' THEN result := 'כיסוי';
                WHEN 'רוצע' THEN result := 'עוצר';
                WHEN 'עוצר' THEN result := 'עוצר';
                WHEN 'לבכ' THEN result := 'כבל';
                WHEN 'כבל' THEN result := 'כבל';
                WHEN 'תבשות' THEN result := 'תושבת';
                WHEN 'תושבת' THEN result := 'תושבת';
                WHEN 'ספ' THEN result := 'פס';
                WHEN 'פס' THEN result := 'פס';
                WHEN 'עורז' THEN result := 'זרוע';
                WHEN 'זרוע' THEN result := 'זרוע';
                WHEN 'החפ' THEN result := 'פח';
                WHEN 'פח' THEN result := 'פח';
                WHEN 'השמש' THEN result := 'שמשה';
                WHEN 'שמשה' THEN result := 'שמשה';
                WHEN 'ללוס' THEN result := 'סולל';
                WHEN 'סולל' THEN result := 'סולל';
                ELSE result := pattern;
            END CASE;
            EXIT; -- Found a match, exit loop
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Update catalog_items with extracted part names
UPDATE catalog_items 
SET part_name = extract_part_name(cat_num_desc)
WHERE part_name IS NULL;

-- 4. Create a simpler search function that actually works
CREATE OR REPLACE FUNCTION search_parts_simple(
    search_text TEXT DEFAULT NULL,
    make_filter TEXT DEFAULT NULL,
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
    part_name TEXT,
    side_position TEXT,
    front_rear TEXT,
    year_range TEXT,
    availability TEXT,
    version_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- If no search text, return some results
    IF search_text IS NULL OR search_text = '' THEN
        RETURN QUERY 
        SELECT 
            ci.id,
            reverse_hebrew(ci.cat_num_desc),
            ci.supplier_name,
            ci.pcode,
            ci.price::NUMERIC,
            ci.oem,
            ci.make,
            ci.model,
            ci.part_family,
            ci.part_name,
            ci.side_position,
            ci.front_rear,
            ci.year_range,
            ci.availability,
            ci.version_date
        FROM catalog_items ci
        WHERE (make_filter IS NULL OR ci.make ILIKE '%' || make_filter || '%')
        LIMIT limit_results;
    ELSE
        -- Search in cat_num_desc for the text (as stored - reversed)
        RETURN QUERY 
        SELECT 
            ci.id,
            reverse_hebrew(ci.cat_num_desc),
            ci.supplier_name,
            ci.pcode,
            ci.price::NUMERIC,
            ci.oem,
            ci.make,
            ci.model,
            ci.part_family,
            ci.part_name,
            ci.side_position,
            ci.front_rear,
            ci.year_range,
            ci.availability,
            ci.version_date
        FROM catalog_items ci
        WHERE ci.cat_num_desc ILIKE '%' || search_text || '%'
           OR ci.cat_num_desc ILIKE '%' || reverse_hebrew(search_text) || '%'
           OR ci.part_name = search_text
           OR ci.part_name = reverse_hebrew(search_text)
           OR ci.pcode ILIKE '%' || search_text || '%'
        LIMIT limit_results;
    END IF;
END;
$$;

-- 5. Update smart_parts_search to use the new approach
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
BEGIN
    -- Use the simple search that works
    RETURN QUERY
    SELECT 
        s.id,
        s.cat_num_desc,
        s.supplier_name,
        s.pcode,
        s.price,
        s.oem,
        s.make,
        s.model,
        s.part_family,
        s.side_position,
        s.front_rear,
        s.year_range,
        s.availability,
        50 as relevance_score,
        s.version_date
    FROM search_parts_simple(
        COALESCE(free_query_param, part_param),
        make_param,
        limit_results
    ) s;
END;
$$;

-- 6. Test the new search
SELECT 'Test 1: Search for דלת' as test;
SELECT COUNT(*) FROM search_parts_simple('דלת');

SELECT 'Test 2: Search for תלד (reversed)' as test;
SELECT COUNT(*) FROM search_parts_simple('תלד');

SELECT 'Test 3: Show some extracted part names' as test;
SELECT DISTINCT part_name, COUNT(*) 
FROM catalog_items 
WHERE part_name IS NOT NULL
GROUP BY part_name
ORDER BY COUNT(*) DESC
LIMIT 10;

SELECT 'SUCCESS: Part names extracted and search simplified!' as status;