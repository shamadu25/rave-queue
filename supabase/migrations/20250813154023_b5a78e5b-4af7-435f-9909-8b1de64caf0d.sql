-- Create sample users with the fixed user creation process
-- First, let's ensure we have the proper departments
INSERT INTO public.departments (name, prefix, color_code, icon_name, max_tokens_per_day, start_time, end_time, is_active) 
VALUES 
  ('Registration', 'REG', '#3b82f6', 'clipboard', 100, '08:00:00', '17:00:00', true),
  ('Consultation', 'CON', '#10b981', 'stethoscope', 50, '08:00:00', '16:00:00', true),
  ('Vital Signs', 'VIT', '#f59e0b', 'heart', 80, '07:30:00', '18:00:00', true),
  ('Pharmacy', 'PHR', '#8b5cf6', 'pill', 120, '08:00:00', '20:00:00', true),
  ('Laboratory', 'LAB', '#ef4444', 'flask', 60, '07:00:00', '15:00:00', true)
ON CONFLICT (name) DO UPDATE SET
  prefix = EXCLUDED.prefix,
  color_code = EXCLUDED.color_code,
  icon_name = EXCLUDED.icon_name,
  max_tokens_per_day = EXCLUDED.max_tokens_per_day,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_active = EXCLUDED.is_active;

-- Add username column to profiles table for unique usernames
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Update the handle_new_user function to support usernames and better role handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_department text;
  user_role text;
  user_username text;
BEGIN
  -- Get department from metadata, default to 'Consultation' if not provided or invalid
  user_department := COALESCE(NEW.raw_user_meta_data ->> 'department', 'Consultation');
  
  -- Validate department exists and is active, otherwise use 'Consultation'
  IF NOT EXISTS (
    SELECT 1 FROM public.departments 
    WHERE name = user_department AND is_active = true
  ) THEN
    user_department := 'Consultation';
  END IF;
  
  -- Get role from metadata with expanded role options
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'doctor');
  
  -- Validate role is one of the allowed values
  IF user_role NOT IN ('admin', 'doctor', 'nurse', 'receptionist', 'staff') THEN
    user_role := 'doctor';
  END IF;

  -- Generate username from email if not provided
  user_username := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  
  -- Ensure username is unique by appending number if needed
  DECLARE
    counter INTEGER := 1;
    temp_username text := user_username;
  BEGIN
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = temp_username) LOOP
      temp_username := user_username || counter::text;
      counter := counter + 1;
    END LOOP;
    user_username := temp_username;
  END;

  INSERT INTO public.profiles (id, email, full_name, role, department, username)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    user_role,
    user_department,
    user_username
  );
  RETURN NEW;
END;
$function$;