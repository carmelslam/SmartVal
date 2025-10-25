-- =====================================================
-- Phase 9: Update RPC functions to accept PDF URLs
-- Date: 2025-10-25
-- Purpose: Add PDF storage parameters to RPC functions
-- =====================================================

-- Update upsert_tracking_expertise_from_helper to accept PDF URLs
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
        pdf_storage_path,
        pdf_public_url,
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
        p_pdf_storage_path,  -- Store PDF path
        p_pdf_public_url,     -- Store PDF URL
        now()
      );

      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update upsert_tracking_final_report_from_helper to accept PDF URLs
CREATE OR REPLACE FUNCTION upsert_tracking_final_report_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT,
  p_report_type TEXT DEFAULT 'final_report',
  p_status TEXT DEFAULT 'draft',
  p_pdf_storage_path TEXT DEFAULT NULL,
  p_pdf_public_url TEXT DEFAULT NULL
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
        pdf_storage_path,
        pdf_public_url,
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
        p_pdf_storage_path,  -- Store PDF path
        p_pdf_public_url,     -- Store PDF URL
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
      pdf_storage_path,
      pdf_public_url,
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
      p_pdf_storage_path,  -- Store PDF path
      p_pdf_public_url,     -- Store PDF URL
      now()
    );

    inserted_count := 1;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
