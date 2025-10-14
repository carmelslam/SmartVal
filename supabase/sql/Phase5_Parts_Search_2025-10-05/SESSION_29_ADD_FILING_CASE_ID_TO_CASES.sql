-- SESSION 29 - ADD FILING CASE ID TO CASES TABLE
-- Date: 2025-10-14
-- Purpose: Add filing_case_id column to cases table to store YC-PLATE-YEAR identifier
-- Agent: Claude Session 29

-- ============================================================================
-- ADD FILING_CASE_ID COLUMN TO CASES
-- ============================================================================

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' 
    AND column_name = 'filing_case_id'
  ) THEN
    ALTER TABLE public.cases 
    ADD COLUMN filing_case_id TEXT UNIQUE;
    
    RAISE NOTICE '✅ Added filing_case_id column to cases table';
  ELSE
    RAISE NOTICE 'ℹ️ filing_case_id column already exists in cases table';
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_filing_case_id 
ON public.cases(filing_case_id) 
WHERE filing_case_id IS NOT NULL;

-- ============================================================================
-- CREATE FUNCTION TO GENERATE FILING CASE ID
-- ============================================================================

-- Function to automatically generate filing_case_id from plate and created_at
CREATE OR REPLACE FUNCTION generate_filing_case_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If filing_case_id is not set, generate it as YC-PLATE-YEAR
  IF NEW.filing_case_id IS NULL AND NEW.plate IS NOT NULL THEN
    NEW.filing_case_id := 'YC-' || NEW.plate || '-' || EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_generate_filing_case_id ON public.cases;

-- Create trigger
CREATE TRIGGER trigger_generate_filing_case_id
  BEFORE INSERT OR UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION generate_filing_case_id();

-- ============================================================================
-- POPULATE EXISTING ROWS
-- ============================================================================

-- Update existing rows to generate filing_case_id
UPDATE public.cases
SET filing_case_id = 'YC-' || plate || '-' || EXTRACT(YEAR FROM created_at)
WHERE filing_case_id IS NULL 
  AND plate IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  index_exists BOOLEAN;
  trigger_exists BOOLEAN;
  populated_count INT;
  total_count INT;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' 
    AND column_name = 'filing_case_id'
  ) INTO column_exists;
  
  -- Check if index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'cases' 
    AND indexname = 'idx_cases_filing_case_id'
  ) INTO index_exists;
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_generate_filing_case_id'
  ) INTO trigger_exists;
  
  -- Count populated rows
  SELECT COUNT(*) INTO populated_count
  FROM public.cases
  WHERE filing_case_id IS NOT NULL;
  
  -- Count total rows
  SELECT COUNT(*) INTO total_count
  FROM public.cases;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 29 - CASES TABLE ENHANCEMENT VERIFICATION';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'filing_case_id column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Unique index created: %', CASE WHEN index_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Auto-generate trigger: %', CASE WHEN trigger_exists THEN '✅ ACTIVE' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Rows with filing_case_id: % / % cases', populated_count, total_count;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Format: YC-PLATE-YEAR (e.g., YC-22184003-2025)';
  RAISE NOTICE '🔄 Auto-generation: Trigger creates on insert if not provided';
  RAISE NOTICE '🔒 Constraint: UNIQUE to prevent duplicate filing IDs';
  RAISE NOTICE '';
  RAISE NOTICE '✅ cases table enhanced!';
END $$;

-- ============================================================================
-- OPTIONAL: View sample data
-- ============================================================================

-- Uncomment to see sample rows with filing_case_id
-- SELECT 
--   id,
--   filing_case_id,
--   plate,
--   owner_name,
--   status,
--   created_at
-- FROM public.cases
-- WHERE filing_case_id IS NOT NULL
-- ORDER BY created_at DESC
-- LIMIT 10;
