-- Comprehensive Field Analysis for All Invoice Tables
-- Shows field population status and available OCR data

-- =====================================================
-- INVOICE_LINES TABLE ANALYSIS
-- =====================================================

SELECT 'INVOICE_LINES FIELD ANALYSIS' as analysis_type;

SELECT 
  'invoice_lines' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(invoice_id) as has_invoice_id,
  COUNT(line_number) as has_line_number,
  COUNT(item_description) as has_item_description,
  COUNT(item_code) as has_item_code,
  COUNT(quantity) as has_quantity,
  COUNT(unit_price) as has_unit_price,
  COUNT(discount_amount) as has_discount_amount,
  COUNT(line_total) as has_line_total,
  COUNT(metadata) as has_metadata,
  COUNT(created_by) as has_created_by,
  COUNT(updated_by) as has_updated_by,
  COUNT(created_at) as has_created_at,
  COUNT(updated_at) as has_updated_at,
  COUNT(item_category) as has_item_category,
  COUNT(vat_rate) as has_vat_rate,
  COUNT(calculation_method) as has_calculation_method,
  COUNT(notes) as has_notes,
  COUNT(source) as has_source,
  COUNT(catalog_code) as has_catalog_code
FROM invoice_lines;

-- Show sample values for key fields
SELECT 'INVOICE_LINES SAMPLE VALUES' as section;
SELECT 
  item_category,
  COUNT(*) as count
FROM invoice_lines 
WHERE item_category IS NOT NULL
GROUP BY item_category
ORDER BY count DESC;

SELECT 
  source,
  COUNT(*) as count
FROM invoice_lines 
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC;

-- =====================================================
-- INVOICES TABLE ANALYSIS  
-- =====================================================

SELECT 'INVOICES FIELD ANALYSIS' as analysis_type;

SELECT 
  'invoices' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(invoice_number) as has_invoice_number,
  COUNT(supplier_name) as has_supplier_name,
  COUNT(supplier_tax_id) as has_supplier_tax_id,
  COUNT(invoice_date) as has_invoice_date,
  COUNT(due_date) as has_due_date,
  COUNT(issue_date) as has_issue_date,
  COUNT(total_before_tax) as has_total_before_tax,
  COUNT(tax_amount) as has_tax_amount,
  COUNT(total_amount) as has_total_amount,
  COUNT(currency) as has_currency,
  COUNT(status) as has_status,
  COUNT(invoice_type) as has_invoice_type,
  COUNT(metadata) as has_metadata,
  COUNT(created_by) as has_created_by,
  COUNT(updated_by) as has_updated_by,
  COUNT(created_at) as has_created_at,
  COUNT(updated_at) as has_updated_at,
  COUNT(case_id) as has_case_id
FROM invoices;

-- Show sample values for key fields
SELECT 'INVOICES SAMPLE VALUES' as section;
SELECT 
  status,
  COUNT(*) as count
FROM invoices 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

SELECT 
  invoice_type,
  COUNT(*) as count
FROM invoices 
WHERE invoice_type IS NOT NULL
GROUP BY invoice_type
ORDER BY count DESC;

-- =====================================================
-- INVOICE_SUPPLIERS TABLE ANALYSIS
-- =====================================================

SELECT 'INVOICE_SUPPLIERS FIELD ANALYSIS' as analysis_type;

SELECT 
  'invoice_suppliers' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(name) as has_name,
  COUNT(tax_id) as has_tax_id,
  COUNT(business_number) as has_business_number,
  COUNT(address) as has_address,
  COUNT(city) as has_city,
  COUNT(postal_code) as has_postal_code,
  COUNT(phone) as has_phone,
  COUNT(email) as has_email,
  COUNT(website) as has_website,
  COUNT(total_invoices) as has_total_invoices,
  COUNT(total_amount) as has_total_amount,
  COUNT(average_invoice_amount) as has_average_invoice_amount,
  COUNT(last_invoice_date) as has_last_invoice_date,
  COUNT(metadata) as has_metadata,
  COUNT(created_at) as has_created_at,
  COUNT(updated_at) as has_updated_at
FROM invoice_suppliers;

-- =====================================================
-- AVAILABLE OCR DATA ANALYSIS
-- =====================================================

SELECT 'AVAILABLE OCR DATA' as analysis_type;

-- Count invoices with OCR data
SELECT 
  COUNT(*) as total_invoice_documents,
  COUNT(ocr_structured_data) as has_ocr_data,
  COUNT(CASE WHEN jsonb_typeof(ocr_structured_data->'חלקים') = 'array' THEN 1 END) as has_parts_data,
  COUNT(CASE WHEN jsonb_typeof(ocr_structured_data->'עבודות') = 'array' THEN 1 END) as has_works_data
FROM invoice_documents;

-- Show what OCR fields are available for invoice level data
SELECT 'OCR INVOICE LEVEL FIELDS' as section;
SELECT DISTINCT
  jsonb_object_keys(ocr_structured_data) as available_invoice_ocr_fields,
  COUNT(*) as field_count
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL
GROUP BY jsonb_object_keys(ocr_structured_data)
ORDER BY field_count DESC;

-- Show what OCR fields are available for parts
SELECT 'OCR PARTS FIELDS' as section;
SELECT DISTINCT
  jsonb_object_keys(jsonb_array_elements(ocr_structured_data->'חלקים')) as available_parts_ocr_fields,
  COUNT(*) as field_count
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
  AND jsonb_typeof(ocr_structured_data->'חלקים') = 'array'
GROUP BY jsonb_object_keys(jsonb_array_elements(ocr_structured_data->'חלקים'))
ORDER BY field_count DESC;

-- Sample OCR data structure
SELECT 'SAMPLE OCR DATA STRUCTURE' as section;
SELECT 
  filename,
  jsonb_pretty(ocr_structured_data) as sample_ocr_structure
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
LIMIT 2;