-- Phase 7: File Storage & OneDrive Integration
-- Task 6: File operations, search, and maintenance functions
-- Date: 2025-11-06
-- Session: 99

-- =====================================================
-- FILE OPERATIONS, SEARCH, AND MAINTENANCE
-- =====================================================

-- Create file operations log table
CREATE TABLE IF NOT EXISTS file_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL, -- 'bulk_upload', 'bulk_delete', 'bulk_move', 'search', 'cleanup'
  initiated_by UUID REFERENCES auth.users(id),
  operation_data JSONB NOT NULL,
  files_affected INT DEFAULT 0,
  files_succeeded INT DEFAULT 0,
  files_failed INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_ops_user ON file_operations_log(initiated_by);
CREATE INDEX IF NOT EXISTS idx_file_ops_status ON file_operations_log(status);
CREATE INDEX IF NOT EXISTS idx_file_ops_type ON file_operations_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_file_ops_started ON file_operations_log(started_at DESC);

-- Enable RLS
ALTER TABLE file_operations_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can see their own operations
CREATE POLICY "Users can view their own file operations" ON file_operations_log
FOR SELECT USING (initiated_by = auth.uid());

-- Function for advanced file search
CREATE OR REPLACE FUNCTION search_files(
  p_search_params JSONB
) RETURNS JSONB AS $$
DECLARE
  v_query TEXT;
  v_where_conditions TEXT[] := ARRAY[]::TEXT[];
  v_params JSONB;
  v_results JSONB;
  v_total_count INT;
  v_limit INT := COALESCE((p_search_params->>'limit')::int, 50);
  v_offset INT := COALESCE((p_search_params->>'offset')::int, 0);
BEGIN
  -- Extract search parameters
  v_params := p_search_params;
  
  -- Base query
  v_query := 'SELECT d.*, c.plate, c.owner_name FROM documents d JOIN cases c ON d.case_id = c.id';
  
  -- Add access control
  v_where_conditions := array_append(v_where_conditions, 
    '(
      c.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM case_collaborators cc
        WHERE cc.case_id = c.id AND cc.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() AND p.role IN (''admin'', ''developer'')
      )
    )');
  
  -- Filename search
  IF v_params ? 'filename' AND v_params->>'filename' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.filename ILIKE ''%%%s%%''', replace(v_params->>'filename', '''', '''''')));
  END IF;
  
  -- Category filter
  IF v_params ? 'category' AND v_params->>'category' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.category = ''%s''', replace(v_params->>'category', '''', '''''')));
  END IF;
  
  -- MIME type filter
  IF v_params ? 'mime_type' AND v_params->>'mime_type' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.mime_type = ''%s''', replace(v_params->>'mime_type', '''', '''''')));
  END IF;
  
  -- Bucket filter
  IF v_params ? 'bucket_name' AND v_params->>'bucket_name' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.bucket_name = ''%s''', replace(v_params->>'bucket_name', '''', '''''')));
  END IF;
  
  -- Case ID filter
  IF v_params ? 'case_id' AND v_params->>'case_id' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.case_id = ''%s''::uuid', replace(v_params->>'case_id', '''', '''''')));
  END IF;
  
  -- Plate number filter
  IF v_params ? 'plate' AND v_params->>'plate' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('c.plate ILIKE ''%%%s%%''', replace(v_params->>'plate', '''', '''''')));
  END IF;
  
  -- Size range filter
  IF v_params ? 'min_size' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.size_bytes >= %s', (v_params->>'min_size')::bigint));
  END IF;
  
  IF v_params ? 'max_size' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.size_bytes <= %s', (v_params->>'max_size')::bigint));
  END IF;
  
  -- Date range filter
  IF v_params ? 'created_after' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.created_at >= ''%s''::timestamptz', v_params->>'created_after'));
  END IF;
  
  IF v_params ? 'created_before' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.created_at <= ''%s''::timestamptz', v_params->>'created_before'));
  END IF;
  
  -- Upload status filter
  IF v_params ? 'upload_status' AND v_params->>'upload_status' != '' THEN
    v_where_conditions := array_append(v_where_conditions, 
      format('d.upload_status = ''%s''', replace(v_params->>'upload_status', '''', '''''')));
  END IF;
  
  -- Build complete query
  IF array_length(v_where_conditions, 1) > 0 THEN
    v_query := v_query || ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
  END IF;
  
  -- Get total count
  EXECUTE 'SELECT COUNT(*) FROM (' || v_query || ') as count_query' INTO v_total_count;
  
  -- Add ordering and pagination
  v_query := v_query || ' ORDER BY d.created_at DESC LIMIT ' || v_limit || ' OFFSET ' || v_offset;
  
  -- Execute search and build results
  EXECUTE 'SELECT jsonb_agg(
    jsonb_build_object(
      ''id'', id,
      ''filename'', filename,
      ''category'', category,
      ''mime_type'', mime_type,
      ''size_bytes'', size_bytes,
      ''bucket_name'', bucket_name,
      ''upload_status'', upload_status,
      ''created_at'', created_at,
      ''case_id'', case_id,
      ''plate'', plate,
      ''owner_name'', owner_name
    )
  ) FROM (' || v_query || ') as search_results' INTO v_results;
  
  -- Log search operation
  INSERT INTO file_operations_log (
    operation_type, initiated_by, operation_data, files_affected, status, completed_at
  ) VALUES (
    'search', auth.uid(), p_search_params, v_total_count, 'completed', now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'results', COALESCE(v_results, '[]'::jsonb),
    'total_count', v_total_count,
    'limit', v_limit,
    'offset', v_offset,
    'search_params', p_search_params
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'search_params', p_search_params
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for bulk file operations
CREATE OR REPLACE FUNCTION bulk_file_operation(
  p_operation_type TEXT,
  p_file_ids UUID[],
  p_operation_params JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_operation_id UUID;
  v_file_id UUID;
  v_succeeded_count INT := 0;
  v_failed_count INT := 0;
  v_error_details JSONB := '[]'::JSONB;
  v_has_access BOOLEAN;
BEGIN
  -- Create operation log entry
  INSERT INTO file_operations_log (
    operation_type, initiated_by, operation_data, files_affected, status
  ) VALUES (
    p_operation_type, auth.uid(), 
    jsonb_build_object('file_ids', p_file_ids, 'params', p_operation_params),
    array_length(p_file_ids, 1), 'running'
  ) RETURNING id INTO v_operation_id;
  
  -- Process each file
  FOREACH v_file_id IN ARRAY p_file_ids
  LOOP
    BEGIN
      -- Check access permission
      SELECT check_file_access_permission(v_file_id) INTO v_has_access;
      
      IF NOT v_has_access THEN
        v_error_details := v_error_details || jsonb_build_object(
          'file_id', v_file_id,
          'error', 'access_denied'
        );
        v_failed_count := v_failed_count + 1;
        CONTINUE;
      END IF;
      
      -- Perform operation based on type
      CASE p_operation_type
        WHEN 'bulk_delete' THEN
          -- Delete file (calls existing delete function logic)
          DELETE FROM documents WHERE id = v_file_id;
          
        WHEN 'bulk_update_category' THEN
          -- Update category
          UPDATE documents 
          SET category = p_operation_params->>'new_category',
              updated_at = now()
          WHERE id = v_file_id;
          
        WHEN 'bulk_move_bucket' THEN
          -- Move to different bucket (would require storage operations)
          UPDATE documents 
          SET bucket_name = p_operation_params->>'new_bucket',
              updated_at = now()
          WHERE id = v_file_id;
          
        WHEN 'bulk_sync_trigger' THEN
          -- Trigger sync to OneDrive
          PERFORM trigger_onedrive_sync(v_file_id, 'high', true);
          
        ELSE
          RAISE EXCEPTION 'Unknown operation type: %', p_operation_type;
      END CASE;
      
      v_succeeded_count := v_succeeded_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_details := v_error_details || jsonb_build_object(
        'file_id', v_file_id,
        'error', SQLERRM
      );
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;
  
  -- Update operation log
  UPDATE file_operations_log SET
    files_succeeded = v_succeeded_count,
    files_failed = v_failed_count,
    error_details = v_error_details,
    status = CASE WHEN v_failed_count = 0 THEN 'completed' ELSE 'failed' END,
    completed_at = now()
  WHERE id = v_operation_id;
  
  RETURN v_operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate file export manifest
CREATE OR REPLACE FUNCTION generate_file_export_manifest(
  p_case_id UUID,
  p_include_metadata BOOLEAN DEFAULT true
) RETURNS JSONB AS $$
DECLARE
  v_has_access BOOLEAN;
  v_case_info JSONB;
  v_files JSONB;
  v_manifest JSONB;
BEGIN
  -- Check case access
  v_has_access := EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = p_case_id
    AND (
      c.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM case_collaborators cc
        WHERE cc.case_id = c.id AND cc.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'developer')
      )
    )
  );
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object('success', false, 'error', 'access_denied');
  END IF;
  
  -- Get case information
  SELECT jsonb_build_object(
    'id', c.id,
    'plate', c.plate,
    'owner_name', c.owner_name,
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) INTO v_case_info
  FROM cases c WHERE c.id = p_case_id;
  
  -- Get files information
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'filename', d.filename,
      'category', d.category,
      'mime_type', d.mime_type,
      'size_bytes', d.size_bytes,
      'bucket_name', d.bucket_name,
      'storage_path', d.storage_path,
      'file_hash', d.file_hash,
      'upload_status', d.upload_status,
      'created_at', d.created_at,
      'sync_status', COALESCE(
        (
          SELECT jsonb_build_object(
            'status', fs.status,
            'last_attempt', fs.last_attempt,
            'onedrive_file_id', d.onedrive_file_id
          )
          FROM file_sync_status fs
          WHERE fs.document_id = d.id AND fs.sync_type = 'onedrive'
          ORDER BY fs.updated_at DESC LIMIT 1
        ),
        jsonb_build_object('status', 'not_synced')
      ),
      'versions_count', (
        SELECT COUNT(*) FROM file_versions fv WHERE fv.document_id = d.id
      )
    )
    ORDER BY d.category, d.created_at
  ) INTO v_files
  FROM documents d
  WHERE d.case_id = p_case_id AND d.upload_status = 'completed';
  
  -- Build manifest
  v_manifest := jsonb_build_object(
    'success', true,
    'export_timestamp', now(),
    'case_info', v_case_info,
    'files', COALESCE(v_files, '[]'::jsonb),
    'summary', jsonb_build_object(
      'total_files', jsonb_array_length(COALESCE(v_files, '[]'::jsonb)),
      'total_size_bytes', (
        SELECT COALESCE(SUM(size_bytes), 0) FROM documents 
        WHERE case_id = p_case_id AND upload_status = 'completed'
      ),
      'categories', (
        SELECT jsonb_object_agg(category, count)
        FROM (
          SELECT category, COUNT(*) as count
          FROM documents 
          WHERE case_id = p_case_id AND upload_status = 'completed'
          GROUP BY category
        ) cat_counts
      ),
      'sync_status_summary', (
        SELECT jsonb_object_agg(status, count)
        FROM (
          SELECT 
            COALESCE(fs.status, 'not_synced') as status,
            COUNT(*) as count
          FROM documents d
          LEFT JOIN file_sync_status fs ON d.id = fs.document_id AND fs.sync_type = 'onedrive'
          WHERE d.case_id = p_case_id AND d.upload_status = 'completed'
          GROUP BY COALESCE(fs.status, 'not_synced')
        ) sync_counts
      )
    )
  );
  
  -- Add metadata if requested
  IF p_include_metadata THEN
    v_manifest := v_manifest || jsonb_build_object(
      'metadata', jsonb_build_object(
        'exported_by', (SELECT name FROM profiles WHERE user_id = auth.uid()),
        'export_version', '1.0',
        'storage_buckets_used', (
          SELECT jsonb_agg(DISTINCT bucket_name)
          FROM documents
          WHERE case_id = p_case_id AND upload_status = 'completed'
        )
      )
    );
  END IF;
  
  RETURN v_manifest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for comprehensive file cleanup
CREATE OR REPLACE FUNCTION comprehensive_file_cleanup(
  p_cleanup_params JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  v_operation_id UUID;
  v_cleaned_files INT := 0;
  v_cleaned_versions INT := 0;
  v_cleaned_sync_logs INT := 0;
  v_cleaned_access_logs INT := 0;
  v_temp_count INT;
  v_temp_files_days INT := COALESCE((p_cleanup_params->>'temp_files_days')::int, 1);
  v_failed_uploads_days INT := COALESCE((p_cleanup_params->>'failed_uploads_days')::int, 7);
  v_version_retention_days INT := COALESCE((p_cleanup_params->>'version_retention_days')::int, 90);
  v_access_log_days INT := COALESCE((p_cleanup_params->>'access_log_days')::int, 90);
  v_sync_log_days INT := COALESCE((p_cleanup_params->>'sync_log_days')::int, 30);
BEGIN
  -- Create operation log
  INSERT INTO file_operations_log (
    operation_type, initiated_by, operation_data, status
  ) VALUES (
    'cleanup', auth.uid(), p_cleanup_params, 'running'
  ) RETURNING id INTO v_operation_id;
  
  -- Cleanup 1: Remove old temp files
  DELETE FROM documents 
  WHERE bucket_name = 'temp'
  AND created_at < now() - (v_temp_files_days || ' days')::INTERVAL
  AND upload_status IN ('failed', 'pending');
  
  GET DIAGNOSTICS v_cleaned_files = ROW_COUNT;
  
  -- Cleanup 2: Remove old failed uploads
  DELETE FROM documents 
  WHERE upload_status = 'failed'
  AND created_at < now() - (v_failed_uploads_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_cleaned_files := v_cleaned_files + v_temp_count;
  
  -- Cleanup 3: Remove old file versions
  SELECT cleanup_old_versions(NULL, 10, v_version_retention_days) INTO v_cleaned_versions;
  
  -- Cleanup 4: Remove old sync logs
  DELETE FROM file_sync_status
  WHERE status IN ('completed', 'skipped')
  AND updated_at < now() - (v_sync_log_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_cleaned_sync_logs = ROW_COUNT;
  
  -- Cleanup 5: Remove old access logs
  SELECT cleanup_access_logs(v_access_log_days) INTO v_cleaned_access_logs;
  
  -- Update operation log
  UPDATE file_operations_log SET
    files_affected = v_cleaned_files + v_cleaned_versions + v_cleaned_sync_logs + v_cleaned_access_logs,
    files_succeeded = v_cleaned_files + v_cleaned_versions + v_cleaned_sync_logs + v_cleaned_access_logs,
    status = 'completed',
    completed_at = now(),
    operation_data = operation_data || jsonb_build_object(
      'cleanup_results', jsonb_build_object(
        'files_cleaned', v_cleaned_files,
        'versions_cleaned', v_cleaned_versions,
        'sync_logs_cleaned', v_cleaned_sync_logs,
        'access_logs_cleaned', v_cleaned_access_logs
      )
    )
  WHERE id = v_operation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'operation_id', v_operation_id,
    'cleanup_results', jsonb_build_object(
      'files_cleaned', v_cleaned_files,
      'versions_cleaned', v_cleaned_versions,
      'sync_logs_cleaned', v_cleaned_sync_logs,
      'access_logs_cleaned', v_cleaned_access_logs,
      'total_cleaned', v_cleaned_files + v_cleaned_versions + v_cleaned_sync_logs + v_cleaned_access_logs
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for file operation status
CREATE OR REPLACE VIEW file_operations_status AS
SELECT 
  fol.*,
  p.name as initiated_by_name,
  CASE 
    WHEN fol.status = 'running' AND fol.estimated_completion IS NOT NULL 
    THEN GREATEST(0, EXTRACT(EPOCH FROM (fol.estimated_completion - now())))
    ELSE NULL
  END as estimated_seconds_remaining
FROM file_operations_log fol
LEFT JOIN profiles p ON fol.initiated_by = p.user_id
ORDER BY fol.started_at DESC;

-- Grant permissions
GRANT SELECT ON file_operations_status TO authenticated;
GRANT EXECUTE ON FUNCTION search_files TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_file_operation TO authenticated;
GRANT EXECUTE ON FUNCTION generate_file_export_manifest TO authenticated;

-- Grant cleanup function only to admins
REVOKE EXECUTE ON FUNCTION comprehensive_file_cleanup FROM authenticated;
GRANT EXECUTE ON FUNCTION comprehensive_file_cleanup TO authenticated;

-- Create policy for cleanup function access
CREATE OR REPLACE FUNCTION check_admin_access() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'developer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE file_operations_log IS 'Logs bulk file operations and long-running tasks';
COMMENT ON FUNCTION search_files IS 'Advanced file search with multiple criteria';
COMMENT ON FUNCTION bulk_file_operation IS 'Performs bulk operations on multiple files';
COMMENT ON FUNCTION generate_file_export_manifest IS 'Generates export manifest for case files';
COMMENT ON FUNCTION comprehensive_file_cleanup IS 'Comprehensive cleanup of old files and logs';
COMMENT ON VIEW file_operations_status IS 'Current status of file operations';

-- Sample usage queries:
-- SELECT search_files('{"filename": "invoice", "category": "invoice", "limit": 20}');
-- SELECT bulk_file_operation('bulk_update_category', ARRAY['uuid1', 'uuid2'], '{"new_category": "updated"}');
-- SELECT generate_file_export_manifest('case-uuid'::uuid, true);
-- SELECT comprehensive_file_cleanup('{"temp_files_days": 1, "failed_uploads_days": 7}');

COMMIT;