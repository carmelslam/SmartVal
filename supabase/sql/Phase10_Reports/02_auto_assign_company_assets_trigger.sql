-- =====================================================
-- Phase 10: Report Submission System
-- Migration 02: Auto-Assign Company Assets to New Users
-- Date: 2025-11-09
-- =====================================================
--
-- Purpose: Automatically assign company branding assets to new users
-- Trigger: When a new profile is created, copy company assets from admin user
--
-- Business Logic:
-- - All users share the same company branding (logo, stamp, signature, background)
-- - New users automatically get these assets without manual intervention
-- - Assets are copied from the admin user (e2b7355f-1b05-4410-a0e2-0e60ea9917d7)
--
-- =====================================================

-- =====================================================
-- Step 1: Copy assets to all existing users (one-time)
-- =====================================================

INSERT INTO user_assets (
  user_id,
  company_logo_url,
  company_stamp_url,
  user_signature_url,
  background_url,
  draft_watermark_text,
  directive_watermark_text
)
SELECT
  p.user_id,
  'https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/public/user_logo/last%20logo%20trans.png',
  'https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/public/user_stamp/yaron%20signature%20transparent%20.png',
  'https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/public/user_stamp/yaron%20signature%20transparent%20.png',
  'https://nvqrptokmwdhvpiufrad.supabase.co/storage/v1/object/public/user_background/good.jpg',
  'טיוטה בלבד',
  null
FROM profiles p
WHERE p.user_id NOT IN (SELECT user_id FROM user_assets)
  AND p.user_id != 'e2b7355f-1b05-4410-a0e2-0e60ea9917d7';

-- =====================================================
-- Step 2: Create function to auto-assign assets to new users
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_company_assets()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_user_id UUID := 'e2b7355f-1b05-4410-a0e2-0e60ea9917d7';
  v_admin_assets RECORD;
BEGIN
  -- Get admin user's assets
  SELECT
    company_logo_url,
    company_stamp_url,
    user_signature_url,
    background_url,
    draft_watermark_text,
    directive_watermark_text
  INTO v_admin_assets
  FROM user_assets
  WHERE user_id = v_admin_user_id;

  -- If admin assets exist, copy them to the new user
  IF FOUND THEN
    INSERT INTO user_assets (
      user_id,
      company_logo_url,
      company_stamp_url,
      user_signature_url,
      background_url,
      draft_watermark_text,
      directive_watermark_text
    ) VALUES (
      NEW.user_id,
      v_admin_assets.company_logo_url,
      v_admin_assets.company_stamp_url,
      v_admin_assets.user_signature_url,
      v_admin_assets.background_url,
      v_admin_assets.draft_watermark_text,
      v_admin_assets.directive_watermark_text
    );

    RAISE NOTICE 'Auto-assigned company assets to new user: %', NEW.user_id;
  ELSE
    RAISE WARNING 'Admin user assets not found - new user % will not have assets', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 3: Create trigger on profiles table
-- =====================================================

DROP TRIGGER IF EXISTS trg_auto_assign_company_assets ON profiles;

CREATE TRIGGER trg_auto_assign_company_assets
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_company_assets();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON FUNCTION auto_assign_company_assets() IS
  'Automatically assigns company branding assets to newly created users by copying from admin user';

COMMENT ON TRIGGER trg_auto_assign_company_assets ON profiles IS
  'Trigger that fires after new profile creation to assign default company assets';

-- =====================================================
-- Verification
-- =====================================================

-- Check how many users now have assets
SELECT
  COUNT(*) as users_with_assets,
  (SELECT COUNT(*) FROM profiles) as total_users
FROM user_assets;

-- =====================================================
-- Success message
-- =====================================================

DO $$
DECLARE
  v_users_updated INTEGER;
  v_total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users_updated FROM user_assets;
  SELECT COUNT(*) INTO v_total_users FROM profiles;

  RAISE NOTICE '✅ Phase 10 Migration 02 completed successfully';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Results:';
  RAISE NOTICE '  - Users with assets: % / %', v_users_updated, v_total_users;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Auto-assignment trigger created:';
  RAISE NOTICE '  - Function: auto_assign_company_assets()';
  RAISE NOTICE '  - Trigger: trg_auto_assign_company_assets (on profiles table)';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Future users will automatically get company assets!';
  RAISE NOTICE '';
  RAISE NOTICE '⏭️ Next step:';
  RAISE NOTICE '  - Update HTML builders to use asset-loader.js (FIX 4-6)';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
