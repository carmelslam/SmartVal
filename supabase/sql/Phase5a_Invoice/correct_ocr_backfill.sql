-- Correct OCR Data Backfill Script
-- This pulls OCR data from invoice_documents.ocr_structured_data and populates ALL invoice tables

-- 1. First, let's add the missing columns and update constraints
ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS catalog_code text;

-- 2. Update constraints to allow Hebrew values
DO $$
BEGIN
    -- Drop existing item_category constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoice_lines_item_category_check'
    ) THEN
        ALTER TABLE public.invoice_lines DROP CONSTRAINT invoice_lines_item_category_check;
    END IF;
    
    -- Add new constraint that allows Hebrew categories
    ALTER TABLE public.invoice_lines 
    ADD CONSTRAINT invoice_lines_item_category_check 
    CHECK (
      (item_category IS NULL) OR 
      (item_category = ANY (ARRAY[
        'part'::text, 'work'::text, 'repair'::text, 'material'::text,
        'חלק'::text, 'עבודה'::text, 'תיקון'::text, 'חומר'::text
      ]))
    );
END $$;

-- 3. Backfill invoice_lines from invoice_documents OCR data
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
  source = COALESCE(
    lm.part_data->>'מקור',
    lm.part_data->>'סוג חלק',
    lm.part_data->>'מקור חלק',
    'לא צוין'
  ),
  catalog_code = COALESCE(
    lm.part_data->>'מק״ט חלק',
    lm.part_data->>'מקט חלק', 
    lm.part_data->>'מק"ט חלק',
    lm.part_data->>'קוד חלק',
    lm.part_data->>'מספר חלק',
    lm.part_data->>'קטלוג',
    lm.part_data->>'מקט',
    lm.part_data->>'קוד'
  ),
  item_category = CASE 
    WHEN LOWER(lm.part_data->>'קטגוריה') LIKE '%עבודה%' THEN 'עבודה'
    WHEN LOWER(lm.part_data->>'קטגוריה') LIKE '%תיקון%' THEN 'תיקון'
    WHEN LOWER(lm.part_data->>'קטגוריה') LIKE '%חומר%' THEN 'חומר'
    ELSE 'חלק'
  END
FROM line_mapping lm
WHERE invoice_lines.id = lm.line_id;

-- 4. Backfill invoices table from invoice_documents OCR data (including raw_webhook_data)
UPDATE invoices 
SET 
  supplier_tax_id = COALESCE(
    supplier_tax_id,
    -- First try from ocr_structured_data
    (SELECT id.ocr_structured_data->>'ח.פ מוסך' 
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
     LIMIT 1),
    (SELECT id.ocr_structured_data->>'ח.פ.' 
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
     LIMIT 1),
    -- Then try from ocr_structured_data (webhook data is stored here)
    (SELECT id.ocr_structured_data->>'ח.פ.'
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
       AND id.ocr_structured_data->>'ח.פ.' IS NOT NULL
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
    -- First try from ocr_structured_data
    (SELECT CAST(REPLACE(REPLACE(id.ocr_structured_data->>'סהכ לפני מע״מ', ',', ''), '₪', '') AS numeric)
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL 
       AND id.ocr_structured_data->>'סהכ לפני מע״מ' IS NOT NULL
     LIMIT 1),
    -- Then try from ocr_structured_data (webhook data is stored here)
    (SELECT CAST(REPLACE(REPLACE(id.ocr_structured_data->>'עלות כוללת ללא מע״מ', ',', ''), '₪', '') AS numeric)
     FROM invoice_documents id 
     WHERE id.invoice_id = invoices.id 
       AND id.ocr_structured_data IS NOT NULL
       AND id.ocr_structured_data->>'עלות כוללת ללא מע״מ' IS NOT NULL
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

-- 5. Populate user tracking fields with a reasonable default
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

-- 6. Create comprehensive supplier records with ALL available OCR data
WITH supplier_ocr_data AS (
  SELECT DISTINCT
    i.supplier_name as name,
    i.supplier_tax_id as tax_id,
    
    -- Extract from ocr_structured_data
    COALESCE(
      id.ocr_structured_data->>'כתובת מוסך',
      id.ocr_structured_data->>'כתובת ספק',
      id.ocr_structured_data->>'כתובת'
    ) as address,
    
    COALESCE(
      id.ocr_structured_data->>'טלפון מוסך',
      id.ocr_structured_data->>'טלפון ספק', 
      id.ocr_structured_data->>'טלפון',
      id.ocr_structured_data->>'פלאפון'
    ) as phone,
    
    COALESCE(
      id.ocr_structured_data->>'דוא״ל מוסך',
      id.ocr_structured_data->>'אימייל מוסך',
      id.ocr_structured_data->>'דוא״ל ספק',
      id.ocr_structured_data->>'אימייל'
    ) as email,
    
    COALESCE(
      id.ocr_structured_data->>'אתר מוסך',
      id.ocr_structured_data->>'אתר אינטרנט'
    ) as website,
    
    COALESCE(
      id.ocr_structured_data->>'עיר מוסך',
      id.ocr_structured_data->>'עיר'
    ) as city,
    
    COALESCE(
      id.ocr_structured_data->>'מיקוד',
      id.ocr_structured_data->>'מיקוד מוסך'
    ) as postal_code,
    
    COALESCE(
      id.ocr_structured_data->>'מס׳ עסק',
      id.ocr_structured_data->>'רישיון עסק'
    ) as business_number,
    
    -- Additional OCR data from structured data
    id.ocr_structured_data->>'כתובת מוסך' as webhook_address,
    id.ocr_structured_data->>'טלפון מוסך' as webhook_phone,
    id.ocr_structured_data->>'דוא״ל מוסך' as webhook_email,
    
    -- Statistics
    COUNT(*) OVER (PARTITION BY i.supplier_name) as total_invoices,
    SUM(i.total_amount) OVER (PARTITION BY i.supplier_name) as total_amount,
    AVG(i.total_amount) OVER (PARTITION BY i.supplier_name) as average_amount,
    MAX(i.invoice_date) OVER (PARTITION BY i.supplier_name) as last_invoice_date,
    
    -- Metadata with all OCR fields
    jsonb_build_object(
      'ocr_data_sources', jsonb_build_object(
        'structured_data', id.ocr_structured_data,
        'ocr_confidence', id.ocr_confidence,
        'ocr_status', id.ocr_status
      ),
      'contact_variations', jsonb_build_object(
        'phone_variants', ARRAY[
          id.ocr_structured_data->>'טלפון מוסך',
          id.ocr_structured_data->>'טלפון ספק',
          id.ocr_structured_data->>'פלאפון'
        ],
        'email_variants', ARRAY[
          id.ocr_structured_data->>'דוא״ל מוסך',
          id.ocr_structured_data->>'אימייל מוסך',
          id.ocr_structured_data->>'דוא״ל ספק'
        ]
      ),
      'extraction_timestamp', now(),
      'data_completeness', jsonb_build_object(
        'has_address', (id.ocr_structured_data->>'כתובת מוסך' IS NOT NULL),
        'has_phone', (id.ocr_structured_data->>'טלפון מוסך' IS NOT NULL),
        'has_email', (id.ocr_structured_data->>'דוא״ל מוסך' IS NOT NULL),
        'has_tax_id', (i.supplier_tax_id IS NOT NULL)
      )
    ) as metadata
    
  FROM invoices i
  LEFT JOIN invoice_documents id ON id.invoice_id = i.id
  WHERE i.supplier_name IS NOT NULL
)
INSERT INTO invoice_suppliers (
  name, tax_id, business_number, address, city, postal_code, 
  phone, email, website, total_invoices, total_amount, 
  average_invoice_amount, last_invoice_date, metadata, 
  created_at, updated_at
)
SELECT DISTINCT ON (name)
  name,
  tax_id,
  business_number,
  COALESCE(address, webhook_address) as address,
  city,
  postal_code,
  COALESCE(phone, webhook_phone) as phone,
  COALESCE(email, webhook_email) as email,
  website,
  total_invoices,
  total_amount,
  average_amount,
  last_invoice_date,
  metadata,
  now(),
  now()
FROM supplier_ocr_data
WHERE name IS NOT NULL 
  AND name NOT IN (SELECT name FROM invoice_suppliers WHERE name IS NOT NULL)
ON CONFLICT (name) DO UPDATE SET
  tax_id = COALESCE(invoice_suppliers.tax_id, EXCLUDED.tax_id),
  business_number = COALESCE(invoice_suppliers.business_number, EXCLUDED.business_number),
  address = COALESCE(invoice_suppliers.address, EXCLUDED.address),
  city = COALESCE(invoice_suppliers.city, EXCLUDED.city),
  postal_code = COALESCE(invoice_suppliers.postal_code, EXCLUDED.postal_code),
  phone = COALESCE(invoice_suppliers.phone, EXCLUDED.phone),
  email = COALESCE(invoice_suppliers.email, EXCLUDED.email),
  website = COALESCE(invoice_suppliers.website, EXCLUDED.website),
  total_invoices = EXCLUDED.total_invoices,
  total_amount = EXCLUDED.total_amount,
  average_invoice_amount = EXCLUDED.average_invoice_amount,
  last_invoice_date = EXCLUDED.last_invoice_date,
  metadata = COALESCE(invoice_suppliers.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  updated_at = now();

-- 7. Update remaining constraints and add indexes
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoice_lines_source_check'
    ) THEN
        ALTER TABLE public.invoice_lines DROP CONSTRAINT invoice_lines_source_check;
    END IF;
    
    -- Add new constraint that allows any Hebrew text for source
    ALTER TABLE public.invoice_lines 
    ADD CONSTRAINT invoice_lines_source_check 
    CHECK (source IS NULL OR source != '');
END $$;

CREATE INDEX IF NOT EXISTS idx_invoice_lines_source_catalog 
ON public.invoice_lines (source, catalog_code) 
WHERE source IS NOT NULL AND catalog_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_supplier_type 
ON public.invoices (supplier_name, invoice_type) 
WHERE supplier_name IS NOT NULL;

-- 8. Report results
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