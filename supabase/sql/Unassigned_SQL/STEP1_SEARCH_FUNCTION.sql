-- STEP 1: FIX SEARCH FUNCTION ONLY

DROP FUNCTION IF EXISTS extract_core_part_term CASCADE;

CREATE OR REPLACE FUNCTION extract_core_part_term(query_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF query_text IS NULL THEN RETURN query_text; END IF;
    
    -- Check for door
    IF query_text ILIKE '%דלת%' OR query_text ILIKE '%תלד%' THEN
        RETURN 'דלת';
    END IF;
    
    -- Check for fender
    IF query_text ILIKE '%כנף%' OR query_text ILIKE '%ףנכ%' THEN
        RETURN 'כנף';
    END IF;
    
    -- Check for bumper
    IF query_text ILIKE '%מגן%' OR query_text ILIKE '%ןגמ%' THEN
        RETURN 'מגן';
    END IF;
    
    -- Check for light
    IF query_text ILIKE '%פנס%' OR query_text ILIKE '%סנפ%' THEN
        RETURN 'פנס';
    END IF;
    
    -- Check for mirror
    IF query_text ILIKE '%מראה%' OR query_text ILIKE '%הארמ%' OR 
       query_text ILIKE '%ראי%' OR query_text ILIKE '%יאר%' THEN
        RETURN 'מראה';
    END IF;
    
    RETURN query_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Test
SELECT extract_core_part_term('דלת ימין') as should_be_door;