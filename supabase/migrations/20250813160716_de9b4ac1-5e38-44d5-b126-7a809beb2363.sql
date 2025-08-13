-- Create a test admin account
-- First, insert a test user profile for admin testing
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  department,
  username
) VALUES (
  'b7f2c3e4-5d6a-7b8c-9d0e-1f2a3b4c5d6e'::uuid,
  'admin@test.com',
  'Test Admin',
  'admin',
  'Administration',
  'testadmin'
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department;