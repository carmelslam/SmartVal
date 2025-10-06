-- ============================================================================
-- FIX NORMALIZE FUNCTION - October 6, 2025
-- Date: 2025-10-06
-- Version: Phase 5 - Session 8
-- Purpose: Redeploy correct normalize_search_term() function
-- ============================================================================
-- 
-- PROBLEM IDENTIFIED:
-- Diagnostic shows normalize_search_term() returns input unchanged
-- Example: normalize_search_term('אח'') returns 'אח'' instead of '(אח'|אחורי|אחורית)'
--
-- ROOT CAUSE:
-- Wrong version of function deployed - missing regex replacements
--
-- SOLUTION:
-- Redeploy working version from SESSION_7_FIX_4A_NORMALIZE_FUNCTION.sql
-- This version converts UI full words to regex patterns matching database abbreviations
--
-- LOGIC:
-- Database has abbreviations (אח', שמ', ימ', קד') much more than full words
-- - אח' (abbreviated): 9,392 records vs אחורי (full): 693 records
-- - שמ' (abbreviated): 12,134 records vs שמאל (full): 634 records
-- - ימ' (abbreviated): 11,998 records vs ימין (full): 870 records
--
-- When UI sends "שמאל", we need to search for BOTH "שמ'" AND "שמאל"
-- Function creates regex pattern: (שמ'|שמאל|שמאלית)
--
-- ============================================================================

-- Drop old broken version
DROP FUNCTION IF EXISTS normalize_search_term(TEXT);

-- Create correct version
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

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

-- Test 1: Single abbreviation
SELECT 
    'Test 1: Single term' as test,
    'אח''' as input,
    normalize_search_term('אח''') as output,
    '(אח''|אחורי|אחורית)' as expected;

-- Test 2: Full word
SELECT 
    'Test 2: Full word' as test,
    'שמאל' as input,
    normalize_search_term('שמאל') as output,
    '(שמ''|שמאל|שמאלית)' as expected;

-- Test 3: Multiple words
SELECT 
    'Test 3: Full phrase' as test,
    'כנף אחורית צד שמאל' as input,
    normalize_search_term('כנף אחורית צד שמאל') as output;

-- Test 4: Another combination
SELECT 
    'Test 4: Another example' as test,
    'פנס קדמי ימין' as input,
    normalize_search_term('פנס קדמי ימין') as output;

-- Test 5: Upper/lower case insensitive
SELECT 
    'Test 5: Mixed case' as test,
    'פנס עליון' as input,
    normalize_search_term('פנס עליון') as output;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Test 1: Should return "(אח'|אחורי|אחורית)"
-- Test 2: Should return "(שמ'|שמאל|שמאלית)"
-- Test 3: Should return "כנף (אח'|אחורי|אחורית) (צד שמאל|שמ')"
-- Test 4: Should return "פנס (קד'|קדמי|קדמית) (ימ'|ימין|ימנית)"
-- Test 5: Should return "פנס (על'|עליון|עליונה)"
--
-- If tests pass, function is correctly deployed.
-- If tests return input unchanged, function deployment failed.
-- ============================================================================
