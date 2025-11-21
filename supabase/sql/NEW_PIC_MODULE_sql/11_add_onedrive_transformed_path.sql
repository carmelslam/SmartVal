-- ============================================================================
-- 11_add_onedrive_transformed_path.sql
-- ============================================================================
--
-- Purpose: Add column and function parameter for OneDrive transformed image path
-- Date: 2025-11-21
-- Issue: Make.com sends 2 paths (original + transformed) but function only accepts 1
--
-- Changes:
-- 1. Add onedrive_transformed_path column to images table
-- 2. Update update_backup_status function to accept both paths
--
-- ============================================================================

-- Add column for transformed image OneDrive path
ALTER TABLE images
ADD COLUMN IF NOT EXISTS onedrive_transformed_path TEXT;

-- Add comment
COMMENT ON COLUMN images.onedrive_transformed_path IS 'OneDrive path for transformed image with watermarks (מעובדות folder)';

-- ============================================================================
-- Update RPC Function: update_backup_status
-- ============================================================================
-- Now accepts TWO OneDrive paths:
-- - p_onedrive_path: Original image (מקוריות)
-- - p_onedrive_transformed_path: Transformed image (מעובדות)
-- ============================================================================

-- Drop the old version (6 parameters)
DROP FUNCTION IF EXISTS update_backup_status(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL);

-- Create the new version with 7 parameters (added p_onedrive_transformed_path)
CREATE OR REPLACE FUNCTION update_backup_status(
  p_image_id UUID,
  p_onedrive_path TEXT,
  p_backup_status TEXT DEFAULT 'backed_up',
  p_onedrive_transformed_path TEXT DEFAULT NULL,
  p_recognized_damage TEXT DEFAULT NULL,
  p_recognized_part TEXT DEFAULT NULL,
  p_recognition_confidence DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update image record with both OneDrive paths + AI recognition
  UPDATE images
  SET
    onedrive_path = p_onedrive_path,
    onedrive_transformed_path = COALESCE(p_onedrive_transformed_path, onedrive_transformed_path),
    backup_status = p_backup_status,
    recognized_damage = COALESCE(p_recognized_damage, recognized_damage),
    recognized_part = COALESCE(p_recognized_part, recognized_part),
    recognition_confidence = COALESCE(p_recognition_confidence, recognition_confidence),
    recognition_status = CASE
      WHEN p_recognized_damage IS NOT NULL OR p_recognized_part IS NOT NULL
      THEN 'recognized'
      ELSE recognition_status
    END,
    updated_at = now()
  WHERE id = p_image_id;

  -- Log the update
  RAISE NOTICE 'Updated backup for image %: original=%, transformed=%, damage=%, part=%',
    p_image_id, p_onedrive_path, p_onedrive_transformed_path, p_recognized_damage, p_recognized_part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION update_backup_status IS 'Update OneDrive backup paths (original + transformed) + AI recognition data';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_backup_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_backup_status TO anon;

-- ============================================================================
-- Verify changes
-- ============================================================================

-- Check if column was added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'images'
AND column_name IN ('onedrive_path', 'onedrive_transformed_path');

-- Check function signature
SELECT
  p.specific_name,
  p.parameter_name,
  p.data_type,
  p.parameter_mode,
  p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_name IN (
  SELECT r.specific_name
  FROM information_schema.routines r
  WHERE r.routine_name = 'update_backup_status'
  AND r.specific_schema = 'public'
)
ORDER BY p.ordinal_position;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Expected Make.com call format:
-- POST https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/rpc/update_backup_status
-- Body:
-- {
--   "p_image_id": "uuid",
--   "p_onedrive_path": "https://onedrive.../מקוריות/IMG_1234.jpg",
--   "p_onedrive_transformed_path": "https://onedrive.../מעובדות/IMG_1234.jpg",
--   "p_backup_status": "backed_up",
--   "p_recognized_damage": "scratch",
--   "p_recognized_part": "front_bumper",
--   "p_recognition_confidence": 0.95
-- }

-- OneDrive folder structure:
-- /{plate}_תמונות/
--   ├── מקוריות/        (original images)
--   └── מעובדות/        (transformed images with watermarks)

-- ============================================================================
-- END OF FILE
-- ============================================================================
