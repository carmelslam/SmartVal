-- Delete cases and all related data
-- Case IDs: 1dc12a09-7886-45c8-a96e-43b0d074367f and f2e81248-ac73-4e9d-a1ab-f73073fd6dec

-- Delete from webhook_sync_log FIRST (has foreign key to cases)
DELETE FROM webhook_sync_log 
WHERE case_id IN ('1dc12a09-7886-45c8-a96e-43b0d074367f', 'f2e81248-ac73-4e9d-a1ab-f73073fd6dec');

-- Delete from helper_versions
DELETE FROM helper_versions 
WHERE case_id IN ('1dc12a09-7886-45c8-a96e-43b0d074367f', 'f2e81248-ac73-4e9d-a1ab-f73073fd6dec');

-- Delete from case_helper
DELETE FROM case_helper 
WHERE case_id IN ('1dc12a09-7886-45c8-a96e-43b0d074367f', 'f2e81248-ac73-4e9d-a1ab-f73073fd6dec');

-- Delete from cases (parent table - delete last)
DELETE FROM cases 
WHERE id IN ('1dc12a09-7886-45c8-a96e-43b0d074367f', 'f2e81248-ac73-4e9d-a1ab-f73073fd6dec');

-- Verify deletion
SELECT 'Remaining cases:' as status;
SELECT id, plate, owner_name, status FROM cases;

SELECT 'Remaining case_helper:' as status;
SELECT case_id, version, helper_name FROM case_helper;

SELECT 'Remaining helper_versions:' as status;
SELECT case_id, version, helper_name FROM helper_versions;
