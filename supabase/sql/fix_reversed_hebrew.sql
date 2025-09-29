-- FIX REVERSED HEBREW TEXT IN CATALOG
-- The Hebrew text is stored backwards and needs to be corrected

-- ============================================================================
-- 1. CREATE HEBREW TEXT REVERSAL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_hebrew_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    result TEXT := '';
    char_code INT;
    current_char TEXT;
    i INT;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    -- Process each character
    FOR i IN 1..length(input_text) LOOP
        current_char := substring(input_text from i for 1);
        char_code := ascii(current_char);
        
        -- Check if character is Hebrew (Unicode range 1488-1514)
        -- In UTF-8, Hebrew characters are in specific ranges
        IF current_char ~ '[א-ת]' THEN
            -- Hebrew character - add to beginning (reverse)
            result := current_char || result;
        ELSE
            -- Non-Hebrew character (numbers, spaces, punctuation) - add to end
            result := result || current_char;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- ============================================================================
-- 2. CREATE SIMPLE HEBREW WORD REVERSAL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_hebrew_words(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    result TEXT;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    result := input_text;
    
    -- Fix common reversed Hebrew words
    result := replace(result, 'סנפ', 'פנס');        -- headlight
    result := replace(result, 'ףנכ', 'כנף');        -- wing  
    result := replace(result, 'תותיא', 'איתות');     -- signals
    result := replace(result, 'הארמ', 'מראה');       -- mirror
    result := replace(result, 'תלד', 'דלת');         -- door
    result := replace(result, 'שוגפ', 'פגוש');       -- bumper
    result := replace(result, 'לאמש', 'שמאל');       -- left
    result := replace(result, 'נימי', 'ימין');       -- right
    result := replace(result, 'ימדק', 'קדמי');       -- front
    result := replace(result, 'ירוחא', 'אחורי');     -- rear
    result := replace(result, 'הטויוט', 'טויוטה');   -- Toyota
    result := replace(result, 'חותפ', 'פתוח');       -- open
    result := replace(result, 'רוגס', 'סגור');       -- closed
    result := replace(result, 'םיאר', 'ראים');       -- mirrors
    result := replace(result, 'םיסנפ', 'פנסים');     -- headlights
    
    -- Fix abbreviated sides
    result := replace(result, '''מש', 'שמ''');       -- left abbreviation
    result := replace(result, '''מי', 'ים''');       -- right abbreviation
    result := replace(result, '''דק', 'קד''');       -- front abbreviation
    result := replace(result, '''חא', 'אח''');       -- rear abbreviation
    
    RETURN result;
END;
$$;

-- ============================================================================
-- 3. CREATE PART FAMILY EXTRACTION FROM CORRECTED TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_part_family_fixed(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    fixed_text TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Fix the reversed Hebrew first
    fixed_text := fix_hebrew_words(desc_text);
    fixed_text := lower(fixed_text);
    
    -- Now extract part families from corrected text
    IF position('פנס' in fixed_text) > 0 OR position('פנסים' in fixed_text) > 0 THEN
        RETURN 'פנסים';
    END IF;
    
    IF position('כנף' in fixed_text) > 0 THEN
        RETURN 'כנפים';
    END IF;
    
    IF position('איתות' in fixed_text) > 0 THEN
        RETURN 'איתות';
    END IF;
    
    IF position('מראה' in fixed_text) > 0 OR position('מראות' in fixed_text) > 0 THEN
        RETURN 'מראות';
    END IF;
    
    IF position('דלת' in fixed_text) > 0 OR position('דלתות' in fixed_text) > 0 THEN
        RETURN 'דלתות';
    END IF;
    
    IF position('פגוש' in fixed_text) > 0 OR position('פגושים' in fixed_text) > 0 THEN
        RETURN 'פגושים';
    END IF;
    
    RETURN 'כללי';
END;
$$;

-- ============================================================================
-- 4. CREATE SIDE EXTRACTION FROM CORRECTED TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_side_fixed(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    fixed_text TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    fixed_text := fix_hebrew_words(desc_text);
    fixed_text := lower(fixed_text);
    
    IF position('שמאל' in fixed_text) > 0 OR position('שמ''' in fixed_text) > 0 THEN
        RETURN 'שמאל';
    END IF;
    
    IF position('ימין' in fixed_text) > 0 OR position('ים''' in fixed_text) > 0 THEN
        RETURN 'ימין';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 5. CREATE POSITION EXTRACTION FROM CORRECTED TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_position_fixed(desc_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    fixed_text TEXT;
BEGIN
    IF desc_text IS NULL OR desc_text = '' THEN
        RETURN NULL;
    END IF;
    
    fixed_text := fix_hebrew_words(desc_text);
    fixed_text := lower(fixed_text);
    
    IF position('קדמי' in fixed_text) > 0 OR position('קד''' in fixed_text) > 0 THEN
        RETURN 'קדמי';
    END IF;
    
    IF position('אחורי' in fixed_text) > 0 OR position('אח''' in fixed_text) > 0 THEN
        RETURN 'אחורי';
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 6. TEST THE CORRECTION FUNCTIONS
-- ============================================================================

-- Test with your real data
SELECT 
    'חותפ T5 08 - ''מש ''חא סנפ' as original,
    fix_hebrew_words('חותפ T5 08 - ''מש ''חא סנפ') as fixed,
    extract_part_family_fixed('חותפ T5 08 - ''מש ''חא סנפ') as part_family,
    extract_side_fixed('חותפ T5 08 - ''מש ''חא סנפ') as side,
    extract_position_fixed('חותפ T5 08 - ''מש ''חא סנפ') as position;

-- Test with wing signal example
SELECT 
    '(F26) X4 ~ 016-018 ''מש ''דק ףנכב תותיא' as original,
    fix_hebrew_words('(F26) X4 ~ 016-018 ''מש ''דק ףנכב תותיא') as fixed,
    extract_part_family_fixed('(F26) X4 ~ 016-018 ''מש ''דק ףנכב תותיא') as part_family,
    extract_side_fixed('(F26) X4 ~ 016-018 ''מש ''דק ףנכב תותיא') as side,
    extract_position_fixed('(F26) X4 ~ 016-018 ''מש ''דק ףנכב תותיא') as position;

-- ============================================================================
-- 7. CREATE BATCH UPDATE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_hebrew_catalog_batch(batch_size INT DEFAULT 1000)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Fixing reversed Hebrew text for % items...', batch_size;
    
    UPDATE catalog_items SET
        part_family = extract_part_family_fixed(cat_num_desc),
        side_position = extract_side_fixed(cat_num_desc),
        front_rear = extract_position_fixed(cat_num_desc)
    WHERE id IN (
        SELECT id FROM catalog_items 
        WHERE cat_num_desc IS NOT NULL 
        AND cat_num_desc != ''
        ORDER BY id
        LIMIT batch_size
    );
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    
    RAISE NOTICE 'Hebrew correction complete! Updated % rows.', processed_count;
    
    RETURN format('Successfully processed %s items with Hebrew text correction', processed_count);
END;
$$;