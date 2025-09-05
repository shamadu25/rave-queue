-- Add announcement template field to departments table
ALTER TABLE public.departments ADD COLUMN announcement_template TEXT DEFAULT 'Token {number}, please proceed to {department} at {hospitalName}.';

-- Add announcement settings to system_settings for global configuration
-- These will be inserted via the application when admins configure them