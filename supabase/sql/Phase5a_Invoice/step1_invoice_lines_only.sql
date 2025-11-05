-- Step 1: Update ONLY invoice_lines table with OCR data
-- Simple, focused approach - one table at a time

-- First, let's see what we're working with
SELECT 
  il.id,
  il.invoice_id,
  il.line_number,
  il.item_description,
  il.source,
  il.catalog_code,
  il.item_category,
  -- Show OCR data that exists
  jsonb_array_elements(COALESCE(id.ocr_structured_data->'חלקים', '[]'::jsonb)) as ocr_part_data
FROM invoice_lines il
LEFT JOIN invoice_documents id ON id.invoice_id = il.invoice_id
WHERE id.ocr_structured_data IS NOT NULL 
  AND jsonb_typeof(id.ocr_structured_data->'חלקים') = 'array'
LIMIT 5;

-- Show what OCR fields are available for parts
SELECT DISTINCT
  jsonb_object_keys(jsonb_array_elements(id.ocr_structured_data->'חלקים')) as available_ocr_fields
FROM invoice_documents id
WHERE id.ocr_structured_data IS NOT NULL 
  AND jsonb_typeof(id.ocr_structured_data->'חלקים') = 'array'
LIMIT 20;