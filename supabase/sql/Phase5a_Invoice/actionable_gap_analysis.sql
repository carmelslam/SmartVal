-- ACTIONABLE GAP ANALYSIS - Shows exactly what's missing and can be fixed
-- This tells us WHAT TO DO, not just statistics

-- =====================================================
-- 1. INVOICE LINES - MISSING DATA THAT CAN BE FIXED
-- =====================================================

-- How many invoice lines are missing source data but have OCR data available?
SELECT 'MISSING SOURCE DATA - CAN BE FIXED' as issue;
SELECT 
  COUNT(il.*) as lines_missing_source,
  COUNT(CASE WHEN id.ocr_structured_data IS NOT NULL THEN 1 END) as lines_with_ocr_available
FROM invoice_lines il
LEFT JOIN invoice_documents id ON id.invoice_id = il.invoice_id
WHERE il.source IS NULL;

-- How many invoice lines are missing catalog_code but have OCR data?
SELECT 'MISSING CATALOG CODE - CAN BE FIXED' as issue;
SELECT 
  COUNT(il.*) as lines_missing_catalog_code,
  COUNT(CASE WHEN id.ocr_structured_data IS NOT NULL THEN 1 END) as lines_with_ocr_available
FROM invoice_lines il
LEFT JOIN invoice_documents id ON id.invoice_id = il.invoice_id
WHERE il.catalog_code IS NULL;

-- =====================================================
-- 2. INVOICES - MISSING DATA THAT CAN BE FIXED
-- =====================================================

-- Missing supplier tax IDs but OCR data exists
SELECT 'MISSING SUPPLIER TAX ID - CAN BE FIXED' as issue;
SELECT 
  COUNT(i.*) as invoices_missing_tax_id,
  COUNT(CASE WHEN id.ocr_structured_data IS NOT NULL THEN 1 END) as invoices_with_ocr_available
FROM invoices i
LEFT JOIN invoice_documents id ON id.invoice_id = i.id
WHERE i.supplier_tax_id IS NULL;

-- Missing totals but OCR data exists  
SELECT 'MISSING TOTALS - CAN BE FIXED' as issue;
SELECT 
  COUNT(CASE WHEN i.total_before_tax IS NULL THEN 1 END) as missing_total_before_tax,
  COUNT(CASE WHEN i.tax_amount IS NULL THEN 1 END) as missing_tax_amount,
  COUNT(CASE WHEN i.total_amount IS NULL THEN 1 END) as missing_total_amount,
  COUNT(CASE WHEN id.ocr_structured_data IS NOT NULL THEN 1 END) as invoices_with_ocr_available
FROM invoices i
LEFT JOIN invoice_documents id ON id.invoice_id = i.id;

-- =====================================================
-- 3. INVOICE SUPPLIERS - MISSING CONTACT DATA
-- =====================================================

-- Suppliers missing contact info but exist in OCR data
SELECT 'MISSING SUPPLIER CONTACT INFO - CAN BE FIXED' as issue;
SELECT 
  COUNT(*) as total_suppliers,
  COUNT(CASE WHEN phone IS NULL THEN 1 END) as missing_phone,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as missing_email,
  COUNT(CASE WHEN address IS NULL THEN 1 END) as missing_address,
  COUNT(CASE WHEN tax_id IS NULL THEN 1 END) as missing_tax_id
FROM invoice_suppliers;

-- =====================================================
-- 4. SHOW SAMPLE OCR DATA WE CAN USE
-- =====================================================

-- Sample OCR parts data that can populate invoice_lines
SELECT 'SAMPLE OCR PARTS DATA AVAILABLE' as data_source;
SELECT 
  jsonb_array_elements(ocr_structured_data->'חלקים') as sample_part_data
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
  AND jsonb_typeof(ocr_structured_data->'חלקים') = 'array'
LIMIT 3;

-- Sample OCR supplier data that can populate invoice_suppliers
SELECT 'SAMPLE OCR SUPPLIER DATA AVAILABLE' as data_source;
SELECT DISTINCT
  ocr_structured_data->>'שם מוסך' as supplier_name,
  ocr_structured_data->>'ח.פ מוסך' as tax_id,
  ocr_structured_data->>'טלפון מוסך' as phone,
  ocr_structured_data->>'כתובת מוסך' as address,
  ocr_structured_data->>'דוא״ל מוסך' as email
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
LIMIT 5;

-- =====================================================
-- 5. PRIORITY FIXES NEEDED
-- =====================================================

-- Show exactly which invoices need fixing
SELECT 'INVOICES THAT NEED FIXING' as priority;
SELECT 
  i.id,
  i.invoice_number,
  i.supplier_name,
  CASE WHEN i.supplier_tax_id IS NULL THEN 'MISSING TAX ID' END as missing_tax_id,
  CASE WHEN i.total_before_tax IS NULL THEN 'MISSING TOTAL' END as missing_total,
  CASE WHEN id.ocr_structured_data IS NOT NULL THEN 'HAS OCR DATA' END as has_ocr
FROM invoices i
LEFT JOIN invoice_documents id ON id.invoice_id = i.id
WHERE (i.supplier_tax_id IS NULL OR i.total_before_tax IS NULL)
  AND id.ocr_structured_data IS NOT NULL
LIMIT 10;

-- Show exactly which invoice lines need fixing
SELECT 'INVOICE LINES THAT NEED FIXING' as priority;
SELECT 
  il.id,
  il.invoice_id,
  il.line_number,
  il.description,
  CASE WHEN il.source IS NULL THEN 'MISSING SOURCE' END as missing_source,
  CASE WHEN il.catalog_code IS NULL THEN 'MISSING CATALOG' END as missing_catalog,
  CASE WHEN id.ocr_structured_data IS NOT NULL THEN 'HAS OCR DATA' END as has_ocr
FROM invoice_lines il
LEFT JOIN invoice_documents id ON id.invoice_id = il.invoice_id
WHERE (il.source IS NULL OR il.catalog_code IS NULL)
  AND id.ocr_structured_data IS NOT NULL
LIMIT 10;