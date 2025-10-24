-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 04: Final Report Tracking Table
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create tracking_final_report table for actual repairs and final compensation
-- User Specification: 10 columns for final report/estimate tracking
-- Dependencies:
--   - Requires: cases table (from Phase 4)
-- Helper Integration: Auto-populated from helper.estimate or helper.final_report
-- =====================================================

-- Drop table if exists (for development only - comment out for production)
-- DROP TABLE IF EXISTS tracking_final_report CASCADE;

-- Create tracking_final_report table with all 10 columns
CREATE TABLE IF NOT EXISTS tracking_final_report (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to cases
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

  -- מספר רכב - Vehicle plate number
  plate TEXT NOT NULL,

  -- מס מוקדי נזק - Number of damage centers
  damage_center_count INT DEFAULT 0,

  -- מוקד נזק - Damage center name/location
  damage_center_name TEXT,

  -- תיקונים בפועל - Actual repairs performed
  actual_repairs TEXT,

  -- סה"כ חלקים בפועל - Total parts actual cost
  total_parts NUMERIC(10,2),

  -- סה"כ עבודות בפועל - Total work/labor actual cost
  total_work NUMERIC(10,2),

  -- סכום לתביעה - Amount for claim
  claim_amount NUMERIC(10,2),

  -- ירידת ערך - Depreciation
  depreciation NUMERIC(10,2),

  -- פיצוי סופי - Final compensation
  final_compensation NUMERIC(10,2),

  -- הערות - Notes
  notes TEXT,

  -- Damage center index (for multiple damage centers per case)
  damage_center_index INT,

  -- Report type (estimate or final_report)
  report_type TEXT CHECK (report_type IN ('estimate', 'final_report', 'expertise')),

  -- TimeStamp
  timestamp TIMESTAMPTZ DEFAULT now(),

  -- Additional tracking fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index on plate for queries
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_plate
ON tracking_final_report(plate);

-- Index on case_id for joins
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_case_id
ON tracking_final_report(case_id);

-- Index on timestamp
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_timestamp
ON tracking_final_report(timestamp DESC);

-- Index on report_type
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_type
ON tracking_final_report(report_type);

-- Composite index for damage center queries
CREATE INDEX IF NOT EXISTS idx_tracking_final_report_case_center
ON tracking_final_report(case_id, damage_center_index)
WHERE damage_center_index IS NOT NULL;

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_tracking_final_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tracking_final_report_updated_at
  BEFORE UPDATE ON tracking_final_report
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_final_report_timestamp();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE tracking_final_report ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view final report tracking
CREATE POLICY "tracking_final_report_select_policy"
ON tracking_final_report
FOR SELECT
TO authenticated
USING (true);

-- Policy: System can insert final report records (via trigger)
CREATE POLICY "tracking_final_report_insert_policy"
ON tracking_final_report
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: System can update final report records
CREATE POLICY "tracking_final_report_update_policy"
ON tracking_final_report
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Only admins can delete final report records
CREATE POLICY "tracking_final_report_delete_policy"
ON tracking_final_report
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Helper function: Extract final report tracking from helper JSON
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_tracking_final_report_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT,
  p_report_type TEXT DEFAULT 'final_report'
)
RETURNS INT AS $$
DECLARE
  damage_center JSONB;
  center_index INT := 0;
  inserted_count INT := 0;
  source_path TEXT;
BEGIN
  -- Delete existing final report tracking for this case and report type
  DELETE FROM tracking_final_report
  WHERE case_id = p_case_id AND report_type = p_report_type;

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
      now()
    );

    inserted_count := 1;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get financial summary for a case
-- =====================================================

CREATE OR REPLACE FUNCTION get_financial_summary(p_case_id UUID)
RETURNS TABLE (
  report_type TEXT,
  total_parts NUMERIC,
  total_work NUMERIC,
  total_claim NUMERIC,
  total_depreciation NUMERIC,
  total_compensation NUMERIC,
  damage_center_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tfr.report_type,
    SUM(tfr.total_parts) as total_parts,
    SUM(tfr.total_work) as total_work,
    SUM(tfr.claim_amount) as total_claim,
    SUM(tfr.depreciation) as total_depreciation,
    SUM(tfr.final_compensation) as total_compensation,
    COUNT(*)::INT as damage_center_count
  FROM tracking_final_report tfr
  WHERE tfr.case_id = p_case_id
  GROUP BY tfr.report_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get latest final compensation
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_compensation(p_plate TEXT)
RETURNS TABLE (
  case_id UUID,
  report_type TEXT,
  final_compensation NUMERIC,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tfr.case_id,
    tfr.report_type,
    tfr.final_compensation,
    tfr.timestamp
  FROM tracking_final_report tfr
  WHERE tfr.plate = p_plate
  ORDER BY tfr.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE tracking_final_report IS 'Final report/estimate tracking for Nicole queries (Phase 9) - 10 columns';
COMMENT ON COLUMN tracking_final_report.plate IS 'מספר רכב - Vehicle plate number';
COMMENT ON COLUMN tracking_final_report.damage_center_count IS 'מס מוקדי נזק - Number of damage centers';
COMMENT ON COLUMN tracking_final_report.damage_center_name IS 'מוקד נזק - Damage center name/location';
COMMENT ON COLUMN tracking_final_report.actual_repairs IS 'תיקונים בפועל - Actual repairs performed';
COMMENT ON COLUMN tracking_final_report.total_parts IS 'סה"כ חלקים בפועל - Total parts actual cost';
COMMENT ON COLUMN tracking_final_report.total_work IS 'סה"כ עבודות בפועל - Total work/labor actual cost';
COMMENT ON COLUMN tracking_final_report.claim_amount IS 'סכום לתביעה - Amount for claim';
COMMENT ON COLUMN tracking_final_report.depreciation IS 'ירידת ערך - Depreciation';
COMMENT ON COLUMN tracking_final_report.final_compensation IS 'פיצוי סופי - Final compensation';
COMMENT ON COLUMN tracking_final_report.notes IS 'הערות - Notes';
COMMENT ON COLUMN tracking_final_report.report_type IS 'Report type: estimate, final_report, or expertise';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON tracking_final_report TO authenticated;
GRANT INSERT, UPDATE, DELETE ON tracking_final_report TO authenticated; -- RLS restricts

GRANT EXECUTE ON FUNCTION upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_compensation(TEXT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
