-- Add business_name column to user_assets table
-- Date: 2025-11-22
-- Purpose: Store user's business name for PDF footer

ALTER TABLE user_assets
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Update existing user with default value
UPDATE user_assets
SET business_name = 'ירון כיוף - שמאות וייעוץ - רישיון מספר 1097'
WHERE business_name IS NULL;

-- Add comment
COMMENT ON COLUMN user_assets.business_name IS 'Business name displayed in PDF documents and reports';
