-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system settings (admin only)
CREATE POLICY "Admin can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can update system settings" 
ON public.system_settings 
FOR ALL
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, category, description) VALUES
-- Department Management
('departments', '["Consultation", "Lab", "Pharmacy", "X-ray", "Scan", "Billing"]', 'departments', 'Active departments in the system'),

-- Queue Configuration
('auto_reset_midnight', 'true', 'queue', 'Auto-reset queue counters at midnight'),
('display_estimated_wait', 'true', 'queue', 'Show estimated wait times'),
('working_days', '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]', 'queue', 'Active working days'),

-- Display & Notifications
('enable_display_screen', 'true', 'display', 'Enable public display screen'),
('enable_sound_alerts', 'true', 'display', 'Enable sound alerts for queue updates'),
('enable_sms_notifications', 'false', 'display', 'Enable SMS notifications (demo)'),
('refresh_interval', '"10"', 'display', 'Auto-refresh interval in seconds'),

-- System Defaults
('default_priority', '"Normal"', 'defaults', 'Default priority level for new tokens'),
('system_name', '"Hospital Queue Management System"', 'defaults', 'System display name'),
('max_emergency_tokens', '"10"', 'defaults', 'Maximum emergency tokens per day');

-- Create departments table for better management
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL UNIQUE,
  max_tokens_per_day INTEGER NOT NULL DEFAULT 100,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  color_code TEXT DEFAULT '#3b82f6',
  icon_name TEXT DEFAULT 'activity',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Anyone can view departments" 
ON public.departments 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage departments" 
ON public.departments 
FOR ALL
USING (true);

-- Add trigger for departments updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default departments
INSERT INTO public.departments (name, prefix, max_tokens_per_day, start_time, end_time, color_code, icon_name) VALUES
('Consultation', 'C', 100, '08:00', '17:00', '#3b82f6', 'stethoscope'),
('Lab', 'L', 80, '07:00', '16:00', '#10b981', 'test-tube'),
('Pharmacy', 'P', 120, '08:00', '18:00', '#8b5cf6', 'pill'),
('X-ray', 'X', 50, '09:00', '16:00', '#f59e0b', 'radio'),
('Scan', 'S', 30, '09:00', '15:00', '#6366f1', 'scan-line'),
('Billing', 'B', 60, '08:00', '17:00', '#6b7280', 'receipt');