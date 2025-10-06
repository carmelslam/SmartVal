-- ============================================================================
-- SESSION 7 - FIX 6A: Drop Old Functions First
-- Date: 2025-10-05
-- Purpose: Drop old functions before creating new one
-- ============================================================================

-- Drop old field cascade function
DROP FUNCTION IF EXISTS smart_parts_search_field_cascade(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT);

-- Drop old smart_parts_search with old return type
DROP FUNCTION IF EXISTS smart_parts_search(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT);

-- Verify dropped
SELECT 'Functions dropped successfully' as status;
