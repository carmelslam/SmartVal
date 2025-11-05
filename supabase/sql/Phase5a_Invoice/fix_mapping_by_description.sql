-- Fix catalog codes by matching descriptions instead of line numbers

-- 1. Fix PARTS by matching descriptions
UPDATE invoice_lines 
SET catalog_code = parts_match.part_code
FROM (
  SELECT DISTINCT
    il.id as line_id,
    part_data->>'מק''ט חלק' as part_code
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id,
  LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'חלקים') as part_data
  WHERE il.item_category IN ('part', 'uncategorized')
    AND i.metadata->'original_ocr_data'->'חלקים' IS NOT NULL
    AND il.description = part_data->>'תיאור'
) parts_match
WHERE invoice_lines.id = parts_match.line_id;

-- 2. Fix WORKS by matching descriptions  
UPDATE invoice_lines 
SET catalog_code = works_match.work_code
FROM (
  SELECT DISTINCT
    il.id as line_id,
    work_data->>'סוג העבודה' as work_code
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id,
  LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'עבודות') as work_data
  WHERE il.item_category IN ('work', 'material')
    AND i.metadata->'original_ocr_data'->'עבודות' IS NOT NULL
    AND il.description = work_data->>'תיאור עבודות'
) works_match
WHERE invoice_lines.id = works_match.line_id;

-- 3. Show results
SELECT 
  'FIXED BY DESCRIPTION MATCHING' as section,
  line_number,
  description,
  item_category,
  source,
  catalog_code
FROM invoice_lines 
ORDER BY line_number;