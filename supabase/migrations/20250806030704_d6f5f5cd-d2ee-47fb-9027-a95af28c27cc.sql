-- Insert default system settings if they don't exist
INSERT INTO system_settings (setting_key, setting_value, category, description) 
VALUES 
  ('clinic_name', '"City Hospital Clinic"', 'general', 'Name of the clinic/hospital displayed on tickets and interface'),
  ('footer_note', '"Powered by RAVESOFT"', 'general', 'Footer text displayed on printed tickets'),
  ('print_mode', '"popup"', 'general', 'How tokens should be printed (Direct or Popup)'),
  ('theme_mode', '"light"', 'general', 'Application color theme (Light or Dark)'),
  ('enable_voice_announcements', false, 'general', 'Enable voice announcements for queue calls'),
  ('auto_reset_midnight', true, 'queue', 'Automatically reset queue counters every day'),
  ('display_estimated_wait', true, 'queue', 'Show estimated wait times to patients'),
  ('working_days', '["monday", "tuesday", "wednesday", "thursday", "friday"]', 'queue', 'Days when the queue system is active'),
  ('enable_display_screen', true, 'display', 'Show the public queue display screen'),
  ('enable_sound_alerts', true, 'display', 'Play sounds when queue status changes'),
  ('enable_sms_notifications', false, 'display', 'Send SMS updates to patients'),
  ('refresh_interval', '"10"', 'display', 'Auto-refresh interval for display screens'),
  ('default_priority', '"Normal"', 'defaults', 'Default priority level for new tokens'),
  ('max_emergency_tokens', '"10"', 'defaults', 'Maximum emergency tokens allowed per day'),
  ('system_name', '"Hospital Queue Management System"', 'defaults', 'Legacy system name field')
ON CONFLICT (setting_key) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now();