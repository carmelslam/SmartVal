-- Phase 5a Invoice Integration: Add Item Category to Invoice Lines
-- Session 74 - Task 1.8
-- Date: 2025-10-23
-- Purpose: Add categorization field for invoice line items (parts/works/repairs)
-- NOTE: Prepares for AI categorization module and dropdown filtering

-- ============================================================================
-- ADD ITEM_CATEGORY COLUMN TO INVOICE_LINES
-- ============================================================================

-- Add item_category column
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS item_category TEXT;

-- Add check constraint for valid categories
ALTER TABLE invoice_lines 
DROP CONSTRAINT IF EXISTS invoice_lines_item_category_check;

ALTER TABLE invoice_lines 
ADD CONSTRAINT invoice_lines_item_category_check 
CHECK (
  item_category IS NULL OR 
  item_category IN ('part', 'work', 'repair', 'material', 'other', 'uncategorized')
);

-- Set default value for existing rows
UPDATE invoice_lines 
SET item_category = 'uncategorized' 
WHERE item_category IS NULL;

-- ============================================================================
-- ADD AI CATEGORIZATION METADATA
-- ============================================================================

-- Add AI categorization confidence and method tracking
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS category_confidence NUMERIC(5,2);

ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS category_method TEXT; -- 'ai', 'manual', 'ocr', 'default'

ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS category_suggestions JSONB; -- AI alternative suggestions

-- Add index for filtering by category
CREATE INDEX IF NOT EXISTS idx_invoice_lines_category 
ON invoice_lines(item_category) 
WHERE item_category IS NOT NULL;

-- Add composite index for invoice + category queries
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_category 
ON invoice_lines(invoice_id, item_category);

-- ============================================================================
-- HELPER FUNCTIONS FOR CATEGORIZATION
-- ============================================================================

-- Function: Get invoice items by category
CREATE OR REPLACE FUNCTION get_invoice_items_by_category(
  p_invoice_id UUID,
  p_category TEXT
)
RETURNS TABLE (
  id UUID,
  line_number INTEGER,
  description TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  line_total NUMERIC,
  category_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.id,
    il.line_number,
    il.description,
    il.quantity,
    il.unit_price,
    il.line_total,
    il.category_confidence
  FROM invoice_lines il
  WHERE il.invoice_id = p_invoice_id
  AND il.item_category = p_category
  ORDER BY il.line_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get parts for dropdown (combines invoice parts with other sources)
CREATE OR REPLACE FUNCTION get_parts_for_dropdown(
  p_case_id UUID,
  p_invoice_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_invoice_parts JSONB;
BEGIN
  -- Get invoice parts if invoice_id provided
  IF p_invoice_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', il.id,
        'source', 'invoice',
        'name', il.description,
        'description', il.description,
        'quantity', il.quantity,
        'unit_price', il.unit_price,
        'total', il.line_total,
        'category_confidence', il.category_confidence,
        'invoice_id', il.invoice_id
      )
    ) INTO v_invoice_parts
    FROM invoice_lines il
    WHERE il.invoice_id = p_invoice_id
    AND il.item_category = 'part';
  ELSE
    v_invoice_parts := '[]'::jsonb;
  END IF;
  
  -- Build result with invoice parts
  -- Note: Selected parts and general parts bank will be added in JavaScript
  v_result := jsonb_build_object(
    'invoice_parts', COALESCE(v_invoice_parts, '[]'::jsonb),
    'count', jsonb_array_length(COALESCE(v_invoice_parts, '[]'::jsonb))
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-categorize invoice line based on keywords
CREATE OR REPLACE FUNCTION auto_categorize_invoice_line(
  p_description TEXT
)
RETURNS TABLE (
  suggested_category TEXT,
  confidence NUMERIC
) AS $$
DECLARE
  v_desc_lower TEXT;
BEGIN
  v_desc_lower := lower(p_description);
  
  -- Part keywords (Hebrew and English)
  IF v_desc_lower ~ '(חלק|פח|דלת|מנוע|גלגל|צמיג|פנס|מראה|part|door|engine|wheel|tire|light|mirror|hood|bumper|fender)' THEN
    RETURN QUERY SELECT 'part'::TEXT, 0.75::NUMERIC;
    RETURN;
  END IF;
  
  -- Work keywords (Hebrew and English)
  IF v_desc_lower ~ '(עבודה|תיקון|החלפה|התקנה|צביעה|work|labor|repair|replace|install|paint|body)' THEN
    RETURN QUERY SELECT 'work'::TEXT, 0.70::NUMERIC;
    RETURN;
  END IF;
  
  -- Repair keywords (Hebrew and English)
  IF v_desc_lower ~ '(תיקון|שיפוץ|הלחמה|יישור|repair|fix|straighten|weld)' THEN
    RETURN QUERY SELECT 'repair'::TEXT, 0.65::NUMERIC;
    RETURN;
  END IF;
  
  -- Material keywords
  IF v_desc_lower ~ '(חומר|צבע|דבק|ברגים|material|paint|adhesive|bolts)' THEN
    RETURN QUERY SELECT 'material'::TEXT, 0.60::NUMERIC;
    RETURN;
  END IF;
  
  -- Default: uncategorized with low confidence
  RETURN QUERY SELECT 'uncategorized'::TEXT, 0.30::NUMERIC;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Batch categorize all uncategorized lines in an invoice
CREATE OR REPLACE FUNCTION batch_categorize_invoice_lines(p_invoice_id UUID)
RETURNS TABLE (
  line_id UUID,
  old_category TEXT,
  new_category TEXT,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH categorization AS (
    SELECT 
      il.id,
      il.item_category as old_cat,
      (auto_categorize_invoice_line(il.description)).*
    FROM invoice_lines il
    WHERE il.invoice_id = p_invoice_id
    AND (il.item_category IS NULL OR il.item_category = 'uncategorized')
  )
  UPDATE invoice_lines il
  SET 
    item_category = c.suggested_category,
    category_confidence = c.confidence,
    category_method = 'auto',
    updated_at = now()
  FROM categorization c
  WHERE il.id = c.id
  RETURNING il.id, c.old_cat, il.item_category, il.category_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: AUTO-CATEGORIZE ON INSERT
-- ============================================================================

-- Function to auto-categorize new invoice lines
CREATE OR REPLACE FUNCTION trigger_auto_categorize_invoice_line()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
  v_confidence NUMERIC;
BEGIN
  -- Only auto-categorize if category not provided
  IF NEW.item_category IS NULL OR NEW.item_category = 'uncategorized' THEN
    -- Get auto-categorization
    SELECT * INTO v_category, v_confidence
    FROM auto_categorize_invoice_line(NEW.description);
    
    -- Update the new row
    NEW.item_category := v_category;
    NEW.category_confidence := v_confidence;
    NEW.category_method := 'auto';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (optional - can be enabled/disabled)
DROP TRIGGER IF EXISTS auto_categorize_on_insert ON invoice_lines;
CREATE TRIGGER auto_categorize_on_insert
  BEFORE INSERT ON invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_categorize_invoice_line();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check column added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoice_lines' 
-- AND column_name IN ('item_category', 'category_confidence', 'category_method', 'category_suggestions')
-- ORDER BY column_name;

-- Check constraint
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'invoice_lines_item_category_check';

-- Check functions created
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name LIKE '%categor%'
-- ORDER BY routine_name;

-- Test auto-categorization
-- SELECT * FROM auto_categorize_invoice_line('תיקון פח דלת קדמית');
-- SELECT * FROM auto_categorize_invoice_line('דלת אחורית ימין');
-- SELECT * FROM auto_categorize_invoice_line('צביעה');

-- ============================================================================
-- NOTES - CATEGORIZATION WORKFLOW
-- ============================================================================

-- CURRENT WORKFLOW (Automatic categorization):
-- 1. Invoice line inserted → Trigger runs → Auto-categorizes based on keywords
-- 2. category_method = 'auto', confidence = 0.30-0.75
-- 3. User can manually override in UI
--
-- FUTURE WORKFLOW (AI categorization):
-- 1. Invoice uploaded → OCR extracts items
-- 2. BEFORE saving to invoice_lines, send to AI categorization API
-- 3. AI returns: {category: 'part', confidence: 0.95, suggestions: ['work', 'repair']}
-- 4. Save to invoice_lines with:
--    - item_category = 'part'
--    - category_confidence = 0.95
--    - category_method = 'ai'
--    - category_suggestions = ['work', 'repair']
-- 5. If confidence < 0.80, show user for manual confirmation
--
-- PARTS DROPDOWN WORKFLOW (Final Report Builder):
-- 1. User opens damage center iframe
-- 2. User clicks on parts field
-- 3. Dropdown loads 3 sources:
--    a) Selected parts: FROM parts_required WHERE case_id = X
--    b) General parts bank: FROM parts_catalog (if exists)
--    c) Invoice parts: FROM invoice_lines WHERE invoice_id = X AND item_category = 'part'
-- 4. All 3 sources combined and displayed with source indicator
-- 5. User selects part → Creates mapping in invoice_damage_center_mappings
--
-- WORKS/REPAIRS DROPDOWN WORKFLOW:
-- 1. User clicks on work/repair field
-- 2. Dropdown loads from invoice_lines WHERE item_category = 'work' OR 'repair'
-- 3. User selects → Creates mapping
--
-- MANUAL OVERRIDE:
-- User can change category in UI:
-- UPDATE invoice_lines 
-- SET item_category = 'part', 
--     category_method = 'manual',
--     category_confidence = 1.0
-- WHERE id = 'line_id';
--
-- BATCH CATEGORIZATION:
-- After invoice upload, can run:
-- SELECT * FROM batch_categorize_invoice_lines('invoice_id');
-- This will auto-categorize all uncategorized lines at once.

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get all parts from an invoice
-- SELECT * FROM get_invoice_items_by_category('invoice_id', 'part');

-- Get all works from an invoice  
-- SELECT * FROM get_invoice_items_by_category('invoice_id', 'work');

-- Get parts dropdown data (invoice parts only)
-- SELECT * FROM get_parts_for_dropdown('case_id', 'invoice_id');

-- Batch categorize an invoice
-- SELECT * FROM batch_categorize_invoice_lines('invoice_id');

-- Manual categorization
-- UPDATE invoice_lines 
-- SET item_category = 'part', 
--     category_method = 'manual',
--     category_confidence = 1.0,
--     updated_at = now()
-- WHERE id = 'line_id';
