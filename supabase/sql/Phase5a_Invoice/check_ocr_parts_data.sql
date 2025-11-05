-- Check the actual OCR parts data to see what fields exist
SELECT 
  'PARTS OCR DATA' as section,
  part_data->>'תיאור' as description,
  part_data->>'מק״ט חלק' as part_code_field,
  part_data->>'שם חלק' as part_name,
  part_data->>'מקור' as source,
  jsonb_object_keys(part_data) as all_fields_in_part,
  ROW_NUMBER() OVER () as ocr_line_number
FROM invoices i,
LATERAL jsonb_array_elements(i.metadata->'original_ocr_data'->'חלקים') as part_data
WHERE i.metadata->'original_ocr_data'->'חלקים' IS NOT NULL;