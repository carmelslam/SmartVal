-- =====================================================
-- Phase 9: Verify Function and Refresh
-- Date: 2025-10-25
-- Purpose: Verify single function exists and refresh permissions
-- =====================================================

-- =====================================================
-- 1. Verify ONLY ONE function exists
-- =====================================================

-- Check how many versions exist:
SELECT
  p.proname,
  pg_get_function_arguments(p.oid) as args,
  p.oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'upsert_tracking_expertise_from_helper'
AND n.nspname = 'public';

-- Expected: Only 1 row with 6 parameters

-- =====================================================
-- 2. Refresh function permissions
-- =====================================================

-- Revoke all first
REVOKE ALL ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT) FROM authenticated;

-- Grant fresh permissions
GRANT EXECUTE ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 3. Verify tracking_expertise table structure
-- =====================================================

-- Check all columns including case_number
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tracking_expertise'
ORDER BY ordinal_position;

-- =====================================================
-- 4. Test function with dummy data
-- =====================================================

-- This will test if the function works at all
-- Replace with your actual case_id and plate for testing
-- SELECT upsert_tracking_expertise_from_helper(
--   '{"centers": [{"Location": "Test", "Description": "Test Desc", "Parts": {"parts_required": []}, "Works": {"works": []}, "Repairs": {"repairs": []}}]}'::jsonb,
--   'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'::uuid,
--   '22184003',
--   'final',
--   null,
--   null
-- );

-- =====================================================
-- END OF SCRIPT
-- =====================================================
