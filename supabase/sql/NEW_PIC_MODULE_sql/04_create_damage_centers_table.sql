-- ============================================================================
-- DAMAGE CENTERS TABLE - Garage/Shop Associations
-- ============================================================================
-- Purpose: Track damage assessment centers (garages, shops) associated with cases
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- Note: Run this ONLY if damage_centers table doesn't already exist
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF TABLE EXISTS
-- ============================================================================
-- Before running this file, check if the table already exists:
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name = 'damage_centers'
-- );
--
-- If it returns TRUE, skip this file.
-- ============================================================================

-- ============================================================================
-- 2. DROP EXISTING (if re-running)
-- ============================================================================
-- Uncomment only if you need to recreate the table
-- DROP TRIGGER IF EXISTS damage_centers_updated_at_trigger ON damage_centers;
-- DROP FUNCTION IF EXISTS update_damage_centers_updated_at();
-- DROP TABLE IF EXISTS damage_centers CASCADE;

-- ============================================================================
-- 3. CREATE DAMAGE CENTERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS damage_centers (
  -- ========================================
  -- Primary Key
  -- ========================================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========================================
  -- Foreign Key
  -- ========================================
  -- Which case this damage center is associated with
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

  -- ========================================
  -- Basic Information
  -- ========================================
  -- Name of the damage center (in Hebrew)
  -- Example: "מוסך אלון - חיפה"
  name TEXT NOT NULL,

  -- Type of center
  type TEXT CHECK (type IN (
    'garage',     -- מוסך (repair garage)
    'shop',       -- בית עסק (body shop)
    'dealer',     -- סוכנות (authorized dealer)
    'inspector',  -- שמאי (insurance inspector)
    'other'       -- אחר (other)
  )) DEFAULT 'garage',

  -- ========================================
  -- Contact Details
  -- ========================================
  -- Physical address
  address TEXT,

  -- Contact person name
  contact_name TEXT,

  -- Phone number
  contact_phone TEXT,

  -- Email address
  contact_email TEXT,

  -- ========================================
  -- Additional Information
  -- ========================================
  -- Free-form notes
  notes TEXT,

  -- Metadata (flexible JSON for future use)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- ========================================
  -- Statistics (Denormalized for Performance)
  -- ========================================
  -- Count of images associated with this damage center
  -- Updated by trigger or application code
  images_count INT DEFAULT 0,

  -- ========================================
  -- Audit Trail
  -- ========================================
  -- Who created this damage center
  created_by UUID REFERENCES profiles(user_id),

  -- When was it created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Last modification time (auto-updated by trigger)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Get all damage centers for a case
CREATE INDEX idx_damage_centers_case ON damage_centers(case_id);

-- Filter by type
CREATE INDEX idx_damage_centers_type ON damage_centers(type);

-- Search by name (for autocomplete/filtering)
-- Using standard index for LIKE/ILIKE queries
CREATE INDEX idx_damage_centers_name ON damage_centers(name);

-- Find by creator
CREATE INDEX idx_damage_centers_created_by ON damage_centers(created_by);

-- ============================================================================
-- 5. ADD COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE damage_centers IS 'Damage assessment centers (garages, shops) associated with cases';

COMMENT ON COLUMN damage_centers.case_id IS 'Which case this damage center is associated with';
COMMENT ON COLUMN damage_centers.name IS 'Name of the damage center (Hebrew)';
COMMENT ON COLUMN damage_centers.type IS 'Type: garage, shop, dealer, inspector, other';
COMMENT ON COLUMN damage_centers.images_count IS 'Denormalized count of associated images (updated by trigger/app)';
COMMENT ON COLUMN damage_centers.metadata IS 'Flexible JSON for future extensions';

-- ============================================================================
-- 6. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_damage_centers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Automatically update the updated_at timestamp whenever row is modified
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER damage_centers_updated_at_trigger
  BEFORE UPDATE ON damage_centers
  FOR EACH ROW
  EXECUTE FUNCTION update_damage_centers_updated_at();

COMMENT ON FUNCTION update_damage_centers_updated_at() IS 'Automatically updates the updated_at timestamp on damage_centers table';

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE damage_centers ENABLE ROW LEVEL SECURITY;

-- SELECT: View damage centers from your cases
CREATE POLICY damage_centers_select_policy ON damage_centers
  FOR SELECT
  TO authenticated
  USING (
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR
    case_id IN (
      SELECT case_id FROM case_collaborators WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

-- INSERT: Add damage centers to your cases
CREATE POLICY damage_centers_insert_policy ON damage_centers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR
    case_id IN (
      SELECT case_id FROM case_collaborators WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

-- UPDATE: Edit damage centers in your cases
CREATE POLICY damage_centers_update_policy ON damage_centers
  FOR UPDATE
  TO authenticated
  USING (
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

-- DELETE: Remove damage centers from your cases
CREATE POLICY damage_centers_delete_policy ON damage_centers
  FOR DELETE
  TO authenticated
  USING (
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

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON damage_centers TO authenticated;

-- Note: No sequence needed for UUID primary keys (gen_random_uuid())

-- ============================================================================
-- 9. HELPER FUNCTION - UPDATE IMAGE COUNT
-- ============================================================================
-- This function updates the images_count when images are added/removed

CREATE OR REPLACE FUNCTION update_damage_center_image_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_damage_center_id UUID;
BEGIN
  -- Determine which damage center to update
  IF TG_OP = 'DELETE' THEN
    v_damage_center_id := OLD.damage_center_id;
  ELSE
    v_damage_center_id := NEW.damage_center_id;
  END IF;

  -- Skip if no damage center association
  IF v_damage_center_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update the count
  UPDATE damage_centers
  SET images_count = (
    SELECT COUNT(*)
    FROM images
    WHERE damage_center_id = v_damage_center_id
      AND deleted_at IS NULL
  )
  WHERE id = v_damage_center_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_damage_center_image_count() IS
  'Automatically updates images_count in damage_centers when images are added/removed/deleted';

-- ============================================================================
-- 10. TRIGGER - UPDATE IMAGE COUNT ON IMAGES TABLE CHANGES
-- ============================================================================
-- Note: This trigger is created AFTER the images table exists

-- CREATE TRIGGER update_damage_center_count_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON images
--   FOR EACH ROW
--   EXECUTE FUNCTION update_damage_center_image_count();

-- Uncomment the above trigger after images table is created

-- ============================================================================
-- END OF FILE
-- ============================================================================
