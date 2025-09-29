-- IMPROVED HEBREW EXTRACTION FOR M-PINES CATALOG
-- Based on actual catalog patterns seen in screenshot
-- Handles Hebrew text with special characters and mixed encoding

-- ============================================================================
-- 1. IMPROVED HEBREW-AWARE PART FAMILY EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_hebrew_part_family(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    part_result TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Clean the text first (remove extra spaces, normalize)
    desc_text := regexp_replace(desc_text, '\s+', ' ', 'g');
    desc_text := trim(desc_text);
    
    -- Hebrew lighting terms (פנסים / תאורה)
    IF desc_text ~* 'פנס|אור|תאורה|light' THEN
        RETURN 'lighting';
    END IF;
    
    -- Hebrew body parts (כנפים / פנלים)
    IF desc_text ~* 'כנף|פנל|wing|panel' THEN
        RETURN 'body';
    END IF;
    
    -- Hebrew bumpers (פגושים)
    IF desc_text ~* 'פגוש|bumper' THEN
        RETURN 'bumper';
    END IF;
    
    -- Hebrew mirrors (מראות)
    IF desc_text ~* 'מראה|mirror' THEN
        RETURN 'mirror';
    END IF;
    
    -- Hebrew doors (דלתות)
    IF desc_text ~* 'דלת|door' THEN
        RETURN 'door';
    END IF;
    
    -- Hebrew glass (זכוכית)
    IF desc_text ~* 'זכוכית|glass|חלון|window' THEN
        RETURN 'glass';
    END IF;
    
    -- Hebrew signals/indicators (איתות)
    IF desc_text ~* 'איתות|signal|indicator|turn' THEN
        RETURN 'signal';
    END IF;
    
    -- Hebrew high beam (גבוה)
    IF desc_text ~* 'גבוה|high.*beam|beam.*high' THEN
        RETURN 'high_beam';
    END IF;
    
    -- Default to general if no specific match
    RETURN 'general';
END;
$$;

-- ============================================================================
-- 2. IMPROVED HEBREW SIDE EXTRACTION (שמאל/ימין)
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_hebrew_side(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Hebrew left side (שמאל)
    IF desc_text ~* 'שמאל|ש''מ|left|L\.H\.|LH' THEN
        RETURN 'שמאל';
    END IF;
    
    -- Hebrew right side (ימין)  
    IF desc_text ~* 'ימין|י''מ|right|R\.H\.|RH' THEN
        RETURN 'ימין';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 3. IMPROVED HEBREW POSITION EXTRACTION (קדמי/אחורי)
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_hebrew_position(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Hebrew front position (קדמי)
    IF desc_text ~* 'קדמי|קד''מ|front|F\.H\.|FH|FRONT' THEN
        RETURN 'קדמי';
    END IF;
    
    -- Hebrew rear position (אחורי)
    IF desc_text ~* 'אחורי|אח''ר|rear|R\.H\.|RH|REAR' THEN
        RETURN 'אחורי';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 4. IMPROVED YEAR RANGE EXTRACTION FOR HEBREW CATALOGS
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_hebrew_years(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    year_match TEXT[];
    year_result TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Pattern like "016-018" (2016-2018)
    SELECT regexp_match(desc_text, '(\d{3})-(\d{3})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || year_match[1] || '-20' || year_match[2];
    END IF;
    
    -- Pattern like "08-10" (2008-2010)
    SELECT regexp_match(desc_text, '(\d{2})-(\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || year_match[1] || '-20' || year_match[2];
    END IF;
    
    -- Pattern like "T5 08" (2008)
    SELECT regexp_match(desc_text, 'T\d+\s+(\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || year_match[1];
    END IF;
    
    -- Pattern like "C5 11" (2011)
    SELECT regexp_match(desc_text, '[A-Z]\d+\s+(\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN '20' || year_match[1];
    END IF;
    
    -- Single 4-digit year
    SELECT regexp_match(desc_text, '(20\d{2})') INTO year_match;
    IF year_match IS NOT NULL THEN
        RETURN year_match[1];
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 5. IMPROVED OEM EXTRACTION FOR M-PINES FORMAT
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_hebrew_oem(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    oem_result TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Look for patterns like "8E0945095CG" (typical VW/Audi OEM)
    SELECT (regexp_match(desc_text, '([A-Z0-9]{10,15})'))[1] INTO oem_result;
    IF oem_result IS NOT NULL AND oem_result ~ '^[A-Z]' THEN
        RETURN oem_result;
    END IF;
    
    -- Look for patterns with generation codes like "8E", "4F", etc.
    SELECT (regexp_match(desc_text, '((?:8E|4F|8K|8J|8P|8V|1K|5K|3C|7L|7P|4B|4D|8D|8H)[A-Z0-9]+)'))[1] INTO oem_result;
    IF oem_result IS NOT NULL THEN
        RETURN UPPER(oem_result);
    END IF;
    
    -- Generic alphanumeric pattern (8+ characters)
    SELECT (regexp_match(desc_text, '([A-Z0-9]{8,})'))[1] INTO oem_result;
    IF oem_result IS NOT NULL THEN
        RETURN UPPER(oem_result);
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 6. IMPROVED VEHICLE MAKE EXTRACTION (HEBREW AWARE)
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_hebrew_make(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Check against known makes (Hebrew and English)
    IF desc_text ~* 'פולקסווגן|פולקס|וולקסווגן|volkswagen|vw' THEN
        RETURN 'Volkswagen';
    END IF;
    
    IF desc_text ~* 'אאודי|אודי|audi' THEN
        RETURN 'Audi';
    END IF;
    
    IF desc_text ~* 'ב\.מ\.וו|במוו|ביאמוו|bmw' THEN
        RETURN 'BMW';
    END IF;
    
    IF desc_text ~* 'מרצדס|בנץ|mercedes' THEN
        RETURN 'Mercedes-Benz';
    END IF;
    
    IF desc_text ~* 'טויוטה|toyota' THEN
        RETURN 'Toyota';
    END IF;
    
    IF desc_text ~* 'פורד|ford' THEN
        RETURN 'Ford';
    END IF;
    
    IF desc_text ~* 'רנו|רנאו|renault' THEN
        RETURN 'Renault';
    END IF;
    
    IF desc_text ~* 'פיז''ו|פז''ו|peugeot' THEN
        RETURN 'Peugeot';
    END IF;
    
    IF desc_text ~* 'סיטרואן|citroen' THEN
        RETURN 'Citroen';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 7. BATCH UPDATE FUNCTION FOR IMPROVED EXTRACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION run_improved_hebrew_extraction(batch_size INT DEFAULT 1000)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
    total_updated INT := 0;
BEGIN
    RAISE NOTICE 'Starting improved Hebrew extraction for % items...', batch_size;
    
    -- Update batch with improved functions
    UPDATE catalog_items SET
        part_family = extract_hebrew_part_family(cat_num_desc),
        side_position = extract_hebrew_side(cat_num_desc),
        front_rear = extract_hebrew_position(cat_num_desc),
        year_range = extract_hebrew_years(cat_num_desc),
        oem = COALESCE(oem, extract_hebrew_oem(cat_num_desc)),
        make = COALESCE(make, extract_hebrew_make(cat_num_desc))
    WHERE id IN (
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        AND cat_num_desc != ''
        ORDER BY id
        LIMIT batch_size
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    total_updated := total_updated + processed_count;
    
    RAISE NOTICE 'Improved extraction complete! Updated % rows with Hebrew-aware patterns.', processed_count;
    
    RETURN format('Successfully processed %s items with improved Hebrew extraction', total_updated);
END;
$$;

-- ============================================================================
-- 8. TEST THE IMPROVED EXTRACTION
-- ============================================================================

-- Test with your specific example
SELECT 
    '016- וקוריש - מי חא ךמות' as original_text,
    extract_hebrew_part_family('016- וקוריש - מי חא ךמות') as part_family,
    extract_hebrew_side('016- וקוריש - מי חא ךמות') as side,
    extract_hebrew_position('016- וקוריש - מי חא ךמות') as position,
    extract_hebrew_years('016- וקוריש - מי חא ךמות') as years,
    extract_hebrew_oem('016- וקוריש - מי חא ךמות') as oem;

-- Test with examples from your screenshot
SELECT 
    'פנס את שמאל T5 08' as original_text,
    extract_hebrew_part_family('פנס את שמאל T5 08') as part_family,
    extract_hebrew_side('פנס את שמאל T5 08') as side,
    extract_hebrew_position('פנס את שמאל T5 08') as position,
    extract_hebrew_years('פנס את שמאל T5 08') as years;

-- Run the improved extraction
-- SELECT run_improved_hebrew_extraction(100);