-- Update silent printing setting to be disabled by default
INSERT INTO system_settings (setting_key, setting_value, category, description)
VALUES ('enable_silent_printing', 'false', 'printing', 'Print tickets silently without showing print dialog')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'false';