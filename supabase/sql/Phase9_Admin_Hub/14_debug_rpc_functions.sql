-- =====================================================
-- Debug Script: Add detailed logging to RPC functions
-- Date: 2025-10-25
-- =====================================================

-- Replace upsert_tracking_expertise_from_helper with detailed logging
CREATE OR REPLACE FUNCTION upsert_tracking_expertise_from_helper(
  helper_json JSONB,
  p_case_id UUID,
  p_plate TEXT,
  p_status TEXT DEFAULT 'final'
)
RETURNS INT AS $$
DECLARE
  damage_center JSONB;
  center_index INT := 0;
  inserted_count INT := 0;
  centers_array JSONB;
BEGIN
  RAISE NOTICE 'Starting upsert_tracking_expertise_from_helper for case_id: %, plate: %, status: %', p_case_id, p_plate, p_status;

  -- Mark existing current records as not current
  UPDATE tracking_expertise
  SET is_current = false
  WHERE case_id = p_case_id AND is_current = true;

  RAISE NOTICE 'Marked existing records as not current';

  -- Get centers array
  centers_array := helper_json->'damage_assessment'->'centers';
  RAISE NOTICE 'Centers array: %', centers_array;

  -- Check if centers exist
  IF helper_json->'damage_assessment' IS NOT NULL AND
     centers_array IS NOT NULL THEN

    RAISE NOTICE 'Found centers array with % elements', jsonb_array_length(centers_array);

    -- Loop through each damage center
    FOR damage_center IN SELECT * FROM jsonb_array_elements(centers_array)
    LOOP
      center_index := center_index + 1;
      RAISE NOTICE 'Processing center %: %', center_index, damage_center->>'name';

      -- Insert expertise tracking record
      BEGIN
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
          jsonb_array_length(centers_array),
          center_index,
          damage_center->>'name',
          damage_center->>'description',
          damage_center->>'planned_repairs',
          damage_center->>'planned_parts',
          damage_center->>'planned_work',
          damage_center->>'guidance',
          damage_center->>'notes',
          p_status,
          true,
          now()
        );

        inserted_count := inserted_count + 1;
        RAISE NOTICE 'Successfully inserted record %', inserted_count;

      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting record: %', SQLERRM;
      END;
    END LOOP;
  ELSE
    RAISE NOTICE 'No centers found in helper_json';
  END IF;

  RAISE NOTICE 'Completed with % records inserted', inserted_count;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
