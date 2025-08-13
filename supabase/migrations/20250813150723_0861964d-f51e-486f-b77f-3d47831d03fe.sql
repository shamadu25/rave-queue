-- Insert sample departments
INSERT INTO public.departments (name, prefix, color_code, max_tokens_per_day, start_time, end_time, is_active, icon_name) VALUES
('Consultation', 'C', '#3B82F6', 100, '08:00:00', '17:00:00', true, 'stethoscope'),
('Laboratory', 'L', '#10B981', 80, '07:00:00', '18:00:00', true, 'test-tube'),
('Pharmacy', 'P', '#F59E0B', 120, '08:00:00', '20:00:00', true, 'pill'),
('X-ray', 'X', '#8B5CF6', 60, '09:00:00', '16:00:00', true, 'scan'),
('Billing', 'B', '#EF4444', 150, '08:00:00', '18:00:00', true, 'credit-card'),
('Emergency', 'E', '#DC2626', 50, '00:00:00', '23:59:59', true, 'alert-triangle')
ON CONFLICT (name) DO UPDATE SET
  prefix = EXCLUDED.prefix,
  color_code = EXCLUDED.color_code,
  max_tokens_per_day = EXCLUDED.max_tokens_per_day,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_active = EXCLUDED.is_active,
  icon_name = EXCLUDED.icon_name;

-- Insert sample system settings
INSERT INTO public.system_settings (setting_key, setting_value, category, description) VALUES
('clinic_name', '"GLOBE HEALTH ASSESSMENT CLINIC"', 'general', 'Name of the clinic'),
('clinic_address', '"123 Health Street, Medical District, City"', 'general', 'Clinic address'),
('clinic_phone', '"+1-555-HEALTH"', 'general', 'Clinic contact phone'),
('clinic_logo_url', '""', 'general', 'URL to clinic logo'),
('operating_hours', '"Monday-Friday: 8:00 AM - 6:00 PM"', 'general', 'Clinic operating hours'),
('marquee_enabled', 'true', 'general', 'Enable/disable marquee header'),
('auto_delete_days', '3', 'queue', 'Auto-delete tokens older than X days'),
('print_automatically', 'true', 'queue', 'Auto-print tokens after generation')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;

-- Add auto-delete function for old queue entries
CREATE OR REPLACE FUNCTION auto_delete_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.queue_entries 
  WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old entries (this would typically be run via cron)
-- For now, we'll just create the function and it can be called manually or via a scheduled job