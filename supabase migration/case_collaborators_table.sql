-- Case Collaborators Table
-- Allows multiple users to collaborate on the same case
-- Created: 2025-10-23

CREATE TABLE IF NOT EXISTS case_collaborators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  added_by uuid REFERENCES profiles(user_id),
  added_at timestamptz DEFAULT now(),
  UNIQUE(case_id, user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_case_collaborators_case_id ON case_collaborators(case_id);
CREATE INDEX IF NOT EXISTS idx_case_collaborators_user_id ON case_collaborators(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE case_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can see collaborators for cases they own or are collaborators on
CREATE POLICY "Users can view collaborators for their cases"
  ON case_collaborators
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

-- Policy: Case owners and admins can add collaborators
CREATE POLICY "Case owners and admins can add collaborators"
  ON case_collaborators
  FOR INSERT
  WITH CHECK (
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

-- Policy: Case owners and admins can remove collaborators
CREATE POLICY "Case owners and admins can remove collaborators"
  ON case_collaborators
  FOR DELETE
  USING (
    case_id IN (
      SELECT id FROM cases WHERE created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

-- Grant permissions
GRANT ALL ON case_collaborators TO authenticated;
GRANT ALL ON case_collaborators TO service_role;

-- Comments
COMMENT ON TABLE case_collaborators IS 'Tracks which users can collaborate on each case';
COMMENT ON COLUMN case_collaborators.case_id IS 'Reference to the case';
COMMENT ON COLUMN case_collaborators.user_id IS 'User who has collaboration access';
COMMENT ON COLUMN case_collaborators.added_by IS 'User who added this collaborator';
COMMENT ON COLUMN case_collaborators.added_at IS 'When collaboration was granted';
