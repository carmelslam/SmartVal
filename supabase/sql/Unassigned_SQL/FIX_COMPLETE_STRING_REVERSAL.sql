-- Fix COMPLETE string reversal (word order backwards)
-- The source file has ENTIRE strings reversed, not just Hebrew characters

DROP FUNCTION IF EXISTS reverse_hebrew(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION reverse_hebrew(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN 
        RETURN input_text; 
    END IF;
    
    -- Simply reverse the ENTIRE string (this fixes word order)
    -- Hebrew words are already correct in source, just backwards order
    RETURN reverse(input_text);
END;
$$;

-- Test with actual data patterns
SELECT reverse_hebrew('פתוח T5 08 - שמ'' אח'' פנס') as test1; -- Should become: "פנס אח' שמ' - 08 T5 פתוח"
SELECT reverse_hebrew('ןגווסקלופ') as test2; -- Should become: "פולקסווגן"
SELECT reverse_hebrew('יפילח') as test3; -- Should become: "חליפי"
