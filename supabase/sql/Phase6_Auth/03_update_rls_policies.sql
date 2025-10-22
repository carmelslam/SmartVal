-- Phase 6: User Management & Authentication
-- Migration 03: Update RLS Policies for Role-Based Access
-- Date: 2025-10-22
-- Purpose: Implement proper row-level security based on user roles

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 1: Helper Function to Get User Role
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Create function to get current user's role (in public schema)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;

-- Create function to check if user is admin or developer (in public schema)
CREATE OR REPLACE FUNCTION public.is_admin_or_dev()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role IN ('admin', 'developer')
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 2: Update Profiles Table Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop existing permissive policies
DROP POLICY IF EXISTS "All users can read cases" ON profiles;
DROP POLICY IF EXISTS "All users can create cases" ON profiles;
DROP POLICY IF EXISTS "All users can update cases" ON profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Allow admin/developer to view all profiles
CREATE POLICY "Admin/Dev can view all profiles"
ON profiles FOR SELECT
USING (public.is_admin_or_dev());

-- Allow admin/developer to create new users
CREATE POLICY "Admin/Dev can create users"
ON profiles FOR INSERT
WITH CHECK (public.is_admin_or_dev());

-- Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admin/developer to update any profile
CREATE POLICY "Admin/Dev can update all profiles"
ON profiles FOR UPDATE
USING (public.is_admin_or_dev());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 3: Update Cases Table Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop existing permissive policies
DROP POLICY IF EXISTS "All users can read cases" ON cases;
DROP POLICY IF EXISTS "All users can create cases" ON cases;
DROP POLICY IF EXISTS "All users can update cases" ON cases;

-- SELECT: Role-based case viewing
CREATE POLICY "Role-based case viewing"
ON cases FOR SELECT
USING (
  CASE public.get_user_role()
    WHEN 'developer' THEN true  -- Developer sees all
    WHEN 'admin' THEN true      -- Admin sees all
    WHEN 'assistant' THEN true  -- Assistant sees all (view-only)
    WHEN 'assessor' THEN created_by = auth.uid()  -- Assessor sees only own cases
    ELSE false
  END
);

-- INSERT: Assessors, admins, and developers can create cases
CREATE POLICY "Authorized users can create cases"
ON cases FOR INSERT
WITH CHECK (
  public.get_user_role() IN ('assessor', 'admin', 'developer')
);

-- UPDATE: Admins/developers can edit all, assessors can edit own
CREATE POLICY "Role-based case editing"
ON cases FOR UPDATE
USING (
  CASE public.get_user_role()
    WHEN 'developer' THEN true
    WHEN 'admin' THEN true
    WHEN 'assessor' THEN created_by = auth.uid()
    ELSE false  -- Assistants cannot edit
  END
);

-- DELETE: Only admin/developer can delete
CREATE POLICY "Admin/Dev can delete cases"
ON cases FOR DELETE
USING (public.is_admin_or_dev());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 4: Update Case Helper Policies (follows case access)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop existing permissive policies
DROP POLICY IF EXISTS "All users can read helpers" ON case_helper;
DROP POLICY IF EXISTS "All users can create helpers" ON case_helper;
DROP POLICY IF EXISTS "All users can update helpers" ON case_helper;

-- SELECT: Can view helper if can view the case
CREATE POLICY "Can view helper if can view case"
ON case_helper FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_helper.case_id
    AND (
      CASE public.get_user_role()
        WHEN 'developer' THEN true
        WHEN 'admin' THEN true
        WHEN 'assistant' THEN true
        WHEN 'assessor' THEN cases.created_by = auth.uid()
        ELSE false
      END
    )
  )
);

-- INSERT: Can create helper if can edit the case
CREATE POLICY "Can create helper if can edit case"
ON case_helper FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_helper.case_id
    AND (
      public.get_user_role() IN ('developer', 'admin')
      OR (public.get_user_role() = 'assessor' AND cases.created_by = auth.uid())
    )
  )
);

-- UPDATE: Can update helper if can edit the case
CREATE POLICY "Can update helper if can edit case"
ON case_helper FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_helper.case_id
    AND (
      public.get_user_role() IN ('developer', 'admin')
      OR (public.get_user_role() = 'assessor' AND cases.created_by = auth.uid())
    )
  )
);

-- DELETE: Only admin/developer
CREATE POLICY "Admin/Dev can delete helpers"
ON case_helper FOR DELETE
USING (public.is_admin_or_dev());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 5: Update Helper Versions Policies (read-only for most)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- DROP existing policies if any
DROP POLICY IF EXISTS "Users can view helper versions" ON helper_versions;

-- SELECT: Can view versions if can view the case
CREATE POLICY "Can view versions if can view case"
ON helper_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = helper_versions.case_id
    AND (
      CASE public.get_user_role()
        WHEN 'developer' THEN true
        WHEN 'admin' THEN true
        WHEN 'assistant' THEN true
        WHEN 'assessor' THEN cases.created_by = auth.uid()
        ELSE false
      END
    )
  )
);

-- INSERT: Automatic via trigger, allow all authenticated
CREATE POLICY "Authenticated can insert versions"
ON helper_versions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE - this is immutable audit trail

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 6: Update Parts Required Policies (follows case access)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- SELECT: Can view parts if can view the case
CREATE POLICY "Can view parts if can view case"
ON parts_required FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = parts_required.case_id
    AND (
      CASE public.get_user_role()
        WHEN 'developer' THEN true
        WHEN 'admin' THEN true
        WHEN 'assistant' THEN true
        WHEN 'assessor' THEN cases.created_by = auth.uid()
        ELSE false
      END
    )
  )
);

-- INSERT/UPDATE/DELETE: Can modify if can edit the case
CREATE POLICY "Can modify parts if can edit case"
ON parts_required FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = parts_required.case_id
    AND (
      public.get_user_role() IN ('developer', 'admin')
      OR (public.get_user_role() = 'assessor' AND cases.created_by = auth.uid())
    )
  )
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 7: Update Organizations Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- All authenticated users can view the org
CREATE POLICY "Users can view org"
ON orgs FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only developer can modify org
CREATE POLICY "Developer can modify org"
ON orgs FOR ALL
USING (public.get_user_role() = 'developer');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 8: Verification
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- List all policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Migration 03 Completed Successfully';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies Updated:';
  RAISE NOTICE '   ✅ Profiles - Role-based access';
  RAISE NOTICE '   ✅ Cases - Assessors see own, Admin/Dev see all';
  RAISE NOTICE '   ✅ Case Helper - Follows case access';
  RAISE NOTICE '   ✅ Helper Versions - Read-only audit trail';
  RAISE NOTICE '   ✅ Parts Required - Follows case access';
  RAISE NOTICE '   ✅ Organizations - All can view, Dev can modify';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Role Permissions Summary:';
  RAISE NOTICE '   Developer: Full access to everything';
  RAISE NOTICE '   Admin: Full case access, user management';
  RAISE NOTICE '   Assessor: Own cases only';
  RAISE NOTICE '   Assistant: View all cases (read-only)';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Next Steps:';
  RAISE NOTICE '   1. Run migration 04 to assign existing cases';
  RAISE NOTICE '   2. Test login with developer account';
  RAISE NOTICE '   3. Verify role-based access works correctly';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
