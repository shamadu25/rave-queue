-- Update existing departments and set proper data
UPDATE public.departments SET 
  name = 'Consultation',
  prefix = 'C',
  color_code = '#3B82F6',
  max_tokens_per_day = 100,
  start_time = '08:00:00',
  end_time = '17:00:00',
  is_active = true,
  icon_name = 'stethoscope'
WHERE name = 'CONSULTATION';

UPDATE public.departments SET 
  name = 'Laboratory',
  prefix = 'L',
  color_code = '#10B981',
  max_tokens_per_day = 80,
  start_time = '07:00:00',
  end_time = '18:00:00',
  is_active = true,
  icon_name = 'test-tube'
WHERE name = 'ENQUIRY';

UPDATE public.departments SET 
  name = 'Pharmacy',
  prefix = 'PH',
  color_code = '#F59E0B',
  max_tokens_per_day = 120,
  start_time = '08:00:00',
  end_time = '20:00:00',
  is_active = true,
  icon_name = 'pill'
WHERE name = 'IOM SERVICE';

UPDATE public.departments SET 
  name = 'X-ray',
  prefix = 'XR',
  color_code = '#8B5CF6',
  max_tokens_per_day = 60,
  start_time = '09:00:00',
  end_time = '16:00:00',
  is_active = true,
  icon_name = 'scan'
WHERE name = 'RESULT PICKUP';

-- Insert additional departments
INSERT INTO public.departments (name, prefix, color_code, max_tokens_per_day, start_time, end_time, is_active, icon_name) VALUES
('Billing', 'B', '#EF4444', 150, '08:00:00', '18:00:00', true, 'credit-card'),
('Emergency', 'EM', '#DC2626', 50, '00:00:00', '23:59:59', true, 'alert-triangle')
ON CONFLICT (name) DO NOTHING;

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

-- Create auto-delete function for old queue entries
CREATE OR REPLACE FUNCTION auto_delete_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.queue_entries 
  WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;