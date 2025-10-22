-- Phase 6: User Management & Authentication  
-- Migration 06: Wrapper function to create users via Supabase Auth API
-- Date: 2025-10-22
-- Purpose: Create complete user account (auth + profile) using http extension

-- Enable http extension for REST API calls
CREATE EXTENSION IF NOT EXISTS http;

-- IMPORTANT: Before running this migration, you MUST:
-- 1. Go to Supabase Dashboard → Settings → API
-- 2. Copy the "service_role" key (NOT the anon key)
-- 3. Replace YOUR_SERVICE_ROLE_KEY_HERE below with your actual service_role key
-- 4. The service_role key should look like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...

-- Function to create user account
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_role TEXT,
  p_org_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
  v_user_id UUID;
  v_profile_id UUID;
  v_http_response http_response;
  v_response_data JSONB;
BEGIN
  -- Check caller has admin or assistant role
  SELECT role INTO v_current_user_role
  FROM profiles
  WHERE user_id = auth.uid();
  
  IF v_current_user_role NOT IN ('admin', 'assistant', 'developer') THEN
    RAISE EXCEPTION 'Only admins and assistants can create users';
  END IF;

  -- Call Supabase Admin API to create user
  SELECT * INTO v_http_response
  FROM http((
    'POST',
    'https://nvqrptokmwdhvpiufrad.supabase.co/auth/v1/admin/users',
    ARRAY[
      http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cXJwdG9rbXdkaHZwaXVmcmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAzNTQ4NSwiZXhwIjoyMDcxNjExNDg1fQ.3lnf8ypdzRmzX8ePEiOAAUUET_ADH_4nuiuHqVjFqyY'),
      http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cXJwdG9rbXdkaHZwaXVmcmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAzNTQ4NSwiZXhwIjoyMDcxNjExNDg1fQ.3lnf8ypdzRmzX8ePEiOAAUUET_ADH_4nuiuHqVjFqyY'),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'email', p_email,
      'password', p_password,
      'email_confirm', true,
      'user_metadata', json_build_object('name', p_name)
    )::text
  )::http_request);

  -- Check if user creation was successful
  IF v_http_response.status <> 200 AND v_http_response.status <> 201 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create auth user. Status: ' || v_http_response.status || '. Response: ' || v_http_response.content
    );
  END IF;

  -- Extract user_id from response
  v_response_data := v_http_response.content::jsonb;
  v_user_id := (v_response_data->>'id')::uuid;

  -- Create profile
  INSERT INTO profiles (
    user_id,
    name,
    email,
    phone,
    role,
    org_id,
    status,
    must_change_password,
    created_by,
    created_at
  )
  VALUES (
    v_user_id,
    p_name,
    p_email,
    p_phone,
    p_role,
    p_org_id,
    'active',
    true,
    auth.uid(),
    NOW()
  )
  RETURNING id INTO v_profile_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'profile_id', v_profile_id,
    'message', 'User created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_account TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 06 Completed - User creation function with HTTP API ready';
END $$;
