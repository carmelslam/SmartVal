-- ============================================================================
-- ADD TASK TEMPLATES SUPPORT
-- ============================================================================
-- Description: Allows users to save task structures as reusable templates
-- Date: 2025-10-24
-- Dependencies: public.tasks and public.profiles tables must exist
-- Author: Claude Code
-- ============================================================================

-- ============================================================================
-- TABLE: task_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template identification
  template_name TEXT NOT NULL,
  category TEXT, -- e.g., 'assessment', 'admin', 'client_communication'

  -- Template content (what gets copied to new task)
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_duration_hours INT,

  -- Template metadata
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE, -- If true, all org users can use it
  usage_count INT DEFAULT 0, -- Track popularity

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique template names per user
  UNIQUE(created_by, template_name)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
-- Get all templates for a user
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by
  ON public.task_templates(created_by);

-- Get public templates
CREATE INDEX IF NOT EXISTS idx_task_templates_public
  ON public.task_templates(is_public)
  WHERE is_public = TRUE;

-- Search templates by category
CREATE INDEX IF NOT EXISTS idx_task_templates_category
  ON public.task_templates(category)
  WHERE category IS NOT NULL;

-- Popular templates
CREATE INDEX IF NOT EXISTS idx_task_templates_usage
  ON public.task_templates(usage_count DESC);

-- ============================================================================
-- TRIGGER: Auto-update timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_update_timestamp
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_timestamp();

-- ============================================================================
-- FUNCTION: Increment usage count when template is used
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.task_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_template_usage(UUID) IS 'Increments the usage count when a template is used to create a task';

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE public.task_templates IS 'Reusable task templates for quick task creation';
COMMENT ON COLUMN public.task_templates.is_public IS 'If true, template is available to all users in organization';
COMMENT ON COLUMN public.task_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN public.task_templates.category IS 'Optional category for organizing templates (assessment, admin, etc.)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created task_templates table';
  RAISE NOTICE 'ℹ️  Users can now save and reuse task templates';
  RAISE NOTICE 'ℹ️  Templates can be private or public (shared with organization)';
END $$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Create a template:
-- INSERT INTO public.task_templates (template_name, category, title, description, task_type, priority, created_by)
-- VALUES (
--   'Weekly Assessment Review',
--   'assessment',
--   'בדיקת תיקי שמאות שבועית',
--   'בדוק את כל התיקים שנסגרו השבוע ווודא שכל המסמכים מלאים',
--   'review',
--   'medium',
--   'user-uuid'
-- );

-- Load all templates for user:
-- SELECT * FROM public.task_templates
-- WHERE created_by = 'user-uuid' OR is_public = TRUE
-- ORDER BY usage_count DESC, template_name;

-- Use template to create task:
-- 1. SELECT template data
-- 2. Create new task with template values
-- 3. Call: SELECT increment_template_usage('template-uuid');

-- ============================================================================
