-- =====================================================
-- Phase 9: Fix Field Mapping for helper.centers Structure
-- Date: 2025-10-25
-- Purpose: Correctly map helper.centers fields to database columns
-- =====================================================

-- Update upsert_tracking_expertise_from_helper with correct field mapping
CREATE OR REPLACE FUNCTION upsert_tracking_expertise_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT,
  p_status TEXT DEFAULT 'final',
  p_pdf_storage_path TEXT DEFAULT NULL,
  p_pdf_public_url TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  damage_center JSONB;
  center_index INT := 0;
  inserted_count INT := 0;
  case_number_val TEXT;
BEGIN
  -- Get case_number from cases table or helper
  SELECT case_number INTO case_number_val
  FROM cases
  WHERE id = p_case_id
  LIMIT 1;

  -- Fallback to helper if not found in cases
  IF case_number_val IS NULL THEN
    case_number_val := helper_json->'meta'->>'case_id';
  END IF;

  -- Mark existing current records for this case as not current
  UPDATE tracking_expertise
  SET is_current = false
  WHERE case_id = p_case_id AND is_current = true;

  -- Get damage centers array from helper.centers (live data for expertise phase)
  IF helper_json->'centers' IS NOT NULL AND jsonb_typeof(helper_json->'centers') = 'array' THEN

    -- Loop through each damage center
    FOR damage_center IN SELECT * FROM jsonb_array_elements(helper_json->'centers')
    LOOP
      center_index := center_index + 1;

      -- Insert expertise tracking record for this damage center
      -- Field mapping from helper.centers structure:
      -- - Location → damage_center_name
      -- - Description → description
      -- - Parts.parts_required → planned_parts (JSON array as text)
      -- - Works.works → planned_work (JSON array as text)
      -- - Repairs.repairs → planned_repairs (JSON array as text)
      INSERT INTO tracking_expertise (
        case_id,
        case_number,
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
        pdf_storage_path,
        pdf_public_url,
        timestamp
      )
      VALUES (
        p_case_id,
        case_number_val,
        p_plate,
        jsonb_array_length(helper_json->'centers'),
        center_index,
        damage_center->>'Location',  -- Capital L
        damage_center->>'Description',  -- Capital D
        (damage_center->'Repairs'->'repairs')::TEXT,  -- JSON array to text
        (damage_center->'Parts'->'parts_required')::TEXT,  -- JSON array to text
        (damage_center->'Works'->'works')::TEXT,  -- JSON array to text
        NULL,  -- guidance doesn't exist in helper.centers
        NULL,  -- notes doesn't exist in helper.centers
        p_status,
        true,  -- New version is always current
        p_pdf_storage_path,
        p_pdf_public_url,
        now()
      );

      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
