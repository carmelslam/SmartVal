-- Populate empty invoice_date field in invoice_documents table from invoices table
-- Task: Fill invoice_date in invoice_documents from corresponding invoices.invoice_date

-- First, check current state of empty invoice_date fields
SELECT 
  'CURRENT STATE' as section,
  COUNT(*) as total_documents,
  COUNT(CASE WHEN invoice_date IS NULL THEN 1 END) as empty_invoice_dates,
  COUNT(CASE WHEN invoice_date IS NOT NULL THEN 1 END) as filled_invoice_dates
FROM invoice_documents;

-- Show some examples of what we're about to update
SELECT 
  'PREVIEW OF UPDATES' as section,
  id.id,
  id.case_id,
  id.plate,
  id.invoice_date as current_invoice_date,
  i.invoice_date as invoices_table_date,
  i.id as invoice_id
FROM invoice_documents id
LEFT JOIN invoices i ON (
  i.case_id = id.case_id 
  AND i.plate = id.plate
)
WHERE id.invoice_date IS NULL
LIMIT 10;

-- Update empty invoice_date fields from invoices table
-- Match by case_id and plate (most reliable identifiers)
UPDATE invoice_documents 
SET invoice_date = invoices.invoice_date,
    updated_at = NOW()
FROM invoices
WHERE invoice_documents.case_id = invoices.case_id 
  AND invoice_documents.plate = invoices.plate
  AND invoice_documents.invoice_date IS NULL
  AND invoices.invoice_date IS NOT NULL;

-- Show results after update
SELECT 
  'AFTER UPDATE' as section,
  COUNT(*) as total_documents,
  COUNT(CASE WHEN invoice_date IS NULL THEN 1 END) as empty_invoice_dates,
  COUNT(CASE WHEN invoice_date IS NOT NULL THEN 1 END) as filled_invoice_dates
FROM invoice_documents;

-- Show any remaining empty dates (these might need manual review)
SELECT 
  'REMAINING EMPTY DATES' as section,
  id,
  case_id,
  plate,
  filename,
  created_at
FROM invoice_documents 
WHERE invoice_date IS NULL
ORDER BY created_at DESC
LIMIT 20;