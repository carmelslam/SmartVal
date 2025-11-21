-- ============================================================================
-- LINK IMAGES AND DAMAGE CENTERS - Trigger for Auto-Update Count
-- ============================================================================
-- Purpose: Automatically update images_count in damage_centers when images
--          are added, removed, or soft-deleted
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- PREREQUISITE
-- ============================================================================
-- This file should be run AFTER:
-- - 01_create_images_table.sql
-- - 04_create_damage_centers_table.sql
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING TRIGGER (if re-running)
-- ============================================================================

DROP TRIGGER IF EXISTS update_damage_center_count_trigger ON images;

-- ============================================================================
-- 2. CREATE TRIGGER ON IMAGES TABLE
-- ============================================================================

CREATE TRIGGER update_damage_center_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_damage_center_image_count();

COMMENT ON TRIGGER update_damage_center_count_trigger ON images IS
  'Automatically updates images_count in damage_centers when images are added/removed/soft-deleted';

-- ============================================================================
-- 3. INITIAL COUNT UPDATE (For Existing Data)
-- ============================================================================
-- If you already have images in the database (unlikely in fresh migration),
-- run this to populate the counts:

UPDATE damage_centers dc
SET images_count = (
  SELECT COUNT(*)
  FROM images i
  WHERE i.damage_center_id = dc.id
    AND i.deleted_at IS NULL
);

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================
-- After running this file, verify the trigger works:

-- Test 1: Insert an image with damage_center_id
-- INSERT INTO images (case_id, document_id, damage_center_id, original_url, filename, category)
-- VALUES (...);
--
-- Then check:
-- SELECT images_count FROM damage_centers WHERE id = 'damage-center-id';
-- Expected: count should increase by 1

-- Test 2: Soft delete the image
-- UPDATE images SET deleted_at = now() WHERE id = 'image-id';
--
-- Then check:
-- SELECT images_count FROM damage_centers WHERE id = 'damage-center-id';
-- Expected: count should decrease by 1

-- Test 3: Restore the image
-- UPDATE images SET deleted_at = NULL WHERE id = 'image-id';
--
-- Then check:
-- SELECT images_count FROM damage_centers WHERE id = 'damage-center-id';
-- Expected: count should increase by 1

-- ============================================================================
-- END OF FILE
-- ============================================================================
