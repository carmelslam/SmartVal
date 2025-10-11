-- SESSION 23: Update data_source constraints to English values
-- Date: 2025-10-11
-- Purpose: Change data_source from Hebrew ('קטלוג', 'אינטרנט', 'אחר') to English ('catalog', 'web', 'ocr')

-- Drop existing constraints
ALTER TABLE parts_search_sessions 
DROP CONSTRAINT IF EXISTS parts_search_sessions_data_source_check;

ALTER TABLE parts_search_results 
DROP CONSTRAINT IF EXISTS parts_search_results_data_source_check;

ALTER TABLE selected_parts 
DROP CONSTRAINT IF EXISTS selected_parts_data_source_check;

-- Add new constraints with English values
ALTER TABLE parts_search_sessions 
ADD CONSTRAINT parts_search_sessions_data_source_check 
CHECK (data_source IN ('catalog', 'web', 'ocr'));

ALTER TABLE parts_search_results 
ADD CONSTRAINT parts_search_results_data_source_check 
CHECK (data_source IN ('catalog', 'web', 'ocr'));

ALTER TABLE selected_parts 
ADD CONSTRAINT selected_parts_data_source_check 
CHECK (data_source IN ('catalog', 'web', 'ocr'));

-- Update existing data from Hebrew to English (if any exists)
UPDATE parts_search_sessions 
SET data_source = CASE 
  WHEN data_source = 'קטלוג' THEN 'catalog'
  WHEN data_source = 'אינטרנט' THEN 'web'
  WHEN data_source = 'אחר' THEN 'ocr'
  ELSE data_source
END
WHERE data_source IN ('קטלוג', 'אינטרנט', 'אחר');

UPDATE parts_search_results 
SET data_source = CASE 
  WHEN data_source = 'קטלוג' THEN 'catalog'
  WHEN data_source = 'אינטרנט' THEN 'web'
  WHEN data_source = 'אחר' THEN 'ocr'
  ELSE data_source
END
WHERE data_source IN ('קטלוג', 'אינטרנט', 'אחר');

UPDATE selected_parts 
SET data_source = CASE 
  WHEN data_source = 'קטלוג' THEN 'catalog'
  WHEN data_source = 'אינטרנט' THEN 'web'
  WHEN data_source = 'אחר' THEN 'ocr'
  ELSE data_source
END
WHERE data_source IN ('קטלוג', 'אינטרנט', 'אחר');

-- Verification queries (run these to check)
-- SELECT DISTINCT data_source FROM parts_search_sessions;
-- SELECT DISTINCT data_source FROM parts_search_results;
-- SELECT DISTINCT data_source FROM selected_parts;
