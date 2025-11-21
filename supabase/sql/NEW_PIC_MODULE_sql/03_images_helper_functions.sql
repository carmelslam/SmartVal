-- ============================================================================
-- HELPER FUNCTIONS - Images Table
-- ============================================================================
-- Purpose: Utility functions for common image operations
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- 1. GET NEXT DISPLAY ORDER
-- ============================================================================
-- Purpose: Get the next available display_order value for a case
-- Usage: SELECT get_next_display_order('case-uuid-here');
-- Returns: Next order value (max + 100, or 0 if no images)

CREATE OR REPLACE FUNCTION get_next_display_order(p_case_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(display_order), -100) + 100
  FROM images
  WHERE case_id = p_case_id
    AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION get_next_display_order(UUID) IS
  'Returns the next available display_order value for a case (max + 100, or 0 if no images)';

-- Example usage:
-- INSERT INTO images (case_id, display_order, ...)
-- VALUES ('case-uuid', get_next_display_order('case-uuid'), ...);

-- ============================================================================
-- 2. REORDER IMAGES (BATCH UPDATE)
-- ============================================================================
-- Purpose: Update display_order for multiple images at once (drag-drop reordering)
-- Usage: SELECT reorder_images('[{"id": "uuid1", "order": 0}, {"id": "uuid2", "order": 100}]'::jsonb);
-- Returns: Number of images reordered

CREATE OR REPLACE FUNCTION reorder_images(p_image_orders JSONB)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_item JSONB;
  v_count INT := 0;
BEGIN
  -- Loop through each image order update
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_image_orders)
  LOOP
    -- Update the display_order for this image
    UPDATE images
    SET display_order = (v_item->>'order')::int,
        updated_at = now()
    WHERE id = (v_item->>'id')::uuid;

    -- Increment counter if row was updated
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION reorder_images(JSONB) IS
  'Batch update display_order for multiple images. Input: [{"id": "uuid", "order": 100}, ...]';

-- Example usage:
-- SELECT reorder_images('[
--   {"id": "img-uuid-1", "order": 0},
--   {"id": "img-uuid-2", "order": 100},
--   {"id": "img-uuid-3", "order": 200}
-- ]'::jsonb);

-- ============================================================================
-- 3. SOFT DELETE IMAGE
-- ============================================================================
-- Purpose: Mark an image as deleted without removing it from database
-- Usage: SELECT soft_delete_image('image-uuid-here');
-- Returns: TRUE if deleted, FALSE if not found or already deleted

CREATE OR REPLACE FUNCTION soft_delete_image(p_image_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the image to set deleted_at and deleted_by
  UPDATE images
  SET deleted_at = now(),
      deleted_by = auth.uid(),
      updated_at = now()
  WHERE id = p_image_id
    AND deleted_at IS NULL;  -- Only delete if not already deleted

  -- FOUND is a special variable that is TRUE if the last SQL statement affected at least one row
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION soft_delete_image(UUID) IS
  'Soft delete an image (sets deleted_at and deleted_by). Returns TRUE if successful.';

-- Example usage:
-- SELECT soft_delete_image('img-uuid-here');

-- ============================================================================
-- 4. RESTORE DELETED IMAGE
-- ============================================================================
-- Purpose: Restore a soft-deleted image
-- Usage: SELECT restore_image('image-uuid-here');
-- Returns: TRUE if restored, FALSE if not found or not deleted

CREATE OR REPLACE FUNCTION restore_image(p_image_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear deleted_at and deleted_by
  UPDATE images
  SET deleted_at = NULL,
      deleted_by = NULL,
      updated_at = now()
  WHERE id = p_image_id
    AND deleted_at IS NOT NULL;  -- Only restore if currently deleted

  -- FOUND is a special variable that is TRUE if the last SQL statement affected at least one row
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION restore_image(UUID) IS
  'Restore a soft-deleted image (clears deleted_at and deleted_by). Returns TRUE if successful.';

-- Example usage:
-- SELECT restore_image('img-uuid-here');

-- ============================================================================
-- 5. GET CASE IMAGE COUNT
-- ============================================================================
-- Purpose: Count images for a case (excluding deleted)
-- Usage: SELECT get_case_image_count('case-uuid-here');
-- Returns: Number of non-deleted images

CREATE OR REPLACE FUNCTION get_case_image_count(p_case_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::int
  FROM images
  WHERE case_id = p_case_id
    AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION get_case_image_count(UUID) IS
  'Returns the count of non-deleted images for a case';

-- Example usage:
-- SELECT get_case_image_count('case-uuid-here');

-- ============================================================================
-- 6. GET CASE IMAGE COUNT BY CATEGORY
-- ============================================================================
-- Purpose: Count images for a case by category
-- Usage: SELECT get_case_image_count_by_category('case-uuid-here');
-- Returns: JSONB with counts per category

CREATE OR REPLACE FUNCTION get_case_image_count_by_category(p_case_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_object_agg(
    COALESCE(category, 'uncategorized'),
    count
  )
  FROM (
    SELECT category, COUNT(*)::int as count
    FROM images
    WHERE case_id = p_case_id
      AND deleted_at IS NULL
    GROUP BY category
  ) counts;
$$;

COMMENT ON FUNCTION get_case_image_count_by_category(UUID) IS
  'Returns image counts by category as JSONB: {"damage": 5, "general": 3, ...}';

-- Example usage:
-- SELECT get_case_image_count_by_category('case-uuid-here');
-- Returns: {"damage": 5, "general": 3, "parts": 2}

-- ============================================================================
-- 7. GET PENDING OPTIMIZATIONS
-- ============================================================================
-- Purpose: Get all images that need Cloudinary processing
-- Usage: SELECT * FROM get_pending_optimizations(10);
-- Returns: Table of images waiting for processing

CREATE OR REPLACE FUNCTION get_pending_optimizations(p_limit INT DEFAULT 50)
RETURNS TABLE (
  image_id UUID,
  case_id UUID,
  original_url TEXT,
  filename TEXT,
  created_at TIMESTAMPTZ,
  age_minutes INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id as image_id,
    case_id,
    original_url,
    filename,
    created_at,
    EXTRACT(EPOCH FROM (now() - created_at))::int / 60 as age_minutes
  FROM images
  WHERE optimization_status = 'pending'
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_pending_optimizations(INT) IS
  'Returns images waiting for Cloudinary processing, ordered by oldest first';

-- Example usage:
-- SELECT * FROM get_pending_optimizations(10);

-- ============================================================================
-- 8. UPDATE OPTIMIZATION STATUS
-- ============================================================================
-- Purpose: Update optimization status and Cloudinary URL after processing
-- Usage: SELECT update_optimization_status('img-uuid', 'optimized', 'https://...');
-- Returns: TRUE if updated successfully

CREATE OR REPLACE FUNCTION update_optimization_status(
  p_image_id UUID,
  p_status TEXT,
  p_cloudinary_url TEXT DEFAULT NULL,
  p_onedrive_path TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate status
  IF p_status NOT IN ('pending', 'processing', 'optimized', 'failed') THEN
    RAISE EXCEPTION 'Invalid optimization status: %', p_status;
  END IF;

  -- Update the image
  UPDATE images
  SET optimization_status = p_status,
      cloudinary_url = COALESCE(p_cloudinary_url, cloudinary_url),
      onedrive_path = COALESCE(p_onedrive_path, onedrive_path),
      updated_at = now()
  WHERE id = p_image_id;

  -- FOUND is a special variable that is TRUE if the last SQL statement affected at least one row
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION update_optimization_status(UUID, TEXT, TEXT, TEXT) IS
  'Update optimization status and optionally set Cloudinary URL and OneDrive path';

-- Example usage:
-- SELECT update_optimization_status(
--   'img-uuid-here',
--   'optimized',
--   'https://res.cloudinary.com/.../image.jpg',
--   '/EVALIX/Cases/ABC123/Images/image.jpg'
-- );

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_next_display_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_images(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_image(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_image(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_case_image_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_case_image_count_by_category(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_optimizations(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_optimization_status(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- END OF FILE
-- ============================================================================
