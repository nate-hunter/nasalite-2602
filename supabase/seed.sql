-- Seed: one initial user for local development.
-- See: https://supabase.com/docs/guides/local-development/seeding-your-database
-- User creation pattern: https://laros.io/seeding-users-in-supabase-with-a-sql-seed-script
-- GoTrue scans auth.users into Go structs with string (not *string) fields; NULL causes
-- "converting NULL to string is unsupported". Set all such varchar columns to ''.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  -- Password for local dev only (e.g. "password")
  v_encrypted_pw TEXT := crypt('password', gen_salt('bf'));
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'su@example.com',
    v_encrypted_pw,
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    format('{"sub": "%s", "email": "su@example.com"}', v_user_id)::jsonb,
    'email',
    v_user_id,
    NOW(),
    NOW(),
    NOW()
  );

  -- handle_new_user() trigger created the profile with app_role = 'authenticated'.
  -- Promote to super_admin so this user can upload to app-media-items (see storage RLS in
  -- 20260314200909_media_galleries_and_app_bucket_rls.sql).
  UPDATE public.user_profiles
  SET app_role = 'super_admin'
  WHERE id = v_user_id;
END $$;
