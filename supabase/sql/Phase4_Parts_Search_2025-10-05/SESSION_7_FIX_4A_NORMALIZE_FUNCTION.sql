-- ============================================================================
-- SESSION 7 - FIX 4A: Create Normalization Function ONLY
-- Date: 2025-10-05
-- Purpose: Create helper function to normalize search terms
-- ============================================================================

-- This function converts UI full words to regex patterns matching database abbreviations
-- Example: "שמאל" → "(שמ'|שמאל|שמאלית)"

CREATE OR REPLACE FUNCTION normalize_search_term(term TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := term;
    
    -- שמאל variations (12,134 records have שמ', only 634 have שמאל)
    normalized := regexp_replace(normalized, 'שמאל(ית)?', '(שמ''|שמאל|שמאלית)', 'gi');
    normalized := regexp_replace(normalized, 'צד\s+שמאל', '(צד שמאל|שמ'')', 'gi');
    
    -- ימין variations (11,998 records have ימ', only 870 have ימין)
    normalized := regexp_replace(normalized, 'ימין(ית)?', '(ימ''|ימין|ימנית)', 'gi');
    normalized := regexp_replace(normalized, 'צד\s+ימין', '(צד ימין|ימ'')', 'gi');
    
    -- אחורי variations (9,392 records have אח', only 693 have אחורי)
    normalized := regexp_replace(normalized, 'אחורי(ת)?', '(אח''|אחורי|אחורית)', 'gi');
    
    -- קדמי variations
    normalized := regexp_replace(normalized, 'קדמי(ת)?', '(קד''|קדמי|קדמית)', 'gi');
    
    -- תחתון variations
    normalized := regexp_replace(normalized, 'תחתון(ה)?', '(תח''|תחתון|תחתונה)', 'gi');
    
    -- עליון variations
    normalized := regexp_replace(normalized, 'עליון(ה)?', '(על''|עליון|עליונה)', 'gi');
    
    RETURN normalized;
END;
$$;

-- Test it
SELECT 
    'Test 1: Full phrase' as test,
    normalize_search_term('כנף אחורית צד שמאל') as result;

SELECT 
    'Test 2: Another example' as test,
    normalize_search_term('פנס קדמי ימין') as result;
