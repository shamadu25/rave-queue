-- Add system setting for allowing all users to call next token
INSERT INTO public.system_settings (setting_key, setting_value, category, description) 
VALUES ('allow_all_users_call_tokens', 'false', 'queue', 'Allow all users to call tokens from any department')
ON CONFLICT (setting_key) DO NOTHING;