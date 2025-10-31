-- ============================================================================
-- Add invoice_date field to invoices and invoice_documents tables
-- ============================================================================
-- Purpose: Store actual invoice date (not upload date) for better display
-- Usage: Extract from helper.invoices[].תאריך or OCR data
-- Session: SESSION 88 - Invoice Assignment Architecture
-- ============================================================================

-- Add invoice_date field to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS invoice_date date NULL;

-- Add invoice_date field to invoice_documents table  
ALTER TABLE public.invoice_documents 
ADD COLUMN IF NOT EXISTS invoice_date date NULL;

-- Add index for performance on invoice_date queries
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date 
  ON public.invoices USING btree (invoice_date) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_invoice_documents_invoice_date 
  ON public.invoice_documents USING btree (invoice_date) TABLESPACE pg_default;

-- Add composite index for case_id + invoice_date
CREATE INDEX IF NOT EXISTS idx_invoices_case_invoice_date 
  ON public.invoices USING btree (case_id, invoice_date) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON COLUMN public.invoices.invoice_date IS 
'Actual invoice date from OCR or manual entry (not upload date). Extract from helper.invoices[].תאריך or ocr_structured_data.תאריך';

COMMENT ON COLUMN public.invoice_documents.invoice_date IS 
'Actual invoice date from OCR processing (not upload date). Should match invoices.invoice_date';

-- Sample update script to populate existing records (run after adding column)
/*
UPDATE public.invoices 
SET invoice_date = (ocr_structured_data->>'תאריך')::date 
WHERE ocr_structured_data->>'תאריך' IS NOT NULL 
  AND invoice_date IS NULL;

UPDATE public.invoice_documents 
SET invoice_date = (ocr_structured_data->>'תאריך')::date 
WHERE ocr_structured_data->>'תאריך' IS NOT NULL 
  AND invoice_date IS NULL;
*/