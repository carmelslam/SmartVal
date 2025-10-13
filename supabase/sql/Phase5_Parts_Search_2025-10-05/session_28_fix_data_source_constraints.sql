-- ============================================================================
-- SESSION 28: FIX DATA_SOURCE CONSTRAINTS FOR ENGLISH VALUES
-- ============================================================================
-- Date: 2025-10-13
-- Purpose: Update database constraints to accept English values instead of Hebrew
-- Issue: Code sends 'catalog', 'web', 'ocr' but DB expects Hebrew values
-- Impact: All 3 search paths (catalog, web, OCR) failing with constraint violation
-- 
-- Background:
-- - Session 26: Changed frontend code from Hebrew to English for DB compatibility
-- - Session 27: Verified code sends correct English values
-- - Session 28: Database constraints still expect old Hebrew values
--
-- Root Cause:
-- The CHECK constraints on data_source columns were never updated to match
-- the Session 26 code changes. Database still expects:
--   - 'קטלוג' (catalog in Hebrew)
--   - 'אינטרנט' (web/internet in Hebrew)  
--   - 'אחר' (other in Hebrew)
-- 
-- But code now sends:
--   - 'catalog' (English)
--   - 'web' (English)
--   - 'ocr' (English)
--
-- Solution:
-- Update all 3 tables to accept English values that match the frontend code.
-- ============================================================================

-- CRITICAL: Run these commands in order. Do not skip any steps.

-- ============================================================================
-- TABLE 1: parts_search_sessions
-- Purpose: Tracks every search attempt (catalog, web, OCR)
-- Impact: Session creation fails for ALL paths without this fix
-- ============================================================================

-- Step 1: Drop old Hebrew constraint
ALTER TABLE parts_search_sessions 
DROP CONSTRAINT IF EXISTS parts_search_sessions_data_source_check;

-- Step 2: Add new English constraint
ALTER TABLE parts_search_sessions 
ADD CONSTRAINT parts_search_sessions_data_source_check 
CHECK (data_source IN ('catalog', 'web', 'ocr'));

-- Verification query (optional - run to confirm)
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'parts_search_sessions_data_source_check';

-- ============================================================================
-- TABLE 2: parts_search_results  
-- Purpose: Stores search results linked to sessions
-- Impact: Results save fails for ALL paths without this fix
-- ============================================================================

-- Step 1: Drop old Hebrew constraint
ALTER TABLE parts_search_results 
DROP CONSTRAINT IF EXISTS parts_search_results_data_source_check;

-- Step 2: Add new English constraint
ALTER TABLE parts_search_results 
ADD CONSTRAINT parts_search_results_data_source_check 
CHECK (data_source IN ('catalog', 'web', 'ocr'));

-- Verification query (optional)
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'parts_search_results_data_source_check';

-- ============================================================================
-- TABLE 3: selected_parts
-- Purpose: Tracks individual part selections from any source
-- Impact: Part selection save fails for ALL paths without this fix
-- ============================================================================

-- Step 1: Drop old Hebrew constraint
ALTER TABLE selected_parts 
DROP CONSTRAINT IF EXISTS selected_parts_data_source_check;

-- Step 2: Add new English constraint
ALTER TABLE selected_parts 
ADD CONSTRAINT selected_parts_data_source_check 
CHECK (data_source IN ('catalog', 'web', 'ocr'));

-- Verification query (optional)
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'selected_parts_data_source_check';

-- ============================================================================
-- VERIFICATION: Check all constraints are updated
-- ============================================================================
-- Run this query to confirm all 3 constraints are now correct:

SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%data_source_check'
ORDER BY constraint_name;

-- Expected output:
-- parts_search_results_data_source_check   | (data_source IN ('catalog', 'web', 'ocr'))
-- parts_search_sessions_data_source_check  | (data_source IN ('catalog', 'web', 'ocr'))
-- selected_parts_data_source_check         | (data_source IN ('catalog', 'web', 'ocr'))

-- ============================================================================
-- POST-DEPLOYMENT TESTING
-- ============================================================================
-- After running this migration, test all 3 search paths:
-- 
-- 1. Catalog Search:
--    - Fill vehicle form
--    - Click "חפש במאגר הנתונים"
--    - Check: Session created in parts_search_sessions with data_source='catalog'
--
-- 2. Web Search:
--    - Fill vehicle form
--    - Click "חפש במערכת חיצונית"
--    - Wait for webhook response
--    - Check: Session created with data_source='web'
--
-- 3. OCR Search:
--    - Upload image/PDF
--    - Click "שלח תוצאת חיפוש לניתוח"
--    - Wait for webhook response
--    - Check: Session created with data_source='ocr'
--
-- All should succeed without constraint violation errors.
-- ============================================================================

-- NOTES:
-- - This fix is backward compatible - existing NULL values unaffected
-- - If you have existing rows with Hebrew values, they will fail constraint
-- - To migrate existing data, run before adding constraints:
--   UPDATE parts_search_sessions SET data_source = 'catalog' WHERE data_source = 'קטלוג';
--   UPDATE parts_search_sessions SET data_source = 'web' WHERE data_source = 'אינטרנט';
--   UPDATE parts_search_sessions SET data_source = 'ocr' WHERE data_source = 'אחר';
-- - Repeat for parts_search_results and selected_parts tables
-- ============================================================================
