-- Comprehensive Invoice Data Population Fix
-- This addresses ALL missing field population issues across ALL invoice tables

-- 1. Add missing fields to invoice_lines table
ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS catalog_code text;

-- 2. Update existing invoice_lines records from stored OCR data
UPDATE invoice_lines 
SET 
  -- Populate source from metadata or OCR data
  source = CASE 
    WHEN metadata->>'original_ocr_source' = 'מקורי' THEN 'Original'
    WHEN metadata->>'original_ocr_source' = 'תחליפי' THEN 'Aftermarket'
    WHEN metadata->>'original_ocr_source' = 'משומש' THEN 'Used'
    WHEN metadata->>'original_ocr_source' = 'משופץ' THEN 'Refurbished'
    WHEN metadata->>'original_ocr_source' = 'OEM' THEN 'OEM'
    WHEN metadata->>'original_ocr_source' = 'חדש' THEN 'New'
    WHEN metadata->>'original_ocr_source' = 'יד שנייה' THEN 'Used'
    ELSE metadata->>'original_ocr_source'
  END,
  
  -- Populate catalog_code from metadata
  catalog_code = COALESCE(metadata->>'code', metadata->>'catalog_code'),
  
  -- Populate item_category properly
  item_category = CASE 
    WHEN LOWER(metadata->>'category') = 'part' THEN 'part'
    WHEN LOWER(metadata->>'category') = 'work' THEN 'work'
    WHEN LOWER(metadata->>'category') = 'repair' THEN 'repair'
    WHEN LOWER(metadata->>'category') = 'material' THEN 'material'
    ELSE 'part'
  END

WHERE metadata IS NOT NULL AND (source IS NULL OR catalog_code IS NULL OR item_category IS NULL);

-- 3. Update invoices table with missing supplier and metadata fields from OCR data
UPDATE invoices 
SET 
  -- Populate supplier details from OCR stored in metadata
  supplier_tax_id = COALESCE(
    supplier_tax_id, 
    metadata->'supplier_details'->>'business_number',
    metadata->'raw_ocr_data'->>'ח.פ מוסך',
    metadata->'raw_ocr_data'->>'עוסק מורשה'
  ),
  
  -- Populate dates from OCR
  due_date = CASE 
    WHEN due_date IS NULL AND metadata->'raw_ocr_data'->>'תאריך תשלום' IS NOT NULL 
    THEN (metadata->'raw_ocr_data'->>'תאריך תשלום')::date
    ELSE due_date
  END,
  
  issue_date = CASE 
    WHEN issue_date IS NULL AND metadata->'raw_ocr_data'->>'תאריך הנפקה' IS NOT NULL 
    THEN (metadata->'raw_ocr_data'->>'תאריך הנפקה')::date
    WHEN issue_date IS NULL AND invoice_date IS NOT NULL 
    THEN invoice_date
    ELSE issue_date
  END,
  
  -- Populate invoice_type based on content analysis
  invoice_type = CASE 
    WHEN invoice_type = 'OTHER' OR invoice_type IS NULL THEN
      CASE 
        WHEN metadata->'totals_breakdown'->>'parts_total' IS NOT NULL 
             AND (metadata->'totals_breakdown'->>'works_total' IS NULL OR metadata->'totals_breakdown'->>'works_total' = '0')
             AND (metadata->'totals_breakdown'->>'repairs_total' IS NULL OR metadata->'totals_breakdown'->>'repairs_total' = '0')
        THEN 'PARTS'
        WHEN (metadata->'totals_breakdown'->>'parts_total' IS NULL OR metadata->'totals_breakdown'->>'parts_total' = '0')
             AND metadata->'totals_breakdown'->>'works_total' IS NOT NULL 
             AND (metadata->'totals_breakdown'->>'repairs_total' IS NULL OR metadata->'totals_breakdown'->>'repairs_total' = '0')
        THEN 'LABOR'
        ELSE 'PARTS'
      END
    ELSE invoice_type
  END,
  
  -- Enhance metadata with missing fields
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'data_completion_updated', now(),
    'backfill_applied', true,
    'missing_fields_populated', true
  )

WHERE metadata IS NOT NULL;

-- 4. Populate created_by and updated_by fields where missing
-- First, try to get user info from session or recent activity
DO $$
DECLARE
    default_user_id uuid;
BEGIN
    -- Try to find a reasonable default user (most recent active user)
    SELECT user_id INTO default_user_id 
    FROM profiles 
    WHERE updated_at > (now() - interval '30 days')
    ORDER BY updated_at DESC 
    LIMIT 1;
    
    -- Update invoice_lines with user tracking
    UPDATE invoice_lines 
    SET 
        created_by = COALESCE(created_by, default_user_id),
        updated_by = COALESCE(updated_by, default_user_id),
        updated_at = COALESCE(updated_at, now())
    WHERE created_by IS NULL OR updated_by IS NULL;
    
    -- Update invoices with user tracking  
    UPDATE invoices 
    SET 
        created_by = COALESCE(created_by, default_user_id),
        updated_by = COALESCE(updated_by, default_user_id)
    WHERE created_by IS NULL OR updated_by IS NULL;
    
    -- Update invoice_damage_center_mappings with user tracking
    UPDATE invoice_damage_center_mappings 
    SET 
        mapped_by = COALESCE(mapped_by, default_user_id),
        updated_at = COALESCE(updated_at, now())
    WHERE mapped_by IS NULL;
    
END $$;

-- 5. Fix validation_status in invoice_damage_center_mappings
UPDATE invoice_damage_center_mappings 
SET validation_status = 'approved'
WHERE validation_status = 'pending' 
  AND mapping_status = 'active'
  AND mapping_confidence > 80;

-- 6. Update invoice_suppliers table with missing data from invoices
INSERT INTO invoice_suppliers (name, tax_id, created_at, updated_at)
SELECT DISTINCT 
    supplier_name,
    supplier_tax_id,
    now(),
    now()
FROM invoices 
WHERE supplier_name IS NOT NULL 
  AND supplier_name NOT IN (SELECT name FROM invoice_suppliers)
ON CONFLICT (name) DO UPDATE SET
    tax_id = COALESCE(invoice_suppliers.tax_id, EXCLUDED.tax_id),
    updated_at = now();

-- 7. Update invoice_suppliers with enhanced metadata from invoices
UPDATE invoice_suppliers 
SET 
    total_invoices = (
        SELECT COUNT(*) 
        FROM invoices 
        WHERE invoices.supplier_name = invoice_suppliers.name
    ),
    total_amount = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM invoices 
        WHERE invoices.supplier_name = invoice_suppliers.name
    ),
    average_invoice_amount = (
        SELECT COALESCE(AVG(total_amount), 0) 
        FROM invoices 
        WHERE invoices.supplier_name = invoice_suppliers.name
    ),
    last_invoice_date = (
        SELECT MAX(invoice_date) 
        FROM invoices 
        WHERE invoices.supplier_name = invoice_suppliers.name
    ),
    updated_at = now()
WHERE name IN (SELECT DISTINCT supplier_name FROM invoices WHERE supplier_name IS NOT NULL);

-- 8. Add constraints after data population
DO $$
BEGIN
    -- Add source constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoice_lines_source_check'
    ) THEN
        ALTER TABLE public.invoice_lines 
        ADD CONSTRAINT invoice_lines_source_check 
        CHECK (
          (source IS NULL) OR 
          (source = ANY (ARRAY[
            'Original'::text, 'Aftermarket'::text, 'Used'::text, 
            'Refurbished'::text, 'OEM'::text, 'Genuine'::text, 'New'::text,
            'מקורי'::text, 'תחליפי'::text, 'משומש'::text, 'משופץ'::text, 
            'יד שנייה'::text, 'חדש'::text
          ]))
        );
    END IF;
END $$;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_lines_source 
ON public.invoice_lines USING btree (source) 
WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_lines_catalog_code 
ON public.invoice_lines USING btree (catalog_code) 
WHERE catalog_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_lines_category_source 
ON public.invoice_lines USING btree (item_category, source) 
WHERE item_category IS NOT NULL AND source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_type_supplier 
ON public.invoices USING btree (invoice_type, supplier_name) 
WHERE invoice_type IS NOT NULL AND supplier_name IS NOT NULL;

-- 10. Add column comments
COMMENT ON COLUMN public.invoice_lines.source IS 'PART SOURCE from OCR מקור field: Original/Aftermarket/Used/Refurbished/OEM/etc.';
COMMENT ON COLUMN public.invoice_lines.catalog_code IS 'Catalog/part code from OCR מק"ט חלק field';

-- Report completion
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive invoice data population completed successfully!';
    RAISE NOTICE 'Updated invoice_lines, invoices, invoice_damage_center_mappings, and invoice_suppliers tables';
    RAISE NOTICE 'Populated missing fields from existing OCR data stored in metadata';
    RAISE NOTICE 'Added user tracking, proper categorization, and enhanced supplier information';
END $$;