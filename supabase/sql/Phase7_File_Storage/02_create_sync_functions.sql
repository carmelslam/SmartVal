-- Phase 7: File Storage & OneDrive Integration
-- Task 2: OneDrive sync management system
-- Date: 2025-11-06
-- Session: 99

-- =====================================================
-- ONEDRIVE SYNC MANAGEMENT SYSTEM
-- =====================================================

-- Create sync status tracking table
CREATE TABLE IF NOT EXISTS file_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'onedrive', -- 'onedrive', 'backup', 'mirror'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed', 'skipped'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  error_message TEXT,
  sync_priority TEXT DEFAULT 'normal', -- 'high', 'normal', 'low'
  make_webhook_url TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraints
ALTER TABLE file_sync_status ADD CONSTRAINT file_sync_status_type_check 
CHECK (sync_type IN ('onedrive', 'backup', 'mirror'));

ALTER TABLE file_sync_status ADD CONSTRAINT file_sync_status_status_check 
CHECK (status IN ('pending', 'syncing', 'completed', 'failed', 'skipped'));

ALTER TABLE file_sync_status ADD CONSTRAINT file_sync_status_priority_check 
CHECK (sync_priority IN ('high', 'normal', 'low'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_sync_document ON file_sync_status(document_id);
CREATE INDEX IF NOT EXISTS idx_file_sync_status ON file_sync_status(status);
CREATE INDEX IF NOT EXISTS idx_file_sync_retry ON file_sync_status(next_retry) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_file_sync_priority ON file_sync_status(sync_priority, created_at);

-- Unique constraint to prevent duplicate sync requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_sync_unique 
ON file_sync_status(document_id, sync_type) 
WHERE status IN ('pending', 'syncing');

-- Enable RLS
ALTER TABLE file_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can only see sync status for their files
CREATE POLICY "Users can view sync status for their files" ON file_sync_status
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN cases c ON d.case_id = c.id
    WHERE d.id = file_sync_status.document_id
    AND (
      c.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM case_collaborators cc
        WHERE cc.case_id = c.id 
        AND cc.user_id = auth.uid()
      )
    )
  )
);

-- Function to trigger OneDrive sync
CREATE OR REPLACE FUNCTION trigger_onedrive_sync(
  p_document_id UUID,
  p_sync_priority TEXT DEFAULT 'normal',
  p_force_resync BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_sync_id UUID;
  v_document documents%ROWTYPE;
  v_webhook_url TEXT := 'https://hook.eu2.make.com/SYNC_TO_ONEDRIVE'; -- To be configured
BEGIN
  -- Get document details
  SELECT * INTO v_document FROM documents WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;
  
  -- Check if file is ready for sync
  IF v_document.upload_status != 'completed' THEN
    RAISE EXCEPTION 'Document upload not completed: %', p_document_id;
  END IF;
  
  -- Check if sync already exists and not forcing resync
  IF NOT p_force_resync THEN
    SELECT id INTO v_sync_id 
    FROM file_sync_status 
    WHERE document_id = p_document_id 
    AND sync_type = 'onedrive'
    AND status IN ('pending', 'syncing', 'completed');
    
    IF FOUND THEN
      RETURN v_sync_id;
    END IF;
  END IF;
  
  -- Create sync request
  INSERT INTO file_sync_status (
    document_id,
    sync_type,
    status,
    sync_priority,
    make_webhook_url,
    next_retry
  ) VALUES (
    p_document_id,
    'onedrive',
    'pending',
    p_sync_priority,
    v_webhook_url,
    now()
  ) 
  ON CONFLICT (document_id, sync_type) 
  WHERE status IN ('pending', 'syncing')
  DO UPDATE SET
    sync_priority = EXCLUDED.sync_priority,
    status = 'pending',
    attempts = 0,
    next_retry = now(),
    updated_at = now()
  RETURNING id INTO v_sync_id;
  
  -- Log the sync request
  PERFORM log_file_operation(
    p_document_id,
    'sync_requested',
    jsonb_build_object(
      'sync_id', v_sync_id,
      'sync_type', 'onedrive',
      'priority', p_sync_priority,
      'force_resync', p_force_resync
    )
  );
  
  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_sync_status(
  p_sync_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_response_data JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_sync file_sync_status%ROWTYPE;
  v_retry_delay INTERVAL;
BEGIN
  -- Get current sync record
  SELECT * INTO v_sync FROM file_sync_status WHERE id = p_sync_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sync record not found: %', p_sync_id;
  END IF;
  
  -- Calculate retry delay for failed syncs
  IF p_status = 'failed' THEN
    v_retry_delay := CASE v_sync.attempts
      WHEN 0 THEN INTERVAL '5 minutes'
      WHEN 1 THEN INTERVAL '30 minutes'
      WHEN 2 THEN INTERVAL '2 hours'
      ELSE INTERVAL '24 hours'
    END;
  END IF;
  
  -- Update sync status
  UPDATE file_sync_status SET
    status = p_status,
    attempts = CASE 
      WHEN p_status = 'failed' THEN attempts + 1
      ELSE attempts
    END,
    last_attempt = now(),
    next_retry = CASE 
      WHEN p_status = 'failed' AND attempts < max_attempts THEN now() + v_retry_delay
      ELSE NULL
    END,
    error_message = p_error_message,
    response_data = COALESCE(p_response_data, response_data),
    updated_at = now()
  WHERE id = p_sync_id;
  
  -- If sync completed successfully, update document
  IF p_status = 'completed' AND p_response_data IS NOT NULL THEN
    UPDATE documents SET
      onedrive_file_id = p_response_data->>'file_id',
      onedrive_web_url = p_response_data->>'web_url'
    WHERE id = v_sync.document_id;
  END IF;
  
  -- Log the status update
  PERFORM log_file_operation(
    v_sync.document_id,
    format('sync_%s', p_status),
    jsonb_build_object(
      'sync_id', p_sync_id,
      'attempts', v_sync.attempts + CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,
      'error_message', p_error_message,
      'response_data', p_response_data
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending sync queue
CREATE OR REPLACE FUNCTION get_sync_queue(
  p_limit INT DEFAULT 10,
  p_priority_filter TEXT DEFAULT NULL
) RETURNS TABLE (
  sync_id UUID,
  document_id UUID,
  filename TEXT,
  storage_path TEXT,
  bucket_name TEXT,
  case_id UUID,
  plate TEXT,
  sync_priority TEXT,
  attempts INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id,
    d.id,
    d.filename,
    d.storage_path,
    d.bucket_name,
    d.case_id,
    c.plate,
    fs.sync_priority,
    fs.attempts,
    fs.created_at
  FROM file_sync_status fs
  JOIN documents d ON fs.document_id = d.id
  JOIN cases c ON d.case_id = c.id
  WHERE fs.status = 'pending'
  AND (p_priority_filter IS NULL OR fs.sync_priority = p_priority_filter)
  AND (fs.next_retry IS NULL OR fs.next_retry <= now())
  ORDER BY 
    CASE fs.sync_priority 
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 3
    END,
    fs.created_at
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed syncs
CREATE OR REPLACE FUNCTION retry_failed_syncs() RETURNS INT AS $$
DECLARE
  v_retried_count INT := 0;
  v_sync_record RECORD;
BEGIN
  -- Get failed syncs that are ready for retry
  FOR v_sync_record IN 
    SELECT id, document_id, attempts, max_attempts
    FROM file_sync_status
    WHERE status = 'failed'
    AND attempts < max_attempts
    AND (next_retry IS NULL OR next_retry <= now())
    ORDER BY sync_priority, created_at
    LIMIT 50
  LOOP
    -- Reset to pending for retry
    UPDATE file_sync_status SET
      status = 'pending',
      next_retry = now(),
      updated_at = now()
    WHERE id = v_sync_record.id;
    
    v_retried_count := v_retried_count + 1;
    
    -- Log retry attempt
    PERFORM log_file_operation(
      v_sync_record.document_id,
      'sync_retry',
      jsonb_build_object(
        'sync_id', v_sync_record.id,
        'attempt', v_sync_record.attempts + 1,
        'max_attempts', v_sync_record.max_attempts
      )
    );
  END LOOP;
  
  RETURN v_retried_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old sync records
CREATE OR REPLACE FUNCTION cleanup_sync_records(
  p_days_old INT DEFAULT 30
) RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Delete completed sync records older than specified days
  DELETE FROM file_sync_status
  WHERE status IN ('completed', 'skipped')
  AND updated_at < now() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Mark permanently failed syncs as skipped
  UPDATE file_sync_status SET
    status = 'skipped',
    error_message = COALESCE(error_message, '') || ' - Max attempts exceeded',
    updated_at = now()
  WHERE status = 'failed'
  AND attempts >= max_attempts
  AND updated_at < now() - INTERVAL '24 hours';
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create sync request for new files
CREATE OR REPLACE FUNCTION auto_sync_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger sync for completed uploads
  IF NEW.upload_status = 'completed' AND (OLD.upload_status IS NULL OR OLD.upload_status != 'completed') THEN
    -- Create sync request with normal priority
    PERFORM trigger_onedrive_sync(NEW.id, 'normal', false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_sync ON documents;
CREATE TRIGGER trg_auto_sync
  AFTER UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_trigger();

-- Create view for sync statistics
CREATE OR REPLACE VIEW sync_statistics AS
SELECT 
  sync_type,
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts,
  MIN(created_at) as oldest_request,
  MAX(updated_at) as latest_update
FROM file_sync_status 
GROUP BY sync_type, status;

-- Grant permissions
GRANT SELECT ON sync_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_sync_queue TO authenticated;

-- Add comments
COMMENT ON TABLE file_sync_status IS 'Tracks file synchronization status with external services';
COMMENT ON FUNCTION trigger_onedrive_sync IS 'Creates sync request to backup file to OneDrive';
COMMENT ON FUNCTION update_sync_status IS 'Updates sync status and handles retry logic';
COMMENT ON FUNCTION get_sync_queue IS 'Returns pending sync requests in priority order';
COMMENT ON FUNCTION retry_failed_syncs IS 'Retries failed sync requests that are ready for retry';
COMMENT ON FUNCTION cleanup_sync_records IS 'Removes old completed sync records';
COMMENT ON VIEW sync_statistics IS 'Provides sync operation statistics';

-- Enable realtime for sync status
ALTER PUBLICATION supabase_realtime ADD TABLE file_sync_status;

-- Verification queries
-- SELECT * FROM sync_statistics;
-- SELECT COUNT(*) as pending_syncs FROM file_sync_status WHERE status = 'pending';

COMMIT;