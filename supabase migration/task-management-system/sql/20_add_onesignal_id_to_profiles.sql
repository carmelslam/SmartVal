-- Add OneSignal Player ID to profiles table for push notifications
-- Created: 2025-10-23
-- Purpose: Store OneSignal Player ID for each user to enable push notifications

-- Add onesignal_id column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onesignal_id TEXT;

-- Create index for faster lookups by OneSignal ID
CREATE INDEX IF NOT EXISTS idx_profiles_onesignal_id
ON public.profiles(onesignal_id)
WHERE onesignal_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.onesignal_id
IS 'OneSignal Player ID for push notifications. Updated when user logs in and OneSignal initializes.';

-- Note: This column will be populated by the frontend when OneSignal.User.getOnesignalId() resolves
-- The task notification system uses this to send push notifications via Make.com webhook
