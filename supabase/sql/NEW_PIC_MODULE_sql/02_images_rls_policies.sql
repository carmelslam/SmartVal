-- ============================================================================
-- ROW LEVEL SECURITY POLICIES - Images Table
-- ============================================================================
-- Purpose: Enforce case ownership - users can only access images from their cases
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON IMAGES TABLE
-- ============================================================================

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (if re-running)
-- ============================================================================

DROP POLICY IF EXISTS images_select_policy ON images;
DROP POLICY IF EXISTS images_insert_policy ON images;
DROP POLICY IF EXISTS images_update_policy ON images;
DROP POLICY IF EXISTS images_delete_policy ON images;

-- ============================================================================
-- 3. SELECT POLICY - View images from your cases
-- ============================================================================

CREATE POLICY images_select_policy ON images
  FOR SELECT
  TO authenticated
  USING (
    -- User can view images if they own the case
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR
    -- OR if they are a collaborator on the case (future feature)
    case_id IN (
      SELECT case_id FROM case_collaborators WHERE user_id = auth.uid()
    )
    OR
    -- OR if they are admin/developer (full access)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

COMMENT ON POLICY images_select_policy ON images IS
  'Users can view images from cases they own, collaborate on, or if they are admin/developer';

-- ============================================================================
-- 4. INSERT POLICY - Add images to your cases
-- ============================================================================

CREATE POLICY images_insert_policy ON images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can insert images if they own the case
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR
    -- OR if they are a collaborator on the case
    case_id IN (
      SELECT case_id FROM case_collaborators WHERE user_id = auth.uid()
    )
    OR
    -- OR if they are admin/developer
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

COMMENT ON POLICY images_insert_policy ON images IS
  'Users can add images to cases they own, collaborate on, or if they are admin/developer';

-- ============================================================================
-- 5. UPDATE POLICY - Edit your images (including soft delete)
-- ============================================================================

CREATE POLICY images_update_policy ON images
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update if they created the image
    created_by = auth.uid()
    OR
    -- OR if they own the case
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR
    -- OR if they are admin/developer
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    -- Same conditions for the updated row
    created_by = auth.uid()
    OR
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

COMMENT ON POLICY images_update_policy ON images IS
  'Users can update images they created, or images in cases they own, or if they are admin/developer';

-- ============================================================================
-- 6. DELETE POLICY - Hard delete (admin only, soft delete uses UPDATE)
-- ============================================================================

CREATE POLICY images_delete_policy ON images
  FOR DELETE
  TO authenticated
  USING (
    -- Only admin/developer can permanently delete images
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

COMMENT ON POLICY images_delete_policy ON images IS
  'Only admins and developers can permanently delete images (hard delete). Regular users should use soft delete via UPDATE.';

-- ============================================================================
-- 7. NOTES ON USAGE
-- ============================================================================

-- Regular users should NEVER use DELETE. Instead, soft delete:
--   UPDATE images SET deleted_at = now(), deleted_by = auth.uid() WHERE id = ...
--
-- Only admins can permanently delete:
--   DELETE FROM images WHERE id = ...
--
-- To restore a soft-deleted image (admin only):
--   UPDATE images SET deleted_at = NULL, deleted_by = NULL WHERE id = ...

-- ============================================================================
-- END OF FILE
-- ============================================================================
