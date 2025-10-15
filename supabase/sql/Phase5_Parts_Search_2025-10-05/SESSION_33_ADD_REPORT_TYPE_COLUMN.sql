-- SESSION 33: Add report_type column to parts_export_reports
-- Date: 2025-10-15
-- Purpose: Enable independent current_state tracking per report type
-- 
-- Problem: When exporting "full_search_results", it was setting current_state=false
--          for "selected_parts" reports. Each report type needs its own current_state tracking.
--
-- Solution: Add report_type column to distinguish between report types:
--           - 'selected_parts' - Selected parts list exports
--           - 'full_search_results' - Full search history exports
--
-- This allows backend logic (triggers/webhooks) to update current_state 
-- ONLY within the same report_type, not across all reports.

-- Add report_type column with default value
ALTER TABLE parts_export_reports 
ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'selected_parts';

-- Add comment to document the column
COMMENT ON COLUMN parts_export_reports.report_type IS 
'Type of report: selected_parts, full_search_results. Used for independent current_state tracking per type.';

-- Create index for faster queries by report_type + case_id
CREATE INDEX IF NOT EXISTS idx_parts_export_reports_type_case 
ON parts_export_reports(report_type, case_id);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'parts_export_reports' 
  AND column_name = 'report_type';
