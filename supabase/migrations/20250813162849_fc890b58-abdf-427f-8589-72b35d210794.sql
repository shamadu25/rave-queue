-- Add system setting for allowing all users to call next token
INSERT INTO public.system_settings (setting_key, setting_value, category, description) 
VALUES ('allow_all_users_call_tokens', 'false', 'queue', 'Allow all users to call tokens from any department')
ON CONFLICT (setting_key) DO NOTHING;

-- Auto-create Admin fallback account if it doesn't exist
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'admin@hospital.com'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Create admin user via auth
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
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@hospital.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Super Admin","role":"admin","department":"Admin"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Create profile for admin
        INSERT INTO public.profiles (id, email, full_name, role, department, username)
        VALUES (admin_user_id, 'admin@hospital.com', 'Super Admin', 'admin', 'Admin', 'superadmin');
    END IF;
END $$;

-- Auto-create Universal Test User if it doesn't exist
DO $$
DECLARE
    test_user_id uuid;
    test_user_exists boolean;
    dept_record RECORD;
BEGIN
    -- Check if test user already exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'user@queue.com'
    ) INTO test_user_exists;
    
    IF NOT test_user_exists THEN
        -- Create test user via auth
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
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'user@queue.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Test Staff","role":"staff","department":"Consultation"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO test_user_id;
        
        -- Create profile for test user
        INSERT INTO public.profiles (id, email, full_name, role, department, username)
        VALUES (test_user_id, 'user@queue.com', 'Test Staff', 'staff', 'Consultation', 'teststaff');
        
        -- Assign test user to ALL departments
        FOR dept_record IN SELECT id FROM public.departments WHERE is_active = true LOOP
            INSERT INTO public.user_departments (user_id, department_id)
            VALUES (test_user_id, dept_record.id)
            ON CONFLICT (user_id, department_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;