-- Deploy Hebrew Search Functions to Supabase
-- Run this in the Supabase SQL Editor to enable Hebrew search

-- Hebrew Search Function for Catalog Items
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
  version_date DATE,
  created_at TIMESTAMPTZ,
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
    c.cat_num_desc ILIKE '%' || search_term || '%'
    OR c.part_family ILIKE '%' || search_term || '%'
    OR c.make ILIKE '%' || search_term || '%'
    OR c.model ILIKE '%' || search_term || '%'
    OR c.supplier_name ILIKE '%' || search_term || '%'
    OR c.comments ILIKE '%' || search_term || '%'
    OR c.pcode ILIKE '%' || search_term || '%'
    OR c.oem ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN c.part_family = search_term THEN 1
      WHEN c.part_family ILIKE search_term || '%' THEN 2
      WHEN c.cat_num_desc = search_term THEN 3
      WHEN c.cat_num_desc ILIKE search_term || '%' THEN 4
      ELSE 5
    END,
    c.price ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Advanced Hebrew search with filters
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
  version_date DATE,
  created_at TIMESTAMPTZ,
  source TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  search_term := TRIM(REGEXP_REPLACE(search_term, '[^\w\s\u0590-\u05FF]', '', 'g'));
  
  IF filter_make IS NOT NULL THEN
    filter_make := TRIM(filter_make);
  END IF;
  
  IF filter_model IS NOT NULL THEN
    filter_model := TRIM(filter_model);
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id, c.pcode, c.cat_num_desc, c.part_family, c.make, c.model,
    c.year_from, c.year_to, c.price, c.oem, c.supplier_name, c.availability,
    c.location, c.comments, c.version_date, c.created_at, c.source,
    (CASE 
      WHEN c.part_family = search_term THEN 10
      WHEN c.part_family ILIKE search_term || '%' THEN 9
      WHEN c.cat_num_desc = search_term THEN 8
      WHEN c.cat_num_desc ILIKE search_term || '%' THEN 7
      ELSE 1
    END)::INTEGER AS relevance_score
  FROM catalog_items c
  WHERE 
    (LENGTH(search_term) = 0 OR (
      c.cat_num_desc ILIKE '%' || search_term || '%'
      OR c.part_family ILIKE '%' || search_term || '%'
      OR c.make ILIKE '%' || search_term || '%'
      OR c.model ILIKE '%' || search_term || '%'
      OR c.supplier_name ILIKE '%' || search_term || '%'
      OR c.pcode ILIKE '%' || search_term || '%'
      OR c.oem ILIKE '%' || search_term || '%'
    ))
    AND (filter_make IS NULL OR c.make ILIKE '%' || filter_make || '%')
    AND (filter_model IS NULL OR c.model ILIKE '%' || filter_model || '%')
  ORDER BY 
    relevance_score DESC,
    c.price ASC NULLS LAST
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_catalog_hebrew(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_catalog_hebrew_filtered(TEXT, TEXT, TEXT, INTEGER) TO authenticated, anon;

-- Test the function
SELECT 'Hebrew search functions deployed successfully!' as status;