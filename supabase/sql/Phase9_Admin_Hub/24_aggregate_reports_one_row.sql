-- =====================================================
-- Phase 9: Fix reports to create ONE ROW per report (not per damage center)
-- Date: 2025-10-26
-- Purpose: Aggregate all damage centers into single report row
-- =====================================================

-- Drop old versions
DROP FUNCTION IF EXISTS upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- =====================================================
-- EXPERTISE: One row per report with aggregated centers
-- =====================================================
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
  centers_array JSONB;
  damage_centers_names TEXT;
  case_number_val TEXT;
BEGIN
  -- Mark existing current records for this case as not current
  UPDATE tracking_expertise
  SET is_current = false
  WHERE case_id = p_case_id AND is_current = true;

  -- Get case number from helper
  case_number_val := helper_json->'meta'->>'case_id';

  -- Get centers array from helper.centers (top level)
  centers_array := helper_json->'centers';

  IF centers_array IS NOT NULL AND jsonb_typeof(centers_array) = 'array' THEN
    -- Concatenate all damage center names
    SELECT string_agg(center->>'Location', ', ')
    INTO damage_centers_names
    FROM jsonb_array_elements(centers_array) AS center;

    -- Insert ONE row for the entire report
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
      jsonb_array_length(centers_array),
      1,  -- Single row, so index is always 1
      damage_centers_names,
      (SELECT string_agg(center->>'Description', ' | ') FROM jsonb_array_elements(centers_array) AS center),
      centers_array::TEXT,  -- Store all repairs as JSON string
      centers_array::TEXT,  -- Store all parts as JSON string
      centers_array::TEXT,  -- Store all work as JSON string
      NULL,
      NULL,
      p_status,
      true,
      p_pdf_storage_path,
      p_pdf_public_url,
      now()
    );

    RETURN 1;  -- One row inserted
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINAL REPORT / ESTIMATE: One row per report with aggregated centers
-- =====================================================
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
  centers_array JSONB;
  damage_centers_names TEXT;
  total_parts_sum NUMERIC := 0;
  total_work_sum NUMERIC := 0;
  center JSONB;
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
    ELSE NULL
  END;

  IF centers_array IS NOT NULL AND jsonb_typeof(centers_array) = 'array' THEN
    -- Concatenate all damage center names
    SELECT string_agg(c->>'Location', ', ')
    INTO damage_centers_names
    FROM jsonb_array_elements(centers_array) AS c;

    -- Sum up totals from all centers
    FOR center IN SELECT * FROM jsonb_array_elements(centers_array)
    LOOP
      total_parts_sum := total_parts_sum + COALESCE((center->'Parts'->>'total_cost')::NUMERIC, 0);
      total_work_sum := total_work_sum + COALESCE((center->'Works'->>'total_cost')::NUMERIC, 0);
    END LOOP;

    -- Insert ONE row for the entire report
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
      1,  -- Single row, so index is always 1
      damage_centers_names,
      centers_array::TEXT,  -- Store all repairs as JSON string
      total_parts_sum,
      total_work_sum,
      total_parts_sum + total_work_sum,  -- Claim amount = parts + work
      NULL,
      NULL,
      NULL,
      p_status,
      true,
      p_pdf_storage_path,
      p_pdf_public_url,
      now()
    );

    RETURN 1;  -- One row inserted
  END IF;

  -- If no centers, try to create summary record
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
        p_status,
        true,
        p_pdf_storage_path,
        p_pdf_public_url,
        now()
      );

      RETURN 1;
    END IF;
  END;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
