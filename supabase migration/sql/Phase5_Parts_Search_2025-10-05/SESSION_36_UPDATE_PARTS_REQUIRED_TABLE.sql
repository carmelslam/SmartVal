-- SESSION 36: Parts Required Integration - Database Migration
-- Purpose: Add pricing calculation fields to parts_required table
-- Date: 2025-10-16
-- Reference: SESSION_36_COMPLETE_IMPLEMENTATION_GUIDE.md

-- Add new columns for price calculations
ALTER TABLE parts_required 
  ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS reduction_percentage NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wear_percentage NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS row_uuid UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for case_id + damage_center_code lookup
CREATE INDEX IF NOT EXISTS idx_parts_required_case_center 
  ON parts_required(case_id, damage_center_code);

-- Create unique index for UPSERT operations by row_uuid
CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_required_unique_row
  ON parts_required(row_uuid);

-- Add comment to document the schema change
COMMENT ON COLUMN parts_required.price_per_unit IS 'Original price per unit before reductions';
COMMENT ON COLUMN parts_required.reduction_percentage IS 'Percentage reduction (0-100)';
COMMENT ON COLUMN parts_required.wear_percentage IS 'Percentage wear discount (0-100)';
COMMENT ON COLUMN parts_required.updated_price IS 'Final unit price after reduction and wear';
COMMENT ON COLUMN parts_required.total_cost IS 'Final total: updated_price * quantity';
COMMENT ON COLUMN parts_required.row_uuid IS 'Unique identifier for UPSERT operations (edit mode)';
COMMENT ON COLUMN parts_required.description IS 'Part description for user reference';

-- Verification query (run after migration)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'parts_required' 
-- AND column_name IN ('price_per_unit', 'reduction_percentage', 'wear_percentage', 'updated_price', 'total_cost', 'row_uuid', 'description');
