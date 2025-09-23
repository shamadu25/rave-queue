-- Add intended_department column to track the patient's final destination
-- while keeping department as current queue location  
ALTER TABLE public.queue_entries 
ADD COLUMN IF NOT EXISTS intended_department text;

-- Create Reception department with REC prefix
INSERT INTO public.departments (name, prefix, color_code, icon_name, announcement_template, is_active)
VALUES ('Reception', 'REC', '#6B7280', 'user-check', 'Token {number}, please proceed to Reception.', true)
ON CONFLICT (name) DO UPDATE SET 
  prefix = 'REC',
  color_code = '#6B7280',
  icon_name = 'user-check',
  announcement_template = 'Token {number}, please proceed to Reception.',
  is_active = true;

-- Add system settings for Reception-First workflow (using proper jsonb format)
INSERT INTO public.system_settings (setting_key, setting_value, category, description)
VALUES 
  ('enable_reception_first', 'true'::jsonb, 'workflow', 'Enable Reception-First workflow where all tokens must go through Reception first'),
  ('reception_announcement_template', '"Token {number}, please proceed to Reception."'::jsonb, 'announcements', 'Announcement template for Reception calls'),
  ('reception_ticket_message', '"First Report To: Reception"'::jsonb, 'tickets', 'Message shown on tickets for Reception-first workflow'),
  ('department_announcement_template', '"Token {number}, please proceed to {department}."'::jsonb, 'announcements', 'Announcement template for department calls after Reception transfer')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  category = EXCLUDED.category,
  description = EXCLUDED.description;