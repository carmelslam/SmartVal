-- ============================================================================
-- 07_add_transformation_columns.sql
-- ============================================================================
--
-- Purpose: Add columns for Cloudinary transformation URLs and backup status
-- Date: 2025-11-21
-- Phase: 1A - Final Architecture Update
--
-- Changes:
-- 1. Add transformed_url column (Cloudinary fetch URL)
-- 2. Add onedrive_transformed_path column (optional transformed backup)
-- 3. Add backup_status column (track OneDrive backup status)
-- 4. Add RPC function for Make.com to update backup status
--
-- ============================================================================

-- Add new columns to images table
ALTER TABLE images
ADD COLUMN IF NOT EXISTS transformed_url TEXT,
ADD COLUMN IF NOT EXISTS onedrive_transformed_path TEXT,
ADD COLUMN IF NOT EXISTS backup_status TEXT DEFAULT 'pending' CHECK (backup_status IN ('pending', 'backed_up', 'failed'));

-- Add comment explaining the columns
COMMENT ON COLUMN images.transformed_url IS 'Cloudinary fetch URL with transformations (watermark, text overlays, resize)';
COMMENT ON COLUMN images.onedrive_transformed_path IS 'OneDrive path for transformed image backup (optional)';
COMMENT ON COLUMN images.backup_status IS 'Status of OneDrive backup: pending, backed_up, failed';

-- Add index for querying images needing backup
CREATE INDEX IF NOT EXISTS idx_images_backup_pending
ON images(case_id, backup_status)
WHERE backup_status = 'pending' AND deleted_at IS NULL;

-- ============================================================================
-- RPC Function: update_backup_status
-- ============================================================================
-- Purpose: Called by Make.com UPLOAD_PICTURES webhook after OneDrive upload
-- Parameters:
--   p_image_id: UUID of the image record
--   p_onedrive_path: OneDrive URL where file was uploaded
--   p_backup_status: Status ('backed_up' or 'failed')
-- ============================================================================

CREATE OR REPLACE FUNCTION update_backup_status(
  p_image_id UUID,
  p_onedrive_path TEXT,
  p_backup_status TEXT DEFAULT 'backed_up'
)
RETURNS VOID AS $$
BEGIN
  -- Update image record with OneDrive backup info
  UPDATE images
  SET
    onedrive_path = p_onedrive_path,
    backup_status = p_backup_status,
    updated_at = now()
  WHERE id = p_image_id;

  -- Log the update
  RAISE NOTICE 'Updated backup status for image %: % - %',
    p_image_id, p_backup_status, p_onedrive_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION update_backup_status IS 'Update OneDrive backup status for an image (called by Make.com webhook)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_backup_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_backup_status TO anon;

-- ============================================================================
-- RPC Function: update_transformed_backup
-- ============================================================================
-- Purpose: Called by Make.com TRANSFORM_PICTURES webhook (optional)
-- Parameters:
--   p_image_id: UUID of the image record
--   p_onedrive_transformed_path: OneDrive URL for transformed image
-- ============================================================================

CREATE OR REPLACE FUNCTION update_transformed_backup(
  p_image_id UUID,
  p_onedrive_transformed_path TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update image record with transformed backup path
  UPDATE images
  SET
    onedrive_transformed_path = p_onedrive_transformed_path,
    updated_at = now()
  WHERE id = p_image_id;

  -- Log the update
  RAISE NOTICE 'Updated transformed backup for image %: %',
    p_image_id, p_onedrive_transformed_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION update_transformed_backup IS 'Update OneDrive path for transformed image backup (called by Make.com webhook)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_transformed_backup TO authenticated;
GRANT EXECUTE ON FUNCTION update_transformed_backup TO anon;

-- ============================================================================
-- Helper Function: get_images_needing_backup
-- ============================================================================
-- Purpose: Get images that need OneDrive backup
-- Parameters:
--   p_limit: Maximum number of images to return (default 50)
-- Returns: Array of images with pending backup status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_images_needing_backup(
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  image_id UUID,
  case_id UUID,
  original_url TEXT,
  filename TEXT,
  created_at TIMESTAMPTZ,
  age_minutes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS image_id,
    i.case_id,
    i.original_url,
    d.filename,
    i.created_at,
    EXTRACT(EPOCH FROM (now() - i.created_at))::INT / 60 AS age_minutes
  FROM images i
  JOIN documents d ON i.document_id = d.id
  WHERE
    i.backup_status = 'pending'
    AND i.deleted_at IS NULL
    AND i.original_url IS NOT NULL
  ORDER BY i.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_images_needing_backup IS 'Get images with pending OneDrive backup (oldest first)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_images_needing_backup TO authenticated;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the migration succeeded

DO $$
DECLARE
  v_transformed_url_exists BOOLEAN;
  v_onedrive_transformed_path_exists BOOLEAN;
  v_backup_status_exists BOOLEAN;
  v_update_backup_status_exists BOOLEAN;
  v_update_transformed_backup_exists BOOLEAN;
  v_get_images_needing_backup_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'transformed_url'
  ) INTO v_transformed_url_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'onedrive_transformed_path'
  ) INTO v_onedrive_transformed_path_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'backup_status'
  ) INTO v_backup_status_exists;

  -- Check if functions exist
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_backup_status'
  ) INTO v_update_backup_status_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_transformed_backup'
  ) INTO v_update_transformed_backup_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_images_needing_backup'
  ) INTO v_get_images_needing_backup_exists;

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 07 Verification Results:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'transformed_url column: %',
    CASE WHEN v_transformed_url_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'onedrive_transformed_path column: %',
    CASE WHEN v_onedrive_transformed_path_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'backup_status column: %',
    CASE WHEN v_backup_status_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'update_backup_status() function: %',
    CASE WHEN v_update_backup_status_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'update_transformed_backup() function: %',
    CASE WHEN v_update_transformed_backup_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'get_images_needing_backup() function: %',
    CASE WHEN v_get_images_needing_backup_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '========================================';

  IF v_transformed_url_exists AND v_onedrive_transformed_path_exists AND
     v_backup_status_exists AND v_update_backup_status_exists AND
     v_update_transformed_backup_exists AND v_get_images_needing_backup_exists THEN
    RAISE NOTICE '✅ Migration 07 completed successfully!';
  ELSE
    RAISE WARNING '❌ Migration 07 incomplete - check errors above';
  END IF;
END $$;
