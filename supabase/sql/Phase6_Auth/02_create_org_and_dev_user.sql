-- Phase 6: User Management & Authentication
-- Migration 02: Create Organization & Developer User
-- Date: 2025-10-22
-- Purpose: Create the organization and link developer account

-- ⚠️ IMPORTANT: Before running this script:
-- 1. Create your email account in Supabase Auth Dashboard:
--    Go to Authentication → Users → Add User
--    Enter your email and password
--    Copy the User ID (UUID)
-- 2. Replace 'YOUR_USER_ID_HERE' below with your actual User ID
-- 3. Replace 'your.email@example.com' with your actual email
-- 4. Replace 'Your Name' with your actual name
-- 5. Replace 'YOUR_PHONE' with your phone number
-- 6. Then run this script

-- Create both organizations
-- 1. Evalix (your development company)
INSERT INTO orgs (name, created_at)
VALUES ('Evalix', NOW())
ON CONFLICT DO NOTHING;

-- 2. Yaron Cayouf (the client organization)
INSERT INTO orgs (name, created_at)
VALUES ('ירון כיוף - שמאות וייעוץ', NOW())
ON CONFLICT DO NOTHING;

-- Get the organization IDs (for reference)
DO $$
DECLARE
  evalix_uuid UUID;
  yaron_uuid UUID;
BEGIN
  SELECT id INTO evalix_uuid FROM orgs WHERE name = 'Evalix';
  SELECT id INTO yaron_uuid FROM orgs WHERE name = 'ירון כיוף - שמאות וייעוץ';
  
  RAISE NOTICE '📋 Organizations created:';
  RAISE NOTICE '   Evalix (Developer Org): %', evalix_uuid;
  RAISE NOTICE '   ירון כיוף - שמאות וייעוץ (Client Org): %', yaron_uuid;
END $$;

-- Create developer profile
-- ⚠️ REPLACE THESE VALUES WITH YOUR ACTUAL DATA ⚠️
INSERT INTO profiles (
  user_id,
  name,
  role,
  phone,
  username,
  org_id,
  status,
  must_change_password,
  created_at
)
VALUES (
  '5f7de877-688d-4584-912d-299b2c0b7fe9'::UUID,  -- Your User ID from Supabase Auth
  'כרמל כיוף',                -- ⚠️ REPLACE with your actual name if different
  'developer',
  '052-3115707',              -- Your phone number
  'developer',                -- Username for login
  (SELECT id FROM orgs WHERE name = 'Evalix'),
  'active',
  false,                      -- Developer doesn't need to change password
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  role = 'developer',
  org_id = (SELECT id FROM orgs WHERE name = 'Evalix'),
  status = 'active';

-- Verify creation
DO $$
DECLARE
  profile_record RECORD;
  org_record RECORD;
BEGIN
  -- Get organization details
  SELECT * INTO org_record FROM orgs WHERE name = 'ירון כיוף - שמאות וייעוץ';
  
  -- Get profile details
  SELECT p.*, o.name as org_name 
  INTO profile_record
  FROM profiles p
  LEFT JOIN orgs o ON p.org_id = o.id
  WHERE p.role = 'developer'
  LIMIT 1;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Migration 02 Completed Successfully';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Organization Details:';
  RAISE NOTICE '   Name: %', org_record.name;
  RAISE NOTICE '   ID: %', org_record.id;
  RAISE NOTICE '   Created: %', org_record.created_at;
  RAISE NOTICE '';
  RAISE NOTICE '👤 Developer Profile Details:';
  RAISE NOTICE '   Name: %', profile_record.name;
  RAISE NOTICE '   Username: %', profile_record.username;
  RAISE NOTICE '   Role: %', profile_record.role;
  RAISE NOTICE '   Phone: %', profile_record.phone;
  RAISE NOTICE '   Organization: %', profile_record.org_name;
  RAISE NOTICE '   Status: %', profile_record.status;
  RAISE NOTICE '   User ID: %', profile_record.user_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Next Steps:';
  RAISE NOTICE '   1. Verify you can login with your email and password';
  RAISE NOTICE '   2. Run migration 03 to update RLS policies';
  RAISE NOTICE '   3. Run migration 04 to assign existing cases';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- EXAMPLE (DO NOT RUN - FOR REFERENCE ONLY):
-- If your User ID from Supabase Auth is: 12345678-1234-1234-1234-123456789012
-- Your name is: כרמל כיוף
-- Your phone is: 050-1234567
--
-- Then the INSERT should look like:
-- INSERT INTO profiles (user_id, name, role, phone, username, org_id, ...)
-- VALUES (
--   '12345678-1234-1234-1234-123456789012'::UUID,
--   'כרמל כיוף',
--   'developer',
--   '050-1234567',
--   'developer',
--   ...
-- )
