-- Debug why email didn't populate

-- Check what email data exists in OCR
SELECT 
  'EMAIL DEBUG' as section,
  i.supplier_name,
  i.metadata->'original_ocr_data'->>'דוא״ל מוסך' as email_ocr_field,
  LENGTH(i.metadata->'original_ocr_data'->>'דוא״ל מוסך') as email_length,
  is_email.email as current_supplier_email
FROM invoices i
LEFT JOIN invoice_suppliers is_email ON is_email.name = i.supplier_name
WHERE i.metadata->'original_ocr_data' IS NOT NULL;

-- Try to fix email manually if the field exists
UPDATE invoice_suppliers 
SET email = ocr_data.email_value
FROM (
  SELECT DISTINCT
    i.supplier_name,
    i.metadata->'original_ocr_data'->>'דוא״ל מוסך' as email_value
  FROM invoices i
  WHERE i.metadata->'original_ocr_data'->>'דוא״ל מוסך' IS NOT NULL
    AND i.metadata->'original_ocr_data'->>'דוא״ל מוסך' != ''
) ocr_data
WHERE invoice_suppliers.name = ocr_data.supplier_name
  AND (invoice_suppliers.email IS NULL OR invoice_suppliers.email = '');

-- Check final result
SELECT 
  'FINAL EMAIL CHECK' as section,
  name,
  email,
  CASE WHEN email IS NOT NULL THEN 'HAS EMAIL' ELSE 'NO EMAIL' END as email_status
FROM invoice_suppliers;