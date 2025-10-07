-- SESSION 12: Add data_source tracking and drop legacy search_results table
-- Date: October 7, 2025
-- Purpose: 
--   1. Add data_source column to parts_search_sessions (WHERE user is searching)
--   2. Add data_source column to parts_search_results (WHERE data came from)
--   3. Add data_source column to selected_parts (WHERE selected part came from)
--   4. Drop legacy search_results table
-- 
-- IMPORTANT: 
-- - search_type = HOW user searched (simple_search, advanced_search, smart_search)
-- - data_source = WHERE data comes from (Hebrew labels)
-- 
-- Data Source Values (Hebrew):
-- - 'קטלוג' = Catalog (Supabase catalog_items)
-- - 'אינטרנט' = Web (Make.com external API)
-- - 'אחר' = Other (OCR, manual entry, etc.)

-- STEP 1: Add data_source to parts_search_sessions
-- Tracks WHERE the user intended to search
DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts_search_sessions' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.parts_search_sessions ADD COLUMN data_source TEXT DEFAULT 'קטלוג';
  END IF;
  
  -- Drop constraint if it exists (to recreate with correct values)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parts_search_sessions_data_source_check'
  ) THEN
    ALTER TABLE public.parts_search_sessions DROP CONSTRAINT parts_search_sessions_data_source_check;
  END IF;
  
  -- Add constraint
  ALTER TABLE public.parts_search_sessions 
    ADD CONSTRAINT parts_search_sessions_data_source_check 
    CHECK (data_source IN ('קטלוג', 'אינטרנט', 'אחר'));
END $$;

-- STEP 2: Add data_source to parts_search_results
-- Tracks WHERE the results actually came from
DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts_search_results' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.parts_search_results ADD COLUMN data_source TEXT DEFAULT 'קטלוג';
  END IF;
  
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parts_search_results_data_source_check'
  ) THEN
    ALTER TABLE public.parts_search_results DROP CONSTRAINT parts_search_results_data_source_check;
  END IF;
  
  -- Add constraint
  ALTER TABLE public.parts_search_results 
    ADD CONSTRAINT parts_search_results_data_source_check 
    CHECK (data_source IN ('קטלוג', 'אינטרנט', 'אחר'));
END $$;

-- STEP 3: Add data_source to selected_parts
-- Tracks WHERE the selected part originally came from
DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selected_parts' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.selected_parts ADD COLUMN data_source TEXT DEFAULT 'קטלוג';
  END IF;
  
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'selected_parts_data_source_check'
  ) THEN
    ALTER TABLE public.selected_parts DROP CONSTRAINT selected_parts_data_source_check;
  END IF;
  
  -- Add constraint
  ALTER TABLE public.selected_parts 
    ADD CONSTRAINT selected_parts_data_source_check 
    CHECK (data_source IN ('קטלוג', 'אינטרנט', 'אחר'));
END $$;

-- STEP 4: Drop the legacy search_results table
DROP TABLE IF EXISTS public.search_results CASCADE;

-- Verification:
-- ✅ parts_search_sessions.data_source = where user searched ('קטלוג', 'אינטרנט', 'אחר')
-- ✅ parts_search_results.data_source = where data came from ('קטלוג', 'אינטרנט', 'אחר')
-- ✅ selected_parts.data_source = where selected part came from ('קטלוג', 'אינטרנט', 'אחר')
-- ✅ Legacy search_results table removed
-- ✅ Current system tables intact

-- Expected result: 
-- - All three tables now track data source in Hebrew
-- - Legacy table removed, no impact on current system
-- - Default 'קטלוג' for existing records
