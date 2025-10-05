-- FIX ENGLISH TEXT REVERSAL IN TRIGGER
-- Problem: "ADVENTURE" becomes "ERUTNEVDA" (reversed letter by letter)
-- Solution: Only reverse Hebrew words, preserve English/Latin text

-- Drop existing function first
DROP FUNCTION IF EXISTS reverse_hebrew(TEXT) CASCADE;

-- Updated reverse_hebrew function that preserves English
CREATE OR REPLACE FUNCTION reverse_hebrew(text_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    words TEXT[];
    word TEXT;
    reversed_words TEXT[] := ARRAY[]::TEXT[];
    result TEXT := '';
BEGIN
    IF text_input IS NULL OR text_input = '' THEN
        RETURN text_input;
    END IF;
    
    -- Split by space
    words := string_to_array(text_input, ' ');
    
    -- Process each word
    FOREACH word IN ARRAY words LOOP
        -- Only reverse if word contains Hebrew characters
        IF word ~ '[א-ת]' THEN
            -- Reverse the Hebrew word
            reversed_words := array_append(reversed_words, reverse(word));
        ELSE
            -- Keep English/Latin/numbers as-is
            reversed_words := array_append(reversed_words, word);
        END IF;
    END LOOP;
    
    -- Reverse word order and join
    result := array_to_string(ARRAY(SELECT unnest(reversed_words) ORDER BY generate_subscripts(reversed_words, 1) DESC), ' ');
    
    RETURN result;
END;
$$;

-- Test the fixed function
SELECT 'Test 1: Hebrew only' as test;
SELECT reverse_hebrew('תילאמש תירוחא ףנכ') as result;
-- Expected: כנף אחורית שמאלית

SELECT 'Test 2: Hebrew + English' as test;
SELECT reverse_hebrew('ADVENTURE סורק הלורוק - תילאמש תירוחא ףנכ') as result;
-- Expected: כנף אחורית שמאלית - קורולה קרוס ADVENTURE

SELECT 'Test 3: Mixed Hebrew and numbers' as test;
SELECT reverse_hebrew('810-610 הלורוק') as result;
-- Expected: קורולה 610-810
