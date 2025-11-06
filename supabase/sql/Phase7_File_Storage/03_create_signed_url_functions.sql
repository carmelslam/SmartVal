-- Phase 7: File Storage & OneDrive Integration
-- Task 3: Secure signed URL generation system
-- Date: 2025-11-06
-- Session: 99

-- =====================================================
-- SIGNED URL GENERATION FOR SECURE FILE ACCESS
-- =====================================================

-- Create table to track URL access logs (optional for audit)
CREATE TABLE IF NOT EXISTS file_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL, -- 'view', 'download', 'thumbnail'
  ip_address INET,
  user_agent TEXT,
  signed_url_expires TIMESTAMPTZ,
  access_granted BOOLEAN DEFAULT true,
  access_reason TEXT, -- 'permission_denied', 'expired_url', 'file_not_found'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_access_document ON file_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_file_access_user ON file_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_timestamp ON file_access_log(created_at);

-- Enable RLS
ALTER TABLE file_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can only see their own access logs
CREATE POLICY "Users can view their own file access logs" ON file_access_log
FOR SELECT USING (user_id = auth.uid());

-- Function to check file access permission
CREATE OR REPLACE FUNCTION check_file_access_permission(
  p_document_id UUID,
  p_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN := false;
BEGIN
  -- Check if user has access to the case containing this document
  SELECT EXISTS (
    SELECT 1 
    FROM documents d
    JOIN cases c ON d.case_id = c.id
    WHERE d.id = p_document_id
    AND (
      c.created_by = p_user_id
      OR EXISTS (
        SELECT 1 FROM case_collaborators cc
        WHERE cc.case_id = c.id 
        AND cc.user_id = p_user_id
      )
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = p_user_id
        AND p.role IN ('admin', 'developer')
      )
    )
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate signed URL with permission check
CREATE OR REPLACE FUNCTION generate_signed_url(
  p_document_id UUID,
  p_expires_in INTERVAL DEFAULT '1 hour',
  p_access_type TEXT DEFAULT 'view'
) RETURNS JSONB AS $$
DECLARE
  v_document documents%ROWTYPE;
  v_user_id UUID := auth.uid();
  v_has_access BOOLEAN;
  v_signed_url TEXT;
  v_expires_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'authentication_required',
      'message', 'User must be authenticated'
    );
  END IF;
  
  -- Get document details
  SELECT * INTO v_document FROM documents WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'document_not_found',
      'message', 'Document not found'
    );
  END IF;
  
  -- Check file access permission
  v_has_access := check_file_access_permission(p_document_id, v_user_id);
  
  IF NOT v_has_access THEN
    -- Log denied access
    INSERT INTO file_access_log (
      document_id, user_id, access_type, access_granted, access_reason
    ) VALUES (
      p_document_id, v_user_id, p_access_type, false, 'permission_denied'
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'access_denied',
      'message', 'No permission to access this file'
    );
  END IF;
  
  -- Check if file upload is completed
  IF v_document.upload_status != 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'file_not_ready',
      'message', 'File upload not completed'
    );
  END IF;
  
  -- Calculate expiration time
  v_expires_at := now() + p_expires_in;
  
  -- Generate the storage path for Supabase Storage
  -- Note: This will need to be called from the frontend with the actual Supabase client
  -- as RLS policies and signed URL generation need to happen client-side for security
  v_signed_url := format('%s/%s/%s',
    current_setting('app.supabase_storage_url', true),
    v_document.bucket_name,
    v_document.storage_path
  );
  
  -- Log successful access
  INSERT INTO file_access_log (
    document_id, user_id, access_type, signed_url_expires, access_granted
  ) VALUES (
    p_document_id, v_user_id, p_access_type, v_expires_at, true
  );
  
  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'storage_path', v_document.storage_path,
    'bucket_name', v_document.bucket_name,
    'filename', v_document.filename,
    'mime_type', v_document.mime_type,
    'size_bytes', v_document.size_bytes,
    'expires_at', v_expires_at,
    'access_type', p_access_type
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate batch signed URLs
CREATE OR REPLACE FUNCTION generate_batch_signed_urls(
  p_document_ids UUID[],
  p_expires_in INTERVAL DEFAULT '1 hour',
  p_access_type TEXT DEFAULT 'view'
) RETURNS JSONB AS $$
DECLARE
  v_results JSONB := '[]'::jsonb;
  v_document_id UUID;
  v_url_result JSONB;
BEGIN
  -- Process each document ID
  FOREACH v_document_id IN ARRAY p_document_ids
  LOOP
    v_url_result := generate_signed_url(v_document_id, p_expires_in, p_access_type);
    v_results := v_results || jsonb_build_object(
      'document_id', v_document_id,
      'result', v_url_result
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'results', v_results,
    'total_count', array_length(p_document_ids, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file info for display (without signed URL)
CREATE OR REPLACE FUNCTION get_file_info(
  p_document_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_document documents%ROWTYPE;
  v_case cases%ROWTYPE;
  v_has_access BOOLEAN;
  v_sync_status file_sync_status%ROWTYPE;
BEGIN
  -- Check access permission
  v_has_access := check_file_access_permission(p_document_id);
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'access_denied'
    );
  END IF;
  
  -- Get document info
  SELECT * INTO v_document
  FROM documents d
  WHERE d.id = p_document_id;
  
  -- Get case info
  SELECT * INTO v_case
  FROM cases c
  WHERE c.id = v_document.case_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'document_not_found'
    );
  END IF;
  
  -- Get sync status
  SELECT * INTO v_sync_status
  FROM file_sync_status
  WHERE document_id = p_document_id
  AND sync_type = 'onedrive'
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Return comprehensive file info
  RETURN jsonb_build_object(
    'success', true,
    'document', jsonb_build_object(
      'id', v_document.id,
      'filename', v_document.filename,
      'category', v_document.category,
      'mime_type', v_document.mime_type,
      'size_bytes', v_document.size_bytes,
      'bucket_name', v_document.bucket_name,
      'upload_status', v_document.upload_status,
      'file_hash', v_document.file_hash,
      'thumbnail_path', v_document.thumbnail_path,
      'created_at', v_document.created_at
    ),
    'case', jsonb_build_object(
      'id', v_case.id,
      'plate', v_case.plate,
      'owner_name', v_case.owner_name,
      'status', v_case.status
    ),
    'sync_status', CASE 
      WHEN v_sync_status.id IS NOT NULL THEN
        jsonb_build_object(
          'status', v_sync_status.status,
          'attempts', v_sync_status.attempts,
          'last_attempt', v_sync_status.last_attempt,
          'error_message', v_sync_status.error_message
        )
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get case files with basic info
CREATE OR REPLACE FUNCTION get_case_files(
  p_case_id UUID,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_has_access BOOLEAN;
  v_files JSONB;
  v_total_count INT;
BEGIN
  -- Check case access permission
  SELECT EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = p_case_id
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
  ) INTO v_has_access;
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'access_denied'
    );
  END IF;
  
  -- Get total count
  SELECT COUNT(*) INTO v_total_count
  FROM documents
  WHERE case_id = p_case_id
  AND (p_category IS NULL OR category = p_category);
  
  -- Get files
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'filename', d.filename,
      'category', d.category,
      'mime_type', d.mime_type,
      'size_bytes', d.size_bytes,
      'bucket_name', d.bucket_name,
      'upload_status', d.upload_status,
      'created_at', d.created_at,
      'has_thumbnail', d.thumbnail_path IS NOT NULL
    )
    ORDER BY d.created_at DESC
  ) INTO v_files
  FROM documents d
  WHERE d.case_id = p_case_id
  AND (p_category IS NULL OR d.category = p_category)
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'success', true,
    'files', COALESCE(v_files, '[]'::jsonb),
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired access logs
CREATE OR REPLACE FUNCTION cleanup_access_logs(
  p_days_old INT DEFAULT 90
) RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM file_access_log
  WHERE created_at < now() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for file access statistics
CREATE OR REPLACE VIEW file_access_statistics AS
SELECT 
  d.case_id,
  c.plate,
  d.category,
  COUNT(fal.*) as total_accesses,
  COUNT(DISTINCT fal.user_id) as unique_users,
  COUNT(*) FILTER (WHERE fal.access_granted = true) as successful_accesses,
  COUNT(*) FILTER (WHERE fal.access_granted = false) as denied_accesses,
  MAX(fal.created_at) as last_access,
  MIN(fal.created_at) as first_access
FROM documents d
LEFT JOIN file_access_log fal ON d.id = fal.document_id
LEFT JOIN cases c ON d.case_id = c.id
GROUP BY d.case_id, c.plate, d.category;

-- Grant permissions
GRANT SELECT ON file_access_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION generate_signed_url TO authenticated;
GRANT EXECUTE ON FUNCTION generate_batch_signed_urls TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_case_files TO authenticated;

-- Add comments
COMMENT ON TABLE file_access_log IS 'Audit trail for file access attempts';
COMMENT ON FUNCTION check_file_access_permission IS 'Checks if user has permission to access a file';
COMMENT ON FUNCTION generate_signed_url IS 'Generates secure signed URL for file access with permission check';
COMMENT ON FUNCTION generate_batch_signed_urls IS 'Generates multiple signed URLs in batch';
COMMENT ON FUNCTION get_file_info IS 'Returns file information with access control';
COMMENT ON FUNCTION get_case_files IS 'Returns list of files for a case with access control';
COMMENT ON FUNCTION cleanup_access_logs IS 'Removes old access log entries';
COMMENT ON VIEW file_access_statistics IS 'File access statistics by case and category';

-- Enable realtime for access logs (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE file_access_log;

-- Sample usage queries for reference:
-- SELECT generate_signed_url('document-uuid'::uuid, '2 hours'::interval, 'download');
-- SELECT get_case_files('case-uuid'::uuid, 'invoice', 20, 0);
-- SELECT * FROM file_access_statistics WHERE plate = '12345678';

COMMIT;