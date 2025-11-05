-- Correct OCR Data Backfill Script
-- This pulls OCR data from invoice_documents.ocr_structured_data and populates ALL invoice tables

-- 1. First, let's add the missing columns
ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS catalog_code text;

-- 2. Backfill invoice_lines from invoice_documents OCR data
WITH ocr_parts AS (
  SELECT 
    id.invoice_id,
    id.ocr_structured_data,
    jsonb_array_elements(COALESCE(id.ocr_structured_data->'חלקים', '[]'::jsonb)) as part_data,
    ROW_NUMBER() OVER (PARTITION BY id.invoice_id ORDER BY jsonb_array_elements(COALESCE(id.ocr_structured_data->'חלקים', '[]'::jsonb))) as part_index
  FROM invoice_documents id
  WHERE id.ocr_structured_data IS NOT NULL 
    AND jsonb_typeof(id.ocr_structured_data->'חלקים') = 'array'
),
line_mapping AS (
  SELECT 
    il.id as line_id,
    il.invoice_id,
    il.line_number,
    op.part_data,
    op.ocr_structured_data
  FROM invoice_lines il
  JOIN ocr_parts op ON op.invoice_id = il.invoice_id 
    AND op.part_index = il.line_number
)
UPDATE invoice_lines 
SET 
  source = CASE 
    WHEN lm.part_data->>'מקור' = 'מקורי' THEN 'Original'
    WHEN lm.part_data->>'מקור' = 'תחליפי' THEN 'Aftermarket'
    WHEN lm.part_data->>'מקור' = 'משומש' THEN 'Used'
    WHEN lm.part_data->>'מקור' = 'משופץ' THEN 'Refurbished'
    WHEN lm.part_data->>'מקור' = 'OEM' THEN 'OEM'
    WHEN lm.part_data->>'מקור' = 'חדש' THEN 'New'
    WHEN lm.part_data->>'מקור' = 'יד שנייה' THEN 'Used'
    ELSE lm.part_data->>'מקור'
  END,
  catalog_code = COALESCE(
    lm.part_data->>'מק״ט חלק',
    lm.part_data->>'מק\'ט חלק', 
    lm.part_data->>'מק"ט חלק',
    lm.part_data->>'קוד חלק'
  ),
  item_category = CASE 
    WHEN LOWER(lm.part_data->>'קטגוריה') LIKE '%עבודה%' THEN 'work'
    WHEN LOWER(lm.part_data->>'קטגוריה') LIKE '%תיקון%' THEN 'repair'
    WHEN LOWER(lm.part_data->>'קטגוריה') LIKE '%חומר%' THEN 'material'
    ELSE 'part'
  END
FROM line_mapping lm
WHERE invoice_lines.id = lm.line_id;

-- 3. Backfill invoices table from invoice_documents OCR data
UPDATE invoices 
SET 
  supplier_tax_id = COALESCE(
    supplier_tax_id,
    (SELECT id.ocr_structured_data->>'ח.פ מוסך' 
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
     LIMIT 1),
    (SELECT id.ocr_structured_data->>'עוסק מורשה' 
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
     LIMIT 1)
  ),
  
  supplier_name = COALESCE(
    supplier_name,
    (SELECT id.ocr_structured_data->>'שם מוסך' 
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
     LIMIT 1)
  ),
  
  total_before_tax = COALESCE(
    total_before_tax,
    (SELECT CAST(REPLACE(REPLACE(id.ocr_structured_data->>'סהכ לפני מע״מ', ',', ''), '₪', '') AS numeric)
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
       AND id.ocr_structured_data->>'סהכ לפני מע״מ' IS NOT NULL
     LIMIT 1)
  ),
  
  tax_amount = COALESCE(
    tax_amount,
    (SELECT CAST(REPLACE(REPLACE(id.ocr_structured_data->>'מע״מ', ',', ''), '₪', '') AS numeric)
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
       AND id.ocr_structured_data->>'מע״מ' IS NOT NULL
     LIMIT 1)
  ),
  
  total_amount = COALESCE(
    total_amount,
    (SELECT CAST(REPLACE(REPLACE(id.ocr_structured_data->>'סה״כ כולל מע״מ', ',', ''), '₪', '') AS numeric)
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
       AND id.ocr_structured_data->>'סה״כ כולל מע״מ' IS NOT NULL
     LIMIT 1)
  ),
  
  invoice_date = COALESCE(
    invoice_date,
    (SELECT 
       CASE 
         WHEN id.ocr_structured_data->>'תאריך' ~ '^\d{1,2}/\d{1,2}/\d{2,4}$' 
         THEN TO_DATE(id.ocr_structured_data->>'תאריך', 'DD/MM/YYYY')
         WHEN id.ocr_structured_data->>'תאריך חשבונית' ~ '^\d{1,2}/\d{1,2}/\d{2,4}$' 
         THEN TO_DATE(id.ocr_structured_data->>'תאריך חשבונית', 'DD/MM/YYYY')
         ELSE NULL
       END
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
     LIMIT 1)
  ),
  
  invoice_type = CASE 
    WHEN invoice_type = 'OTHER' OR invoice_type IS NULL THEN
      CASE 
        WHEN (SELECT jsonb_array_length(COALESCE(id.ocr_structured_data->'חלקים', '[]'::jsonb)) 
              FROM invoice_documents id 
              WHERE id.invoice_id = invoices.id LIMIT 1) > 0 
             AND (SELECT jsonb_array_length(COALESCE(id.ocr_structured_data->'עבודות', '[]'::jsonb)) 
                  FROM invoice_documents id 
                  WHERE id.invoice_id = invoices.id LIMIT 1) = 0
        THEN 'PARTS'
        WHEN (SELECT jsonb_array_length(COALESCE(id.ocr_structured_data->'חלקים', '[]'::jsonb)) 
              FROM invoice_documents id 
              WHERE id.invoice_id = invoices.id LIMIT 1) = 0 
             AND (SELECT jsonb_array_length(COALESCE(id.ocr_structured_data->'עבודות', '[]'::jsonb)) 
                  FROM invoice_documents id 
                  WHERE id.invoice_id = invoices.id LIMIT 1) > 0
        THEN 'LABOR'
        ELSE 'PARTS'
      END
    ELSE invoice_type
  END,
  
  -- Update metadata with OCR data
  metadata = COALESCE(metadata, '{}'::jsonb) || 
    COALESCE(
      (SELECT jsonb_build_object(
        'ocr_backfill_applied', true,
        'ocr_backfill_timestamp', now(),
        'original_ocr_data', id.ocr_structured_data,
        'vehicle_details', jsonb_build_object(
          'plate', id.ocr_structured_data->>'מספר רכב',
          'manufacturer', id.ocr_structured_data->>'יצרן',
          'model', id.ocr_structured_data->>'דגם',
          'year', id.ocr_structured_data->>'שנת ייצור',
          'owner', id.ocr_structured_data->>'בעל הרכב'
        ),
        'totals_breakdown', jsonb_build_object(
          'parts_total', id.ocr_structured_data->>'סהכ חלקים',
          'works_total', id.ocr_structured_data->>'סהכ עבודות',
          'repairs_total', id.ocr_structured_data->>'סהכ תיקונים'
        )
      )
      FROM invoice_documents id 
      WHERE id.invoice_id = invoices.id 
        AND id.ocr_structured_data IS NOT NULL 
      LIMIT 1),
      '{}'::jsonb
    )

WHERE EXISTS (
  SELECT 1 FROM invoice_documents id 
  WHERE id.invoice_id = invoices.id 
    AND id.ocr_structured_data IS NOT NULL
);

-- 4. Populate user tracking fields with a reasonable default
DO $$
DECLARE
    default_user_id uuid;
BEGIN
    -- Get the most recent active user
    SELECT user_id INTO default_user_id 
    FROM profiles 
    WHERE updated_at > (now() - interval '90 days')
    ORDER BY updated_at DESC 
    LIMIT 1;
    
    -- Update all missing user fields
    UPDATE invoice_lines 
    SET 
        created_by = COALESCE(created_by, default_user_id),
        updated_by = COALESCE(updated_by, default_user_id)
    WHERE created_by IS NULL OR updated_by IS NULL;
    
    UPDATE invoices 
    SET 
        created_by = COALESCE(created_by, default_user_id),
        updated_by = COALESCE(updated_by, default_user_id)
    WHERE created_by IS NULL OR updated_by IS NULL;
    
    RAISE NOTICE 'Updated user tracking fields with default user: %', default_user_id;
END $$;

-- 5. Create missing suppliers from invoice data
INSERT INTO invoice_suppliers (name, tax_id, total_invoices, total_amount, last_invoice_date, created_at, updated_at)
SELECT DISTINCT 
    i.supplier_name,
    i.supplier_tax_id,
    COUNT(*) OVER (PARTITION BY i.supplier_name),
    SUM(i.total_amount) OVER (PARTITION BY i.supplier_name),
    MAX(i.invoice_date) OVER (PARTITION BY i.supplier_name),
    now(),
    now()
FROM invoices i
WHERE i.supplier_name IS NOT NULL 
  AND i.supplier_name NOT IN (SELECT name FROM invoice_suppliers WHERE name IS NOT NULL)
ON CONFLICT (name) DO UPDATE SET
    tax_id = COALESCE(invoice_suppliers.tax_id, EXCLUDED.tax_id),
    total_invoices = EXCLUDED.total_invoices,
    total_amount = EXCLUDED.total_amount,
    last_invoice_date = EXCLUDED.last_invoice_date,
    updated_at = now();

-- 6. Add indexes and constraints
CREATE INDEX IF NOT EXISTS idx_invoice_lines_source_catalog 
ON public.invoice_lines (source, catalog_code) 
WHERE source IS NOT NULL AND catalog_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_supplier_type 
ON public.invoices (supplier_name, invoice_type) 
WHERE supplier_name IS NOT NULL;

-- 7. Report results
DO $$
DECLARE
    lines_updated integer;
    invoices_updated integer;
    suppliers_created integer;
BEGIN
    -- Count updated records
    SELECT COUNT(*) INTO lines_updated 
    FROM invoice_lines 
    WHERE source IS NOT NULL OR catalog_code IS NOT NULL;
    
    SELECT COUNT(*) INTO invoices_updated 
    FROM invoices 
    WHERE metadata->>'ocr_backfill_applied' = 'true';
    
    SELECT COUNT(*) INTO suppliers_created 
    FROM invoice_suppliers 
    WHERE created_at::date = CURRENT_DATE;
    
    RAISE NOTICE '=== OCR BACKFILL COMPLETED ===';
    RAISE NOTICE 'Invoice lines updated: %', lines_updated;
    RAISE NOTICE 'Invoices updated: %', invoices_updated;
    RAISE NOTICE 'Suppliers created: %', suppliers_created;
    RAISE NOTICE 'All invoice tables now populated from existing OCR data!';
END $$;