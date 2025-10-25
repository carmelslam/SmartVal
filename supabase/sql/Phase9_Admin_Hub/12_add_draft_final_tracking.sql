-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 12: Add Draft/Final Tracking Columns
-- Date: 2025-10-25
-- Session: Report Save to Supabase Fix
-- =====================================================
--
-- Purpose: Add status and version tracking to report tables
-- User Specification: Track draft vs final versions with is_current flag
--
-- Workflow:
--   - Expertise: Always final (no draft)
--   - Final Report: Draft on save, Final on export
--   - Estimate: Draft on save, Final on export
--   - is_current: true for latest version, false for history
-- =====================================================

-- =====================================================
-- 1. Add columns to tracking_expertise
-- =====================================================

ALTER TABLE tracking_expertise
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'final' CHECK (status IN ('draft', 'final')),
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- Index for querying current records
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_current
ON tracking_expertise(case_id, is_current)
WHERE is_current = true;

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_status
ON tracking_expertise(status, is_current);

-- =====================================================
-- 2. Add columns to tracking_final_report
-- =====================================================

ALTER TABLE tracking_final_report
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- Index for querying current records
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_current
ON tracking_final_report(case_id, report_type, is_current)
WHERE is_current = true;

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_status
ON tracking_final_report(report_type, status, is_current);

-- =====================================================
-- 3. Update upsert_tracking_expertise_from_helper function
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_tracking_expertise_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT,
  p_status TEXT DEFAULT 'final'  -- Expertise is always final
)
RETURNS INT AS $$
DECLARE
  damage_center JSONB;
  center_index INT := 0;
  inserted_count INT := 0;
BEGIN
  -- Mark existing current records for this case as not current
  UPDATE tracking_expertise
  SET is_current = false
  WHERE case_id = p_case_id AND is_current = true;

  -- Get damage centers array from helper
  IF helper_json->'damage_assessment' IS NOT NULL AND
     helper_json->'damage_assessment'->'centers' IS NOT NULL THEN

    -- Loop through each damage center
    FOR damage_center IN SELECT * FROM jsonb_array_elements(helper_json->'damage_assessment'->'centers')
    LOOP
      center_index := center_index + 1;

      -- Insert expertise tracking record for this damage center
      INSERT INTO tracking_expertise (
        case_id,
        plate,
        damage_center_count,
        damage_center_index,
        damage_center_name,
        description,
        planned_repairs,
        planned_parts,
        planned_work,
        guidance,
        notes,
        status,
        is_current,
        timestamp
      )
      VALUES (
        p_case_id,
        p_plate,
        jsonb_array_length(helper_json->'damage_assessment'->'centers'),
        center_index,
        damage_center->>'name',
        damage_center->>'description',
        damage_center->>'planned_repairs',
        damage_center->>'planned_parts',
        damage_center->>'planned_work',
        damage_center->>'guidance',
        damage_center->>'notes',
        p_status,
        true,  -- New version is always current
        now()
      );

      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Update upsert_tracking_final_report_from_helper function
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_tracking_final_report_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT,
  p_report_type TEXT DEFAULT 'final_report',
  p_status TEXT DEFAULT 'draft'  -- Default to draft, export sets to final
)
RETURNS INT AS $$
DECLARE
  damage_center JSONB;
  center_index INT := 0;
  inserted_count INT := 0;
  source_path TEXT;
BEGIN
  -- Mark existing current records for this case and report type as not current
  UPDATE tracking_final_report
  SET is_current = false
  WHERE case_id = p_case_id
    AND report_type = p_report_type
    AND is_current = true;

  -- Determine source path based on report type
  source_path := CASE
    WHEN p_report_type = 'estimate' THEN 'estimate'
    WHEN p_report_type = 'final_report' THEN 'final_report'
    ELSE 'damage_assessment'
  END;

  -- Get damage centers array from appropriate helper section
  IF helper_json->source_path IS NOT NULL AND
     helper_json->source_path->'centers' IS NOT NULL THEN

    -- Loop through each damage center
    FOR damage_center IN SELECT * FROM jsonb_array_elements(helper_json->source_path->'centers')
    LOOP
      center_index := center_index + 1;

      -- Insert final report tracking record for this damage center
      INSERT INTO tracking_final_report (
        case_id,
        plate,
        report_type,
        damage_center_count,
        damage_center_index,
        damage_center_name,
        actual_repairs,
        total_parts,
        total_work,
        claim_amount,
        depreciation,
        final_compensation,
        notes,
        status,
        is_current,
        timestamp
      )
      VALUES (
        p_case_id,
        p_plate,
        p_report_type,
        jsonb_array_length(helper_json->source_path->'centers'),
        center_index,
        damage_center->>'name',
        damage_center->>'actual_repairs',
        (damage_center->>'total_parts')::NUMERIC,
        (damage_center->>'total_work')::NUMERIC,
        (damage_center->>'claim_amount')::NUMERIC,
        (damage_center->>'depreciation')::NUMERIC,
        (damage_center->>'final_compensation')::NUMERIC,
        damage_center->>'notes',
        p_status,
        true,  -- New version is always current
        now()
      );

      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;

  -- If no centers found, create a summary record from top-level data
  IF inserted_count = 0 AND helper_json->source_path IS NOT NULL THEN
    INSERT INTO tracking_final_report (
      case_id,
      plate,
      report_type,
      damage_center_count,
      total_parts,
      total_work,
      claim_amount,
      depreciation,
      final_compensation,
      notes,
      status,
      is_current,
      timestamp
    )
    VALUES (
      p_case_id,
      p_plate,
      p_report_type,
      0,
      (helper_json->source_path->'summary'->>'total_parts')::NUMERIC,
      (helper_json->source_path->'summary'->>'total_work')::NUMERIC,
      (helper_json->source_path->'summary'->>'total_claim')::NUMERIC,
      (helper_json->source_path->>'depreciation')::NUMERIC,
      (helper_json->source_path->>'final_compensation')::NUMERIC,
      helper_json->source_path->>'notes',
      p_status,
      true,  -- New version is always current
      now()
    );

    inserted_count := 1;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Add helper functions for version queries
-- =====================================================

-- Get current (latest) version of expertise for a case
CREATE OR REPLACE FUNCTION get_current_expertise(p_case_id UUID)
RETURNS TABLE (
  id UUID,
  damage_center_name TEXT,
  description TEXT,
  status TEXT,
  record_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.id,
    te.damage_center_name,
    te.description,
    te.status,
    te.timestamp
  FROM tracking_expertise te
  WHERE te.case_id = p_case_id
    AND te.is_current = true
  ORDER BY te.damage_center_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current (latest) version of report for a case
CREATE OR REPLACE FUNCTION get_current_report(p_case_id UUID, p_report_type TEXT)
RETURNS TABLE (
  id UUID,
  damage_center_name TEXT,
  total_parts NUMERIC,
  total_work NUMERIC,
  final_compensation NUMERIC,
  status TEXT,
  record_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tfr.id,
    tfr.damage_center_name,
    tfr.total_parts,
    tfr.total_work,
    tfr.final_compensation,
    tfr.status,
    tfr.timestamp
  FROM tracking_final_report tfr
  WHERE tfr.case_id = p_case_id
    AND tfr.report_type = p_report_type
    AND tfr.is_current = true
  ORDER BY tfr.damage_center_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get version history for a case
CREATE OR REPLACE FUNCTION get_report_history(p_case_id UUID, p_report_type TEXT)
RETURNS TABLE (
  id UUID,
  status TEXT,
  is_current BOOLEAN,
  record_timestamp TIMESTAMPTZ,
  damage_center_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tfr.id,
    tfr.status,
    tfr.is_current,
    tfr.timestamp,
    tfr.damage_center_count
  FROM tracking_final_report tfr
  WHERE tfr.case_id = p_case_id
    AND tfr.report_type = p_report_type
  ORDER BY tfr.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Grant permissions on new functions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_current_expertise(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_report(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_report_history(UUID, TEXT) TO authenticated;

-- =====================================================
-- 7. Comments for documentation
-- =====================================================

COMMENT ON COLUMN tracking_expertise.status IS 'Report status: draft or final (expertise is always final)';
COMMENT ON COLUMN tracking_expertise.is_current IS 'True for latest version, false for historical versions';
COMMENT ON COLUMN tracking_final_report.status IS 'Report status: draft (from save) or final (from export)';
COMMENT ON COLUMN tracking_final_report.is_current IS 'True for latest version, false for historical versions';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
