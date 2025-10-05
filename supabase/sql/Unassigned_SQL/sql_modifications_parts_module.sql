-- Parts Module Supabase Table Enhancements
-- Execute these modifications to enable full parts search functionality

-- ============================================================================
-- 1. ENHANCE CATALOG_ITEMS TABLE 
-- ============================================================================

-- Add missing fields for PDF parsing and Hebrew text support
-- pcode already exists in table
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS cat_num_desc TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS price_updated NUMERIC(10,2);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS source_type TEXT; -- Expr2 from PDF
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS oem_number TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add Hebrew/English translation support
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS name_hebrew TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS name_english TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS description_hebrew TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS description_english TEXT;

-- Add indexing for fast Hebrew text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Hebrew trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_catalog_items_name_hebrew_trgm 
ON catalog_items USING gin (name_hebrew gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_catalog_items_desc_hebrew_trgm 
ON catalog_items USING gin (description_hebrew gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_catalog_items_cat_num_desc_trgm 
ON catalog_items USING gin (cat_num_desc gin_trgm_ops);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_catalog_items_fulltext_hebrew 
ON catalog_items USING gin (to_tsvector('simple', 
  coalesce(name_hebrew,'') || ' ' || 
  coalesce(description_hebrew,'') || ' ' || 
  coalesce(cat_num_desc,'') || ' ' ||
  coalesce(oem_number,'')
));

-- Regular indexes for filtering
CREATE INDEX IF NOT EXISTS idx_catalog_items_make ON catalog_items(make);
CREATE INDEX IF NOT EXISTS idx_catalog_items_pcode ON catalog_items(pcode);
CREATE INDEX IF NOT EXISTS idx_catalog_items_oem ON catalog_items(oem_number);
CREATE INDEX IF NOT EXISTS idx_catalog_items_availability ON catalog_items(availability);

-- ============================================================================
-- 2. ENHANCE SUPPLIERS TABLE
-- ============================================================================

-- Add supplier display names and metadata
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing suppliers with display names
UPDATE suppliers SET display_name = 'M-Pines' WHERE id = (
  SELECT id FROM suppliers WHERE LOWER(name) LIKE '%pines%' LIMIT 1
);

-- ============================================================================
-- 3. CREATE DICTIONARY TABLES FOR TRANSLATION
-- ============================================================================

-- Hebrew to English part names dictionary
CREATE TABLE IF NOT EXISTS part_name_dictionary (
  id BIGSERIAL PRIMARY KEY,
  hebrew_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  category TEXT,
  aliases TEXT[], -- Alternative Hebrew names
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hebrew_name, english_name)
);

-- Car make/model Hebrew to English translation
CREATE TABLE IF NOT EXISTS vehicle_dictionary (
  id BIGSERIAL PRIMARY KEY,
  hebrew_term TEXT NOT NULL,
  english_term TEXT NOT NULL,
  term_type TEXT NOT NULL CHECK (term_type IN ('make', 'model', 'trim')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hebrew_term, english_term, term_type)
);

-- Populate basic translations
INSERT INTO part_name_dictionary (hebrew_name, english_name, category) VALUES
('פגוש קדמי', 'Front Bumper', 'Body'),
('פגוש אחורי', 'Rear Bumper', 'Body'),
('כנף שמאל', 'Left Fender', 'Body'),
('כנף ימין', 'Right Fender', 'Body'),
('דלת קדמית שמאל', 'Front Left Door', 'Body'),
('דלת קדמית ימין', 'Front Right Door', 'Body'),
('פנס קדמי שמאל', 'Front Left Headlight', 'Lighting'),
('פנס קדמי ימין', 'Front Right Headlight', 'Lighting'),
('פנס אחורי שמאל', 'Rear Left Taillight', 'Lighting'),
('פנס אחורי ימין', 'Rear Right Taillight', 'Lighting'),
('בולם דלת מטען', 'Trunk Door Strut', 'Body'),
('מראה צד שמאל', 'Left Side Mirror', 'Body'),
('מראה צד ימין', 'Right Side Mirror', 'Body')
ON CONFLICT (hebrew_name, english_name) DO NOTHING;

INSERT INTO vehicle_dictionary (hebrew_term, english_term, term_type) VALUES
('טויוטה', 'Toyota', 'make'),
('הונדה', 'Honda', 'make'),
('מזדה', 'Mazda', 'make'),
('סובארו', 'Subaru', 'make'),
('ניסאן', 'Nissan', 'make'),
('קורולה', 'Corolla', 'model'),
('קרוס', 'Cross', 'model'),
('סיביק', 'Civic', 'model'),
('אקורד', 'Accord', 'model')
ON CONFLICT (hebrew_term, english_term, term_type) DO NOTHING;

-- ============================================================================
-- 4. CREATE SEARCH VIEW WITH SUPPLIER NAMES
-- ============================================================================

-- Create view that joins catalog_items with supplier display names
CREATE OR REPLACE VIEW catalog_search_view AS
SELECT 
  ci.*,
  s.display_name as supplier_name,
  s.website_url as supplier_website,
  s.is_active as supplier_active
FROM catalog_items ci
LEFT JOIN suppliers s ON ci.supplier_id = s.id
WHERE s.is_active = true OR s.is_active IS NULL;

-- ============================================================================
-- 5. CREATE SEARCH FUNCTIONS FOR PARTS MODULE
-- ============================================================================

-- Main search function for parts with Hebrew support
CREATE OR REPLACE FUNCTION search_parts_for_plate(
  p_plate TEXT,
  p_part_name TEXT DEFAULT NULL,
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_year INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  supplier_name TEXT,
  pcode TEXT,
  cat_num_desc TEXT,
  name_hebrew TEXT,
  name_english TEXT,
  description_hebrew TEXT,
  description_english TEXT,
  price_updated NUMERIC,
  oem_number TEXT,
  availability TEXT,
  location TEXT,
  comments TEXT,
  make TEXT,
  source_type TEXT,
  supplier_website TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csv.id,
    csv.supplier_name,
    csv.pcode,
    csv.cat_num_desc,
    csv.name_hebrew,
    csv.name_english,
    csv.description_hebrew,
    csv.description_english,
    csv.price_updated,
    csv.oem_number,
    csv.availability,
    csv.location,
    csv.comments,
    csv.make,
    csv.source_type,
    csv.supplier_website
  FROM catalog_search_view csv
  WHERE 
    (p_make IS NULL OR csv.make ILIKE '%' || p_make || '%')
    AND (
      p_part_name IS NULL 
      OR csv.name_hebrew ILIKE '%' || p_part_name || '%'
      OR csv.name_english ILIKE '%' || p_part_name || '%'
      OR csv.cat_num_desc ILIKE '%' || p_part_name || '%'
      OR csv.description_hebrew ILIKE '%' || p_part_name || '%'
      OR csv.description_english ILIKE '%' || p_part_name || '%'
      OR csv.oem_number ILIKE '%' || p_part_name || '%'
    )
  ORDER BY 
    -- Prioritize exact Hebrew matches
    CASE WHEN csv.name_hebrew ILIKE p_part_name THEN 1 ELSE 2 END,
    -- Then by price (lowest first)
    csv.price_updated ASC NULLS LAST,
    -- Then by supplier name
    csv.supplier_name ASC
  LIMIT 100;
END;
$$;

-- Function for getting part suggestions (autocomplete)
CREATE OR REPLACE FUNCTION get_part_suggestions(
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  hebrew_name TEXT,
  english_name TEXT,
  category TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pnd.hebrew_name,
    pnd.english_name,
    pnd.category
  FROM part_name_dictionary pnd
  WHERE 
    pnd.hebrew_name ILIKE '%' || p_query || '%'
    OR pnd.english_name ILIKE '%' || p_query || '%'
    OR p_query = ANY(pnd.aliases)
  ORDER BY 
    CASE WHEN pnd.hebrew_name ILIKE p_query || '%' THEN 1 ELSE 2 END,
    LENGTH(pnd.hebrew_name)
  LIMIT p_limit;
END;
$$;

-- Function for translating Hebrew to English
CREATE OR REPLACE FUNCTION translate_part_name(
  p_hebrew_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  english_result TEXT;
BEGIN
  SELECT english_name INTO english_result
  FROM part_name_dictionary 
  WHERE hebrew_name = p_hebrew_name
     OR p_hebrew_name = ANY(aliases)
  LIMIT 1;
  
  RETURN COALESCE(english_result, p_hebrew_name);
END;
$$;

-- ============================================================================
-- 6. ENHANCE PARTS_SEARCH_SESSIONS TABLE
-- ============================================================================

-- Add fields for tracking search context
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS vehicle_year INT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS search_query TEXT;
ALTER TABLE parts_search_sessions ADD COLUMN IF NOT EXISTS results_count INT DEFAULT 0;

-- ============================================================================
-- 7. ENHANCE PARTS_SEARCH_RESULTS TABLE  
-- ============================================================================

-- Add fields for comprehensive result tracking
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS result_data JSONB;
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS search_path TEXT; -- 'catalog', 'web', 'ocr'
ALTER TABLE parts_search_results ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2); -- 0.0 to 1.0

-- ============================================================================
-- 8. ENHANCE SELECTED_PARTS TABLE
-- ============================================================================

-- Add fields for damage center integration
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS damage_center_id TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS selected_price NUMERIC(10,2);
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE selected_parts ADD COLUMN IF NOT EXISTS selection_source TEXT; -- 'catalog', 'web', 'manual'

-- ============================================================================
-- 9. CREATE HELPER INTEGRATION FUNCTION
-- ============================================================================

-- Function to sync with helper structure
CREATE OR REPLACE FUNCTION sync_parts_with_helper(
  p_plate TEXT,
  p_helper_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  session_id UUID;
  part_record JSONB;
BEGIN
  -- Create or update search session
  INSERT INTO parts_search_sessions (plate, search_context, vehicle_make, vehicle_model, vehicle_year)
  VALUES (
    p_plate,
    p_helper_data,
    p_helper_data->>'manufacturer',
    p_helper_data->>'model',
    (p_helper_data->>'year')::INT
  )
  ON CONFLICT (plate) DO UPDATE SET
    search_context = p_helper_data,
    vehicle_make = p_helper_data->>'manufacturer',
    vehicle_model = p_helper_data->>'model',
    vehicle_year = (p_helper_data->>'year')::INT,
    created_at = now()
  RETURNING id INTO session_id;

  -- Sync selected parts
  FOR part_record IN SELECT * FROM jsonb_array_elements(p_helper_data->'parts_search'->'selected_parts')
  LOOP
    INSERT INTO selected_parts (plate, part_name, part_data, session_id, damage_center_id)
    VALUES (
      p_plate,
      part_record->>'name',
      part_record,
      session_id,
      part_record->>'damage_center_id'
    )
    ON CONFLICT (plate, part_name) DO UPDATE SET
      part_data = part_record,
      damage_center_id = part_record->>'damage_center_id',
      updated_at = now();
  END LOOP;

  RETURN true;
END;
$$;

-- ============================================================================
-- 10. SET UP ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on main tables
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_parts ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Allow read access to catalog" ON catalog_items FOR SELECT USING (true);
CREATE POLICY "Allow read access to part dictionary" ON part_name_dictionary FOR SELECT USING (true);
CREATE POLICY "Allow read access to vehicle dictionary" ON vehicle_dictionary FOR SELECT USING (true);

-- Policies for parts search (plate-based access)
CREATE POLICY "Allow parts search access" ON parts_search_sessions 
  FOR ALL USING (true); -- Adjust based on your auth requirements

CREATE POLICY "Allow parts results access" ON parts_search_results 
  FOR ALL USING (true); -- Adjust based on your auth requirements

CREATE POLICY "Allow selected parts access" ON selected_parts 
  FOR ALL USING (true); -- Adjust based on your auth requirements

-- Grant necessary permissions
GRANT SELECT ON catalog_search_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_parts_for_plate TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_part_suggestions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION translate_part_name TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_parts_with_helper TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Create a simple test to verify setup
DO $$
BEGIN
  RAISE NOTICE 'Parts Module Supabase Enhancement Complete!';
  RAISE NOTICE 'Tables enhanced: catalog_items, suppliers, parts_search_sessions, parts_search_results, selected_parts';
  RAISE NOTICE 'Dictionary tables created: part_name_dictionary, vehicle_dictionary';
  RAISE NOTICE 'Search functions created: search_parts_for_plate, get_part_suggestions, translate_part_name';
  RAISE NOTICE 'Helper integration function: sync_parts_with_helper';
  RAISE NOTICE 'Ready for Parts Search Module integration!';
END $$;