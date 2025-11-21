-- ============================================================================
-- 09_fix_audit_log_function.sql
-- ============================================================================
--
-- Purpose: Fix log_file_operation function to use correct column names
-- Date: 2025-11-21
-- Issue: Function was trying to insert into "changes" column which doesn't exist
--        The audit_log table uses "old_values" and "new_values" instead
--
-- ============================================================================

-- Fix the log_file_operation function
CREATE OR REPLACE FUNCTION log_file_operation(
  p_document_id UUID,
  p_operation TEXT,
  p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (
    actor,
    action,
    table_name,
    record_id,
    new_values,  -- Changed from "changes" to "new_values"
    metadata
  ) VALUES (
    auth.uid(),
    p_operation,
    'documents',
    p_document_id,
    p_details,
    jsonb_build_object(
      'timestamp', now(),
      'session_id', current_setting('app.session_id', true)
    )
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_file_operation IS 'Log file operations to audit_log table (fixed to use new_values column)';

-- Verify the function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_file_operation'
  ) THEN
    RAISE NOTICE '✅ log_file_operation function updated successfully';
  ELSE
    RAISE WARNING '❌ log_file_operation function not found';
  END IF;
END $$;
