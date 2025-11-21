-- ============================================================================
-- IMAGES TABLE - Pictures Upload Module Rebuild
-- ============================================================================
-- Purpose: Core table for managing case images with ordering, categorization,
--          and damage center association
-- Created: 2025-11-21
-- Phase: 1A - Foundation
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING (if re-running)
-- ============================================================================
-- Uncomment only if you need to recreate the table
-- DROP TRIGGER IF EXISTS images_updated_at_trigger ON images;
-- DROP FUNCTION IF EXISTS update_images_updated_at();
-- DROP TABLE IF EXISTS images CASCADE;

-- ============================================================================
-- 2. CREATE IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS images (
  -- ========================================
  -- Primary Key
  -- ========================================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========================================
  -- Foreign Keys
  -- ========================================
  -- Case association (which case owns this image)
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

  -- Document reference (file storage record in documents table)
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Damage center association (which garage/shop)
  -- Note: May be NULL if image is general or not associated with specific center
  -- Note: Foreign key constraint will be added after damage_centers table is created
  damage_center_id UUID,

  -- ========================================
  -- URLs & Storage References
  -- ========================================
  -- Primary URL: Supabase Storage public/signed URL
  original_url TEXT NOT NULL,

  -- Optional: Cloudinary transformation URL (watermarked, optimized)
  cloudinary_url TEXT,

  -- Legacy: OneDrive path for backward compatibility
  onedrive_path TEXT,

  -- ========================================
  -- File Metadata
  -- ========================================
  -- Original filename (stored here for quick access, also in documents table)
  filename TEXT NOT NULL,

  -- Image dimensions (populated after upload or by Make.com)
  width INT,
  height INT,

  -- EXIF data (camera info, GPS, etc.) stored as JSON
  exif_data JSONB,

  -- ========================================
  -- Organization & Display
  -- ========================================
  -- Display order for reordering (higher = later in sequence)
  -- Spacing by 100 allows inserting between items without full reorder
  display_order INT DEFAULT 0,

  -- Image category for filtering
  category TEXT CHECK (category IN (
    'damage',      -- נזק (damage photos)
    'general',     -- כללי (general vehicle photos)
    'parts',       -- חלקים (parts photos)
    'documents',   -- מסמכים (document photos)
    'other'        -- אחר (other)
  )),

  -- ========================================
  -- Processing Status
  -- ========================================
  -- Tracks Cloudinary/Make.com processing status
  optimization_status TEXT DEFAULT 'pending' CHECK (optimization_status IN (
    'pending',     -- Waiting for processing
    'processing',  -- Currently being processed by Make.com
    'optimized',   -- Processing complete, cloudinary_url available
    'failed'       -- Processing failed, check logs
  )),

  -- ========================================
  -- Source Tracking
  -- ========================================
  -- How was this image uploaded?
  source TEXT DEFAULT 'direct_upload' CHECK (source IN (
    'direct_upload',  -- Uploaded via upload-images.html
    'email',          -- Received via email (future feature)
    'onedrive',       -- Imported from OneDrive (future feature)
    'manual'          -- Manually added by admin
  )),

  -- Flag: Was this image processed by external software before upload?
  is_external_processed BOOLEAN DEFAULT false,

  -- ========================================
  -- Audit Trail
  -- ========================================
  -- Who uploaded this image
  created_by UUID REFERENCES profiles(user_id),

  -- When was it uploaded
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Last modification time (auto-updated by trigger)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ========================================
  -- Soft Delete
  -- ========================================
  -- When was it deleted (NULL = not deleted)
  deleted_at TIMESTAMPTZ,

  -- Who deleted it
  deleted_by UUID REFERENCES profiles(user_id)
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Main query: Get all images for a case, ordered
-- This is the most common query, so optimize it well
CREATE INDEX idx_images_case_order ON images(case_id, display_order);

-- Filter by damage center
CREATE INDEX idx_images_damage_center ON images(damage_center_id);

-- Filter by category
CREATE INDEX idx_images_category ON images(category);

-- Partial index: Filter out deleted images (most common case)
-- This makes queries that filter WHERE deleted_at IS NULL much faster
CREATE INDEX idx_images_not_deleted ON images(case_id, display_order)
  WHERE deleted_at IS NULL;

-- Query pending/processing optimizations (for background jobs)
CREATE INDEX idx_images_optimization ON images(optimization_status)
  WHERE optimization_status IN ('pending', 'processing');

-- Find images by document_id (useful for file operations)
CREATE INDEX idx_images_document ON images(document_id);

-- Find images by creator (audit queries)
CREATE INDEX idx_images_created_by ON images(created_by);

-- ============================================================================
-- 4. ADD COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE images IS 'Core table for managing case images with ordering, categorization, and damage center association';

COMMENT ON COLUMN images.case_id IS 'Which case this image belongs to';
COMMENT ON COLUMN images.document_id IS 'Reference to file storage record in documents table';
COMMENT ON COLUMN images.damage_center_id IS 'Which damage center (garage/shop) this image is associated with';
COMMENT ON COLUMN images.original_url IS 'Primary Supabase Storage URL for the image';
COMMENT ON COLUMN images.cloudinary_url IS 'Optional Cloudinary transformation URL (watermarked, optimized)';
COMMENT ON COLUMN images.display_order IS 'Order for displaying images (spaced by 100 for easy reordering)';
COMMENT ON COLUMN images.category IS 'Image category: damage, general, parts, documents, other';
COMMENT ON COLUMN images.optimization_status IS 'Processing status: pending, processing, optimized, failed';
COMMENT ON COLUMN images.source IS 'How was this image uploaded: direct_upload, email, onedrive, manual';
COMMENT ON COLUMN images.deleted_at IS 'Soft delete timestamp (NULL = not deleted)';

-- ============================================================================
-- 5. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Automatically update the updated_at timestamp whenever row is modified
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER images_updated_at_trigger
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_images_updated_at();

COMMENT ON FUNCTION update_images_updated_at() IS 'Automatically updates the updated_at timestamp on images table';

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to the table
-- (RLS policies will control what they can actually see/modify)
GRANT SELECT, INSERT, UPDATE, DELETE ON images TO authenticated;

-- Note: No sequence needed for UUID primary keys (gen_random_uuid())

-- ============================================================================
-- END OF FILE
-- ============================================================================
