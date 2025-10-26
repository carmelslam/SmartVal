-- =====================================================
-- Phase 9: Fix upsert_tracking_final_report_from_helper dynamic path extraction
-- Date: 2025-10-26
-- Purpose: Fix SQL function to properly extract data from estimate/final_report paths
-- =====================================================

-- Drop old version
DROP FUNCTION IF EXISTS upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Recreate with fixed dynamic path extraction
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
  centers_array JSONB;
BEGIN
  -- Mark existing current records for this case and report type as not current
  UPDATE tracking_final_report
  SET is_current = false
  WHERE case_id = p_case_id
    AND report_type = p_report_type
    AND is_current = true;

  -- Extract centers array based on report type
  centers_array := CASE
    WHEN p_report_type = 'estimate' THEN helper_json->'estimate'->'centers'
    WHEN p_report_type = 'final_report' THEN helper_json->'final_report'->'centers'
    ELSE helper_json->'damage_assessment'->'centers'
  END;

  -- Get damage centers array from appropriate helper section
  IF centers_array IS NOT NULL AND jsonb_typeof(centers_array) = 'array' THEN

    -- Loop through each damage center
    FOR damage_center IN SELECT * FROM jsonb_array_elements(centers_array)
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
        jsonb_array_length(centers_array),
        center_index,
        damage_center->>'Location',  -- Match field name from helper structure
        (damage_center->'Repairs'->'repairs')::TEXT,
        (damage_center->'Parts'->'total_cost')::NUMERIC,
        (damage_center->'Works'->'total_cost')::NUMERIC,
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

  -- If no centers found, try summary record from top-level data
  IF inserted_count = 0 THEN
    DECLARE
      summary_data JSONB;
    BEGIN
      summary_data := CASE
        WHEN p_report_type = 'estimate' THEN helper_json->'estimate'->'summary'
        WHEN p_report_type = 'final_report' THEN helper_json->'final_report'->'summary'
        ELSE NULL
      END;

      IF summary_data IS NOT NULL THEN
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
          (summary_data->>'total_parts')::NUMERIC,
          (summary_data->>'total_work')::NUMERIC,
          (summary_data->>'total_claim')::NUMERIC,
          (summary_data->>'depreciation')::NUMERIC,
          (summary_data->>'final_compensation')::NUMERIC,
          summary_data->>'notes',
          p_status,
          true,  -- New version is always current
          p_pdf_storage_path,  -- Store PDF path
          p_pdf_public_url,     -- Store PDF URL
          now()
        );

        inserted_count := 1;
      END IF;
    END;
  END IF;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
