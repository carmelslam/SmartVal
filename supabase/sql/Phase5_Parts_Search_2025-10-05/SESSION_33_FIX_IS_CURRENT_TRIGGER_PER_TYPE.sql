-- SESSION 33: Fix is_current trigger to respect report_type
-- Date: 2025-10-15
-- Purpose: Update the trigger to only mark old reports as not current WITHIN THE SAME REPORT TYPE
--
-- Problem: When inserting a 'full_search_results' report, the trigger was setting
--          is_current=false for ALL reports (including 'selected_parts' reports).
--
-- Solution: Add report_type filter to the trigger so each report type tracks
--           is_current independently.
--
-- Example:
--   - Insert new 'selected_parts' report → only old 'selected_parts' become false
--   - Insert new 'full_search_results' report → only old 'full_search_results' become false
--   - They don't interfere with each other

-- ============================================================================
-- UPDATE TRIGGER FUNCTION TO FILTER BY REPORT_TYPE
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_old_exports_not_current()
RETURNS TRIGGER AS $$
BEGIN
  -- Only if this is a new insert (not an update)
  IF TG_OP = 'INSERT' AND NEW.is_current = true THEN
    -- SESSION 33: Mark previous exports as not current FOR THE SAME REPORT TYPE ONLY
    UPDATE public.parts_export_reports
    SET is_current = false
    WHERE case_id = NEW.case_id 
      AND report_type = NEW.report_type  -- 🔥 SESSION 33: Filter by report_type!
      AND id != NEW.id
      AND is_current = true;
    
    RAISE NOTICE 'SESSION 33: Marked old % reports as not current for case_id: %', NEW.report_type, NEW.case_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE INDEX TO INCLUDE REPORT_TYPE
-- ============================================================================

-- Drop old index
DROP INDEX IF EXISTS idx_export_reports_current;

-- Create new composite index with report_type
CREATE INDEX IF NOT EXISTS idx_export_reports_current_by_type 
ON public.parts_export_reports(case_id, report_type, is_current) 
WHERE is_current = true;

-- Add comment
COMMENT ON INDEX idx_export_reports_current_by_type IS 
'Fast lookup for current reports per case per type. SESSION 33: Each report type tracks current state independently.';

-- ============================================================================
-- FIX EXISTING DATA (MARK LATEST OF EACH TYPE AS CURRENT)
-- ============================================================================

-- For existing records, mark only the latest export per case PER REPORT TYPE as current
WITH latest_exports AS (
  SELECT DISTINCT ON (case_id, report_type) 
    id,
    case_id,
    report_type
  FROM public.parts_export_reports
  ORDER BY case_id, report_type, created_at DESC
)
UPDATE public.parts_export_reports
SET is_current = CASE 
  WHEN id IN (SELECT id FROM latest_exports) THEN true 
  ELSE false 
END;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  total_exports INT;
  current_exports INT;
  current_selected INT;
  current_search INT;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO total_exports FROM public.parts_export_reports;
  SELECT COUNT(*) INTO current_exports FROM public.parts_export_reports WHERE is_current = true;
  SELECT COUNT(*) INTO current_selected FROM public.parts_export_reports WHERE is_current = true AND report_type = 'selected_parts';
  SELECT COUNT(*) INTO current_search FROM public.parts_export_reports WHERE is_current = true AND report_type = 'full_search_results';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 33 - FIX IS_CURRENT TRIGGER BY REPORT_TYPE';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '📊 Export Statistics:';
  RAISE NOTICE '  Total exports: %', total_exports;
  RAISE NOTICE '  Current exports (all types): %', current_exports;
  RAISE NOTICE '  └─ Current selected_parts: %', current_selected;
  RAISE NOTICE '  └─ Current full_search_results: %', current_search;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Each report type now tracks is_current independently!';
  RAISE NOTICE '✅ Exporting selected_parts won''t affect full_search_results';
  RAISE NOTICE '✅ Exporting full_search_results won''t affect selected_parts';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- EXAMPLE QUERIES (UPDATED FOR REPORT_TYPE)
-- ============================================================================

-- Get current selected_parts export for a specific case
-- SELECT * FROM parts_export_reports 
-- WHERE case_id = 'uuid-here' 
--   AND report_type = 'selected_parts' 
--   AND is_current = true;

-- Get current full_search_results export for a specific case
-- SELECT * FROM parts_export_reports 
-- WHERE case_id = 'uuid-here' 
--   AND report_type = 'full_search_results' 
--   AND is_current = true;

-- Get ALL current exports (one per case per type)
-- SELECT * FROM parts_export_reports 
-- WHERE is_current = true 
-- ORDER BY case_id, report_type, created_at DESC;
