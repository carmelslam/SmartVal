-- SESSION 10: Clean parts_search_results Table Structure
-- Date: 2025-10-07
-- Purpose: Remove individual part fields that can't represent entire search
-- Reason: A search returns 50 parts - can't associate one pcode/price/supplier to whole search
-- Strategy: Keep ONLY search parameters + full results JSONB

-- BACKUP REMINDER: Make sure you have a backup before running!

-- Drop individual part columns (they are redundant with results JSONB)
ALTER TABLE parts_search_results
  DROP COLUMN IF EXISTS pcode,
  DROP COLUMN IF EXISTS cat_num_desc,
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS oem,
  DROP COLUMN IF EXISTS availability,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS supplier_name,
  DROP COLUMN IF EXISTS supplier,
  DROP COLUMN IF EXISTS comments;

-- What remains in the table:
-- ✅ session_id (FK to parts_search_sessions)
-- ✅ plate (from search params)
-- ✅ make (from search params)
-- ✅ model (from search params)
-- ✅ trim (from search params)
-- ✅ year (from search params)
-- ✅ engine_volume (from search params)
-- ✅ engine_code (from search params)
-- ✅ engine_type (from search params)
-- ✅ vin (from search params)
-- ✅ part_family (from search params)
-- ✅ search_type (simple_search / advanced_search / smart_search)
-- ✅ search_query (JSONB - full search parameters)
-- ✅ results (JSONB - array of all parts found, each with pcode/price/supplier/etc)
-- ✅ response_time_ms (search performance)
-- ✅ created_at (timestamp)

-- Note: All individual part details are preserved in results JSONB column
-- Each part in the array has: id, pcode, cat_num_desc, price, source, oem, availability, location, supplier_name, etc.

COMMENT ON TABLE parts_search_results IS 'Stores search results metadata + full results JSONB. Individual part details are in results array, not separate columns.';
