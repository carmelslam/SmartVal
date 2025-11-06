-- Phase 7: File Storage & OneDrive Integration
-- Task 5: Storage bucket RLS policies and security
-- Date: 2025-11-06
-- Session: 99

-- =====================================================
-- STORAGE BUCKET RLS POLICIES AND SECURITY
-- =====================================================

-- Note: Storage bucket policies must be created via the Supabase dashboard or API
-- This file contains helper functions only. Storage policies are created via dashboard.

-- IMPORTANT: Create storage policies via Supabase dashboard instead
-- See JavaScript examples at the bottom of this file for policy definitions

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE POLICIES
-- =====================================================

-- Function to check storage access permission
CREATE OR REPLACE FUNCTION check_storage_access(
  p_bucket_name TEXT,
  p_file_path TEXT,
  p_operation TEXT DEFAULT 'SELECT'
) RETURNS BOOLEAN AS $$
DECLARE
  v_case_id UUID;
  v_user_id UUID := auth.uid();
  v_has_access BOOLEAN := false;
BEGIN
  -- Return false if user not authenticated
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Extract case ID from file path (assuming format: case-{uuid}/...)
  BEGIN
    v_case_id := (regexp_match(p_file_path, 'case-([0-9a-f-]{36})'))[1]::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- If can't extract case ID, check if admin
    RETURN EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = v_user_id
      AND p.role IN ('admin', 'developer')
    );
  END;
  
  -- Check case access
  SELECT EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = v_case_id
    AND (
      c.created_by = v_user_id
      OR EXISTS (
        SELECT 1 FROM case_collaborators cc
        WHERE cc.case_id = c.id 
        AND cc.user_id = v_user_id
      )
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = v_user_id
        AND p.role IN ('admin', 'developer')
      )
    )
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file upload constraints
CREATE OR REPLACE FUNCTION validate_file_upload(
  p_bucket_name TEXT,
  p_filename TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_bucket_config JSONB;
  v_max_size BIGINT;
  v_allowed_types TEXT[];
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Define bucket configurations
  v_bucket_config := jsonb_build_object(
    'reports', jsonb_build_object('max_size', 52428800, 'allowed_types', '["application/pdf"]'),
    'originals', jsonb_build_object('max_size', 10485760, 'allowed_types', '["image/jpeg", "image/png", "image/gif", "image/webp"]'),
    'processed', jsonb_build_object('max_size', 10485760, 'allowed_types', '["image/jpeg", "image/png", "image/gif", "image/webp"]'),
    'docs', jsonb_build_object('max_size', 52428800, 'allowed_types', '["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv"]'),
    'temp', jsonb_build_object('max_size', 52428800, 'allowed_types', '["*"]')
  );
  
  -- Check if bucket exists
  IF NOT v_bucket_config ? p_bucket_name THEN
    v_errors := array_append(v_errors, format('Unknown bucket: %s', p_bucket_name));
    RETURN jsonb_build_object('valid', false, 'errors', v_errors);
  END IF;
  
  -- Get bucket limits
  v_max_size := (v_bucket_config->p_bucket_name->>'max_size')::bigint;
  v_allowed_types := ARRAY(SELECT jsonb_array_elements_text(v_bucket_config->p_bucket_name->'allowed_types'));
  
  -- Validate file size
  IF p_file_size > v_max_size THEN
    v_errors := array_append(v_errors, format('File size %s exceeds limit of %s for bucket %s', 
      pg_size_pretty(p_file_size), pg_size_pretty(v_max_size), p_bucket_name));
  END IF;
  
  -- Validate file type (skip if wildcard allowed)
  IF v_allowed_types[1] != '*' AND NOT (p_mime_type = ANY(v_allowed_types)) THEN
    v_errors := array_append(v_errors, format('File type %s not allowed in bucket %s. Allowed: %s', 
      p_mime_type, p_bucket_name, array_to_string(v_allowed_types, ', ')));
  END IF;
  
  -- Validate filename
  IF p_filename ~ '[<>:"/\\|?*]' THEN
    v_errors := array_append(v_errors, 'Filename contains invalid characters');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) = 0,
    'errors', v_errors,
    'bucket_config', v_bucket_config->p_bucket_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired temp files
CREATE OR REPLACE FUNCTION cleanup_temp_files(
  p_hours_old INT DEFAULT 24
) RETURNS INT AS $$
DECLARE
  v_deleted_count INT := 0;
  v_temp_file RECORD;
BEGIN
  -- Get temp files older than specified hours with no corresponding document
  FOR v_temp_file IN 
    SELECT DISTINCT storage_path, bucket_name
    FROM documents 
    WHERE bucket_name = 'temp'
    AND created_at < now() - (p_hours_old || ' hours')::INTERVAL
    AND upload_status IN ('failed', 'pending')
  LOOP
    -- Delete from storage (this would need to be done via application code)
    -- We just mark for deletion here
    UPDATE documents 
    SET upload_status = 'cleanup_pending'
    WHERE storage_path = v_temp_file.storage_path 
    AND bucket_name = v_temp_file.bucket_name;
    
    v_deleted_count := v_deleted_count + 1;
  END LOOP;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage usage view
CREATE OR REPLACE VIEW storage_usage_summary AS
SELECT 
  bucket_name,
  COUNT(*) as file_count,
  SUM(size_bytes) as total_size_bytes,
  pg_size_pretty(SUM(size_bytes)) as total_size_formatted,
  AVG(size_bytes) as avg_file_size,
  MAX(size_bytes) as largest_file_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM documents 
WHERE bucket_name IS NOT NULL
AND upload_status = 'completed'
GROUP BY bucket_name
ORDER BY total_size_bytes DESC;

-- Grant permissions
GRANT SELECT ON storage_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_storage_access TO authenticated;
GRANT EXECUTE ON FUNCTION validate_file_upload TO authenticated;

-- Add comments
COMMENT ON FUNCTION check_storage_access IS 'Checks if user has access to files in storage bucket';
COMMENT ON FUNCTION validate_file_upload IS 'Validates file upload against bucket constraints';
COMMENT ON FUNCTION cleanup_temp_files IS 'Marks old temp files for cleanup';
COMMENT ON VIEW storage_usage_summary IS 'Storage usage statistics by bucket';

-- =====================================================
-- STORAGE POLICY EXAMPLES (CREATE VIA DASHBOARD/API)
-- =====================================================

-- Note: The storage policies must be created via Supabase dashboard or API.
-- Here are the JavaScript examples for creating them:

/*
JavaScript example for creating storage policies via Supabase client:

// Reports bucket policies
await supabase.storage.from('reports').createPolicy({
  name: 'Users can upload reports for their cases',
  operation: 'INSERT',
  definition: `
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id::text = (storage.foldername(name))[2]::uuid
      AND (
        c.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM case_collaborators cc
          WHERE cc.case_id = c.id 
          AND cc.user_id = auth.uid()
        )
      )
    )
  `
});

await supabase.storage.from('reports').createPolicy({
  name: 'Users can view reports for their cases',
  operation: 'SELECT',
  definition: `
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id::text = (storage.foldername(name))[2]::uuid
      AND (
        c.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM case_collaborators cc
          WHERE cc.case_id = c.id 
          AND cc.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid()
          AND p.role IN ('admin', 'developer')
        )
      )
    )
  `
});

// Similar policies needed for: originals, processed, docs, temp buckets
// With appropriate operations: INSERT, SELECT, UPDATE, DELETE
*/

-- Sample validation and usage queries:
-- SELECT validate_file_upload('reports', 'test.pdf', 1024000, 'application/pdf');
-- SELECT check_storage_access('docs', 'case-uuid/invoices/file.pdf', 'SELECT');
-- SELECT * FROM storage_usage_summary;

COMMIT;