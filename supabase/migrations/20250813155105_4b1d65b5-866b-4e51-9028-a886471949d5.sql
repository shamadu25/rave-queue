-- Create sample queue entries for testing
INSERT INTO public.queue_entries (token, full_name, phone_number, department, priority, status, created_at)
VALUES 
  ('CON001', 'John Smith', '+1234567890', 'Consultation', 'Normal', 'Waiting', NOW() - INTERVAL '5 minutes'),
  ('LAB002', 'Sarah Johnson', '+1234567891', 'Laboratory', 'Normal', 'Called', NOW() - INTERVAL '10 minutes'),
  ('PHR003', 'Mike Wilson', '+1234567892', 'Pharmacy', 'Emergency', 'Served', NOW() - INTERVAL '15 minutes'),
  ('REG004', 'Anna Brown', '+1234567893', 'Registration', 'Normal', 'Waiting', NOW() - INTERVAL '2 minutes'),
  ('VIT005', 'David Lee', '+1234567894', 'Vital Signs', 'Normal', 'Completed', NOW() - INTERVAL '25 minutes'),
  ('CON006', 'Emma Davis', '+1234567895', 'Consultation', 'Emergency', 'Waiting', NOW() - INTERVAL '1 minute'),
  ('LAB007', 'Tom Garcia', '+1234567896', 'Laboratory', 'Normal', 'Waiting', NOW() - INTERVAL '8 minutes');

-- Add missing system settings for complete functionality
INSERT INTO public.system_settings (setting_key, setting_value, category, description)
VALUES 
  ('clinic_name', 'Advanced Medical Center', 'general', 'Name of the clinic/hospital displayed on tickets and interface'),
  ('clinic_address', '123 Healthcare Boulevard, Medical City, MC 12345', 'general', 'Physical address of the clinic/hospital'),
  ('clinic_phone', '+1 (555) 123-4567', 'general', 'Primary phone number for the clinic'),
  ('clinic_email', 'info@advancedmedical.com', 'general', 'Contact email address for the clinic'),
  ('operating_hours', 'Monday - Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 2:00 PM', 'general', 'Business operating hours displayed to patients'),
  ('website_url', 'https://www.advancedmedical.com', 'general', 'Official website URL'),
  ('emergency_contact', '+1 (555) 911-HELP', 'general', 'Emergency contact number'),
  ('clinic_logo_url', '/logo.png', 'general', 'URL or path to clinic logo image'),
  ('enable_online_booking', false, 'general', 'Allow patients to book appointments online'),
  ('enable_patient_feedback', true, 'general', 'Allow patients to provide feedback'),
  ('enable_sound_alerts', true, 'display', 'Play sounds when queue status changes'),
  ('enable_sms_notifications', false, 'display', 'Send SMS updates to patients'),
  ('refresh_interval', '10', 'display', 'Auto-refresh interval for display screens'),
  ('max_queue_display_count', '20', 'display', 'Maximum number of queue entries to show on display screen'),
  ('show_department_colors', true, 'display', 'Display department colors on queue screens'),
  ('default_priority', 'Normal', 'defaults', 'Default priority level for new tokens'),
  ('max_emergency_tokens', '10', 'defaults', 'Maximum emergency tokens allowed per day')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();