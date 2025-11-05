-- Debug line mapping to see why catalog codes aren't matching correctly

-- Show the OCR parts data with line numbers
SELECT 
  'PARTS OCR DATA' as section,
  part_data->>'תיאור' as description,
  part_data->>'מק״ט חלק' as part_code,
  part_data->>'מקור' as source,
  ROW_NUMBER() OVER () as ocr_line_number
FROM invoices i,
LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'חלקים') as part_data
WHERE i.metadata->'original_ocr_data'->'חלקים' IS NOT NULL;

-- Show the OCR works data with line numbers  
SELECT 
  'WORKS OCR DATA' as section,
  work_data->>'תיאור עבודות' as description,
  work_data->>'סוג העבודה' as work_code,
  ROW_NUMBER() OVER () as ocr_line_number
FROM invoices i,
LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'עבודות') as work_data
WHERE i.metadata->'original_ocr_data'->'עבודות' IS NOT NULL;

-- Show current invoice lines with their line numbers and categories
SELECT 
  'CURRENT INVOICE LINES' as section,
  line_number,
  description,
  item_category,
  source,
  catalog_code
FROM invoice_lines 
ORDER BY line_number;

-- Check if the line mapping is correct by description matching
SELECT 
  'LINE MAPPING CHECK' as section,
  il.line_number,
  il.description as line_description,
  il.item_category,
  parts.part_description,
  parts.part_code,
  works.work_description, 
  works.work_code
FROM invoice_lines il
LEFT JOIN (
  SELECT 
    part_data->>'תיאור' as part_description,
    part_data->>'מק״ט חלק' as part_code,
    ROW_NUMBER() OVER () as part_order
  FROM invoices i,
  LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'חלקים') as part_data
) parts ON parts.part_order = il.line_number AND il.item_category IN ('part', 'uncategorized')
LEFT JOIN (
  SELECT 
    work_data->>'תיאור עבודות' as work_description,
    work_data->>'סוג העבודה' as work_code,
    ROW_NUMBER() OVER () as work_order
  FROM invoices i,
  LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'עבודות') as work_data
) works ON works.work_order = (il.line_number - 7) AND il.item_category IN ('work', 'material')
ORDER BY il.line_number;