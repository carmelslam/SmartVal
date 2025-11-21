-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT - Images → Damage Centers
-- ============================================================================
-- Purpose: Add foreign key constraint from images.damage_center_id to damage_centers.id
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- PREREQUISITE
-- ============================================================================
-- This file should be run AFTER:
-- - 01_create_images_table.sql (images table exists)
-- - 04_create_damage_centers_table.sql (damage_centers table exists)
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF CONSTRAINT ALREADY EXISTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'images_damage_center_id_fkey'
    AND table_name = 'images'
  ) THEN
    RAISE NOTICE 'Foreign key constraint already exists. Skipping.';
  ELSE
    -- Add the foreign key constraint
    ALTER TABLE images
    ADD CONSTRAINT images_damage_center_id_fkey
    FOREIGN KEY (damage_center_id)
    REFERENCES damage_centers(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Foreign key constraint added successfully.';
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE INDEX ON DAMAGE_CENTER_ID (if not already created)
-- ============================================================================

-- This index should already exist from 01_create_images_table.sql
-- But we'll make sure it exists
CREATE INDEX IF NOT EXISTS idx_images_damage_center ON images(damage_center_id);

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

-- Verify the constraint was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'images_damage_center_id_fkey'
    AND table_name = 'images'
  ) THEN
    RAISE NOTICE '✓ Foreign key constraint exists';
  ELSE
    RAISE WARNING '✗ Foreign key constraint NOT found!';
  END IF;
END $$;

-- ============================================================================
-- END OF FILE
-- ============================================================================
