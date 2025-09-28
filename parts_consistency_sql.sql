-- Parts Module Table Consistency SQL
-- Ensures all parts tables have consistent field names and complete catalog fields

-- ============================================================================
-- 1. STANDARDIZE FIELD NAMES ACROSS ALL PARTS TABLES
-- ============================================================================

-- Fix field name inconsistencies (rename to match catalog_items)
-- selected_parts: oem_number -> oem (to match catalog_items.oem)
ALTER TABLE selected_parts RENAME COLUMN oem_number TO oem;

-- parts_search_sessions: year_vehicle -> year (to match other tables)  
ALTER TABLE parts_search_sessions RENAME COLUMN year_vehicle TO year;

-- selected_parts: year_vehicle -> year (to match other tables)
ALTER TABLE selected_parts RENAME COLUMN year_vehicle TO year;

-- parts_required: year_vehicle -> year (to match other tables)
ALTER TABLE parts_required RENAME COLUMN year_vehicle TO year;

-- ============================================================================
-- 2. ADD MISSING CATALOG FIELDS TO ALL TABLES
-- ============================================================================

-- Add missing fields to parts_search_results (should mirror catalog structure)
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS pcode TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS cat_num_desc TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS oem TEXT; -- Missing OEM field
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS "trim" TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS engine_volume TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS engine_code TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS engine_type TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS part_family TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- Add missing fields to selected_parts (ensure it has all catalog fields)
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS pcode TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS cat_num_desc TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS engine_code TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS engine_type TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- Add missing fields to parts_required (ensure consistency)
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS pcode TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS cat_num_desc TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS oem TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- ============================================================================
-- 3. STANDARDIZE SHARED FIELD NAMES ACROSS ALL TABLES
-- ============================================================================

-- Ensure all tables use consistent field names for shared concepts:
-- - plate: TEXT (vehicle identification)
-- - make: TEXT (vehicle manufacturer) 
-- - model: TEXT (vehicle model)
-- - trim: TEXT (vehicle trim level)
-- - year: TEXT (vehicle year)
-- - engine_volume: TEXT (engine displacement)
-- - engine_code: TEXT (engine code)
-- - engine_type: TEXT (engine type)
-- - vin: TEXT (vehicle identification number)
-- - pcode: TEXT (supplier part code)
-- - oem: TEXT (OEM part number)
-- - cat_num_desc: TEXT (catalog description)
-- - price: NUMERIC (part price)
-- - source: TEXT (part source/type)
-- - availability: TEXT (stock status)
-- - location: TEXT (supplier location)
-- - comments: TEXT (additional notes)
-- - part_family: TEXT (part category/group)
-- - supplier_name: TEXT (readable supplier name)
-- - quantity: INTEGER (part quantity)

-- ============================================================================
-- 4. UPDATE SEARCH FUNCTION TO USE CONSISTENT FIELDS
-- ============================================================================

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS search_parts_comprehensive(text,text,text,text,text,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION search_parts_comprehensive(
  p_plate TEXT DEFAULT NULL,
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_trim_level TEXT DEFAULT NULL,
  p_year TEXT DEFAULT NULL,
  p_engine_volume TEXT DEFAULT NULL,
  p_engine_code TEXT DEFAULT NULL,
  p_engine_type TEXT DEFAULT NULL,
  p_vin TEXT DEFAULT NULL,
  p_part_family TEXT DEFAULT NULL,
  p_part_name TEXT DEFAULT NULL,
  p_free_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  supplier_name TEXT,
  pcode TEXT,
  cat_num_desc TEXT,
  price NUMERIC,
  oem TEXT,
  availability TEXT,
  location TEXT,
  comments TEXT,
  make TEXT,
  model TEXT,
  "trim" TEXT,
  year TEXT,
  engine_volume TEXT,
  part_family TEXT,
  source TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.supplier_name,
    ci.pcode,
    ci.cat_num_desc,
    ci.price,
    ci.oem,
    ci.availability,
    ci.location,
    ci.comments,
    ci.make,
    ci.model,
    ci.trim,
    CAST(ci.version_date AS TEXT) as year, -- Use version_date as year equivalent
    ci.engine_volume,
    ci.part_family,
    ci.source
  FROM catalog_items ci
  WHERE 
    -- Vehicle matching (if provided)
    (p_make IS NULL OR ci.make ILIKE '%' || p_make || '%')
    AND (p_model IS NULL OR ci.model ILIKE '%' || p_model || '%')
    AND (p_trim_level IS NULL OR ci.trim ILIKE '%' || p_trim_level || '%')
    AND (p_engine_volume IS NULL OR ci.engine_volume ILIKE '%' || p_engine_volume || '%')
    AND (p_engine_code IS NULL OR ci.engine_code ILIKE '%' || p_engine_code || '%')
    
    -- Part matching (if provided)
    AND (p_part_family IS NULL OR ci.part_family ILIKE '%' || p_part_family || '%')
    AND (
      -- Free query search (most flexible)
      p_free_query IS NULL 
      OR ci.cat_num_desc ILIKE '%' || p_free_query || '%'
      OR ci.oem ILIKE '%' || p_free_query || '%'
      OR ci.make ILIKE '%' || p_free_query || '%'
      OR ci.model ILIKE '%' || p_free_query || '%'
      OR ci.part_family ILIKE '%' || p_free_query || '%'
      OR ci.supplier_name ILIKE '%' || p_free_query || '%'
      OR ci.pcode ILIKE '%' || p_free_query || '%'
    )
    AND (
      -- Specific part name search
      p_part_name IS NULL
      OR ci.cat_num_desc ILIKE '%' || p_part_name || '%'
      OR ci.part_family ILIKE '%' || p_part_name || '%'
    )
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN ci.make ILIKE p_make THEN 1 ELSE 2 END,
    CASE WHEN ci.model ILIKE p_model THEN 1 ELSE 2 END,
    -- Then by price (lowest first)
    ci.price ASC NULLS LAST,
    -- Then by supplier
    ci.supplier_name ASC
  LIMIT 100;
END;
$$;

-- ============================================================================
-- 5. UPDATE SAVE FUNCTIONS TO USE CONSISTENT FIELDS
-- ============================================================================

CREATE OR REPLACE FUNCTION save_search_result(
  p_session_id UUID,
  p_result_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO parts_search_results (
    session_id,
    supplier,
    search_query,
    results,
    plate,
    make,
    model,
    pcode,
    cat_num_desc,
    price,
    source,
    oem,
    availability,
    location,
    comments,
    part_family,
    supplier_name
  )
  VALUES (
    p_session_id,
    p_result_data->>'supplier',
    p_result_data->'query',
    p_result_data->'results',
    p_result_data->>'plate',
    p_result_data->>'make',
    p_result_data->>'model',
    p_result_data->>'pcode',
    p_result_data->>'cat_num_desc',
    (p_result_data->>'price')::NUMERIC,
    p_result_data->>'source',
    p_result_data->>'oem',
    p_result_data->>'availability',
    p_result_data->>'location',
    p_result_data->>'comments',
    p_result_data->>'part_family',
    p_result_data->>'supplier_name'
  )
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;

CREATE OR REPLACE FUNCTION save_selected_part_complete(
  p_plate TEXT,
  p_part_data JSONB,
  p_damage_center_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  part_id UUID;
BEGIN
  INSERT INTO selected_parts (
    plate,
    part_name,
    supplier,
    price,
    oem,
    quantity,
    damage_center_id,
    make,
    model,
    trim,
    year,
    engine_volume,
    part_group,
    pcode,
    cat_num_desc,
    source,
    availability,
    location,
    comments,
    supplier_name,
    raw_data
  )
  VALUES (
    p_plate,
    p_part_data->>'name',
    p_part_data->>'supplier',
    (p_part_data->>'price')::NUMERIC,
    p_part_data->>'oem',
    (p_part_data->>'quantity')::INTEGER,
    p_damage_center_id,
    p_part_data->>'make',
    p_part_data->>'model',
    p_part_data->>'trim',
    p_part_data->>'year',
    p_part_data->>'engine_volume',
    p_part_data->>'group',
    p_part_data->>'pcode',
    p_part_data->>'cat_num_desc',
    p_part_data->>'source',
    p_part_data->>'availability',
    p_part_data->>'location',
    p_part_data->>'comments',
    p_part_data->>'supplier_name',
    p_part_data
  )
  RETURNING id INTO part_id;
  
  RETURN part_id;
END;
$$;

-- ============================================================================
-- 6. CREATE INDEXES FOR NEW FIELDS
-- ============================================================================

-- Indexes for parts_search_results
CREATE INDEX IF NOT EXISTS idx_search_results_plate ON parts_search_results(plate);
CREATE INDEX IF NOT EXISTS idx_search_results_make_model ON parts_search_results(make, model);
CREATE INDEX IF NOT EXISTS idx_search_results_oem ON parts_search_results(oem);
CREATE INDEX IF NOT EXISTS idx_search_results_pcode ON parts_search_results(pcode);

-- Indexes for selected_parts (updated field names)
CREATE INDEX IF NOT EXISTS idx_selected_parts_oem ON selected_parts(oem);
CREATE INDEX IF NOT EXISTS idx_selected_parts_pcode ON selected_parts(pcode);
CREATE INDEX IF NOT EXISTS idx_selected_parts_make_model ON selected_parts(make, model);

-- Indexes for parts_required
CREATE INDEX IF NOT EXISTS idx_parts_required_oem ON parts_required(oem);
CREATE INDEX IF NOT EXISTS idx_parts_required_pcode ON parts_required(pcode);
CREATE INDEX IF NOT EXISTS idx_parts_required_make_model ON parts_required(make, model);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION save_search_result TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_selected_part_complete TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Parts Table Consistency SQL Complete!';
  RAISE NOTICE 'Standardized field names: oem_number->oem, year_vehicle->year';
  RAISE NOTICE 'Added missing catalog fields to all tables: pcode, oem, cat_num_desc, etc.';
  RAISE NOTICE 'Updated search functions to use consistent field names';
  RAISE NOTICE 'All parts tables now have consistent shared field names!';
END $$;