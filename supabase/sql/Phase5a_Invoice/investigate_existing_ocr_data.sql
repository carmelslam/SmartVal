-- Investigation Script: Check what OCR data actually exists in the database
-- Run this first to see the actual data structure before backfilling

-- 1. Check invoice_documents OCR data structure
SELECT 
    'invoice_documents OCR structure' as table_name,
    COUNT(*) as total_records,
    COUNT(ocr_structured_data) as records_with_ocr,
    AVG(jsonb_array_length(jsonb_path_query_array(ocr_structured_data, '$.חלקים'))) as avg_parts_per_invoice
FROM invoice_documents;

-- 2. Sample OCR data structure from invoice_documents
SELECT 
    id,
    filename,
    jsonb_pretty(ocr_structured_data) as sample_ocr_structure
FROM invoice_documents 
WHERE ocr_structured_data IS NOT NULL 
LIMIT 2;

-- 3. Check what's in invoice_lines metadata
SELECT 
    'invoice_lines metadata' as table_name,
    COUNT(*) as total_records,
    COUNT(metadata) as records_with_metadata,
    jsonb_object_keys(metadata) as metadata_keys
FROM invoice_lines 
WHERE metadata IS NOT NULL
LIMIT 5;

-- 4. Check what's in invoices metadata  
SELECT 
    'invoices metadata' as table_name,
    COUNT(*) as total_records,
    COUNT(metadata) as records_with_metadata,
    jsonb_pretty(metadata) as sample_metadata
FROM invoices 
WHERE metadata IS NOT NULL
LIMIT 2;

-- 5. Check relationships between tables
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.supplier_name,
    i.total_amount,
    COUNT(il.id) as line_count,
    COUNT(id.id) as document_count,
    bool_or(id.ocr_structured_data IS NOT NULL) as has_ocr_data
FROM invoices i
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
LEFT JOIN invoice_documents id ON id.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.supplier_name, i.total_amount
ORDER BY i.created_at DESC
LIMIT 10;

-- 6. Check specific OCR fields we need
SELECT 
    id.invoice_id,
    id.filename,
    -- Check for parts data
    jsonb_array_length(COALESCE(id.ocr_structured_data->'חלקים', '[]'::jsonb)) as parts_count,
    -- Check for supplier info
    id.ocr_structured_data->>'שם מוסך' as garage_name,
    id.ocr_structured_data->>'ח.פ מוסך' as tax_id,
    -- Check for totals
    id.ocr_structured_data->>'סהכ חלקים' as parts_total,
    id.ocr_structured_data->>'מע״מ' as vat_amount,
    -- Sample part with source info
    (id.ocr_structured_data->'חלקים'->0->>'מקור') as first_part_source,
    (id.ocr_structured_data->'חלקים'->0->>'מק״ט חלק') as first_part_code
FROM invoice_documents id
WHERE id.ocr_structured_data IS NOT NULL
LIMIT 5;