-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 07: Tracking Update Triggers
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create triggers to auto-update tracking tables when helper is saved
-- Dependencies:
--   - Requires: case_helper table (from Phase 4)
--   - Requires: tracking_general, tracking_expertise, tracking_final_report tables
-- Critical Integration: This connects helper saves to tracking tables
-- =====================================================

-- =====================================================
-- Main Trigger Function: Update all tracking tables from helper
-- =====================================================

CREATE OR REPLACE FUNCTION update_tracking_tables_from_helper()
RETURNS TRIGGER AS $$
DECLARE
  helper_data JSONB;
  plate_number TEXT;
  case_uuid UUID;
  tracking_result INT;
BEGIN
  -- Get the helper JSON data
  helper_data := NEW.helper_json;

  -- Get plate from helper or case
  plate_number := helper_data->>'plate';

  -- Get case_id
  case_uuid := NEW.case_id;

  -- Skip if no plate number
  IF plate_number IS NULL THEN
    RAISE NOTICE 'No plate number found in helper, skipping tracking update';
    RETURN NEW;
  END IF;

  -- Log the update
  RAISE NOTICE 'Updating tracking tables for case_id: %, plate: %', case_uuid, plate_number;

  -- ============================================
  -- 1. Update tracking_general
  -- ============================================
  BEGIN
    tracking_result := upsert_tracking_general_from_helper(
      helper_data,
      case_uuid,
      plate_number
    );
    RAISE NOTICE 'tracking_general updated: %', tracking_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update tracking_general: %', SQLERRM;
  END;

  -- ============================================
  -- 2. Update tracking_expertise
  -- ============================================
  BEGIN
    tracking_result := upsert_tracking_expertise_from_helper(
      helper_data,
      case_uuid,
      plate_number
    );
    RAISE NOTICE 'tracking_expertise updated: % records', tracking_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update tracking_expertise: %', SQLERRM;
  END;

  -- ============================================
  -- 3. Update tracking_final_report (estimate)
  -- ============================================
  IF helper_data->'estimate' IS NOT NULL THEN
    BEGIN
      tracking_result := upsert_tracking_final_report_from_helper(
        helper_data,
        case_uuid,
        plate_number,
        'estimate'
      );
      RAISE NOTICE 'tracking_final_report (estimate) updated: % records', tracking_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to update tracking_final_report (estimate): %', SQLERRM;
    END;
  END IF;

  -- ============================================
  -- 4. Update tracking_final_report (final_report)
  -- ============================================
  IF helper_data->'final_report' IS NOT NULL THEN
    BEGIN
      tracking_result := upsert_tracking_final_report_from_helper(
        helper_data,
        case_uuid,
        plate_number,
        'final_report'
      );
      RAISE NOTICE 'tracking_final_report (final_report) updated: % records', tracking_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to update tracking_final_report (final_report): %', SQLERRM;
    END;
  END IF;

  -- Return the NEW record to continue with the insert/update
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Create Trigger on case_helper table
-- =====================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_update_tracking_on_helper_save ON case_helper;

-- Create trigger that fires AFTER INSERT OR UPDATE on case_helper
CREATE TRIGGER trg_update_tracking_on_helper_save
  AFTER INSERT OR UPDATE OF helper_json ON case_helper
  FOR EACH ROW
  WHEN (NEW.is_current = true) -- Only update tracking for current helpers
  EXECUTE FUNCTION update_tracking_tables_from_helper();

-- =====================================================
-- Optional: Create trigger on helper_versions table
-- =====================================================

-- This is optional but useful for tracking historical data
CREATE OR REPLACE FUNCTION log_tracking_update_from_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Log that a new version was created
  -- (Could update tracking tables here too if needed for historical tracking)
  RAISE NOTICE 'New helper version saved: case_id %, version %', NEW.case_id, NEW.version;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_version_save ON helper_versions;

CREATE TRIGGER trg_log_version_save
  AFTER INSERT ON helper_versions
  FOR EACH ROW
  EXECUTE FUNCTION log_tracking_update_from_version();

-- =====================================================
-- Helper function: Manual refresh of tracking tables
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_tracking_for_case(p_case_id UUID)
RETURNS JSONB AS $$
DECLARE
  helper_data JSONB;
  plate_number TEXT;
  result JSONB;
  general_result UUID;
  expertise_result INT;
  estimate_result INT;
  final_report_result INT;
BEGIN
  -- Get current helper for the case
  SELECT helper_json, helper_name
  INTO helper_data, plate_number
  FROM case_helper
  WHERE case_id = p_case_id AND is_current = true
  LIMIT 1;

  IF helper_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No current helper found for case'
    );
  END IF;

  -- Extract plate from helper
  plate_number := helper_data->>'plate';

  -- Update all tracking tables
  general_result := upsert_tracking_general_from_helper(helper_data, p_case_id, plate_number);
  expertise_result := upsert_tracking_expertise_from_helper(helper_data, p_case_id, plate_number);

  -- Update estimate if exists
  IF helper_data->'estimate' IS NOT NULL THEN
    estimate_result := upsert_tracking_final_report_from_helper(helper_data, p_case_id, plate_number, 'estimate');
  ELSE
    estimate_result := 0;
  END IF;

  -- Update final_report if exists
  IF helper_data->'final_report' IS NOT NULL THEN
    final_report_result := upsert_tracking_final_report_from_helper(helper_data, p_case_id, plate_number, 'final_report');
  ELSE
    final_report_result := 0;
  END IF;

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'case_id', p_case_id,
    'plate', plate_number,
    'tracking_general_id', general_result,
    'expertise_records', expertise_result,
    'estimate_records', estimate_result,
    'final_report_records', final_report_result
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Batch refresh all tracking tables
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_all_tracking_tables()
RETURNS TABLE (
  case_id UUID,
  plate TEXT,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  case_record RECORD;
  refresh_result JSONB;
BEGIN
  -- Loop through all cases with current helpers
  FOR case_record IN
    SELECT DISTINCT ch.case_id, ch.helper_json->>'plate' as plate
    FROM case_helper ch
    WHERE ch.is_current = true
  LOOP
    BEGIN
      -- Refresh tracking for this case
      refresh_result := refresh_tracking_for_case(case_record.case_id);

      -- Return success
      RETURN QUERY SELECT
        case_record.case_id,
        case_record.plate,
        true,
        NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
      -- Return failure
      RETURN QUERY SELECT
        case_record.case_id,
        case_record.plate,
        false,
        SQLERRM;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Verification function: Check tracking data consistency
-- =====================================================

CREATE OR REPLACE FUNCTION verify_tracking_consistency()
RETURNS TABLE (
  case_id UUID,
  plate TEXT,
  has_general_tracking BOOLEAN,
  has_expertise_tracking BOOLEAN,
  has_final_report_tracking BOOLEAN,
  general_count BIGINT,
  expertise_count BIGINT,
  final_report_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as case_id,
    c.plate,
    EXISTS(SELECT 1 FROM tracking_general tg WHERE tg.case_id = c.id) as has_general_tracking,
    EXISTS(SELECT 1 FROM tracking_expertise te WHERE te.case_id = c.id) as has_expertise_tracking,
    EXISTS(SELECT 1 FROM tracking_final_report tfr WHERE tfr.case_id = c.id) as has_final_report_tracking,
    (SELECT COUNT(*) FROM tracking_general tg WHERE tg.case_id = c.id) as general_count,
    (SELECT COUNT(*) FROM tracking_expertise te WHERE te.case_id = c.id) as expertise_count,
    (SELECT COUNT(*) FROM tracking_final_report tfr WHERE tfr.case_id = c.id) as final_report_count
  FROM cases c
  WHERE c.status IN ('OPEN', 'IN_PROGRESS')
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON FUNCTION update_tracking_tables_from_helper() IS 'Trigger function: Auto-updates all tracking tables when helper is saved (Phase 9)';
COMMENT ON FUNCTION refresh_tracking_for_case(UUID) IS 'Manually refresh tracking tables for a specific case';
COMMENT ON FUNCTION refresh_all_tracking_tables() IS 'Batch refresh all tracking tables for all cases';
COMMENT ON FUNCTION verify_tracking_consistency() IS 'Verify tracking data consistency across all cases';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION refresh_tracking_for_case(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_tracking_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_tracking_consistency() TO authenticated;

-- =====================================================
-- Initial Setup: Refresh tracking for existing cases
-- =====================================================

-- Uncomment to run initial refresh (WARNING: This may take time for large databases)
-- SELECT * FROM refresh_all_tracking_tables();

-- =====================================================
-- Verification queries
-- =====================================================

-- Uncomment to verify trigger is created
-- SELECT tgname, tgtype, tgenabled
-- FROM pg_trigger
-- WHERE tgname = 'trg_update_tracking_on_helper_save';

-- Uncomment to verify tracking consistency
-- SELECT * FROM verify_tracking_consistency();

-- =====================================================
-- END OF SCRIPT
-- =====================================================
