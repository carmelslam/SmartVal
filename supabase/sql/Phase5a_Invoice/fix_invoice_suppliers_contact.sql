-- Fix invoice_suppliers missing contact info from OCR data

UPDATE invoice_suppliers 
SET 
  tax_id = COALESCE(invoice_suppliers.tax_id, ocr_data.supplier_tax_id),
  address = COALESCE(invoice_suppliers.address, ocr_data.address),
  phone = COALESCE(invoice_suppliers.phone, ocr_data.phone),
  email = COALESCE(invoice_suppliers.email, ocr_data.email)
FROM (
  SELECT DISTINCT
    i.supplier_name,
    i.supplier_tax_id,
    i.metadata->'original_ocr_data'->>'כתובת מוסך' as address,
    i.metadata->'original_ocr_data'->>'טלפון מוסך' as phone,
    i.metadata->'original_ocr_data'->>'דוא״ל מוסך' as email
  FROM invoices i
  WHERE i.metadata->'original_ocr_data' IS NOT NULL
    AND i.supplier_name IS NOT NULL
) ocr_data
WHERE invoice_suppliers.name = ocr_data.supplier_name;

-- Report results
SELECT 
  'SUPPLIER CONTACT INFO UPDATED' as section,
  COUNT(*) as total_suppliers,
  COUNT(tax_id) as has_tax_id,
  COUNT(address) as has_address, 
  COUNT(phone) as has_phone,
  COUNT(email) as has_email
FROM invoice_suppliers;