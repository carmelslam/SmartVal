-- SESSION 29 - ADD FILING CASE ID TO CASE_HELPER TABLE
-- Date: 2025-10-14
-- Purpose: Add filing_case_id column to case_helper to store YC-PLATE-YEAR identifier
-- Agent: Claude Session 29

-- ============================================================================
-- ADD FILING_CASE_ID AND PLATE COLUMNS TO CASE_HELPER
-- ============================================================================

-- Add filing_case_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_helper' 
    AND column_name = 'filing_case_id'
  ) THEN
    ALTER TABLE public.case_helper 
    ADD COLUMN filing_case_id TEXT;
    
    RAISE NOTICE '✅ Added filing_case_id column to case_helper table';
  ELSE
    RAISE NOTICE 'ℹ️ filing_case_id column already exists in case_helper table';
  END IF;
END $$;

-- Add plate column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_helper' 
    AND column_name = 'plate'
  ) THEN
    ALTER TABLE public.case_helper 
    ADD COLUMN plate TEXT;
    
    RAISE NOTICE '✅ Added plate column to case_helper table';
  ELSE
    RAISE NOTICE 'ℹ️ plate column already exists in case_helper table';
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_case_helper_filing_case_id 
ON public.case_helper(filing_case_id) 
WHERE filing_case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_helper_plate 
ON public.case_helper(plate) 
WHERE plate IS NOT NULL;

-- ============================================================================
-- POPULATE EXISTING ROWS (Extract from helper_json if present)
-- ============================================================================

-- Update existing rows to extract filing_case_id from helper_json->meta->case_id
UPDATE public.case_helper
SET filing_case_id = helper_json->'meta'->>'case_id'
WHERE filing_case_id IS NULL 
  AND helper_json->'meta'->>'case_id' IS NOT NULL
  AND helper_json->'meta'->>'case_id' ~ '^YC-[0-9]+-[0-9]+$'; -- Match YC-PLATE-YEAR pattern

-- Update existing rows to extract plate from helper_json->meta->plate
UPDATE public.case_helper
SET plate = helper_json->'meta'->>'plate'
WHERE plate IS NULL 
  AND helper_json->'meta'->>'plate' IS NOT NULL;

-- ============================================================================
-- CREATE TRIGGER TO AUTO-POPULATE FILING_CASE_ID AND PLATE
-- ============================================================================

-- Function to extract filing_case_id and plate from helper_json on insert/update
CREATE OR REPLACE FUNCTION extract_helper_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- If filing_case_id is not set but exists in helper_json
  IF NEW.filing_case_id IS NULL AND NEW.helper_json->'meta'->>'case_id' IS NOT NULL THEN
    NEW.filing_case_id := NEW.helper_json->'meta'->>'case_id';
  END IF;
  
  -- If plate is not set but exists in helper_json
  IF NEW.plate IS NULL AND NEW.helper_json->'meta'->>'plate' IS NOT NULL THEN
    NEW.plate := NEW.helper_json->'meta'->>'plate';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_extract_filing_case_id ON public.case_helper;

-- Create new trigger
DROP TRIGGER IF EXISTS trigger_extract_helper_metadata ON public.case_helper;

CREATE TRIGGER trigger_extract_helper_metadata
  BEFORE INSERT OR UPDATE ON public.case_helper
  FOR EACH ROW
  EXECUTE FUNCTION extract_helper_metadata();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  index_exists BOOLEAN;
  trigger_exists BOOLEAN;
  populated_count INT;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_helper' 
    AND column_name = 'filing_case_id'
  ) INTO column_exists;
  
  -- Check if index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'case_helper' 
    AND indexname = 'idx_case_helper_filing_case_id'
  ) INTO index_exists;
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_extract_filing_case_id'
  ) INTO trigger_exists;
  
  -- Count populated rows
  SELECT COUNT(*) INTO populated_count
  FROM public.case_helper
  WHERE filing_case_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 29 - CASE_HELPER ENHANCEMENT VERIFICATION';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'filing_case_id column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Index created: %', CASE WHEN index_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Auto-extract trigger: %', CASE WHEN trigger_exists THEN '✅ ACTIVE' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Rows with filing_case_id: % rows', populated_count;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Purpose: Store YC-PLATE-YEAR identifier alongside UUID';
  RAISE NOTICE '🔄 Auto-population: Trigger extracts from helper_json on insert/update';
  RAISE NOTICE '';
  RAISE NOTICE '✅ case_helper table enhanced!';
END $$;

-- ============================================================================
-- OPTIONAL: View sample data
-- ============================================================================

-- Uncomment to see sample rows with filing_case_id
-- SELECT 
--   id,
--   case_id,
--   filing_case_id,
--   helper_name,
--   is_current,
--   updated_at
-- FROM public.case_helper
-- WHERE filing_case_id IS NOT NULL
-- ORDER BY updated_at DESC
-- LIMIT 5;
