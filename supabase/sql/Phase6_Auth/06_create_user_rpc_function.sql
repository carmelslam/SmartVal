-- Phase 6: User Management & Authentication
-- Migration 06: Create User via RPC Function
-- Date: 2025-10-22
-- Purpose: Server-side function to create users securely (requires service role privileges)

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
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_current_user_role TEXT;
BEGIN
  -- Check caller has admin or assistant role
  SELECT role INTO v_current_user_role
  FROM profiles
  WHERE user_id = auth.uid();
  
  IF v_current_user_role NOT IN ('admin', 'assistant', 'developer') THEN
    RAISE EXCEPTION 'Only admins and assistants can create users';
  END IF;
  
  -- Create user in auth.users table
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', p_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;
  
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
  
  -- Return success with user_id
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'profile_id', v_profile_id,
    'message', 'User created successfully'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_account TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 06 Completed - User creation RPC function created';
END $$;
