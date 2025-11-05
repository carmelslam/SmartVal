-- Rename issue_date field to invoice_number in invoices table
-- Note: We already have invoice_date field for the actual date

-- Check what's currently in the issue_date field
SELECT 
  'CURRENT ISSUE_DATE VALUES' as section,
  issue_date,
  invoice_date,
  invoice_number,
  COUNT(*) as count
FROM invoices 
GROUP BY issue_date, invoice_date, invoice_number
ORDER BY count DESC;

-- Rename the column from issue_date to invoice_number
ALTER TABLE public.invoices 
RENAME COLUMN issue_date TO invoice_number_from_issue_date;

-- Add comment to clarify the change
COMMENT ON COLUMN public.invoices.invoice_number_from_issue_date IS 'Renamed from issue_date - contains invoice number data, not date. Use invoice_date field for actual invoice date.';

-- Show final structure
SELECT 
  'FINAL STRUCTURE' as section,
  invoice_number,
  invoice_number_from_issue_date,
  invoice_date,
  due_date
FROM invoices
LIMIT 5;