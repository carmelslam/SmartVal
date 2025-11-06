-- Phase 7: File Storage & OneDrive Integration
-- Task 4: File versioning system
-- Date: 2025-11-06
-- Session: 99

-- =====================================================
-- FILE VERSIONING AND HISTORY MANAGEMENT
-- =====================================================

-- Create file versions table for tracking file history
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  bucket_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_hash TEXT,
  is_current BOOLEAN DEFAULT false,
  version_notes TEXT,
  replaced_by UUID REFERENCES file_versions(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'file_versions_bucket_check'
  ) THEN
    ALTER TABLE file_versions ADD CONSTRAINT file_versions_bucket_check 
    CHECK (bucket_name IN ('reports', 'originals', 'processed', 'docs', 'temp'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_versions_document ON file_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_current ON file_versions(document_id, is_current);
CREATE INDEX IF NOT EXISTS idx_file_versions_version ON file_versions(document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_file_versions_hash ON file_versions(file_hash);

-- Unique constraint for current version per document
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_versions_unique_current 
ON file_versions(document_id) 
WHERE is_current = true;

-- Unique constraint for version number per document
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_versions_unique_version 
ON file_versions(document_id, version_number);

-- Enable RLS
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can only access versions for files they can access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'file_versions' 
    AND policyname = 'Users can access file versions for their files'
  ) THEN
    CREATE POLICY "Users can access file versions for their files" ON file_versions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM documents d
        JOIN cases c ON d.case_id = c.id
        WHERE d.id = file_versions.document_id
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
    );
  END IF;
END $$;

-- Function to create new file version
CREATE OR REPLACE FUNCTION create_file_version(
  p_document_id UUID,
  p_filename TEXT,
  p_mime_type TEXT,
  p_size_bytes BIGINT,
  p_bucket_name TEXT,
  p_storage_path TEXT,
  p_file_hash TEXT DEFAULT NULL,
  p_version_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_version_number INT;
  v_version_id UUID;
  v_current_version_id UUID;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_version_number
  FROM file_versions 
  WHERE document_id = p_document_id;
  
  -- Get current version ID for replacement tracking
  SELECT id INTO v_current_version_id
  FROM file_versions
  WHERE document_id = p_document_id AND is_current = true;
  
  -- Create new version
  INSERT INTO file_versions (
    document_id,
    version_number,
    filename,
    mime_type,
    size_bytes,
    bucket_name,
    storage_path,
    file_hash,
    is_current,
    version_notes,
    created_by
  ) VALUES (
    p_document_id,
    v_version_number,
    p_filename,
    p_mime_type,
    p_size_bytes,
    p_bucket_name,
    p_storage_path,
    p_file_hash,
    true,
    p_version_notes,
    auth.uid()
  ) RETURNING id INTO v_version_id;
  
  -- Update previous current version
  IF v_current_version_id IS NOT NULL THEN
    UPDATE file_versions SET
      is_current = false,
      replaced_by = v_version_id
    WHERE id = v_current_version_id;
  END IF;
  
  -- Log version creation
  PERFORM log_file_operation(
    p_document_id,
    'version_created',
    jsonb_build_object(
      'version_id', v_version_id,
      'version_number', v_version_number,
      'previous_version', v_current_version_id,
      'filename', p_filename,
      'size_bytes', p_size_bytes
    )
  );
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore file version
CREATE OR REPLACE FUNCTION restore_file_version(
  p_version_id UUID,
  p_restore_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_version file_versions%ROWTYPE;
  v_document documents%ROWTYPE;
  v_current_version_id UUID;
BEGIN
  -- Get version details
  SELECT * INTO v_version FROM file_versions WHERE id = p_version_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found: %', p_version_id;
  END IF;
  
  -- Get document details
  SELECT * INTO v_document FROM documents WHERE id = v_version.document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', v_version.document_id;
  END IF;
  
  -- Check if user has permission
  IF NOT check_file_access_permission(v_version.document_id) THEN
    RAISE EXCEPTION 'Access denied to restore file version';
  END IF;
  
  -- Get current version
  SELECT id INTO v_current_version_id
  FROM file_versions
  WHERE document_id = v_version.document_id AND is_current = true;
  
  -- Update current version to not current
  UPDATE file_versions SET is_current = false WHERE id = v_current_version_id;
  
  -- Set restored version as current
  UPDATE file_versions SET is_current = true WHERE id = p_version_id;
  
  -- Update main document record to reflect restored version
  UPDATE documents SET
    filename = v_version.filename,
    mime_type = v_version.mime_type,
    size_bytes = v_version.size_bytes,
    bucket_name = v_version.bucket_name,
    storage_path = v_version.storage_path,
    file_hash = v_version.file_hash,
    updated_at = now()
  WHERE id = v_version.document_id;
  
  -- Log restoration
  PERFORM log_file_operation(
    v_version.document_id,
    'version_restored',
    jsonb_build_object(
      'restored_version_id', p_version_id,
      'restored_version_number', v_version.version_number,
      'previous_current_version', v_current_version_id,
      'restore_notes', p_restore_notes,
      'filename', v_version.filename
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file version history
CREATE OR REPLACE FUNCTION get_file_version_history(
  p_document_id UUID,
  p_limit INT DEFAULT 20
) RETURNS JSONB AS $$
DECLARE
  v_has_access BOOLEAN;
  v_versions JSONB;
BEGIN
  -- Check access permission
  v_has_access := check_file_access_permission(p_document_id);
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'access_denied'
    );
  END IF;
  
  -- Get version history
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', fv.id,
      'version_number', fv.version_number,
      'filename', fv.filename,
      'mime_type', fv.mime_type,
      'size_bytes', fv.size_bytes,
      'bucket_name', fv.bucket_name,
      'storage_path', fv.storage_path,
      'file_hash', fv.file_hash,
      'is_current', fv.is_current,
      'version_notes', fv.version_notes,
      'replaced_by', fv.replaced_by,
      'created_by', p.name,
      'created_at', fv.created_at
    )
    ORDER BY fv.version_number DESC
  ) INTO v_versions
  FROM file_versions fv
  LEFT JOIN profiles p ON fv.created_by = p.user_id
  WHERE fv.document_id = p_document_id
  LIMIT p_limit;
  
  RETURN jsonb_build_object(
    'success', true,
    'document_id', p_document_id,
    'versions', COALESCE(v_versions, '[]'::jsonb),
    'total_versions', (
      SELECT COUNT(*) FROM file_versions WHERE document_id = p_document_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compare file versions
CREATE OR REPLACE FUNCTION compare_file_versions(
  p_version_1_id UUID,
  p_version_2_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_version_1 file_versions%ROWTYPE;
  v_version_2 file_versions%ROWTYPE;
  v_comparison JSONB;
BEGIN
  -- Get both versions
  SELECT * INTO v_version_1 FROM file_versions WHERE id = p_version_1_id;
  SELECT * INTO v_version_2 FROM file_versions WHERE id = p_version_2_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'version_not_found'
    );
  END IF;
  
  -- Check if versions belong to same document
  IF v_version_1.document_id != v_version_2.document_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'versions_from_different_documents'
    );
  END IF;
  
  -- Check access permission
  IF NOT check_file_access_permission(v_version_1.document_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'access_denied'
    );
  END IF;
  
  -- Build comparison
  v_comparison := jsonb_build_object(
    'success', true,
    'document_id', v_version_1.document_id,
    'version_1', jsonb_build_object(
      'id', v_version_1.id,
      'version_number', v_version_1.version_number,
      'filename', v_version_1.filename,
      'mime_type', v_version_1.mime_type,
      'size_bytes', v_version_1.size_bytes,
      'file_hash', v_version_1.file_hash,
      'is_current', v_version_1.is_current,
      'created_at', v_version_1.created_at
    ),
    'version_2', jsonb_build_object(
      'id', v_version_2.id,
      'version_number', v_version_2.version_number,
      'filename', v_version_2.filename,
      'mime_type', v_version_2.mime_type,
      'size_bytes', v_version_2.size_bytes,
      'file_hash', v_version_2.file_hash,
      'is_current', v_version_2.is_current,
      'created_at', v_version_2.created_at
    ),
    'differences', jsonb_build_object(
      'filename_changed', v_version_1.filename != v_version_2.filename,
      'size_changed', v_version_1.size_bytes != v_version_2.size_bytes,
      'content_changed', COALESCE(v_version_1.file_hash, '') != COALESCE(v_version_2.file_hash, ''),
      'size_difference', v_version_2.size_bytes - v_version_1.size_bytes,
      'time_difference', v_version_2.created_at - v_version_1.created_at
    )
  );
  
  RETURN v_comparison;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old versions
CREATE OR REPLACE FUNCTION cleanup_old_versions(
  p_document_id UUID DEFAULT NULL,
  p_keep_versions INT DEFAULT 10,
  p_days_old INT DEFAULT 90
) RETURNS INT AS $$
DECLARE
  v_deleted_count INT := 0;
  v_document_record RECORD;
BEGIN
  -- If specific document, process only that one
  IF p_document_id IS NOT NULL THEN
    -- Delete old versions for specific document, keeping the most recent ones
    DELETE FROM file_versions
    WHERE document_id = p_document_id
    AND is_current = false
    AND version_number <= (
      SELECT MAX(version_number) - p_keep_versions
      FROM file_versions
      WHERE document_id = p_document_id
    )
    AND created_at < now() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  ELSE
    -- Process all documents
    FOR v_document_record IN 
      SELECT DISTINCT document_id FROM file_versions
    LOOP
      DELETE FROM file_versions
      WHERE document_id = v_document_record.document_id
      AND is_current = false
      AND version_number <= (
        SELECT MAX(version_number) - p_keep_versions
        FROM file_versions
        WHERE document_id = v_document_record.document_id
      )
      AND created_at < now() - (p_days_old || ' days')::INTERVAL;
      
      v_deleted_count := v_deleted_count + (SELECT ROW_COUNT());
    END LOOP;
  END IF;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create version when document is updated
CREATE OR REPLACE FUNCTION auto_version_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if file content changed (different storage path or hash)
  IF NEW.storage_path != OLD.storage_path OR 
     COALESCE(NEW.file_hash, '') != COALESCE(OLD.file_hash, '') THEN
    
    PERFORM create_file_version(
      NEW.id,
      NEW.filename,
      NEW.mime_type,
      NEW.size_bytes,
      NEW.bucket_name,
      NEW.storage_path,
      NEW.file_hash,
      'Auto-generated version on file update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (disabled by default - enable when needed)
-- DROP TRIGGER IF EXISTS trg_auto_version ON documents;
-- CREATE TRIGGER trg_auto_version
--   AFTER UPDATE ON documents
--   FOR EACH ROW
--   WHEN (OLD.upload_status = 'completed' AND NEW.upload_status = 'completed')
--   EXECUTE FUNCTION auto_version_trigger();

-- Create view for version statistics
CREATE OR REPLACE VIEW file_version_statistics AS
SELECT 
  d.case_id,
  c.plate,
  d.category,
  COUNT(fv.*) as total_versions,
  COUNT(*) FILTER (WHERE fv.is_current = true) as current_versions,
  AVG(fv.size_bytes) as avg_version_size,
  MAX(fv.created_at) as latest_version,
  MIN(fv.created_at) as first_version
FROM documents d
LEFT JOIN file_versions fv ON d.id = fv.document_id
LEFT JOIN cases c ON d.case_id = c.id
GROUP BY d.case_id, c.plate, d.category;

-- Grant permissions
GRANT SELECT ON file_version_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION create_file_version TO authenticated;
GRANT EXECUTE ON FUNCTION restore_file_version TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_version_history TO authenticated;
GRANT EXECUTE ON FUNCTION compare_file_versions TO authenticated;

-- Add comments
COMMENT ON TABLE file_versions IS 'Tracks file version history for documents';
COMMENT ON FUNCTION create_file_version IS 'Creates new version of a file';
COMMENT ON FUNCTION restore_file_version IS 'Restores previous version of a file';
COMMENT ON FUNCTION get_file_version_history IS 'Returns version history for a document';
COMMENT ON FUNCTION compare_file_versions IS 'Compares two versions of a file';
COMMENT ON FUNCTION cleanup_old_versions IS 'Removes old file versions based on retention policy';
COMMENT ON VIEW file_version_statistics IS 'File versioning statistics by case and category';

-- Enable realtime for file versions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'file_versions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE file_versions;
  END IF;
END $$;

-- Sample usage queries:
-- SELECT create_file_version('doc-uuid'::uuid, 'updated_file.pdf', 'application/pdf', 1024000, 'docs', 'path/to/file.pdf', 'hash123', 'Updated with corrections');
-- SELECT get_file_version_history('doc-uuid'::uuid, 10);
-- SELECT compare_file_versions('version1-uuid'::uuid, 'version2-uuid'::uuid);
-- SELECT * FROM file_version_statistics WHERE plate = '12345678';

COMMIT;