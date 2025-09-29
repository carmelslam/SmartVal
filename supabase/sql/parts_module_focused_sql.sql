-- Parts Module Focused SQL Modifications
-- Based on current table analysis and requirements
-- Only adds missing fields needed for parts search.html integration

-- ============================================================================
-- 1. ADD MISSING FIELDS TO CATALOG_ITEMS 
-- ============================================================================

-- Add missing vehicle identification fields (from parts search.html form)
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS trim TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS engine_volume TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS engine_code TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS part_family TEXT; -- from part_group in UI

-- Add supplier name for direct display (avoid UUID lookups)
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- ============================================================================
-- 2. ADD IDENTIFICATION FIELDS TO ALL PARTS TABLES
-- ============================================================================

-- Add common identification fields to parts_search_sessions
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS trim TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS year_vehicle TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS engine_volume TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS engine_code TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS engine_type TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS vin TEXT;

-- Add common identification fields to parts_search_results  
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS plate TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS search_type TEXT; -- 'catalog', 'web', 'ocr'

-- Add vehicle context to selected_parts (already has some fields)
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS trim TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS year_vehicle TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS engine_volume TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS part_group TEXT; -- from UI dropdown

-- Add vehicle context to parts_required (already has some fields)
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS plate TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS trim TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS year_vehicle TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS engine_volume TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS engine_code TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS engine_type TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE parts_required ADD COLUMN IF NOT EXISTS part_group TEXT;

-- ============================================================================
-- 3. CREATE INDEXES FOR SEARCH PERFORMANCE  
-- ============================================================================

-- Enable extensions for Hebrew text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Indexes for catalog_items (main search table)
CREATE INDEX IF NOT EXISTS idx_catalog_make_model ON catalog_items(make, model);
CREATE INDEX IF NOT EXISTS idx_catalog_part_family ON catalog_items(part_family);
CREATE INDEX IF NOT EXISTS idx_catalog_supplier_name ON catalog_items(supplier_name);

-- Hebrew text search indexes
CREATE INDEX IF NOT EXISTS idx_catalog_cat_num_desc_trgm 
ON catalog_items USING gin (cat_num_desc gin_trgm_ops);

-- Full text search for parts
CREATE INDEX IF NOT EXISTS idx_catalog_fulltext 
ON catalog_items USING gin (to_tsvector('simple', 
  coalesce(cat_num_desc,'') || ' ' || 
  coalesce(make,'') || ' ' ||
  coalesce(model,'') || ' ' ||
  coalesce(part_family,'') || ' ' ||
  coalesce(oem,'') || ' ' ||
  coalesce(supplier_name,'')
));

-- Indexes for selected_parts (plate-based queries)
CREATE INDEX IF NOT EXISTS idx_selected_parts_plate ON selected_parts(plate);
CREATE INDEX IF NOT EXISTS idx_selected_parts_damage_center ON selected_parts(damage_center_id);

-- Indexes for parts_required (plate-based queries)  
CREATE INDEX IF NOT EXISTS idx_parts_required_plate ON parts_required(plate);
CREATE INDEX IF NOT EXISTS idx_parts_required_damage_center ON parts_required(damage_center_code);

-- ============================================================================
-- 4. CREATE MAIN SEARCH FUNCTION FOR PARTS SEARCH.HTML
-- ============================================================================

CREATE OR REPLACE FUNCTION search_parts_comprehensive(
  p_plate TEXT DEFAULT NULL,
  p_manufacturer TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_trim TEXT DEFAULT NULL,
  p_year TEXT DEFAULT NULL,
  p_engine_volume TEXT DEFAULT NULL,
  p_engine_code TEXT DEFAULT NULL,
  p_engine_type TEXT DEFAULT NULL,
  p_vin TEXT DEFAULT NULL,
  p_part_group TEXT DEFAULT NULL,
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
    ci.part_family,
    ci.source
  FROM catalog_items ci
  WHERE 
    -- Vehicle matching (if provided)
    (p_manufacturer IS NULL OR ci.make ILIKE '%' || p_manufacturer || '%')
    AND (p_model IS NULL OR ci.model ILIKE '%' || p_model || '%')
    AND (p_trim IS NULL OR ci.trim ILIKE '%' || p_trim || '%')
    AND (p_engine_volume IS NULL OR ci.engine_volume ILIKE '%' || p_engine_volume || '%')
    AND (p_engine_code IS NULL OR ci.engine_code ILIKE '%' || p_engine_code || '%')
    
    -- Part matching (if provided)
    AND (p_part_group IS NULL OR ci.part_family ILIKE '%' || p_part_group || '%')
    AND (
      -- Free query search (most flexible)
      p_free_query IS NULL 
      OR ci.cat_num_desc ILIKE '%' || p_free_query || '%'
      OR ci.oem ILIKE '%' || p_free_query || '%'
      OR ci.make ILIKE '%' || p_free_query || '%'
      OR ci.model ILIKE '%' || p_free_query || '%'
      OR ci.part_family ILIKE '%' || p_free_query || '%'
      OR ci.supplier_name ILIKE '%' || p_free_query || '%'
    )
    AND (
      -- Specific part name search
      p_part_name IS NULL
      OR ci.cat_num_desc ILIKE '%' || p_part_name || '%'
      OR ci.part_family ILIKE '%' || p_part_name || '%'
    )
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN ci.make ILIKE p_manufacturer THEN 1 ELSE 2 END,
    CASE WHEN ci.model ILIKE p_model THEN 1 ELSE 2 END,
    -- Then by price (lowest first)
    ci.price ASC NULLS LAST,
    -- Then by supplier
    ci.supplier_name ASC
  LIMIT 100;
END;
$$;

-- ============================================================================
-- 5. CREATE FUNCTION TO SAVE SEARCH SESSION
-- ============================================================================

CREATE OR REPLACE FUNCTION save_parts_search_session(
  p_plate TEXT,
  p_search_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO parts_search_sessions (
    plate,
    search_context,
    make,
    model,
    trim,
    year_vehicle,
    engine_volume,
    engine_code,
    engine_type,
    vin
  )
  VALUES (
    p_plate,
    p_search_data,
    p_search_data->>'manufacturer',
    p_search_data->>'model', 
    p_search_data->>'trim',
    p_search_data->>'year',
    p_search_data->>'engine_volume',
    p_search_data->>'engine_code',
    p_search_data->>'engine_type',
    p_search_data->>'vin'
  )
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- ============================================================================
-- 6. CREATE FUNCTION TO SAVE SELECTED PARTS
-- ============================================================================

CREATE OR REPLACE FUNCTION save_selected_part(
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
    oem_number,
    quantity,
    damage_center_id,
    make,
    model,
    part_group,
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
    p_part_data->>'group',
    p_part_data
  )
  RETURNING id INTO part_id;
  
  RETURN part_id;
END;
$$;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION search_parts_comprehensive TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_parts_search_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_selected_part TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Parts Module Focused SQL Complete!';
  RAISE NOTICE 'Added missing fields: model, trim, vin, engine_volume, engine_code, part_family, supplier_name';
  RAISE NOTICE 'Added identification fields to all parts tables';
  RAISE NOTICE 'Created search function: search_parts_comprehensive()';
  RAISE NOTICE 'Created helper functions: save_parts_search_session(), save_selected_part()';
  RAISE NOTICE 'Ready to connect parts search.html to Supabase!';
END $$;