-- Add assigned_to field to cases table for case assignment functionality
-- This connects to the profiles table using user_id

-- Add the column
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Add foreign key constraint to profiles table
ALTER TABLE cases
ADD CONSTRAINT fk_cases_assigned_to_profiles
FOREIGN KEY (assigned_to)
REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to
ON cases(assigned_to);

-- Add comment for documentation
COMMENT ON COLUMN cases.assigned_to IS 'User ID of the assessor/admin assigned to this case';

-- Grant necessary permissions
GRANT SELECT, UPDATE ON cases TO authenticated;

-- Example usage:
-- UPDATE cases SET assigned_to = 'user-uuid-here' WHERE id = 'case-id-here';
