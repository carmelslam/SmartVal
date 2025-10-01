-- PHASE 2: FIELD EXTRACTION - STEP BY STEP APPROACH
-- Run each section separately to avoid timeout
-- Each step processes a manageable chunk

-- ============================================================================
-- STEP 1: ADD MISSING COLUMNS (Run this first)
-- ============================================================================

-- Add year column for display
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'extracted_year'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN extracted_year TEXT;
        RAISE NOTICE 'Added extracted_year column';
    END IF;
END $$;

-- Add model display column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'model_display'
    ) THEN
        ALTER TABLE catalog_items ADD COLUMN model_display TEXT;
        RAISE NOTICE 'Added model_display column';
    END IF;
END $$;

SELECT 'Step 1 Complete - Columns added' as status;