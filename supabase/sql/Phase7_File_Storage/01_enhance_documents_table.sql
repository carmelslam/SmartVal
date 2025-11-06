-- Phase 7: File Storage & OneDrive Integration
-- Task 1: Enhance documents table for better file management
-- Date: 2025-11-06
-- Session: 99

-- =====================================================
-- ENHANCE DOCUMENTS TABLE FOR FILE STORAGE MIGRATION
-- =====================================================

-- Add new columns for Supabase Storage integration
ALTER TABLE documents ADD COLUMN IF NOT EXISTS bucket_name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS upload_status TEXT DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT '{}';

-- Add constraints for upload status
ALTER TABLE documents ADD CONSTRAINT documents_upload_status_check 
CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed', 'syncing'));

-- Add constraints for bucket name (must match existing buckets)
ALTER TABLE documents ADD CONSTRAINT documents_bucket_name_check 
CHECK (bucket_name IN ('reports', 'originals', 'processed', 'docs', 'temp') OR bucket_name IS NULL);

-- Update existing storage_key column comment
COMMENT ON COLUMN documents.storage_key IS 'Legacy OneDrive storage path - deprecated in favor of storage_path';
COMMENT ON COLUMN documents.storage_path IS 'Supabase Storage path within bucket';
COMMENT ON COLUMN documents.bucket_name IS 'Supabase Storage bucket name';
COMMENT ON COLUMN documents.upload_status IS 'File upload and sync status';
COMMENT ON COLUMN documents.file_hash IS 'SHA-256 hash for file integrity verification';
COMMENT ON COLUMN documents.thumbnail_path IS 'Path to generated thumbnail (for images/PDFs)';
COMMENT ON COLUMN documents.file_metadata IS 'Additional file metadata (dimensions, duration, etc.)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_bucket_path ON documents(bucket_name, storage_path);
CREATE INDEX IF NOT EXISTS idx_documents_upload_status ON documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_case_category ON documents(case_id, category);

-- Create unique constraint on file hash to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_unique_hash 
ON documents(file_hash) 
WHERE file_hash IS NOT NULL;

-- Update RLS policies for new columns
-- Users can only access files for cases they have access to
DROP POLICY IF EXISTS "Users can access documents for their cases" ON documents;
CREATE POLICY "Users can access documents for their cases" ON documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = documents.case_id 
    AND (
      cases.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM case_collaborators 
        WHERE case_collaborators.case_id = cases.id 
        AND case_collaborators.user_id = auth.uid()
      )
    )
  )
);

-- Add function to generate storage path
CREATE OR REPLACE FUNCTION generate_storage_path(
  p_case_id UUID,
  p_category TEXT,
  p_filename TEXT
) RETURNS TEXT AS $$
DECLARE
  sanitized_filename TEXT;
  timestamp_suffix TEXT;
BEGIN
  -- Sanitize filename (remove special characters, spaces)
  sanitized_filename := regexp_replace(p_filename, '[^a-zA-Z0-9._-]', '_', 'g');
  
  -- Add timestamp suffix to prevent conflicts
  timestamp_suffix := to_char(now(), 'YYYYMMDD_HH24MISS');
  
  -- Generate path: case-{case_id}/{category}/{timestamp}_{filename}
  RETURN format('case-%s/%s/%s_%s', 
    p_case_id, 
    COALESCE(p_category, 'general'),
    timestamp_suffix,
    sanitized_filename
  );
END;
$$ LANGUAGE plpgsql;

-- Add function to determine bucket based on file type
CREATE OR REPLACE FUNCTION determine_bucket(
  p_mime_type TEXT,
  p_category TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  -- Determine bucket based on MIME type and category
  CASE 
    WHEN p_category = 'report' OR p_mime_type LIKE 'application/pdf' THEN
      RETURN 'reports';
    WHEN p_mime_type LIKE 'image/%' AND p_category = 'processed' THEN
      RETURN 'processed';
    WHEN p_mime_type LIKE 'image/%' THEN
      RETURN 'originals';
    WHEN p_mime_type IN ('application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'text/plain', 'text/csv') THEN
      RETURN 'docs';
    ELSE
      RETURN 'temp';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-populate storage path and bucket
CREATE OR REPLACE FUNCTION populate_storage_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Only populate if not already set
  IF NEW.storage_path IS NULL AND NEW.filename IS NOT NULL THEN
    NEW.storage_path := generate_storage_path(NEW.case_id, NEW.category, NEW.filename);
  END IF;
  
  IF NEW.bucket_name IS NULL AND NEW.mime_type IS NOT NULL THEN
    NEW.bucket_name := determine_bucket(NEW.mime_type, NEW.category);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_populate_storage_info ON documents;
CREATE TRIGGER trg_populate_storage_info
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION populate_storage_info();

-- Add audit log function for file operations
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
    changes,
    metadata
  ) VALUES (
    auth.uid(),
    p_operation,
    'documents',
    p_document_id,
    p_details,
    jsonb_build_object('timestamp', now(), 'session_id', current_setting('app.session_id', true))
  );
END;
$$ LANGUAGE plpgsql;

-- Create view for file statistics
CREATE OR REPLACE VIEW file_statistics AS
SELECT 
  bucket_name,
  category,
  COUNT(*) as file_count,
  SUM(size_bytes) as total_size_bytes,
  AVG(size_bytes) as avg_size_bytes,
  MIN(created_at) as first_upload,
  MAX(created_at) as last_upload
FROM documents 
WHERE bucket_name IS NOT NULL
GROUP BY bucket_name, category;

-- Grant permissions
GRANT SELECT ON file_statistics TO authenticated;

-- Add comments
COMMENT ON FUNCTION generate_storage_path IS 'Generates standardized storage path for files';
COMMENT ON FUNCTION determine_bucket IS 'Determines appropriate storage bucket based on file type';
COMMENT ON FUNCTION populate_storage_info IS 'Auto-populates storage path and bucket on insert/update';
COMMENT ON FUNCTION log_file_operation IS 'Logs file operations for audit trail';
COMMENT ON VIEW file_statistics IS 'Provides file storage statistics by bucket and category';

-- Enable realtime for documents table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- Verification queries
-- SELECT COUNT(*) as total_documents FROM documents;
-- SELECT bucket_name, COUNT(*) as count FROM documents GROUP BY bucket_name;
-- SELECT upload_status, COUNT(*) as count FROM documents GROUP BY upload_status;

COMMIT;