-- ============================================================================
-- FIX HEBREW REVERSAL - FINAL VERSION (Safe to run after trigger fix)
-- Date: 2025-10-05
-- Problem: ~50% of records have reversed Hebrew text (11,590 out of 48,276)
-- Solution: Smart reversal that preserves English, numbers, and special chars
-- ============================================================================

SELECT '=== FIXING HEBREW REVERSAL - START ===' as section;

-- ============================================================================
-- STEP 1: CREATE SMART HEBREW REVERSAL FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS reverse_hebrew_smart(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION reverse_hebrew_smart(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result TEXT := '';
    current_chunk TEXT := '';
    current_char TEXT;
    is_hebrew BOOLEAN := FALSE;
    prev_was_hebrew BOOLEAN := FALSE;
    chunks TEXT[] := ARRAY[]::TEXT[];
    chunk_types BOOLEAN[] := ARRAY[]::BOOLEAN[];
    i INTEGER;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    FOR i IN 1..length(input_text) LOOP
        current_char := substring(input_text from i for 1);
        is_hebrew := current_char ~ '[\u0590-\u05FF]';
        
        IF i > 1 AND is_hebrew != prev_was_hebrew THEN
            chunks := array_append(chunks, current_chunk);
            chunk_types := array_append(chunk_types, prev_was_hebrew);
            current_chunk := current_char;
        ELSE
            current_chunk := current_chunk || current_char;
        END IF;
        
        prev_was_hebrew := is_hebrew;
    END LOOP;
    
    IF current_chunk != '' THEN
        chunks := array_append(chunks, current_chunk);
        chunk_types := array_append(chunk_types, prev_was_hebrew);
    END IF;
    
    FOR i IN 1..array_length(chunks, 1) LOOP
        IF chunk_types[i] = TRUE THEN
            result := result || reverse(chunks[i]);
        ELSE
            result := result || chunks[i];
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- ============================================================================
-- STEP 2: CREATE DETECTION FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS is_hebrew_reversed(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION is_hebrew_reversed(input_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN FALSE;
    END IF;
    
    RETURN (
        input_text LIKE '%ןגמ%' OR input_text LIKE '%תלד%' OR 
        input_text LIKE '%סנפ%' OR input_text LIKE '%ףנכ%' OR 
        input_text LIKE '%הארמ%' OR input_text LIKE '%הלורוק%' OR 
        input_text LIKE '%ךמות%' OR input_text LIKE '%לירג%' OR 
        input_text LIKE '%הסכמ%' OR input_text LIKE '%ריצ%' OR
        input_text LIKE '%תידי%'
    );
END;
$$;

-- ============================================================================
-- STEP 3: COUNT REVERSED RECORDS BEFORE FIX
-- ============================================================================

SELECT 'Before fix - Hebrew status:' as info;

SELECT 
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as reversed_count,
    COUNT(CASE WHEN cat_num_desc ~ '[\u0590-\u05FF]' THEN 1 END) as has_hebrew,
    COUNT(*) as total_records
FROM catalog_items;

-- ============================================================================
-- STEP 4: FIX REVERSED cat_num_desc
-- ============================================================================

SELECT 'Fixing reversed cat_num_desc...' as step;

UPDATE catalog_items
SET cat_num_desc = reverse_hebrew_smart(cat_num_desc)
WHERE is_hebrew_reversed(cat_num_desc) = TRUE
  AND cat_num_desc IS NOT NULL;

-- ============================================================================
-- STEP 5: FIX REVERSED makes
-- ============================================================================

SELECT 'Fixing reversed makes...' as step;

UPDATE catalog_items
SET make = CASE
    WHEN make = 'הטויוט' THEN 'טויוטה'
    WHEN make = 'ינימ / וו.מ.ב' THEN 'ב.מ.וו / מיני'
    WHEN make = 'יאדנוי' THEN 'יונדאי'
    WHEN make = 'הדזמ' THEN 'מזדה'
    WHEN make = 'היק' THEN 'קיה'
    WHEN make = 'ישיבוצימ' THEN 'מיצובישי'
    WHEN make = 'הדנוה' THEN 'הונדה'
    WHEN make = 'הדוקס' THEN 'סקודה'
    WHEN make = 'תוזיפ' THEN 'פיזו'
    WHEN make = 'ןגווסקלופ' THEN 'פולקסווגן'
    WHEN make = 'סדצרמ זנב' THEN 'בנץ מרצדס'
    WHEN make = 'דרופ' THEN 'פורד'
    WHEN is_hebrew_reversed(make) THEN reverse_hebrew_smart(make)
    ELSE make
END
WHERE make IS NOT NULL
  AND is_hebrew_reversed(make) = TRUE;

-- ============================================================================
-- STEP 6: FIX REVERSED models
-- ============================================================================

SELECT 'Fixing reversed models...' as step;

UPDATE catalog_items
SET model = CASE
    WHEN model = 'הלורוק' THEN 'קורולה'
    WHEN model = 'ירמאק' THEN 'קאמרי'
    WHEN model = 'סורק הלורוק' THEN 'קורולה קרוס'
    WHEN model = 'ףלוג' THEN 'גולף'
    WHEN model = 'ולופ' THEN 'פולו'
    WHEN model = 'ןאוגיט' THEN 'טיגואן'
    WHEN is_hebrew_reversed(model) THEN reverse_hebrew_smart(model)
    ELSE model
END
WHERE model IS NOT NULL
  AND is_hebrew_reversed(model) = TRUE;

-- ============================================================================
-- STEP 7: FIX REVERSED part_family
-- ============================================================================

SELECT 'Fixing reversed part_family...' as step;

UPDATE catalog_items
SET part_family = CASE
    WHEN part_family = 'הרואתו םיסנפ' THEN 'פנסים ותאורה'
    WHEN part_family = 'םייפנכו תותלד' THEN 'דלתות וכנפיים'
    WHEN part_family = 'םישוגפו םינגמ' THEN 'מגנים ופגושים'
    WHEN part_family = 'בכרמ יקלח' THEN 'חלקי מרכב'
    WHEN part_family = 'תוארמו תונולח' THEN 'חלונות ומראות'
    WHEN is_hebrew_reversed(part_family) THEN reverse_hebrew_smart(part_family)
    ELSE part_family
END
WHERE part_family IS NOT NULL
  AND is_hebrew_reversed(part_family) = TRUE;

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

SELECT '=== VERIFICATION ===' as section;

SELECT 
    'After fix - Hebrew status:' as info,
    COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) as still_reversed,
    COUNT(CASE WHEN cat_num_desc ~ '[\u0590-\u05FF]' THEN 1 END) as has_hebrew,
    COUNT(*) as total_records,
    CASE 
        WHEN COUNT(CASE WHEN is_hebrew_reversed(cat_num_desc) THEN 1 END) = 0 THEN '✅ ALL FIXED'
        ELSE '⚠️ SOME STILL REVERSED'
    END as status
FROM catalog_items;

-- Sample of fixed records
SELECT 
    'Sample of FIXED records:' as info,
    cat_num_desc,
    make,
    model,
    part_family
FROM catalog_items
WHERE cat_num_desc ~ '[\u0590-\u05FF]'
LIMIT 10;

-- Test search with corrected Hebrew
SELECT 
    'Search Test After Hebrew Fix:' as test_name,
    cat_num_desc,
    make,
    model
FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה',
    free_query_param := 'מגן'
)
LIMIT 5;

SELECT '=== HEBREW REVERSAL FIX COMPLETE ===' as section;
