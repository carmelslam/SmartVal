-- Fix email using the correct field name with apostrophe
UPDATE invoice_suppliers 
SET email = ocr_data.email_value
FROM (
  SELECT DISTINCT
    i.supplier_name,
    i.metadata->'original_ocr_data'->>'דוא''ל מוסך' as email_value
  FROM invoices i
  WHERE i.metadata->'original_ocr_data'->>'דוא''ל מוסך' IS NOT NULL
    AND i.metadata->'original_ocr_data'->>'דוא''ל מוסך' != ''
) ocr_data
WHERE invoice_suppliers.name = ocr_data.supplier_name;

-- Check final result
SELECT 
  'EMAIL FIXED' as section,
  name,
  email,
  CASE WHEN email IS NOT NULL THEN 'HAS EMAIL' ELSE 'NO EMAIL' END as email_status
FROM invoice_suppliers;