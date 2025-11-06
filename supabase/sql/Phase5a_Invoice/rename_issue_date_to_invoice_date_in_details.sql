-- Rename issue_date field to invoice_date in invoice_details table
-- Task: Change field name from issue_date to invoice_date for consistency

-- Check current structure and data
SELECT 
  'CURRENT STRUCTURE' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_details' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current data with issue_date field (both empty and filled)
SELECT 
  'CURRENT DATA SAMPLE' as section,
  id,
  issue_date,
  CASE WHEN issue_date IS NULL THEN 'EMPTY' ELSE 'FILLED' END as status,
  COUNT(*) OVER() as total_records
FROM invoice_details 
LIMIT 10;

-- Rename the column from issue_date to invoice_date
ALTER TABLE public.invoice_details 
RENAME COLUMN issue_date TO invoice_date;

-- Add comment to clarify the change
COMMENT ON COLUMN public.invoice_details.invoice_date IS 'Renamed from issue_date - contains the actual invoice date';

-- Verify the change
SELECT 
  'AFTER RENAME' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_details' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show data with new field name (both empty and filled)
SELECT 
  'FINAL DATA SAMPLE' as section,
  id,
  invoice_date,
  CASE WHEN invoice_date IS NULL THEN 'EMPTY' ELSE 'FILLED' END as status,
  COUNT(*) OVER() as total_records
FROM invoice_details 
LIMIT 10;