-- =====================================================
-- Phase 10: Fix field population - properly extract helper data
-- Date: 2025-11-08
-- Purpose: Fix NULL values and improve field mapping in RPC functions
-- =====================================================

-- Drop old versions to replace with improved field mapping
DROP FUNCTION IF EXISTS upsert_tracking_expertise_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS upsert_tracking_final_report_from_helper(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- =====================================================
-- EXPERTISE: Improved field extraction and formatting
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
  planned_repairs_text TEXT := '';
  planned_parts_text TEXT := '';
  planned_work_text TEXT := '';
  center JSONB;
  repair_item JSONB;
  part_item JSONB;
  work_item JSONB;
BEGIN
  -- Mark existing current records for this case as not current
  UPDATE tracking_expertise
  SET is_current = false
  WHERE case_id = p_case_id AND is_current = true;

  -- 🔧 PHASE 10 FIX: Get case number from helper with better fallback
  case_number_val := COALESCE(
    helper_json->'meta'->>'case_id',
    helper_json->'case_info'->>'case_number',
    helper_json->>'case_number'
  );

  -- Get centers array from helper.centers (top level)
  centers_array := helper_json->'centers';

  IF centers_array IS NOT NULL AND jsonb_typeof(centers_array) = 'array' THEN
    -- Concatenate all damage center names
    SELECT string_agg(center->>'Location', ', ')
    INTO damage_centers_names
    FROM jsonb_array_elements(centers_array) AS center;

    -- 🔧 PHASE 10 FIX: Extract planned repairs, parts, and work properly
    FOR center IN SELECT * FROM jsonb_array_elements(centers_array)
    LOOP
      -- Extract repairs
      IF center->'Repairs' IS NOT NULL THEN
        FOR repair_item IN SELECT * FROM jsonb_array_elements(COALESCE(center->'Repairs'->'repairs', '[]'::JSONB))
        LOOP
          planned_repairs_text := planned_repairs_text || 
            COALESCE(repair_item->>'description', repair_item->>'name', '') || '; ';
        END LOOP;
      END IF;

      -- Extract parts
      IF center->'Parts' IS NOT NULL THEN
        FOR part_item IN SELECT * FROM jsonb_array_elements(COALESCE(center->'Parts'->'parts_required', center->'Parts'->'parts', '[]'::JSONB))
        LOOP
          planned_parts_text := planned_parts_text || 
            COALESCE(part_item->>'name', part_item->>'description', '') || 
            CASE WHEN part_item->>'quantity' IS NOT NULL 
                 THEN ' (כמות: ' || (part_item->>'quantity') || ')'
                 ELSE ''
            END || '; ';
        END LOOP;
      END IF;

      -- Extract work
      IF center->'Works' IS NOT NULL THEN
        FOR work_item IN SELECT * FROM jsonb_array_elements(COALESCE(center->'Works'->'works', center->'Works'->'labor', '[]'::JSONB))
        LOOP
          planned_work_text := planned_work_text || 
            COALESCE(work_item->>'description', work_item->>'name', '') || 
            CASE WHEN work_item->>'hours' IS NOT NULL 
                 THEN ' (' || (work_item->>'hours') || ' שעות)'
                 ELSE ''
            END || '; ';
        END LOOP;
      END IF;
    END LOOP;

    -- Clean up trailing separators
    planned_repairs_text := TRIM(TRAILING '; ' FROM planned_repairs_text);
    planned_parts_text := TRIM(TRAILING '; ' FROM planned_parts_text);
    planned_work_text := TRIM(TRAILING '; ' FROM planned_work_text);

    -- Insert ONE row for the entire report with properly extracted data
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
      planned_repairs_text,  -- 🔧 PHASE 10 FIX: Properly formatted text
      planned_parts_text,    -- 🔧 PHASE 10 FIX: Properly formatted text
      planned_work_text,     -- 🔧 PHASE 10 FIX: Properly formatted text
      COALESCE(helper_json->'expertise'->>'guidance', helper_json->>'guidance'), -- 🔧 PHASE 10 FIX: Extract guidance
      COALESCE(helper_json->'expertise'->>'notes', helper_json->>'notes'), -- 🔧 PHASE 10 FIX: Extract notes
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
-- FINAL REPORT / ESTIMATE: Improved field extraction
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
  actual_repairs_text TEXT := '';
  depreciation_amount NUMERIC := 0;
  final_compensation_amount NUMERIC := 0;
  center JSONB;
  repair_item JSONB;
BEGIN
  -- Mark existing current records for this case and report type as not current
  UPDATE tracking_final_report
  SET is_current = false
  WHERE case_id = p_case_id
    AND report_type = p_report_type
    AND status = p_status  -- 🔧 PHASE 10 FIX: Separate current for draft vs final
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

    -- Sum up totals and extract actual repairs from all centers
    FOR center IN SELECT * FROM jsonb_array_elements(centers_array)
    LOOP
      total_parts_sum := total_parts_sum + COALESCE((center->'Parts'->>'total_cost')::NUMERIC, 0);
      total_work_sum := total_work_sum + COALESCE((center->'Works'->>'total_cost')::NUMERIC, 0);
      
      -- 🔧 PHASE 10 FIX: Extract actual repairs performed
      IF center->'actual_repairs' IS NOT NULL THEN
        FOR repair_item IN SELECT * FROM jsonb_array_elements(COALESCE(center->'actual_repairs', '[]'::JSONB))
        LOOP
          actual_repairs_text := actual_repairs_text || 
            COALESCE(repair_item->>'description', repair_item->>'name', '') || '; ';
        END LOOP;
      END IF;
    END LOOP;

    -- Clean up trailing separators
    actual_repairs_text := TRIM(TRAILING '; ' FROM actual_repairs_text);

    -- 🔧 PHASE 10 FIX: Extract depreciation and final compensation
    depreciation_amount := COALESCE(
      (helper_json->'calculations'->>'depreciation')::NUMERIC,
      (helper_json->'valuation'->>'depreciation')::NUMERIC,
      (helper_json->'depreciation'->>'total_amount')::NUMERIC,
      0
    );

    final_compensation_amount := COALESCE(
      (helper_json->'calculations'->>'final_compensation')::NUMERIC,
      (helper_json->'calculations'->>'total_compensation')::NUMERIC,
      (helper_json->'valuation'->>'final_compensation')::NUMERIC,
      total_parts_sum + total_work_sum - depreciation_amount
    );

    -- Insert ONE row for the entire report with properly extracted data
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
      actual_repairs_text,  -- 🔧 PHASE 10 FIX: Properly formatted repairs text
      total_parts_sum,
      total_work_sum,
      total_parts_sum + total_work_sum,  -- Claim amount = parts + work
      depreciation_amount,  -- 🔧 PHASE 10 FIX: Properly extracted depreciation
      final_compensation_amount,  -- 🔧 PHASE 10 FIX: Properly calculated compensation
      COALESCE(helper_json->p_report_type->>'notes', helper_json->>'notes'), -- 🔧 PHASE 10 FIX: Extract notes
      p_status,
      true,
      p_pdf_storage_path,
      p_pdf_public_url,
      now()
    );

    RETURN 1;  -- One row inserted
  END IF;

  -- 🔧 PHASE 10 FIX: Enhanced fallback with better summary data extraction
  DECLARE
    summary_data JSONB;
    calculations_data JSONB;
  BEGIN
    summary_data := CASE
      WHEN p_report_type = 'estimate' THEN helper_json->'estimate'->'summary'
      WHEN p_report_type = 'final_report' THEN helper_json->'final_report'->'summary'
      ELSE NULL
    END;

    calculations_data := helper_json->'calculations';

    IF summary_data IS NOT NULL OR calculations_data IS NOT NULL THEN
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
        COALESCE(
          (summary_data->>'total_parts')::NUMERIC,
          (calculations_data->>'total_parts')::NUMERIC,
          0
        ),
        COALESCE(
          (summary_data->>'total_work')::NUMERIC,
          (calculations_data->>'total_work')::NUMERIC,
          0
        ),
        COALESCE(
          (summary_data->>'total_claim')::NUMERIC,
          (calculations_data->>'total_claim')::NUMERIC,
          0
        ),
        COALESCE(
          (calculations_data->>'depreciation')::NUMERIC,
          0
        ),
        COALESCE(
          (calculations_data->>'final_compensation')::NUMERIC,
          0
        ),
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