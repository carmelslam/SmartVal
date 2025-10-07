-- SESSION 11: Reorder parts_search_results Table Columns (SAFE VERSION)
-- Date: 2025-10-07
-- Purpose: Move plate column to appear right after session_id for better readability
-- Strategy: Handle foreign key dependencies from selected_parts table

-- STEP 1: Drop the foreign key constraint from selected_parts that depends on parts_search_results
ALTER TABLE public.selected_parts 
  DROP CONSTRAINT IF EXISTS selected_parts_search_result_id_fkey;

-- STEP 2: Create new table with desired column order
CREATE TABLE public.parts_search_results_new (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NULL,
  plate text NULL,  -- ✅ MOVED HERE (after session_id)
  make text NULL,
  model text NULL,
  trim text NULL,
  year text NULL,
  engine_volume text NULL,
  engine_code text NULL,
  engine_type text NULL,
  vin text NULL,
  part_family text NULL,
  search_type text NULL,
  search_query jsonb NULL,
  results jsonb NULL,
  response_time_ms integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT parts_search_results_new_pkey PRIMARY KEY (id),
  CONSTRAINT parts_search_results_new_session_id_fkey FOREIGN KEY (session_id) 
    REFERENCES parts_search_sessions (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- STEP 3: Copy all existing data from old table to new table
INSERT INTO public.parts_search_results_new (
  id,
  session_id,
  plate,
  make,
  model,
  trim,
  year,
  engine_volume,
  engine_code,
  engine_type,
  vin,
  part_family,
  search_type,
  search_query,
  results,
  response_time_ms,
  created_at
)
SELECT 
  id,
  session_id,
  plate,
  make,
  model,
  trim,
  year,
  engine_volume,
  engine_code,
  engine_type,
  vin,
  part_family,
  search_type,
  search_query,
  results,
  response_time_ms,
  created_at
FROM public.parts_search_results;

-- STEP 4: Drop old table (now safe since FK constraint was removed)
DROP TABLE public.parts_search_results;

-- STEP 5: Rename new table to original name
ALTER TABLE public.parts_search_results_new RENAME TO parts_search_results;

-- STEP 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_search_results_plate 
  ON public.parts_search_results USING btree (plate) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_search_results_make_model 
  ON public.parts_search_results USING btree (make, model) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_search_results_session 
  ON public.parts_search_results USING btree (session_id) TABLESPACE pg_default;

-- STEP 7: Recreate the foreign key constraint on selected_parts (if search_result_id column exists)
-- Check if selected_parts has search_result_id column before adding constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'selected_parts' 
      AND column_name = 'search_result_id'
  ) THEN
    ALTER TABLE public.selected_parts 
      ADD CONSTRAINT selected_parts_search_result_id_fkey 
      FOREIGN KEY (search_result_id) 
      REFERENCES parts_search_results (id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint recreated on selected_parts.search_result_id';
  ELSE
    RAISE NOTICE 'Column search_result_id does not exist in selected_parts, skipping FK constraint';
  END IF;
END $$;

COMMENT ON TABLE public.parts_search_results IS 'SESSION 11: Reordered columns - plate now appears after session_id for better readability';

-- ✅ Final column order:
-- 1. id (uuid, PK)
-- 2. session_id (uuid, FK)
-- 3. plate (text) ← MOVED HERE
-- 4. make (text)
-- 5. model (text)
-- 6. trim (text)
-- 7. year (text)
-- 8. engine_volume (text)
-- 9. engine_code (text)
-- 10. engine_type (text)
-- 11. vin (text)
-- 12. part_family (text)
-- 13. search_type (text)
-- 14. search_query (jsonb)
-- 15. results (jsonb)
-- 16. response_time_ms (integer)
-- 17. created_at (timestamptz)

-- ✅ All data preserved
-- ✅ All indexes recreated
-- ✅ Foreign key constraints restored
