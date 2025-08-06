-- Add missing system settings for address, phone, email and other display settings
INSERT INTO system_settings (setting_key, setting_value, category, description) 
VALUES 
  ('clinic_address', '"123 Medical Center Drive, Healthcare City, HC 12345"', 'general', 'Physical address of the clinic/hospital'),
  ('clinic_phone', '"+1 (555) 123-4567"', 'general', 'Primary phone number for the clinic'),
  ('clinic_email', '"info@sgclinic.com"', 'general', 'Contact email address for the clinic'),
  ('operating_hours', '"Monday - Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 2:00 PM"', 'general', 'Business operating hours displayed to patients'),
  ('website_url', '"https://www.sgclinic.com"', 'general', 'Official website URL'),
  ('enable_online_booking', 'false', 'general', 'Allow patients to book appointments online'),
  ('max_queue_display_count', '"20"', 'display', 'Maximum number of queue entries to show on display screen'),
  ('show_department_colors', 'true', 'display', 'Display department colors on queue screens'),
  ('enable_patient_feedback', 'true', 'general', 'Allow patients to provide feedback'),
  ('emergency_contact', '"+1 (555) 911-HELP"', 'general', 'Emergency contact number'),
  ('clinic_logo_url', '""', 'general', 'URL or path to clinic logo image')
ON CONFLICT (setting_key) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now();

-- Update clinic_name to SG CLINIC as requested
UPDATE system_settings 
SET setting_value = '"SG CLINIC"', updated_at = now()
WHERE setting_key = 'clinic_name';