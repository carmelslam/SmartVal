-- COMPLETE FIX FOR EVERYTHING
-- This fixes: search, extraction, normalization, triggers

-- PART 1: Drop old functions
DROP FUNCTION IF EXISTS smart_parts_search CASCADE;
DROP FUNCTION IF EXISTS extract_core_part_term CASCADE;
DROP FUNCTION IF EXISTS auto_extract_catalog_data() CASCADE;

-- PART 2: Create extract_core_part_term
CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    core_terms TEXT[] := ARRAY[
        'דלת', 'תלד', 'כנף', 'ףנכ', 'מגן', 'ןגמ', 'פנס', 'סנפ',
        'ראי', 'יאר', 'מראה', 'הארמ', 'גלגל', 'לגלג', 'מנוע', 'עונמ',
        'שמשה', 'השמש', 'חלון', 'ןולח', 'קישוט', 'טושיק', 'בולם', 'םלוב',
        'כיסוי', 'יוסיכ', 'פח', 'חפ', 'זרוע', 'עורז', 'תושבת', 'תבשות',
        'איתות', 'תותיא', 'ערפל', 'לפרע'
    ];
    term TEXT;
BEGIN
    IF query_text IS NULL THEN RETURN query_text; END IF;
    
    FOREACH term IN ARRAY core_terms LOOP
        IF query_text ILIKE '%' || term || '%' THEN
            CASE term
                WHEN 'תלד' THEN RETURN 'דלת';
                WHEN 'ףנכ' THEN RETURN 'כנף';
                WHEN 'ןגמ' THEN RETURN 'מגן';
                WHEN 'סנפ' THEN RETURN 'פנס';
                WHEN 'יאר', 'הארמ' THEN RETURN 'מראה';
                WHEN 'לגלג' THEN RETURN 'גלגל';
                WHEN 'עונמ' THEN RETURN 'מנוע';
                WHEN 'השמש' THEN RETURN 'שמשה';
                WHEN 'ןולח' THEN RETURN 'חלון';
                WHEN 'טושיק' THEN RETURN 'קישוט';
                WHEN 'םלוב' THEN RETURN 'בולם';
                WHEN 'יוסיכ' THEN RETURN 'כיסוי';
                WHEN 'חפ' THEN RETURN 'פח';
                WHEN 'עורז' THEN RETURN 'זרוע';
                WHEN 'תבשות' THEN RETURN 'תושבת';
                WHEN 'תותיא' THEN RETURN 'איתות';
                WHEN 'לפרע' THEN RETURN 'ערפל';
                ELSE RETURN term;
            END CASE;
        END IF;
    END LOOP;
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PART 3: Create search function
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
    core_part_term TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Make filter
    IF make_param IS NOT NULL AND make_param != '' THEN
        normalized_make := normalize_make(make_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.make = %L OR ci.make ILIKE %L)', 
                   normalized_make, '%' || normalized_make || '%'));
    END IF;
    
    -- Part search with core term extraction
    IF free_query_param IS NOT NULL AND free_query_param != '' THEN
        core_part_term := extract_core_part_term(free_query_param);
        where_conditions := array_append(where_conditions, 
            format('(ci.cat_num_desc ILIKE %L OR ci.cat_num_desc ILIKE %L)', 
                '%' || core_part_term || '%',
                '%' || reverse_hebrew(core_part_term) || '%'));
    END IF;
    
    -- Build query
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
        50 as relevance_score,
        ci.version_date
    FROM catalog_items ci';
    
    IF array_length(where_conditions, 1) > 0 THEN
        final_query := final_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    final_query := final_query || ' ORDER BY ci.price DESC NULLS LAST LIMIT ' || limit_results;
    
    RETURN QUERY EXECUTE final_query;
END;
$$;

-- PART 4: Auto extract function
CREATE OR REPLACE FUNCTION auto_extract_catalog_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    txt text;
    yr text[];
BEGIN
    -- Normalize
    txt := lower(coalesce(new.cat_num_desc, ''));

    -- Extract years
    SELECT regexp_match(txt, '(\d{2,4})\s*[-–]\s*(\d{2,4})') INTO yr;
    IF yr IS NOT NULL THEN
        IF new.year_from IS NULL THEN 
            new.year_from := CASE 
                WHEN length(yr[1]) = 2 THEN 2000 + yr[1]::int
                ELSE yr[1]::int 
            END;
        END IF;
        IF new.year_to IS NULL THEN 
            new.year_to := CASE 
                WHEN length(yr[2]) = 2 THEN 2000 + yr[2]::int
                ELSE yr[2]::int 
            END;
        END IF;
    END IF;

    -- Extract side
    IF new.side_position IS NULL THEN
        IF txt LIKE '%שמאל%' THEN new.side_position := 'שמאל';
        ELSIF txt LIKE '%ימין%' THEN new.side_position := 'ימין';
        END IF;
    END IF;

    -- Extract position
    IF new.front_rear IS NULL THEN
        IF txt LIKE '%קדמי%' THEN new.front_rear := 'קדמי';
        ELSIF txt LIKE '%אחורי%' THEN new.front_rear := 'אחורי';
        END IF;
    END IF;

    -- Extract part family
    IF new.part_family IS NULL THEN
        IF txt LIKE '%פנס%' THEN new.part_family := 'פנס';
        ELSIF txt LIKE '%מראה%' OR txt LIKE '%ראי%' THEN new.part_family := 'מראה';
        ELSIF txt LIKE '%מגן%' OR txt LIKE '%פגוש%' THEN new.part_family := 'פגוש';
        ELSIF txt LIKE '%דלת%' OR txt LIKE '%כנף%' THEN new.part_family := 'פח';
        END IF;
    END IF;

    -- Normalize make
    IF new.make IS NOT NULL THEN
        new.make := normalize_make(new.make);
    END IF;

    RETURN new;
END;
$$;

-- PART 5: Create triggers
DROP TRIGGER IF EXISTS auto_process_catalog_on_insert ON catalog_items;
DROP TRIGGER IF EXISTS auto_process_catalog_on_update ON catalog_items;

CREATE TRIGGER auto_process_catalog_on_insert
BEFORE INSERT ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION auto_extract_catalog_data();

CREATE TRIGGER auto_process_catalog_on_update
BEFORE UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION auto_extract_catalog_data();

-- PART 6: Fix existing data
UPDATE catalog_items
SET make = normalize_make(make)
WHERE make LIKE '%יפן%' OR make LIKE '%ארהב%';

-- Test
SELECT COUNT(*) as search_results
FROM smart_parts_search(free_query_param := 'דלת');