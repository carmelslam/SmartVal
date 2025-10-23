-- ============================================================================
-- USER ID TRACKING MIGRATION
-- Adds created_by/updated_by/created_at/updated_at to all tables
-- Date: 2025-10-23
-- Session: 72
-- Phase: 6 - Complete Authentication & Authorization
-- ============================================================================

-- Purpose: Ensure every table tracks which user performed each action
-- Context: Case collaboration allows multiple users to work on same case
-- Requirement: Track not just case ownership, but individual action ownership

-- ============================================================================
-- 1. parts_search_results
-- ============================================================================

ALTER TABLE parts_search_results
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_parts_search_results_created_by ON parts_search_results(created_by);
CREATE INDEX IF NOT EXISTS idx_parts_search_results_updated_by ON parts_search_results(updated_by);

COMMENT ON COLUMN parts_search_results.created_by IS 'User who created this search result';
COMMENT ON COLUMN parts_search_results.updated_by IS 'User who last updated this result';

-- ============================================================================
-- 2. selected_parts
-- ============================================================================

ALTER TABLE selected_parts
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_selected_parts_created_by ON selected_parts(created_by);
CREATE INDEX IF NOT EXISTS idx_selected_parts_updated_by ON selected_parts(updated_by);

COMMENT ON COLUMN selected_parts.created_by IS 'User who selected this part';
COMMENT ON COLUMN selected_parts.updated_by IS 'User who last modified this selection';

-- ============================================================================
-- 3. parts_required
-- ============================================================================

ALTER TABLE parts_required
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_parts_required_created_by ON parts_required(created_by);
CREATE INDEX IF NOT EXISTS idx_parts_required_updated_by ON parts_required(updated_by);

COMMENT ON COLUMN parts_required.created_by IS 'User who created this requirement';
COMMENT ON COLUMN parts_required.updated_by IS 'User who last updated quantity or status';

-- ============================================================================
-- 4. parts_export_reports
-- ============================================================================

ALTER TABLE parts_export_reports
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_parts_export_reports_created_by ON parts_export_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_parts_export_reports_updated_by ON parts_export_reports(updated_by);

COMMENT ON COLUMN parts_export_reports.created_by IS 'User who generated this export';
COMMENT ON COLUMN parts_export_reports.updated_by IS 'User who last modified this export';

-- ============================================================================
-- 5. case_helper
-- ============================================================================

-- case_helper already has updated_by and updated_at
-- Add created_by for consistency
ALTER TABLE case_helper
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_case_helper_created_by ON case_helper(created_by);

COMMENT ON COLUMN case_helper.created_by IS 'User who created this case version';
COMMENT ON COLUMN case_helper.updated_by IS 'User who last updated this version';

-- ============================================================================
-- 6. cases
-- ============================================================================

-- cases already has created_by and created_at
-- Add updated_by and updated_at for tracking changes (e.g., transfers)
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cases_updated_by ON cases(updated_by);

COMMENT ON COLUMN cases.created_by IS 'Original case owner';
COMMENT ON COLUMN cases.updated_by IS 'User who last modified case (e.g., transferred ownership)';

-- ============================================================================
-- 7. tasks
-- ============================================================================

-- tasks may have assigned_by, but needs standard created_by/updated_by
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_by ON tasks(updated_by);

COMMENT ON COLUMN tasks.created_by IS 'User who created this task';
COMMENT ON COLUMN tasks.updated_by IS 'User who last modified this task';

-- ============================================================================
-- 8. profiles
-- ============================================================================

-- profiles needs tracking for changes (password updates, login tracking, etc.)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_updated_by ON profiles(updated_by);

COMMENT ON COLUMN profiles.updated_by IS 'User who last updated this profile (often the user themselves)';

-- ============================================================================
-- 9. case_collaborators
-- ============================================================================

-- case_collaborators has added_by and added_at (custom fields)
-- Add standard created_by/created_at for consistency
ALTER TABLE case_collaborators
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_collaborators_created_by ON case_collaborators(created_by);

COMMENT ON COLUMN case_collaborators.created_by IS 'Same as added_by - user who added this collaborator';
COMMENT ON COLUMN case_collaborators.added_by IS 'User who granted collaboration access';

-- Note: added_by and created_by should typically be the same value

-- ============================================================================
-- 10. webhook_sync_log
-- ============================================================================

-- webhook_sync_log is a system table but can still track user if triggered by user action
ALTER TABLE webhook_sync_log
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_sync_log_created_by ON webhook_sync_log(created_by);

COMMENT ON COLUMN webhook_sync_log.created_by IS 'User who triggered the sync (if user-initiated)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables now have tracking columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'parts_search_results', 
    'selected_parts', 
    'parts_required',
    'parts_export_reports', 
    'case_helper', 
    'cases', 
    'tasks',
    'profiles', 
    'case_collaborators', 
    'webhook_sync_log'
  )
  AND column_name IN ('created_by', 'updated_by', 'created_at', 'updated_at')
ORDER BY table_name, column_name;

-- Expected: All tables should have all 4 columns (or at least created_by/updated_by)

-- ============================================================================
-- AUDIT TRAIL EXAMPLE QUERIES
-- ============================================================================

-- Example 1: Who worked on a specific case?
-- Run after implementation to see all users who touched a case

/*
SELECT 
  'case_helper' as action_table,
  ch.version,
  p.name as user_name,
  p.email as user_email,
  ch.updated_at,
  'updated case data' as action
FROM case_helper ch
JOIN profiles p ON p.user_id = ch.updated_by
WHERE ch.case_id = '<case-uuid>'

UNION ALL

SELECT 
  'parts_required' as action_table,
  NULL as version,
  p.name as user_name,
  p.email as user_email,
  pr.updated_at,
  'updated parts: ' || pr.part_number as action
FROM parts_required pr
JOIN profiles p ON p.user_id = pr.updated_by
WHERE pr.case_id = '<case-uuid>'

ORDER BY updated_at DESC;
*/

-- Example 2: User activity report
/*
SELECT 
  p.name as user_name,
  p.email,
  p.role,
  COUNT(DISTINCT ch.case_id) as cases_edited,
  COUNT(DISTINCT ps.id) as parts_searched,
  COUNT(DISTINCT sp.id) as parts_selected,
  MAX(ch.updated_at) as last_activity
FROM profiles p
LEFT JOIN case_helper ch ON ch.updated_by = p.user_id
LEFT JOIN parts_search_sessions ps ON ps.created_by = p.user_id
LEFT JOIN selected_parts sp ON sp.created_by = p.user_id
WHERE p.status = 'active'
GROUP BY p.user_id, p.name, p.email, p.role
ORDER BY last_activity DESC NULLS LAST;
*/

-- Example 3: Case collaboration audit
/*
SELECT 
  c.plate as case_plate,
  c.owner_name as case_owner,
  owner.name as owner_username,
  collaborator.name as collaborator_name,
  cc.added_at as collaboration_started,
  added_by_user.name as added_by_username
FROM cases c
JOIN profiles owner ON owner.user_id = c.created_by
LEFT JOIN case_collaborators cc ON cc.case_id = c.id
LEFT JOIN profiles collaborator ON collaborator.user_id = cc.user_id
LEFT JOIN profiles added_by_user ON added_by_user.user_id = cc.added_by
WHERE c.plate = '1234567'
ORDER BY cc.added_at;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ 10 tables updated with user tracking columns
-- ✅ Indexes created for performance
-- ✅ Comments added for documentation
-- ✅ Verification query provided
-- ✅ Example audit queries provided

-- Next Steps:
-- 1. Update application code to populate these fields (see USER_ID_TRACKING_AUDIT.md)
-- 2. Create userTrackingHelper.js service
-- 3. Test with multi-user collaboration scenario
-- 4. Verify audit trail is working correctly

SELECT 'User ID tracking migration completed successfully! ✅' as status;
