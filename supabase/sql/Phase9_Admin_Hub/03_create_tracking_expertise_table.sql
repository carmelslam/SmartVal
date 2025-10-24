-- =====================================================
-- Phase 9: Admin Hub Enhancement
-- Script 03: Expertise Tracking Table
-- Date: 2025-10-24
-- Session: 75
-- =====================================================
--
-- Purpose: Create tracking_expertise table for damage assessment tracking
-- User Specification: 10 columns for expertise/damage center tracking
-- Dependencies:
--   - Requires: cases table (from Phase 4)
-- Helper Integration: Auto-populated from helper.damage_assessment.centers
-- =====================================================

-- Drop table if exists (for development only - comment out for production)
-- DROP TABLE IF EXISTS tracking_expertise CASCADE;

-- Create tracking_expertise table with all 10 columns
CREATE TABLE IF NOT EXISTS tracking_expertise (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to cases
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

  -- מספר תיק - Case number (can be different from case_id)
  case_number TEXT,

  -- מספר רכב - Vehicle plate number
  plate TEXT NOT NULL,

  -- מס מוקדי נזק - Number of damage centers
  damage_center_count INT DEFAULT 0,

  -- מוקד נזק - Damage center name/location
  damage_center_name TEXT,

  -- תיאור - Description of damage
  description TEXT,

  -- תיקונים מתוכננים - Planned repairs
  planned_repairs TEXT,

  -- חלקים מתוכננים - Planned parts
  planned_parts TEXT,

  -- עבודות מתוכננות - Planned work/labor
  planned_work TEXT,

  -- הנחייה - Guidance/instructions
  guidance TEXT,

  -- הערות - Notes
  notes TEXT,

  -- Damage center index (for multiple damage centers per case)
  damage_center_index INT,

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
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_plate
ON tracking_expertise(plate);

-- Index on case_id for joins
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_case_id
ON tracking_expertise(case_id);

-- Index on timestamp
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_timestamp
ON tracking_expertise(timestamp DESC);

-- Composite index for damage center queries
CREATE INDEX IF NOT EXISTS idx_tracking_expertise_case_center
ON tracking_expertise(case_id, damage_center_index)
WHERE damage_center_index IS NOT NULL;

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_tracking_expertise_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tracking_expertise_updated_at
  BEFORE UPDATE ON tracking_expertise
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_expertise_timestamp();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE tracking_expertise ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view expertise tracking
CREATE POLICY "tracking_expertise_select_policy"
ON tracking_expertise
FOR SELECT
TO authenticated
USING (true);

-- Policy: System can insert expertise records (via trigger)
CREATE POLICY "tracking_expertise_insert_policy"
ON tracking_expertise
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: System can update expertise records
CREATE POLICY "tracking_expertise_update_policy"
ON tracking_expertise
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Only admins can delete expertise records
CREATE POLICY "tracking_expertise_delete_policy"
ON tracking_expertise
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
-- Helper function: Extract expertise tracking from helper JSON
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_tracking_expertise_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT
)
RETURNS INT AS $$
DECLARE
  damage_center JSONB;
  center_index INT := 0;
  inserted_count INT := 0;
BEGIN
  -- Delete existing expertise tracking for this case
  DELETE FROM tracking_expertise WHERE case_id = p_case_id;

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
        now()
      );

      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get expertise summary for a case
-- =====================================================

CREATE OR REPLACE FUNCTION get_expertise_summary(p_case_id UUID)
RETURNS TABLE (
  total_damage_centers INT,
  total_planned_parts_count BIGINT,
  damage_centers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_damage_centers,
    COUNT(DISTINCT te.damage_center_name) as total_planned_parts_count,
    jsonb_agg(
      jsonb_build_object(
        'index', te.damage_center_index,
        'name', te.damage_center_name,
        'description', te.description,
        'planned_repairs', te.planned_repairs,
        'planned_parts', te.planned_parts,
        'planned_work', te.planned_work,
        'guidance', te.guidance,
        'notes', te.notes
      ) ORDER BY te.damage_center_index
    ) as damage_centers
  FROM tracking_expertise te
  WHERE te.case_id = p_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE tracking_expertise IS 'Expertise/damage assessment tracking for Nicole queries (Phase 9) - 10 columns';
COMMENT ON COLUMN tracking_expertise.case_number IS 'מספר תיק - Case number';
COMMENT ON COLUMN tracking_expertise.plate IS 'מספר רכב - Vehicle plate number';
COMMENT ON COLUMN tracking_expertise.damage_center_count IS 'מס מוקדי נזק - Number of damage centers';
COMMENT ON COLUMN tracking_expertise.damage_center_name IS 'מוקד נזק - Damage center name/location';
COMMENT ON COLUMN tracking_expertise.description IS 'תיאור - Description of damage';
COMMENT ON COLUMN tracking_expertise.planned_repairs IS 'תיקונים מתוכננים - Planned repairs';
COMMENT ON COLUMN tracking_expertise.planned_parts IS 'חלקים מתוכננים - Planned parts';
COMMENT ON COLUMN tracking_expertise.planned_work IS 'עבודות מתוכננות - Planned work/labor';
COMMENT ON COLUMN tracking_expertise.guidance IS 'הנחייה - Guidance/instructions';
COMMENT ON COLUMN tracking_expertise.notes IS 'הערות - Notes';
COMMENT ON COLUMN tracking_expertise.damage_center_index IS 'Index of damage center (1, 2, 3, etc.)';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON tracking_expertise TO authenticated;
GRANT INSERT, UPDATE, DELETE ON tracking_expertise TO authenticated; -- RLS restricts

GRANT EXECUTE ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expertise_summary(UUID) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
