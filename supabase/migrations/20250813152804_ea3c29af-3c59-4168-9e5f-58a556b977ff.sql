-- Drop the problematic check constraint on profiles department
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_department_check;

-- Update the handle_new_user function to use valid department names and default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_department text;
  user_role text;
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
  
  -- Get role from metadata, default to 'doctor' if not provided
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'doctor');
  
  -- Validate role is one of the allowed values
  IF user_role NOT IN ('admin', 'doctor', 'nurse', 'receptionist') THEN
    user_role := 'doctor';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    user_role,
    user_department
  );
  RETURN NEW;
END;
$function$;