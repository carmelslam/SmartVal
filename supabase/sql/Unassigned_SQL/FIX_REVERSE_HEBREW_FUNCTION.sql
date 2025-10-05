-- Fix reverse_hebrew() function to actually preserve spaces

DROP FUNCTION IF EXISTS reverse_hebrew(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION reverse_hebrew(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT := '';
    words TEXT[];
    reversed_words TEXT[];
    i INTEGER;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN 
        RETURN input_text; 
    END IF;
    
    -- Split by spaces
    words := string_to_array(input_text, ' ');
    
    -- Reverse each word that contains Hebrew
    FOR i IN 1..array_length(words, 1) LOOP
        -- If word contains Hebrew characters, reverse it
        IF words[i] ~ '[א-ת]' THEN
            reversed_words[i] := reverse(words[i]);
        ELSE
            -- Keep non-Hebrew words as-is (numbers, English, etc.)
            reversed_words[i] := words[i];
        END IF;
    END LOOP;
    
    -- Join back with spaces
    RETURN array_to_string(reversed_words, ' ');
END;
$$;

-- Test it
SELECT reverse_hebrew('פנס ראשי ימין 2015') as test1;
SELECT reverse_hebrew('גולף קדמי שמאל') as test2;
SELECT reverse_hebrew('A3 מגן קדמי') as test3;
