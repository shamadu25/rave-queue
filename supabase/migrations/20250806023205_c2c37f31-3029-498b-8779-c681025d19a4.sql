-- Insert system settings for clinic name and footer note if they don't exist
INSERT INTO system_settings (setting_key, setting_value, category, description) 
VALUES 
  ('clinic_name', '"City Hospital Clinic"', 'general', 'Name of the clinic/hospital for display on tickets'),
  ('footer_note', '"Powered by RAVESOFT"', 'general', 'Footer note displayed on printed tickets')
ON CONFLICT (setting_key) DO NOTHING;