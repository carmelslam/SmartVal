-- SESSION 12: Add data_source to selected_parts only
-- Date: October 7, 2025
-- Purpose: Track WHERE selected parts came from
-- 
-- Data Source Values (Hebrew):
-- - 'קטלוג' = Catalog (Supabase catalog_items)
-- - 'אינטרנט' = Web (Make.com external API)
-- - 'אחר' = Other (OCR, manual entry, etc.)

DO $$ 
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selected_parts' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.selected_parts ADD COLUMN data_source TEXT DEFAULT 'קטלוג';
  END IF;
  
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'selected_parts_data_source_check'
  ) THEN
    ALTER TABLE public.selected_parts DROP CONSTRAINT selected_parts_data_source_check;
  END IF;
  
  -- Update existing NULL or invalid values to default
  UPDATE public.selected_parts 
  SET data_source = 'קטלוג' 
  WHERE data_source IS NULL OR data_source NOT IN ('קטלוג', 'אינטרנט', 'אחר');
  
  -- Add constraint
  ALTER TABLE public.selected_parts 
    ADD CONSTRAINT selected_parts_data_source_check 
    CHECK (data_source IN ('קטלוג', 'אינטרנט', 'אחר'));
END $$;
