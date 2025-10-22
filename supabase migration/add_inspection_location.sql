-- Add inspection_location column to cases table
-- This will store the location from the open case page

ALTER TABLE cases 
ADD COLUMN inspection_location TEXT;

-- Optional: Add comment to document the column
COMMENT ON COLUMN cases.inspection_location IS 'Location where the inspection took place, captured from open case form';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cases' 
ORDER BY ordinal_position;
