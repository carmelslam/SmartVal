-- ============================================================================
-- 08_add_ai_recognition_columns.sql
-- ============================================================================
--
-- Purpose: Add columns for ChatGPT AI image recognition (damage + part identification)
-- Date: 2025-11-21
-- Phase: 1A - AI Recognition Feature
--
-- Changes:
-- 1. Add recognized_damage column (scratch, dent, broken, etc.)
-- 2. Add recognized_part column (bumper, door, hood, etc.)
-- 3. Add recognition_confidence column (0.0 to 1.0)
-- 4. Add recognition_status column (pending, recognized, failed)
-- 5. Update RPC function to accept AI recognition data
-- 6. Add indexes for filtering by recognized data
--
-- ============================================================================

-- Add AI recognition columns to images table
ALTER TABLE images
ADD COLUMN IF NOT EXISTS recognized_damage TEXT,
ADD COLUMN IF NOT EXISTS recognized_part TEXT,
ADD COLUMN IF NOT EXISTS recognition_confidence DECIMAL(3,2) CHECK (recognition_confidence BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS recognition_status TEXT DEFAULT 'pending' CHECK (recognition_status IN ('pending', 'recognized', 'failed'));

-- Add comments explaining the columns
COMMENT ON COLUMN images.recognized_damage IS 'AI-recognized damage type (e.g., scratch, dent, broken, crack)';
COMMENT ON COLUMN images.recognized_part IS 'AI-recognized car part (e.g., front_bumper, door, hood, mirror)';
COMMENT ON COLUMN images.recognition_confidence IS 'Confidence score from ChatGPT (0.0 to 1.0)';
COMMENT ON COLUMN images.recognition_status IS 'Status of AI recognition: pending, recognized, failed';

-- Add indexes for filtering by recognized data
CREATE INDEX IF NOT EXISTS idx_images_recognized_part
ON images(case_id, recognized_part)
WHERE deleted_at IS NULL AND recognition_status = 'recognized';

CREATE INDEX IF NOT EXISTS idx_images_recognized_damage
ON images(case_id, recognized_damage)
WHERE deleted_at IS NULL AND recognition_status = 'recognized';

CREATE INDEX IF NOT EXISTS idx_images_recognition_pending
ON images(case_id, recognition_status)
WHERE recognition_status = 'pending' AND deleted_at IS NULL;

-- ============================================================================
-- RPC Function: update_backup_status (UPDATED)
-- ============================================================================
-- Purpose: Called by Make.com after OneDrive backup + AI recognition
-- Now includes AI recognition parameters
-- ============================================================================

-- Drop the old version from migration 07 (3 parameters)
DROP FUNCTION IF EXISTS update_backup_status(UUID, TEXT, TEXT);

-- Create the new version with AI recognition parameters (6 parameters)
CREATE OR REPLACE FUNCTION update_backup_status(
  p_image_id UUID,
  p_onedrive_path TEXT,
  p_backup_status TEXT DEFAULT 'backed_up',
  p_recognized_damage TEXT DEFAULT NULL,
  p_recognized_part TEXT DEFAULT NULL,
  p_recognition_confidence DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update image record with OneDrive backup info + AI recognition
  UPDATE images
  SET
    onedrive_path = p_onedrive_path,
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
  RAISE NOTICE 'Updated backup status for image %: % (damage: %, part: %, confidence: %)',
    p_image_id, p_backup_status, p_recognized_damage, p_recognized_part, p_recognition_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION update_backup_status IS 'Update OneDrive backup status + AI recognition data (called by Make.com webhook)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_backup_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_backup_status TO anon;

-- ============================================================================
-- Helper Function: get_images_by_part
-- ============================================================================
-- Purpose: Get all images for a specific car part
-- Parameters:
--   p_case_id: Case UUID
--   p_part: Part name (e.g., 'front_bumper', 'door')
-- ============================================================================

CREATE OR REPLACE FUNCTION get_images_by_part(
  p_case_id UUID,
  p_part TEXT
)
RETURNS TABLE (
  image_id UUID,
  filename TEXT,
  recognized_damage TEXT,
  recognized_part TEXT,
  recognition_confidence DECIMAL,
  original_url TEXT,
  transformed_url TEXT,
  display_order INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS image_id,
    d.filename,
    i.recognized_damage,
    i.recognized_part,
    i.recognition_confidence,
    i.original_url,
    i.transformed_url,
    i.display_order,
    i.created_at
  FROM images i
  JOIN documents d ON i.document_id = d.id
  WHERE
    i.case_id = p_case_id
    AND i.recognized_part = p_part
    AND i.recognition_status = 'recognized'
    AND i.deleted_at IS NULL
  ORDER BY i.display_order, i.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_images_by_part IS 'Get all recognized images for a specific car part';
GRANT EXECUTE ON FUNCTION get_images_by_part TO authenticated;

-- ============================================================================
-- Helper Function: get_images_by_damage
-- ============================================================================
-- Purpose: Get all images for a specific damage type
-- Parameters:
--   p_case_id: Case UUID
--   p_damage: Damage type (e.g., 'scratch', 'dent')
-- ============================================================================

CREATE OR REPLACE FUNCTION get_images_by_damage(
  p_case_id UUID,
  p_damage TEXT
)
RETURNS TABLE (
  image_id UUID,
  filename TEXT,
  recognized_damage TEXT,
  recognized_part TEXT,
  recognition_confidence DECIMAL,
  original_url TEXT,
  transformed_url TEXT,
  display_order INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS image_id,
    d.filename,
    i.recognized_damage,
    i.recognized_part,
    i.recognition_confidence,
    i.original_url,
    i.transformed_url,
    i.display_order,
    i.created_at
  FROM images i
  JOIN documents d ON i.document_id = d.id
  WHERE
    i.case_id = p_case_id
    AND i.recognized_damage ILIKE '%' || p_damage || '%'
    AND i.recognition_status = 'recognized'
    AND i.deleted_at IS NULL
  ORDER BY i.display_order, i.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_images_by_damage IS 'Get all recognized images for a specific damage type';
GRANT EXECUTE ON FUNCTION get_images_by_damage TO authenticated;

-- ============================================================================
-- Helper Function: get_recognition_summary
-- ============================================================================
-- Purpose: Get summary of recognized parts and damages for a case
-- Returns: Count of each part and damage type
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recognition_summary(
  p_case_id UUID
)
RETURNS TABLE (
  recognized_part TEXT,
  recognized_damage TEXT,
  image_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.recognized_part,
    i.recognized_damage,
    COUNT(*)::INT AS image_count
  FROM images i
  WHERE
    i.case_id = p_case_id
    AND i.recognition_status = 'recognized'
    AND i.deleted_at IS NULL
  GROUP BY i.recognized_part, i.recognized_damage
  ORDER BY image_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_recognition_summary IS 'Get summary of recognized parts and damages (grouped counts)';
GRANT EXECUTE ON FUNCTION get_recognition_summary TO authenticated;

-- ============================================================================
-- Verification Query
-- ============================================================================

DO $$
DECLARE
  v_recognized_damage_exists BOOLEAN;
  v_recognized_part_exists BOOLEAN;
  v_recognition_confidence_exists BOOLEAN;
  v_recognition_status_exists BOOLEAN;
  v_get_images_by_part_exists BOOLEAN;
  v_get_images_by_damage_exists BOOLEAN;
  v_get_recognition_summary_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'recognized_damage'
  ) INTO v_recognized_damage_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'recognized_part'
  ) INTO v_recognized_part_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'recognition_confidence'
  ) INTO v_recognition_confidence_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'images' AND column_name = 'recognition_status'
  ) INTO v_recognition_status_exists;

  -- Check if functions exist
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_images_by_part'
  ) INTO v_get_images_by_part_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_images_by_damage'
  ) INTO v_get_images_by_damage_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_recognition_summary'
  ) INTO v_get_recognition_summary_exists;

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 08 Verification Results:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'recognized_damage column: %',
    CASE WHEN v_recognized_damage_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'recognized_part column: %',
    CASE WHEN v_recognized_part_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'recognition_confidence column: %',
    CASE WHEN v_recognition_confidence_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'recognition_status column: %',
    CASE WHEN v_recognition_status_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'get_images_by_part() function: %',
    CASE WHEN v_get_images_by_part_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'get_images_by_damage() function: %',
    CASE WHEN v_get_images_by_damage_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'get_recognition_summary() function: %',
    CASE WHEN v_get_recognition_summary_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '========================================';

  IF v_recognized_damage_exists AND v_recognized_part_exists AND
     v_recognition_confidence_exists AND v_recognition_status_exists AND
     v_get_images_by_part_exists AND v_get_images_by_damage_exists AND
     v_get_recognition_summary_exists THEN
    RAISE NOTICE '✅ Migration 08 completed successfully!';
  ELSE
    RAISE WARNING '❌ Migration 08 incomplete - check errors above';
  END IF;
END $$;
