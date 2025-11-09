-- =====================================================
-- Phase 10: Report Submission System
-- Migration 01: Create User Assets Table (REVISED)
-- Date: 2025-11-09
-- =====================================================
--
-- Purpose: Dedicated table for user-specific assets (logos, signatures, stamps)
-- User Requirement: Each user should have their own assets for PDF generation
-- Dependencies: profiles table (from Phase 6)
--
-- Benefits of dedicated table:
-- - Better normalized design
-- - Easy to add new asset types
-- - Track upload history and metadata
-- - Cleaner separation of concerns
-- =====================================================

-- Drop columns from profiles if they were added (cleanup)
ALTER TABLE profiles DROP COLUMN IF EXISTS company_logo_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS company_stamp_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS user_signature_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS draft_watermark_text;
ALTER TABLE profiles DROP COLUMN IF EXISTS directive_watermark_text;

-- Create user_assets table
CREATE TABLE IF NOT EXISTS user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to user
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,

  -- Asset URLs (stored in Supabase Storage)
  company_logo_url TEXT,
  company_stamp_url TEXT,
  user_signature_url TEXT,

  -- Custom watermark texts
  draft_watermark_text TEXT DEFAULT 'טיוטה בלבד',
  directive_watermark_text TEXT,

  -- Metadata
  logo_uploaded_at TIMESTAMPTZ,
  stamp_uploaded_at TIMESTAMPTZ,
  signature_uploaded_at TIMESTAMPTZ,

  -- Storage paths (for deletion/updates)
  logo_storage_path TEXT,
  stamp_storage_path TEXT,
  signature_storage_path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Primary lookup by user_id (most common query)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_assets_user_id
ON user_assets(user_id);

-- Index for finding users with logos
CREATE INDEX IF NOT EXISTS idx_user_assets_has_logo
ON user_assets(user_id)
WHERE company_logo_url IS NOT NULL;

-- Index for finding users with signatures
CREATE INDEX IF NOT EXISTS idx_user_assets_has_signature
ON user_assets(user_id)
WHERE user_signature_url IS NOT NULL;

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_assets_updated_at
  BEFORE UPDATE ON user_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_assets_timestamp();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own assets
CREATE POLICY "user_assets_select_own"
ON user_assets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own assets
CREATE POLICY "user_assets_insert_own"
ON user_assets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own assets
CREATE POLICY "user_assets_update_own"
ON user_assets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own assets
CREATE POLICY "user_assets_delete_own"
ON user_assets
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can view all assets
CREATE POLICY "user_assets_admin_select_all"
ON user_assets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- =====================================================
-- Helper Function: Get user assets (with fallback)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_assets(p_user_id UUID)
RETURNS TABLE (
  company_logo_url TEXT,
  company_stamp_url TEXT,
  user_signature_url TEXT,
  draft_watermark_text TEXT,
  directive_watermark_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ua.company_logo_url,
    ua.company_stamp_url,
    ua.user_signature_url,
    COALESCE(ua.draft_watermark_text, 'טיוטה בלבד') as draft_watermark_text,
    ua.directive_watermark_text
  FROM user_assets ua
  WHERE ua.user_id = p_user_id;

  -- If no row exists, return NULL values
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, 'טיוטה בלבד'::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper Function: Upsert user assets
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_user_asset(
  p_user_id UUID,
  p_asset_type TEXT,
  p_asset_url TEXT,
  p_storage_path TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  -- Insert or get existing record
  INSERT INTO user_assets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_asset_id;

  -- Get ID if already existed
  IF v_asset_id IS NULL THEN
    SELECT id INTO v_asset_id FROM user_assets WHERE user_id = p_user_id;
  END IF;

  -- Update specific asset based on type
  CASE p_asset_type
    WHEN 'logo' THEN
      UPDATE user_assets
      SET company_logo_url = p_asset_url,
          logo_storage_path = p_storage_path,
          logo_uploaded_at = now()
      WHERE id = v_asset_id;

    WHEN 'stamp' THEN
      UPDATE user_assets
      SET company_stamp_url = p_asset_url,
          stamp_storage_path = p_storage_path,
          stamp_uploaded_at = now()
      WHERE id = v_asset_id;

    WHEN 'signature' THEN
      UPDATE user_assets
      SET user_signature_url = p_asset_url,
          signature_storage_path = p_storage_path,
          signature_uploaded_at = now()
      WHERE id = v_asset_id;

    ELSE
      RAISE EXCEPTION 'Invalid asset type: %. Must be logo, stamp, or signature', p_asset_type;
  END CASE;

  RETURN v_asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE user_assets IS 'User-specific assets for PDF generation (logos, stamps, signatures)';
COMMENT ON COLUMN user_assets.user_id IS 'Reference to profiles.user_id';
COMMENT ON COLUMN user_assets.company_logo_url IS 'Public URL to user company logo (Supabase Storage)';
COMMENT ON COLUMN user_assets.company_stamp_url IS 'Public URL to user company stamp/seal (Supabase Storage)';
COMMENT ON COLUMN user_assets.user_signature_url IS 'Public URL to user signature image (Supabase Storage)';
COMMENT ON COLUMN user_assets.draft_watermark_text IS 'Custom text for draft watermark (default: טיוטה בלבד)';
COMMENT ON COLUMN user_assets.directive_watermark_text IS 'Custom text for expertise directive watermark';
COMMENT ON COLUMN user_assets.logo_storage_path IS 'Storage bucket path for logo (for deletion/update)';
COMMENT ON COLUMN user_assets.stamp_storage_path IS 'Storage bucket path for stamp (for deletion/update)';
COMMENT ON COLUMN user_assets.signature_storage_path IS 'Storage bucket path for signature (for deletion/update)';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON user_assets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_assets TO authenticated; -- RLS restricts

GRANT EXECUTE ON FUNCTION get_user_assets(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_asset(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- Verification query
-- =====================================================

-- Check that table was created successfully
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_assets'
ORDER BY ordinal_position;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 10 Migration 01 completed successfully (REVISED)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created user_assets table with:';
  RAISE NOTICE '  - company_logo_url (TEXT)';
  RAISE NOTICE '  - company_stamp_url (TEXT)';
  RAISE NOTICE '  - user_signature_url (TEXT)';
  RAISE NOTICE '  - draft_watermark_text (TEXT, default: טיוטה בלבד)';
  RAISE NOTICE '  - directive_watermark_text (TEXT)';
  RAISE NOTICE '  - Metadata fields (upload timestamps, storage paths)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Helper functions created:';
  RAISE NOTICE '  - get_user_assets(user_id) - Fetch assets for a user';
  RAISE NOTICE '  - upsert_user_asset(user_id, type, url, path) - Update assets';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS policies enabled:';
  RAISE NOTICE '  - Users can manage their own assets';
  RAISE NOTICE '  - Admins can view all assets';
  RAISE NOTICE '';
  RAISE NOTICE '⏭️ Next steps:';
  RAISE NOTICE '  1. Upload user assets to Supabase Storage';
  RAISE NOTICE '  2. Call upsert_user_asset() to save asset URLs';
  RAISE NOTICE '  3. Update authService.js to fetch from user_assets table';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
