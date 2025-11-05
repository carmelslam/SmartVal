-- Fix invoice_lines source and catalog_code
-- Handle PARTS vs WORKS vs REPAIRS different OCR field mappings

-- 1. Update PARTS (category = 'part') from חלקים array
UPDATE invoice_lines 
SET 
  source = parts_data->>'מקור',
  catalog_code = parts_data->>'מק״ט חלק'
FROM (
  SELECT 
    il.id as line_id,
    jsonb_array_elements(i.metadata->'original_ocr_data'->'חלקים') as parts_data,
    ROW_NUMBER() OVER (PARTITION BY il.invoice_id ORDER BY il.line_number) as part_index
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id
  WHERE il.item_category IN ('part', 'uncategorized')
    AND i.metadata->'original_ocr_data'->'חלקים' IS NOT NULL
) parts_mapping
WHERE invoice_lines.id = parts_mapping.line_id;

-- 2. Update WORKS (category = 'work', 'material') from עבודות array  
UPDATE invoice_lines 
SET 
  catalog_code = works_data->>'סוג העבודה'
  -- Note: Works don't have 'source' field, only parts do
FROM (
  SELECT 
    il.id as line_id,
    jsonb_array_elements(i.metadata->'original_ocr_data'->'עבודות') as works_data,
    ROW_NUMBER() OVER (PARTITION BY il.invoice_id ORDER BY il.line_number) as work_index
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id
  WHERE il.item_category IN ('work', 'material')
    AND i.metadata->'original_ocr_data'->'עבודות' IS NOT NULL
) works_mapping
WHERE invoice_lines.id = works_mapping.line_id;

-- 3. Update REPAIRS (category = 'repair') from תיקונים array
UPDATE invoice_lines 
SET 
  catalog_code = repairs_data->>'סוג התיקון'
  -- Note: Repairs don't have 'source' field, only parts do
  -- Repairs structure: "סוג התיקון", "תיאור התיקון", "עלות התיקון"
FROM (
  SELECT 
    il.id as line_id,
    jsonb_array_elements(i.metadata->'original_ocr_data'->'תיקונים') as repairs_data,
    ROW_NUMBER() OVER (PARTITION BY il.invoice_id ORDER BY il.line_number) as repair_index
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id
  WHERE il.item_category = 'repair'
    AND i.metadata->'original_ocr_data'->'תיקונים' IS NOT NULL
    AND jsonb_array_length(i.metadata->'original_ocr_data'->'תיקונים') > 0
) repairs_mapping
WHERE invoice_lines.id = repairs_mapping.line_id;

-- 3. Report what was updated
SELECT 
  'RESULTS' as section,
  COUNT(*) as total_lines,
  COUNT(source) as lines_with_source,
  COUNT(catalog_code) as lines_with_catalog_code,
  COUNT(CASE WHEN item_category IN ('part', 'uncategorized') THEN 1 END) as parts_count,
  COUNT(CASE WHEN item_category IN ('work', 'material') THEN 1 END) as works_count
FROM invoice_lines;