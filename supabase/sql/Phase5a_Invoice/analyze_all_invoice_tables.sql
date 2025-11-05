-- COMPREHENSIVE ANALYSIS OF ALL INVOICE TABLES
-- Shows field population status and available OCR data for ALL invoice-related tables

-- =====================================================
-- 1. INVOICE_LINES TABLE ANALYSIS
-- =====================================================
SELECT '=== INVOICE_LINES TABLE ANALYSIS ===' as section;

SELECT 
  'invoice_lines' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(invoice_id) as has_invoice_id, 
  COUNT(line_number) as has_line_number,
  COUNT(description) as has_description,
  COUNT(part_id) as has_part_id,
  COUNT(quantity) as has_quantity,
  COUNT(unit_price) as has_unit_price,
  COUNT(discount_percent) as has_discount_percent,
  COUNT(line_total) as has_line_total,
  COUNT(source) as has_source,
  COUNT(catalog_code) as has_catalog_code,
  COUNT(metadata) as has_metadata,
  COUNT(created_by) as has_created_by,
  COUNT(updated_by) as has_updated_by,
  COUNT(item_category) as has_item_category,
  COUNT(category_confidence) as has_category_confidence,
  COUNT(category_method) as has_category_method,
  COUNT(category_suggestions) as has_category_suggestions
FROM invoice_lines;

-- Sample values for invoice_lines
SELECT 'INVOICE_LINES SAMPLE VALUES' as subsection;
SELECT item_category, COUNT(*) as count FROM invoice_lines WHERE item_category IS NOT NULL GROUP BY item_category ORDER BY count DESC;
SELECT source, COUNT(*) as count FROM invoice_lines WHERE source IS NOT NULL GROUP BY source ORDER BY count DESC LIMIT 10;

-- =====================================================  
-- 2. INVOICES TABLE ANALYSIS
-- =====================================================
SELECT '=== INVOICES TABLE ANALYSIS ===' as section;

SELECT 
  'invoices' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(case_id) as has_case_id,
  COUNT(plate) as has_plate,
  COUNT(invoice_number) as has_invoice_number,
  COUNT(invoice_type) as has_invoice_type,
  COUNT(supplier_name) as has_supplier_name,
  COUNT(supplier_tax_id) as has_supplier_tax_id,
  COUNT(issue_date) as has_issue_date,
  COUNT(due_date) as has_due_date,
  COUNT(status) as has_status,
  COUNT(total_before_tax) as has_total_before_tax,
  COUNT(tax_amount) as has_tax_amount,
  COUNT(total_amount) as has_total_amount,
  COUNT(metadata) as has_metadata,
  COUNT(created_by) as has_created_by,
  COUNT(updated_by) as has_updated_by,
  COUNT(invoice_date) as has_invoice_date
FROM invoices;

-- Sample values for invoices
SELECT 'INVOICES SAMPLE VALUES' as subsection;
SELECT status, COUNT(*) as count FROM invoices WHERE status IS NOT NULL GROUP BY status ORDER BY count DESC;
SELECT invoice_type, COUNT(*) as count FROM invoices WHERE invoice_type IS NOT NULL GROUP BY invoice_type ORDER BY count DESC;

-- =====================================================
-- 3. INVOICE_DAMAGE_CENTER_MAPPINGS TABLE ANALYSIS  
-- =====================================================
SELECT '=== INVOICE_DAMAGE_CENTER_MAPPINGS TABLE ANALYSIS ===' as section;

SELECT 
  'invoice_damage_center_mappings' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(invoice_id) as has_invoice_id,
  COUNT(invoice_line_id) as has_invoice_line_id,
  COUNT(case_id) as has_case_id,
  COUNT(damage_center_id) as has_damage_center_id,
  COUNT(damage_center_name) as has_damage_center_name,
  COUNT(field_type) as has_field_type,
  COUNT(field_index) as has_field_index,
  COUNT(field_id) as has_field_id,
  COUNT(original_field_data) as has_original_field_data,
  COUNT(mapped_data) as has_mapped_data,
  COUNT(mapping_status) as has_mapping_status,
  COUNT(is_user_modified) as has_is_user_modified,
  COUNT(user_modifications) as has_user_modifications,
  COUNT(mapping_confidence) as has_mapping_confidence,
  COUNT(validation_status) as has_validation_status,
  COUNT(mapped_by) as has_mapped_by
FROM invoice_damage_center_mappings;

-- Sample values for mappings
SELECT 'INVOICE_DAMAGE_CENTER_MAPPINGS SAMPLE VALUES' as subsection;
SELECT mapping_status, COUNT(*) as count FROM invoice_damage_center_mappings WHERE mapping_status IS NOT NULL GROUP BY mapping_status ORDER BY count DESC;
SELECT validation_status, COUNT(*) as count FROM invoice_damage_center_mappings WHERE validation_status IS NOT NULL GROUP BY validation_status ORDER BY count DESC;

-- =====================================================
-- 4. INVOICE_SUPPLIERS TABLE ANALYSIS
-- =====================================================
SELECT '=== INVOICE_SUPPLIERS TABLE ANALYSIS ===' as section;

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
  COUNT(category) as has_category,
  COUNT(subcategory) as has_subcategory,
  COUNT(is_preferred) as has_is_preferred,
  COUNT(discount_rate) as has_discount_rate,
  COUNT(payment_terms) as has_payment_terms,
  COUNT(total_invoices) as has_total_invoices,
  COUNT(total_amount) as has_total_amount,
  COUNT(average_invoice_amount) as has_average_invoice_amount,
  COUNT(last_invoice_date) as has_last_invoice_date,
  COUNT(metadata) as has_metadata,
  COUNT(notes) as has_notes,
  COUNT(created_by) as has_created_by,
  COUNT(updated_by) as has_updated_by
FROM invoice_suppliers;

-- Sample contact info availability  
SELECT 'INVOICE_SUPPLIERS CONTACT INFO' as subsection;
SELECT 
  COUNT(*) as total_suppliers,
  COUNT(phone) as has_phone,
  COUNT(email) as has_email,
  COUNT(address) as has_address,
  ROUND(COUNT(phone) * 100.0 / COUNT(*), 1) as phone_percentage,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 1) as email_percentage,
  ROUND(COUNT(address) * 100.0 / COUNT(*), 1) as address_percentage
FROM invoice_suppliers;

-- =====================================================
-- 5. INVOICE_DOCUMENTS TABLE ANALYSIS
-- =====================================================
SELECT '=== INVOICE_DOCUMENTS TABLE ANALYSIS ===' as section;

SELECT 
  'invoice_documents' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(invoice_id) as has_invoice_id,
  COUNT(case_id) as has_case_id,
  COUNT(plate) as has_plate,
  COUNT(filename) as has_filename,
  COUNT(file_size) as has_file_size,
  COUNT(mime_type) as has_mime_type,
  COUNT(storage_path) as has_storage_path,
  COUNT(storage_bucket) as has_storage_bucket,
  COUNT(ocr_status) as has_ocr_status,
  COUNT(ocr_raw_text) as has_ocr_raw_text,
  COUNT(ocr_structured_data) as has_ocr_structured_data,
  COUNT(ocr_confidence) as has_ocr_confidence,
  COUNT(language_detected) as has_language_detected,
  COUNT(processing_method) as has_processing_method,
  COUNT(processing_errors) as has_processing_errors,
  COUNT(uploaded_by) as has_uploaded_by,
  COUNT(invoice_date) as has_invoice_date
FROM invoice_documents;

-- OCR data availability
SELECT 'INVOICE_DOCUMENTS OCR STATUS' as subsection;
SELECT ocr_status, COUNT(*) as count FROM invoice_documents WHERE ocr_status IS NOT NULL GROUP BY ocr_status ORDER BY count DESC;
SELECT 
  COUNT(*) as total_docs,
  COUNT(ocr_structured_data) as has_ocr_data,
  COUNT(CASE WHEN jsonb_typeof(ocr_structured_data->'חלקים') = 'array' THEN 1 END) as has_parts_data,
  COUNT(CASE WHEN jsonb_typeof(ocr_structured_data->'עבודות') = 'array' THEN 1 END) as has_works_data,
  ROUND(COUNT(ocr_structured_data) * 100.0 / COUNT(*), 1) as ocr_percentage
FROM invoice_documents;

-- =====================================================
-- 6. INVOICE_VALIDATIONS TABLE ANALYSIS  
-- =====================================================
SELECT '=== INVOICE_VALIDATIONS TABLE ANALYSIS ===' as section;

SELECT 
  'invoice_validations' as table_name,
  COUNT(*) as total_records,
  COUNT(id) as has_id,
  COUNT(invoice_id) as has_invoice_id,
  COUNT(is_valid) as has_is_valid,
  COUNT(validation_errors) as has_validation_errors,
  COUNT(validation_warnings) as has_validation_warnings,
  COUNT(validation_score) as has_validation_score,
  COUNT(manual_corrections) as has_manual_corrections,
  COUNT(correction_notes) as has_correction_notes,
  COUNT(approval_status) as has_approval_status,
  COUNT(approval_required) as has_approval_required,
  COUNT(reviewed_by) as has_reviewed_by,
  COUNT(review_date) as has_review_date,
  COUNT(review_notes) as has_review_notes,
  COUNT(approved_by) as has_approved_by,
  COUNT(approval_date) as has_approval_date,
  COUNT(rejected_by) as has_rejected_by,
  COUNT(rejection_date) as has_rejection_date,
  COUNT(rules_applied) as has_rules_applied,
  COUNT(auto_validation_enabled) as has_auto_validation_enabled
FROM invoice_validations;

-- Validation status breakdown
SELECT 'INVOICE_VALIDATIONS STATUS' as subsection;
SELECT approval_status, COUNT(*) as count FROM invoice_validations WHERE approval_status IS NOT NULL GROUP BY approval_status ORDER BY count DESC;
SELECT is_valid, COUNT(*) as count FROM invoice_validations WHERE is_valid IS NOT NULL GROUP BY is_valid ORDER BY count DESC;

-- =====================================================
-- 7. AVAILABLE OCR DATA ANALYSIS
-- =====================================================
SELECT '=== AVAILABLE OCR DATA ANALYSIS ===' as section;

-- Show what OCR fields are available at invoice level
SELECT 'OCR INVOICE LEVEL FIELDS' as subsection;
SELECT DISTINCT
  jsonb_object_keys(ocr_structured_data) as available_invoice_ocr_fields,
  COUNT(*) as field_count
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL
GROUP BY jsonb_object_keys(ocr_structured_data)
ORDER BY field_count DESC;

-- Show what OCR fields are available for parts
SELECT 'OCR PARTS FIELDS' as subsection;
SELECT DISTINCT
  jsonb_object_keys(jsonb_array_elements(ocr_structured_data->'חלקים')) as available_parts_ocr_fields,
  COUNT(*) as field_count
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
  AND jsonb_typeof(ocr_structured_data->'חלקים') = 'array'
GROUP BY jsonb_object_keys(jsonb_array_elements(ocr_structured_data->'חלקים'))
ORDER BY field_count DESC;

-- Sample OCR supplier data
SELECT 'OCR SUPPLIER DATA SAMPLE' as subsection;
SELECT DISTINCT
  ocr_structured_data->>'שם מוסך' as garage_name,
  ocr_structured_data->>'ח.פ מוסך' as tax_id,
  ocr_structured_data->>'טלפון מוסך' as phone,
  ocr_structured_data->>'כתובת מוסך' as address,
  ocr_structured_data->>'דוא״ל מוסך' as email
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
  AND (ocr_structured_data->>'שם מוסך' IS NOT NULL 
       OR ocr_structured_data->>'ח.פ מוסך' IS NOT NULL)
LIMIT 10;

-- =====================================================
-- 8. CROSS-TABLE DATA RELATIONSHIPS
-- =====================================================
SELECT '=== CROSS-TABLE RELATIONSHIPS ===' as section;

-- Invoices with/without documents
SELECT 'INVOICES WITH/WITHOUT DOCUMENTS' as subsection;
SELECT 
  COUNT(DISTINCT i.id) as total_invoices,
  COUNT(DISTINCT CASE WHEN id.id IS NOT NULL THEN i.id END) as invoices_with_documents,
  COUNT(DISTINCT CASE WHEN id.ocr_structured_data IS NOT NULL THEN i.id END) as invoices_with_ocr,
  COUNT(DISTINCT CASE WHEN il.id IS NOT NULL THEN i.id END) as invoices_with_lines,
  COUNT(DISTINCT CASE WHEN iv.id IS NOT NULL THEN i.id END) as invoices_with_validations
FROM invoices i
LEFT JOIN invoice_documents id ON id.invoice_id = i.id
LEFT JOIN invoice_lines il ON il.invoice_id = i.id  
LEFT JOIN invoice_validations iv ON iv.invoice_id = i.id;

-- =====================================================
-- 9. SAMPLE OCR DATA STRUCTURE
-- =====================================================
SELECT '=== SAMPLE OCR DATA STRUCTURE ===' as section;
SELECT 
  filename,
  jsonb_pretty(ocr_structured_data) as sample_ocr_structure
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
LIMIT 2;