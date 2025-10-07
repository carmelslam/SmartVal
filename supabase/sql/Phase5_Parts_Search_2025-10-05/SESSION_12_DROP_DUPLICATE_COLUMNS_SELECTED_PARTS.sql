-- SESSION 11: Drop duplicate columns from selected_parts table
-- Date: October 7, 2025
-- Purpose: Remove redundant 'supplier' and 'part_group' columns
-- Keep: supplier_name, part_family

-- Drop the duplicate columns
ALTER TABLE public.selected_parts
  DROP COLUMN IF EXISTS supplier,
  DROP COLUMN IF EXISTS part_group;

-- Verify columns removed
-- Expected remaining columns:
-- id, search_result_id, plate, part_name, pcode, cat_num_desc, oem, 
-- supplier_name (kept), price, source, part_family (kept), availability, 
-- location, comments, quantity, make, model, trim, year, engine_volume, 
-- engine_code, engine_type, vin, status, selected_by, selected_at, raw_data

-- Expected result: Only supplier_name and part_family remain
