-- Check what email data exists in OCR
SELECT 
  'EMAIL DEBUG' as section,
  i.supplier_name,
  i.metadata->'original_ocr_data'->>'דוא״ל מוסך' as email_ocr_field,
  LENGTH(i.metadata->'original_ocr_data'->>'דוא״ל מוסך') as email_length,
  i.metadata->'original_ocr_data' ? 'דוא״ל מוסך' as has_email_key,
  jsonb_object_keys(i.metadata->'original_ocr_data') as all_ocr_keys
FROM invoices i
WHERE i.metadata->'original_ocr_data' IS NOT NULL;