-- Add source field to invoice_lines table  
-- IMPORTANT: This field captures the PART SOURCE from OCR "מקור" field
-- Values like: Original, Aftermarket, Used, Refurbished, OEM, etc.
-- This is NOT for data source tracking - it's about the physical part origin

-- Add the source field for part origin (Original/Aftermarket/Used/etc.)
ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS source text;

-- Add catalog_code field for מק"ט חלק data
ALTER TABLE public.invoice_lines 
ADD COLUMN IF NOT EXISTS catalog_code text;

-- Add constraint for part source values (with proper PostgreSQL syntax)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoice_lines_source_check'
    ) THEN
        ALTER TABLE public.invoice_lines 
        ADD CONSTRAINT invoice_lines_source_check 
        CHECK (
          (source IS NULL) OR 
          (source = ANY (ARRAY[
            'Original'::text,
            'Aftermarket'::text, 
            'Used'::text,
            'Refurbished'::text,
            'OEM'::text,
            'Genuine'::text,
            'New'::text,
            'מקורי'::text,
            'תחליפי'::text,
            'משומש'::text,
            'משופץ'::text,
            'יד שנייה'::text,
            'חדש'::text
          ]))
        );
    END IF;
END $$;

-- Create index for source field 
CREATE INDEX IF NOT EXISTS idx_invoice_lines_source 
ON public.invoice_lines USING btree (source) 
WHERE source IS NOT NULL;

-- Create index for catalog_code field 
CREATE INDEX IF NOT EXISTS idx_invoice_lines_catalog_code 
ON public.invoice_lines USING btree (catalog_code) 
WHERE catalog_code IS NOT NULL;

-- Add catalog_code to the full-text search index
CREATE INDEX IF NOT EXISTS idx_invoice_lines_catalog_search 
ON public.invoice_lines USING gin (catalog_code gin_trgm_ops) 
WHERE catalog_code IS NOT NULL;

-- Update the schema documentation
COMMENT ON COLUMN public.invoice_lines.source IS 'PART SOURCE from OCR מקור field: Original/Aftermarket/Used/Refurbished/OEM/etc. - describes the physical origin of the part, not data source';
COMMENT ON COLUMN public.invoice_lines.catalog_code IS 'Catalog/part code from OCR מק"ט חלק field';