-- SESSION 29 - ADD IS_CURRENT FLAG TO PARTS_EXPORT_REPORTS
-- Date: 2025-10-14
-- Purpose: Add is_current flag to track latest export per case while maintaining history
-- Agent: Claude Session 29

-- ============================================================================
-- ADD IS_CURRENT COLUMN
-- ============================================================================

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts_export_reports' 
    AND column_name = 'is_current'
  ) THEN
    ALTER TABLE public.parts_export_reports 
    ADD COLUMN is_current BOOLEAN DEFAULT true;
    
    RAISE NOTICE '✅ Added is_current column to parts_export_reports table';
  ELSE
    RAISE NOTICE 'ℹ️ is_current column already exists in parts_export_reports table';
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================================================

-- Index for finding current exports quickly
CREATE INDEX IF NOT EXISTS idx_export_reports_current 
ON public.parts_export_reports(case_id, is_current) 
WHERE is_current = true;

-- ============================================================================
-- CREATE TRIGGER TO AUTO-MARK OLD EXPORTS AS NOT CURRENT
-- ============================================================================

-- Function to mark previous exports as not current
CREATE OR REPLACE FUNCTION mark_old_exports_not_current()
RETURNS TRIGGER AS $$
BEGIN
  -- Only if this is a new insert (not an update)
  IF TG_OP = 'INSERT' AND NEW.is_current = true THEN
    -- Mark all previous exports for this case as not current
    UPDATE public.parts_export_reports
    SET is_current = false
    WHERE case_id = NEW.case_id 
      AND id != NEW.id
      AND is_current = true;
    
    RAISE NOTICE 'Marked previous exports as not current for case_id: %', NEW.case_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_mark_old_exports ON public.parts_export_reports;

-- Create trigger (AFTER INSERT so NEW.id exists)
CREATE TRIGGER trigger_mark_old_exports
  AFTER INSERT ON public.parts_export_reports
  FOR EACH ROW
  EXECUTE FUNCTION mark_old_exports_not_current();

-- ============================================================================
-- MARK EXISTING RECORDS
-- ============================================================================

-- For existing records, mark only the latest export per case as current
WITH latest_exports AS (
  SELECT DISTINCT ON (case_id) 
    id,
    case_id
  FROM public.parts_export_reports
  ORDER BY case_id, created_at DESC
)
UPDATE public.parts_export_reports
SET is_current = CASE 
  WHEN id IN (SELECT id FROM latest_exports) THEN true 
  ELSE false 
END
WHERE is_current IS NULL OR is_current = true;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  index_exists BOOLEAN;
  trigger_exists BOOLEAN;
  total_exports INT;
  current_exports INT;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts_export_reports' 
    AND column_name = 'is_current'
  ) INTO column_exists;
  
  -- Check if index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'parts_export_reports' 
    AND indexname = 'idx_export_reports_current'
  ) INTO index_exists;
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_mark_old_exports'
  ) INTO trigger_exists;
  
  -- Count records
  SELECT COUNT(*) INTO total_exports FROM public.parts_export_reports;
  SELECT COUNT(*) INTO current_exports FROM public.parts_export_reports WHERE is_current = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 29 - EXPORT REPORTS ENHANCEMENT VERIFICATION';
  RAISE NOTICE '===================================================';
  RAISE NOTICE 'is_current column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Index created: %', CASE WHEN index_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Auto-mark trigger: %', CASE WHEN trigger_exists THEN '✅ ACTIVE' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Export Statistics:';
  RAISE NOTICE '  Total exports: %', total_exports;
  RAISE NOTICE '  Current exports: % (one per case)', current_exports;
  RAISE NOTICE '  History exports: %', total_exports - current_exports;
  RAISE NOTICE '';
  RAISE NOTICE '✨ Benefits:';
  RAISE NOTICE '  ✅ Full audit trail maintained';
  RAISE NOTICE '  ✅ Easy to find latest: WHERE is_current = true';
  RAISE NOTICE '  ✅ Can view history: ORDER BY created_at DESC';
  RAISE NOTICE '  ✅ Auto-updates on new export';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Export reports table enhanced!';
END $$;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get current export for a specific case
-- SELECT * FROM parts_export_reports WHERE case_id = 'uuid-here' AND is_current = true;

-- Get export history for a specific case
-- SELECT * FROM parts_export_reports WHERE case_id = 'uuid-here' ORDER BY created_at DESC;

-- Get all current exports across all cases
-- SELECT * FROM parts_export_reports WHERE is_current = true ORDER BY created_at DESC;
