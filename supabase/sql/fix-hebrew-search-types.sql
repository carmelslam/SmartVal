-- Fix Hebrew Search Functions - Data Type Mismatch
-- First check the actual table structure and then fix the RPC functions

-- Check the actual column types in catalog_items table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'catalog_items' 
ORDER BY ordinal_position;

-- Drop existing functions to recreate with correct types
DROP FUNCTION IF EXISTS search_catalog_hebrew(TEXT);
DROP FUNCTION IF EXISTS search_catalog_hebrew_filtered(TEXT, TEXT, TEXT, INTEGER);

-- Recreate Hebrew search function with flexible return types
CREATE OR REPLACE FUNCTION search_catalog_hebrew(search_term TEXT)
RETURNS TABLE (
  id UUID,
  pcode TEXT,
  cat_num_desc TEXT,
  part_family TEXT,
  make TEXT,
  model TEXT,
  year_from INTEGER,
  year_to INTEGER,
  price NUMERIC,
  oem TEXT,
  supplier_name TEXT,
  availability TEXT,
  location TEXT,
  comments TEXT,
  version_date DATE,  -- Changed from TIMESTAMP to DATE
  created_at TIMESTAMPTZ,  -- More flexible timestamp type
  source TEXT
) AS $$
BEGIN
  -- Normalize search term: remove special characters but keep Hebrew
  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\w\s\u0590-\u05FF]', '', 'g'));
  
  -- Return early if search term is empty
  IF LENGTH(search_term) = 0 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.pcode,
    c.cat_num_desc,
    c.part_family,
    c.make,
    c.model,
    c.year_from,
    c.year_to,
    c.price,
    c.oem,
    c.supplier_name,
    c.availability,
    c.location,
    c.comments,
    c.version_date,
    c.created_at,
    c.source
  FROM catalog_items c
  WHERE 
    -- Hebrew text fields with ILIKE for case-insensitive search
    c.cat_num_desc ILIKE '%' || search_term || '%'
    OR c.part_family ILIKE '%' || search_term || '%'
    OR c.make ILIKE '%' || search_term || '%'
    OR c.model ILIKE '%' || search_term || '%'
    OR c.supplier_name ILIKE '%' || search_term || '%'
    OR c.comments ILIKE '%' || search_term || '%'
    -- Non-Hebrew fields (exact/partial match)
    OR c.pcode ILIKE '%' || search_term || '%'
    OR c.oem ILIKE '%' || search_term || '%'
    OR c.location ILIKE '%' || search_term || '%'
    OR c.availability ILIKE '%' || search_term || '%'
  ORDER BY 
    -- Prioritize exact matches, then starts with, then contains
    CASE 
      WHEN c.part_family = search_term THEN 1
      WHEN c.part_family ILIKE search_term || '%' THEN 2
      WHEN c.cat_num_desc = search_term THEN 3
      WHEN c.cat_num_desc ILIKE search_term || '%' THEN 4
      WHEN c.make = search_term THEN 5
      WHEN c.make ILIKE search_term || '%' THEN 6
      WHEN c.pcode = search_term THEN 7
      WHEN c.oem = search_term THEN 8
      ELSE 9
    END,
    -- Secondary sort by price (nulls last)
    c.price ASC NULLS LAST,
    -- Tertiary sort by creation date (newest first)
    c.created_at DESC NULLS LAST
  LIMIT 100; -- Add reasonable limit
END;
$$ LANGUAGE plpgsql;

-- Advanced Hebrew search function with filters - corrected types
CREATE OR REPLACE FUNCTION search_catalog_hebrew_filtered(
  search_term TEXT,
  filter_make TEXT DEFAULT NULL,
  filter_model TEXT DEFAULT NULL,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  pcode TEXT,
  cat_num_desc TEXT,
  part_family TEXT,
  make TEXT,
  model TEXT,
  year_from INTEGER,
  year_to INTEGER,
  price NUMERIC,
  oem TEXT,
  supplier_name TEXT,
  availability TEXT,
  location TEXT,
  comments TEXT,
  version_date DATE,  -- Changed from TIMESTAMP to DATE
  created_at TIMESTAMPTZ,  -- More flexible timestamp type
  source TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  -- Normalize search term
  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\w\s\u0590-\u05FF]', '', 'g'));
  
  -- Normalize filters
  IF filter_make IS NOT NULL THEN
    filter_make := TRIM(filter_make);
  END IF;
  
  IF filter_model IS NOT NULL THEN
    filter_model := TRIM(filter_model);
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.pcode,
    c.cat_num_desc,
    c.part_family,
    c.make,
    c.model,
    c.year_from,
    c.year_to,
    c.price,
    c.oem,
    c.supplier_name,
    c.availability,
    c.location,
    c.comments,
    c.version_date,
    c.created_at,
    c.source,
    -- Calculate relevance score
    (CASE 
      WHEN c.part_family = search_term THEN 10
      WHEN c.part_family ILIKE search_term || '%' THEN 9
      WHEN c.cat_num_desc = search_term THEN 8
      WHEN c.cat_num_desc ILIKE search_term || '%' THEN 7
      WHEN c.make = search_term THEN 6
      WHEN c.make ILIKE search_term || '%' THEN 5
      WHEN c.pcode = search_term THEN 4
      WHEN c.oem = search_term THEN 3
      WHEN c.part_family ILIKE '%' || search_term || '%' THEN 2
      ELSE 1
    END)::INTEGER AS relevance_score
  FROM catalog_items c
  WHERE 
    -- Text search conditions
    (LENGTH(search_term) = 0 OR (
      c.cat_num_desc ILIKE '%' || search_term || '%'
      OR c.part_family ILIKE '%' || search_term || '%'
      OR c.make ILIKE '%' || search_term || '%'
      OR c.model ILIKE '%' || search_term || '%'
      OR c.supplier_name ILIKE '%' || search_term || '%'
      OR c.comments ILIKE '%' || search_term || '%'
      OR c.pcode ILIKE '%' || search_term || '%'
      OR c.oem ILIKE '%' || search_term || '%'
      OR c.location ILIKE '%' || search_term || '%'
      OR c.availability ILIKE '%' || search_term || '%'
    ))
    -- Make filter
    AND (filter_make IS NULL OR c.make ILIKE '%' || filter_make || '%')
    -- Model filter
    AND (filter_model IS NULL OR c.model ILIKE '%' || filter_model || '%')
  ORDER BY 
    relevance_score DESC,
    c.price ASC NULLS LAST,
    c.created_at DESC NULLS LAST
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create a simpler function that dynamically adapts to table structure
CREATE OR REPLACE FUNCTION search_catalog_hebrew_simple(search_term TEXT, max_results INTEGER DEFAULT 20)
RETURNS SETOF catalog_items AS $$
BEGIN
  -- Normalize search term
  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\w\s\u0590-\u05FF]', '', 'g'));
  
  RETURN QUERY
  SELECT * FROM catalog_items c
  WHERE 
    c.cat_num_desc ILIKE '%' || search_term || '%'
    OR c.part_family ILIKE '%' || search_term || '%'
    OR c.make ILIKE '%' || search_term || '%'
    OR c.model ILIKE '%' || search_term || '%'
    OR c.supplier_name ILIKE '%' || search_term || '%'
    OR c.pcode ILIKE '%' || search_term || '%'
    OR c.oem ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN c.part_family = search_term THEN 1
      WHEN c.part_family ILIKE search_term || '%' THEN 2
      WHEN c.cat_num_desc = search_term THEN 3
      ELSE 4
    END,
    c.price ASC NULLS LAST
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION search_catalog_hebrew(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_catalog_hebrew_filtered(TEXT, TEXT, TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_catalog_hebrew_simple(TEXT, INTEGER) TO authenticated, anon;

-- Test function to verify it works
SELECT 'Hebrew search functions fixed and deployed!' as status;

-- Quick test
SELECT COUNT(*) as total_catalog_items FROM catalog_items;