-- SESSION 12: Add data_source tracking and drop legacy search_results table
-- Date: October 7, 2025
-- Purpose: 
--   1. Add data_source column to parts_search_sessions (WHERE user is searching)
--   2. Add data_source column to parts_search_results (WHERE data came from)
--   3. Drop legacy search_results table
-- 
-- IMPORTANT: 
-- - search_type = HOW user searched (simple_search, advanced_search, smart_search)
-- - data_source = WHERE data comes from (catalog, web, other)

-- STEP 1: Add data_source to parts_search_sessions
-- Tracks WHERE the user intended to search
ALTER TABLE public.parts_search_sessions
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'catalog',
  ADD CONSTRAINT parts_search_sessions_data_source_check 
    CHECK (data_source IN ('catalog', 'web', 'other'));

-- STEP 2: Add data_source to parts_search_results
-- Tracks WHERE the results actually came from
ALTER TABLE public.parts_search_results
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'catalog',
  ADD CONSTRAINT parts_search_results_data_source_check 
    CHECK (data_source IN ('catalog', 'web', 'other'));

-- STEP 3: Drop the legacy search_results table
DROP TABLE IF EXISTS public.search_results CASCADE;

-- Verification:
-- ✅ parts_search_sessions.data_source = where user searched ('catalog', 'web', 'other')
-- ✅ parts_search_results.data_source = where data came from ('catalog', 'web', 'other')
-- ✅ Legacy search_results table removed
-- ✅ Current system tables intact

-- Expected result: 
-- - Both tables now track data source
-- - Legacy table removed, no impact on current system
-- - Default 'catalog' for existing records
