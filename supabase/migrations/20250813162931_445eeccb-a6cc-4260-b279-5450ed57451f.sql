-- Add system setting for allowing all users to call next token
INSERT INTO public.system_settings (setting_key, setting_value, category, description) 
VALUES ('allow_all_users_call_tokens', 'false', 'queue', 'Allow all users to call tokens from any department')
ON CONFLICT (setting_key) DO NOTHING;

-- Create universal test user profile if it doesn't exist (using 'doctor' role since 'staff' is not valid)
INSERT INTO public.profiles (id, email, full_name, role, department, username)
SELECT 
  gen_random_uuid(),
  'user@queue.com',
  'Test Staff',
  'doctor',
  'Consultation',
  'teststaff'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'user@queue.com'
);

-- Assign test user to ALL departments if user exists
DO $$
DECLARE
    test_user_id uuid;
    dept_record RECORD;
BEGIN
    -- Get test user ID
    SELECT id INTO test_user_id 
    FROM public.profiles 
    WHERE email = 'user@queue.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Assign to ALL departments
        FOR dept_record IN SELECT id FROM public.departments WHERE is_active = true LOOP
            INSERT INTO public.user_departments (user_id, department_id)
            VALUES (test_user_id, dept_record.id)
            ON CONFLICT (user_id, department_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;