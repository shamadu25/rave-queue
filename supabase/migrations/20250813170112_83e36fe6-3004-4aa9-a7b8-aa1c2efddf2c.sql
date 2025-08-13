-- Add auto-print setting to system_settings
INSERT INTO public.system_settings (setting_key, setting_value, category, description)
VALUES 
  ('enable_auto_print', 'true', 'general', 'Automatically print tickets when tokens are generated')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;