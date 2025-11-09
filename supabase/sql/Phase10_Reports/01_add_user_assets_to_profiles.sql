-- =====================================================
-- Phase 10: Report Submission System
-- Migration 01: Add User Assets to Profiles Table
-- Date: 2025-11-09
-- =====================================================
--
-- Purpose: Add columns to store user-specific assets for PDF generation
-- User Requirement: Each user should have their own logo, stamp, signature in PDFs
-- Dependencies: profiles table (from Phase 6)
--
-- =====================================================

-- Add user asset URL columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_stamp_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_signature_url TEXT;

-- Optional: Custom watermark text fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS draft_watermark_text TEXT DEFAULT 'טיוטה בלבד';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS directive_watermark_text TEXT;

-- =====================================================
-- Add comments for documentation
-- =====================================================

COMMENT ON COLUMN profiles.company_logo_url IS 'Public URL to user''s company logo (stored in Supabase Storage)';
COMMENT ON COLUMN profiles.company_stamp_url IS 'Public URL to user''s company stamp/seal (stored in Supabase Storage)';
COMMENT ON COLUMN profiles.user_signature_url IS 'Public URL to user''s signature image (stored in Supabase Storage)';
COMMENT ON COLUMN profiles.draft_watermark_text IS 'Custom text for draft watermark (default: טיוטה בלבד)';
COMMENT ON COLUMN profiles.directive_watermark_text IS 'Custom text for expertise directive watermark';

-- =====================================================
-- Create indexes for performance (optional but recommended)
-- =====================================================

-- Index on non-null asset URLs for queries
CREATE INDEX IF NOT EXISTS idx_profiles_has_logo
ON profiles(user_id)
WHERE company_logo_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_has_signature
ON profiles(user_id)
WHERE user_signature_url IS NOT NULL;

-- =====================================================
-- Verification query
-- =====================================================

-- Check that columns were added successfully
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'company_logo_url',
    'company_stamp_url',
    'user_signature_url',
    'draft_watermark_text',
    'directive_watermark_text'
  )
ORDER BY column_name;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 10 Migration 01 completed successfully';
  RAISE NOTICE 'Added columns to profiles table:';
  RAISE NOTICE '  - company_logo_url (TEXT)';
  RAISE NOTICE '  - company_stamp_url (TEXT)';
  RAISE NOTICE '  - user_signature_url (TEXT)';
  RAISE NOTICE '  - draft_watermark_text (TEXT, default: טיוטה בלבד)';
  RAISE NOTICE '  - directive_watermark_text (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Next steps:';
  RAISE NOTICE '  1. Upload user assets to Supabase Storage buckets';
  RAISE NOTICE '  2. Update profiles with asset URLs';
  RAISE NOTICE '  3. Update authService.js to fetch these fields';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
