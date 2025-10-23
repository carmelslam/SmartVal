-- ============================================================================
-- Fix Profile Manually (for SQL Editor use)
-- ============================================================================
-- Problem: auth.uid() returns NULL in SQL Editor because you're admin user
-- Solution: Find your user_id and update it manually
-- ============================================================================

-- STEP 1: Find all users in auth.users table
SELECT
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- STEP 2: Find your profile (look for כרמל כיוף or your email)
SELECT
  user_id,
  name,
  email,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: Update your profile with the correct role
-- ============================================================================
-- Find the user_id from auth.users that matches YOUR email
-- Then uncomment and run this, replacing the UUID with YOUR user_id:

/*
UPDATE public.profiles
SET role = 'developer'
WHERE user_id = '5f7de877-688d-4584-912d-299b2c0b7fe9'::uuid;  -- REPLACE with your actual UUID
*/

-- OR if your profile doesn't exist at all, create it:
/*
INSERT INTO public.profiles (user_id, name, role, email, org_id)
VALUES (
  '5f7de877-688d-4584-912d-299b2c0b7fe9'::uuid,  -- REPLACE with your actual UUID
  'כרמל כיוף',                                    -- Your name
  'developer',                                    -- Your role
  'your-email@example.com',                       -- REPLACE with your email
  '546e58c3-19b3-4efa-95ec-93e3a5f1d811'::uuid   -- Your org_id (if you know it)
);
*/

-- ============================================================================
-- STEP 4: Fix the function (this works regardless)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;

-- ============================================================================
-- STEP 5: Verify it works
-- ============================================================================
-- This should now show your role:
SELECT
  user_id,
  name,
  role,
  email
FROM public.profiles
WHERE role IN ('admin', 'developer')
ORDER BY name;
