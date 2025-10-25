-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 13: Cleanup Duplicate RPC Functions
-- Date: 2025-10-25
-- Session: Report Save to Supabase Fix
-- =====================================================
--
-- Purpose: Remove old function signatures that conflict with new versions
-- Issue: PostgreSQL function overloading conflict when both 3-param and 4-param versions exist
-- Error: "Could not choose the best candidate function"
-- =====================================================

-- Drop old 3-parameter version of upsert_tracking_expertise_from_helper
DROP FUNCTION IF EXISTS upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT);

-- Drop old 3-parameter version of upsert_tracking_final_report_from_helper
DROP FUNCTION IF EXISTS upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT);

-- The new 4-parameter versions (with p_status parameter) will remain from script 12

-- =====================================================
-- Verify functions
-- =====================================================

-- List all versions of the functions to confirm cleanup
DO $$
BEGIN
  RAISE NOTICE 'Remaining upsert_tracking_expertise_from_helper functions:';
  PERFORM proname, pronargs
  FROM pg_proc
  WHERE proname = 'upsert_tracking_expertise_from_helper';

  RAISE NOTICE 'Remaining upsert_tracking_final_report_from_helper functions:';
  PERFORM proname, pronargs
  FROM pg_proc
  WHERE proname = 'upsert_tracking_final_report_from_helper';
END $$;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT)
IS 'Upsert expertise tracking with status and version control (4 parameters: helper_json, p_case_id, p_plate, p_status)';

COMMENT ON FUNCTION upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT)
IS 'Upsert final report/estimate tracking with status and version control (5 parameters: helper_json, p_case_id, p_plate, p_report_type, p_status)';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
