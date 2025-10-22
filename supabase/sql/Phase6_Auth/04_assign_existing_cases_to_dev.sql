-- Phase 6: User Management & Authentication
-- Migration 04: Assign Existing Cases to Developer
-- Date: 2025-10-22
-- Purpose: Assign all existing cases to the developer user

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 1: Get Developer User ID
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  dev_user_id UUID;
  cases_count INT;
  updated_count INT;
BEGIN
  -- Get developer user ID
  SELECT user_id INTO dev_user_id
  FROM profiles
  WHERE role = 'developer'
  LIMIT 1;

  -- Check if developer exists
  IF dev_user_id IS NULL THEN
    RAISE EXCEPTION 'No developer user found. Please run migration 02 first.';
  END IF;

  -- Count existing cases
  SELECT COUNT(*) INTO cases_count FROM cases;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Starting case assignment...';
  RAISE NOTICE 'Developer User ID: %', dev_user_id;
  RAISE NOTICE 'Total cases in database: %', cases_count;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  -- Update all cases without a creator
  UPDATE cases
  SET created_by = dev_user_id
  WHERE created_by IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Updated % cases with developer as creator', updated_count;
  
  -- Show summary
  RAISE NOTICE '';
  RAISE NOTICE '📊 Case Assignment Summary:';
  RAISE NOTICE '   Total cases: %', cases_count;
  RAISE NOTICE '   Assigned to developer: %', updated_count;
  RAISE NOTICE '   Already had creator: %', cases_count - updated_count;
  RAISE NOTICE '';

END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 2: Verification Query
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Show cases grouped by creator
SELECT 
  COALESCE(p.name, 'No Creator') as creator_name,
  p.role as creator_role,
  COUNT(c.id) as case_count,
  STRING_AGG(c.plate, ', ' ORDER BY c.created_at DESC) as plates
FROM cases c
LEFT JOIN profiles p ON c.created_by = p.user_id
GROUP BY p.name, p.role
ORDER BY case_count DESC;

-- Success message
DO $$
DECLARE
  dev_name TEXT;
  total_cases INT;
BEGIN
  -- Get developer name
  SELECT name INTO dev_name
  FROM profiles
  WHERE role = 'developer'
  LIMIT 1;
  
  -- Get total cases
  SELECT COUNT(*) INTO total_cases FROM cases;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Migration 04 Completed Successfully';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📋 All % existing cases assigned to:', total_cases;
  RAISE NOTICE '   Name: %', dev_name;
  RAISE NOTICE '   Role: Developer';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Next Steps:';
  RAISE NOTICE '   1. All SQL migrations complete!';
  RAISE NOTICE '   2. Deploy updated frontend code';
  RAISE NOTICE '   3. Test login with developer account';
  RAISE NOTICE '   4. Create first assessor user via admin panel';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Phase 6 Database Setup Complete!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
