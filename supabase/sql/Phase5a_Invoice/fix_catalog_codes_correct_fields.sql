-- Fix catalog codes using correct field names with apostrophes

-- 1. Fix PARTS catalog codes using correct field name
UPDATE invoice_lines 
SET catalog_code = parts_data->>'מק''ט חלק'
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
WHERE invoice_lines.id = parts_mapping.line_id
  AND parts_mapping.part_index = invoice_lines.line_number;

-- 2. Fix WORKS catalog codes using correct mapping (works are lines 8-12, OCR works are 1-5)
UPDATE invoice_lines 
SET catalog_code = works_data->>'סוג העבודה'
FROM (
  SELECT 
    il.id as line_id,
    jsonb_array_elements(i.metadata->'original_ocr_data'->'עבודות') as works_data,
    ROW_NUMBER() OVER (PARTITION BY il.invoice_id ORDER BY jsonb_array_elements(i.metadata->'original_ocr_data'->'עבודות')) as work_index
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id
  WHERE il.item_category IN ('work', 'material')
    AND i.metadata->'original_ocr_data'->'עבודות' IS NOT NULL
) works_mapping
WHERE invoice_lines.id = works_mapping.line_id
  AND works_mapping.work_index = (invoice_lines.line_number - 7);

-- 3. Report final results
SELECT 
  'FIXED RESULTS' as section,
  COUNT(*) as total_lines,
  COUNT(CASE WHEN source IS NOT NULL THEN 1 END) as lines_with_source,
  COUNT(CASE WHEN catalog_code IS NOT NULL THEN 1 END) as lines_with_catalog_code,
  COUNT(CASE WHEN item_category IN ('part', 'uncategorized') THEN 1 END) as parts_count,
  COUNT(CASE WHEN item_category IN ('work', 'material') THEN 1 END) as works_count,
  COUNT(CASE WHEN item_category IN ('part', 'uncategorized') AND catalog_code IS NOT NULL THEN 1 END) as parts_with_codes,
  COUNT(CASE WHEN item_category IN ('work', 'material') AND catalog_code IS NOT NULL THEN 1 END) as works_with_codes
FROM invoice_lines;

-- Show sample results
SELECT 
  'SAMPLE RESULTS' as section,
  line_number,
  description,
  item_category,
  source,
  catalog_code
FROM invoice_lines 
ORDER BY line_number;