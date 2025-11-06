-- Populate invoice_number_from_issue_date field in invoices table with invoice_date
-- The invoice_details view uses this field as invoice_date

-- Check current state
SELECT 
  'CURRENT STATE' as section,
  COUNT(*) as total_invoices,
  COUNT(CASE WHEN invoice_number_from_issue_date IS NULL THEN 1 END) as empty_issue_dates,
  COUNT(CASE WHEN invoice_number_from_issue_date IS NOT NULL THEN 1 END) as filled_issue_dates,
  COUNT(CASE WHEN invoice_date IS NULL THEN 1 END) as empty_invoice_dates,
  COUNT(CASE WHEN invoice_date IS NOT NULL THEN 1 END) as filled_invoice_dates
FROM invoices;

-- Show current data
SELECT 
  'CURRENT DATA' as section,
  id,
  case_id,
  plate,
  invoice_date,
  invoice_number_from_issue_date,
  invoice_number
FROM invoices 
LIMIT 10;

-- Update invoice_number_from_issue_date with invoice_date values
UPDATE invoices 
SET invoice_number_from_issue_date = invoice_date,
    updated_at = NOW()
WHERE invoice_number_from_issue_date IS NULL 
  AND invoice_date IS NOT NULL;

-- Show results after update
SELECT 
  'AFTER UPDATE' as section,
  COUNT(*) as total_invoices,
  COUNT(CASE WHEN invoice_number_from_issue_date IS NULL THEN 1 END) as empty_issue_dates,
  COUNT(CASE WHEN invoice_number_from_issue_date IS NOT NULL THEN 1 END) as filled_issue_dates
FROM invoices;

-- Verify invoice_details view now shows filled dates
SELECT 
  'INVOICE_DETAILS VIEW AFTER UPDATE' as section,
  COUNT(*) as total_details,
  COUNT(CASE WHEN invoice_date IS NULL THEN 1 END) as empty_invoice_dates,
  COUNT(CASE WHEN invoice_date IS NOT NULL THEN 1 END) as filled_invoice_dates
FROM invoice_details;