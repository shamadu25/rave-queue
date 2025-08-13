-- Fix department constraint to match dynamic departments
ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_department_check;

-- Create user_departments table for department assignments
CREATE TABLE IF NOT EXISTS public.user_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS on user_departments
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_departments
CREATE POLICY "Users can view their department assignments"
ON public.user_departments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user departments"
ON public.user_departments FOR ALL
USING (true);

-- Create queue_calls table for audit logging
CREATE TABLE IF NOT EXISTS public.queue_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE NOT NULL,
  called_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  called_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  department TEXT NOT NULL,
  token TEXT NOT NULL
);

-- Enable RLS on queue_calls
ALTER TABLE public.queue_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for queue_calls
CREATE POLICY "Anyone can view queue calls"
ON public.queue_calls FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create queue calls"
ON public.queue_calls FOR INSERT
WITH CHECK (auth.uid() = called_by);

-- Add role column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER update_user_departments_updated_at
  BEFORE UPDATE ON public.user_departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample departments if they don't exist
INSERT INTO public.departments (id, name, prefix, color_code, is_active) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Emergency', 'E', '#dc2626', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Consultation', 'C', '#2563eb', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Laboratory', 'L', '#059669', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Pharmacy', 'P', '#7c3aed', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'X-Ray', 'X', '#ea580c', true)
ON CONFLICT (id) DO NOTHING;