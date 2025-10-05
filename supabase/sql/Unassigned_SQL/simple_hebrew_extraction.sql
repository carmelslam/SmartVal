-- SIMPLE HEBREW EXTRACTION WITHOUT COMPLEX REGEX
-- Simplified version to avoid SQL syntax issues

-- ============================================================================
-- 1. SIMPLE PART FAMILY EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_simple_part_family(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Convert to lowercase for comparison
    desc_text := lower(desc_text);
    
    -- Hebrew lighting terms
    IF position('פנס' in desc_text) > 0 OR position('light' in desc_text) > 0 THEN
        RETURN 'lighting';
    END IF;
    
    -- Hebrew body parts
    IF position('כנף' in desc_text) > 0 OR position('wing' in desc_text) > 0 OR position('panel' in desc_text) > 0 THEN
        RETURN 'body';
    END IF;
    
    -- Hebrew bumpers
    IF position('פגוש' in desc_text) > 0 OR position('bumper' in desc_text) > 0 THEN
        RETURN 'bumper';
    END IF;
    
    -- Hebrew mirrors
    IF position('מראה' in desc_text) > 0 OR position('mirror' in desc_text) > 0 THEN
        RETURN 'mirror';
    END IF;
    
    -- Hebrew doors
    IF position('דלת' in desc_text) > 0 OR position('door' in desc_text) > 0 THEN
        RETURN 'door';
    END IF;
    
    -- Hebrew signals
    IF position('איתות' in desc_text) > 0 OR position('signal' in desc_text) > 0 THEN
        RETURN 'signal';
    END IF;
    
    RETURN 'general';
END;
$$;

-- ============================================================================
-- 2. SIMPLE SIDE EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_simple_side(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    desc_text := lower(desc_text);
    
    -- Hebrew left side
    IF position('שמאל' in desc_text) > 0 OR position('left' in desc_text) > 0 THEN
        RETURN 'שמאל';
    END IF;
    
    -- Hebrew right side
    IF position('ימין' in desc_text) > 0 OR position('right' in desc_text) > 0 THEN
        RETURN 'ימין';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 3. SIMPLE POSITION EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_simple_position(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    desc_text := lower(desc_text);
    
    -- Hebrew front position
    IF position('קדמי' in desc_text) > 0 OR position('front' in desc_text) > 0 THEN
        RETURN 'קדמי';
    END IF;
    
    -- Hebrew rear position
    IF position('אחורי' in desc_text) > 0 OR position('rear' in desc_text) > 0 THEN
        RETURN 'אחורי';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 4. SIMPLE YEAR EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_simple_years(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Look for pattern like "016-018"
    SELECT substring(desc_text from '\d{3}-\d{3}') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || substring(year_match from 1 for 2) || '-20' || substring(year_match from 5 for 2);
    END IF;
    
    -- Look for pattern like "08-10"
    SELECT substring(desc_text from '\d{2}-\d{2}') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || year_match;
    END IF;
    
    -- Look for single year like "T5 08"
    SELECT substring(desc_text from 'T\d+ (\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || year_match;
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 5. SIMPLE MAKE EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_simple_make(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    desc_text := lower(desc_text);
    
    -- Check for known makes
    IF position('טויוטה' in desc_text) > 0 OR position('toyota' in desc_text) > 0 THEN
        RETURN 'Toyota';
    END IF;
    
    IF position('פולקסווגן' in desc_text) > 0 OR position('volkswagen' in desc_text) > 0 OR position('vw' in desc_text) > 0 THEN
        RETURN 'Volkswagen';
    END IF;
    
    IF position('אאודי' in desc_text) > 0 OR position('audi' in desc_text) > 0 THEN
        RETURN 'Audi';
    END IF;
    
    IF position('במוו' in desc_text) > 0 OR position('bmw' in desc_text) > 0 THEN
        RETURN 'BMW';
    END IF;
    
    IF position('מרצדס' in desc_text) > 0 OR position('mercedes' in desc_text) > 0 THEN
        RETURN 'Mercedes-Benz';
    END IF;
    
    IF position('פורד' in desc_text) > 0 OR position('ford' in desc_text) > 0 THEN
        RETURN 'Ford';
    END IF;
    
    IF position('רנו' in desc_text) > 0 OR position('renault' in desc_text) > 0 THEN
        RETURN 'Renault';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 6. SIMPLE BATCH UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION run_simple_hebrew_extraction(batch_size INT DEFAULT 1000)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting simple Hebrew extraction for % items...', batch_size;
    
    UPDATE catalog_items SET
        part_family = extract_simple_part_family(cat_num_desc),
        side_position = extract_simple_side(cat_num_desc),
        front_rear = extract_simple_position(cat_num_desc),
        year_range = extract_simple_years(cat_num_desc),
        make = COALESCE(make, extract_simple_make(cat_num_desc))
    WHERE id IN (
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        AND cat_num_desc != ''
        AND part_family IS NULL
        ORDER BY id
        LIMIT batch_size
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    
    RAISE NOTICE 'Simple extraction complete! Updated % rows.', processed_count;
    
    RETURN format('Successfully processed %s items with simple Hebrew extraction', processed_count);
END;
$$;

-- ============================================================================
-- 7. TEST THE SIMPLE EXTRACTION
-- ============================================================================

-- Test with examples
SELECT 
    'פנס את שמאל T5 08' as original_text,
    extract_simple_part_family('פנס את שמאל T5 08') as part_family,
    extract_simple_side('פנס את שמאל T5 08') as side,
    extract_simple_position('פנס את שמאל T5 08') as position,
    extract_simple_years('פנס את שמאל T5 08') as years,
    extract_simple_make('פנס את שמאל T5 08') as make;

-- Run a small test batch
-- SELECT run_simple_hebrew_extraction(100);