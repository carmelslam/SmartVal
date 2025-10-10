-- Migration: Add Generated Columns for Part Vehicle Identity
-- Date: 2025-10-09
-- Purpose: Extract part's original vehicle details from raw_data JSONB for easy querying
-- Session: 18 (continued)

-- Description:
-- Selected parts may be from different vehicles than the user's car (cross-compatibility).
-- Example: User has 2022 Toyota Corolla Cross, but selects part from 2019 Audi A4.
-- The raw_data JSONB contains the part's original vehicle info (make, model, year).
-- These generated columns make it easy to query and display compatibility info.

-- Step 1: Add generated columns that automatically extract from raw_data
ALTER TABLE selected_parts 
  ADD COLUMN IF NOT EXISTS part_make TEXT 
    GENERATED ALWAYS AS (raw_data->>'make') STORED,
  ADD COLUMN IF NOT EXISTS part_model TEXT 
    GENERATED ALWAYS AS (raw_data->>'model') STORED,
  ADD COLUMN IF NOT EXISTS part_year_from INTEGER 
    GENERATED ALWAYS AS (
      CASE 
        WHEN raw_data->>'year_from' ~ '^[0-9]+$' 
        THEN (raw_data->>'year_from')::INTEGER
        ELSE NULL 
      END
    ) STORED,
  ADD COLUMN IF NOT EXISTS part_year_to INTEGER 
    GENERATED ALWAYS AS (
      CASE 
        WHEN raw_data->>'year_to' ~ '^[0-9]+$' 
        THEN (raw_data->>'year_to')::INTEGER
        ELSE NULL 
      END
    ) STORED;

-- Step 2: Add indexes for fast queries
-- Index for filtering by part manufacturer
CREATE INDEX IF NOT EXISTS idx_selected_parts_part_make 
  ON selected_parts(part_make) 
  WHERE part_make IS NOT NULL;

-- Index for finding cross-compatibility cases (part from different vehicle)
CREATE INDEX IF NOT EXISTS idx_selected_parts_compatibility 
  ON selected_parts(make, part_make, model, part_model) 
  WHERE make IS DISTINCT FROM part_make OR model IS DISTINCT FROM part_model;

-- Index for year-based compatibility queries
CREATE INDEX IF NOT EXISTS idx_selected_parts_part_year 
  ON selected_parts(part_year_from, part_year_to) 
  WHERE part_year_from IS NOT NULL;

-- Step 3: Add helpful comments
COMMENT ON COLUMN selected_parts.part_make IS 'Part''s original vehicle manufacturer (auto-extracted from raw_data)';
COMMENT ON COLUMN selected_parts.part_model IS 'Part''s original vehicle model (auto-extracted from raw_data)';
COMMENT ON COLUMN selected_parts.part_year_from IS 'Part''s compatibility start year (auto-extracted from raw_data)';
COMMENT ON COLUMN selected_parts.part_year_to IS 'Part''s compatibility end year (auto-extracted from raw_data)';

-- Verification query: Show parts where part vehicle differs from user's car
-- SELECT 
--   plate,
--   make as user_car_make,
--   model as user_car_model,
--   year as user_car_year,
--   part_make,
--   part_model,
--   part_year_from,
--   part_year_to,
--   part_name,
--   cat_num_desc
-- FROM selected_parts
-- WHERE make IS DISTINCT FROM part_make 
--    OR model IS DISTINCT FROM part_model
-- ORDER BY selected_at DESC
-- LIMIT 20;
