-- SESSION 9 - DIAGNOSTIC: Check Tables State
-- Date: 2025-10-06
-- Purpose: Verify parts_search_sessions, parts_search_results, and selected_parts tables exist
-- Agent: Claude Session 9

-- ============================================================================
-- CHECK 1: Verify parts_search_sessions table
-- ============================================================================
SELECT 
  'parts_search_sessions' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'parts_search_sessions'
  ) as exists,
  (
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'parts_search_sessions'
  ) as columns;

-- ============================================================================
-- CHECK 2: Verify parts_search_results table
-- ============================================================================
SELECT 
  'parts_search_results' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'parts_search_results'
  ) as exists,
  (
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'parts_search_results'
  ) as columns;

-- ============================================================================
-- CHECK 3: Verify selected_parts table
-- ============================================================================
SELECT 
  'selected_parts' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'selected_parts'
  ) as exists,
  (
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'selected_parts'
  ) as columns;

-- ============================================================================
-- CHECK 4: Count records in each table
-- ============================================================================
DO $$
DECLARE
  sessions_count INT;
  results_count INT;
  selected_count INT;
BEGIN
  SELECT COUNT(*) INTO sessions_count FROM parts_search_sessions;
  SELECT COUNT(*) INTO results_count FROM parts_search_results;
  SELECT COUNT(*) INTO selected_count FROM selected_parts;
  
  RAISE NOTICE '📊 Table Record Counts:';
  RAISE NOTICE '  - parts_search_sessions: %', sessions_count;
  RAISE NOTICE '  - parts_search_results: %', results_count;
  RAISE NOTICE '  - selected_parts: %', selected_count;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '❌ One or more tables do not exist!';
END $$;
