-- SESSION 34 - ADD CASE_ID TO SELECTED_PARTS TABLE
-- Date: 2025-10-15
-- Purpose: Add case_id column to track which case each selected part belongs to
-- Context: One plate can have multiple cases, need to distinguish parts per case
-- Agent: Claude Session 34

-- ============================================================================
-- PROBLEM STATEMENT
-- ============================================================================
-- Current: selected_parts only has 'plate' column
-- Issue: One plate can have multiple cases (1:many relationship)
-- Result: Cannot distinguish which selected parts belong to which case
-- Solution: Add case_id column with foreign key to cases table

-- ============================================================================
-- STEP 1: Add case_id column to selected_parts
-- ============================================================================

ALTER TABLE public.selected_parts 
ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.selected_parts.case_id IS 
'References the specific case this part was selected for. Required because one plate can have multiple cases.';

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

-- Index on case_id alone for fast case-specific queries
CREATE INDEX IF NOT EXISTS idx_selected_parts_case_id 
ON public.selected_parts(case_id);

-- Composite index on (case_id, plate) for combined queries
CREATE INDEX IF NOT EXISTS idx_selected_parts_case_plate 
ON public.selected_parts(case_id, plate);

-- ============================================================================
-- STEP 3: Create function to count selected parts by case
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_selected_parts_by_case(case_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  part_count INTEGER;
BEGIN
  -- Count selected parts for the given case
  SELECT COUNT(*)::INTEGER INTO part_count
  FROM public.selected_parts 
  WHERE case_id = case_uuid;
  
  RETURN COALESCE(part_count, 0);
END;
$$;

-- Add comment to document the function
COMMENT ON FUNCTION public.count_selected_parts_by_case(UUID) IS 
'Returns the count of selected parts for a specific case. Used by damage centers wizard Step 4 counter.';

-- ============================================================================
-- STEP 4: Grant execute permission on function
-- ============================================================================

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.count_selected_parts_by_case(UUID) TO authenticated;

-- Grant execute to anon users (if needed for public access)
GRANT EXECUTE ON FUNCTION public.count_selected_parts_by_case(UUID) TO anon;

-- ============================================================================
-- VERIFICATION & TESTING
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  index1_exists BOOLEAN;
  index2_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'selected_parts' 
    AND column_name = 'case_id'
  ) INTO column_exists;
  
  -- Check if indexes exist
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_selected_parts_case_id'
  ) INTO index1_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_selected_parts_case_plate'
  ) INTO index2_exists;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'count_selected_parts_by_case'
  ) INTO function_exists;
  
  -- Output verification results
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SESSION 34 - VERIFICATION RESULTS';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'case_id column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'idx_selected_parts_case_id: %', CASE WHEN index1_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'idx_selected_parts_case_plate: %', CASE WHEN index2_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'count_selected_parts_by_case(): %', CASE WHEN function_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  
  IF column_exists AND index1_exists AND index2_exists AND function_exists THEN
    RAISE NOTICE '✅ All changes applied successfully!';
    RAISE NOTICE '📊 Usage: SELECT count_selected_parts_by_case(''<case-uuid>'');';
  ELSE
    RAISE NOTICE '⚠️ Some changes may not have been applied. Check logs above.';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================

-- Example: Count parts for a specific case
-- SELECT count_selected_parts_by_case('your-case-uuid-here');

-- Example: Get detailed selected parts for a case
-- SELECT * FROM selected_parts WHERE case_id = 'your-case-uuid-here';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- IMPORTANT: Existing rows will have NULL case_id
-- Action required: Update existing rows with appropriate case_id values
-- 
-- Option 1: Update based on plate + timestamp relationship to parts_search_sessions
-- UPDATE selected_parts sp
-- SET case_id = (
--   SELECT pss.case_id 
--   FROM parts_search_sessions pss 
--   WHERE pss.plate = sp.plate 
--   ORDER BY pss.created_at DESC 
--   LIMIT 1
-- )
-- WHERE sp.case_id IS NULL;
--
-- Option 2: Leave NULL for historical data (will be excluded from counts)
-- New selections will automatically include case_id going forward

-- ============================================================================
-- END OF SESSION 34 MIGRATION
-- ============================================================================
