-- Create user profiles table for staff authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'lab', 'pharmacy', 'billing')),
  department TEXT NOT NULL CHECK (department IN ('Consultation', 'Lab', 'Pharmacy', 'Billing', 'Admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'doctor', -- default role
    'Consultation' -- default department
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update queue_entries table to support enhanced status flow and transfers
ALTER TABLE public.queue_entries 
ADD COLUMN called_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN served_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN skipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN transferred_from TEXT,
ADD COLUMN served_by UUID REFERENCES public.profiles(id);

-- Update status check to include new statuses
ALTER TABLE public.queue_entries 
DROP CONSTRAINT IF EXISTS queue_entries_status_check;

ALTER TABLE public.queue_entries 
ADD CONSTRAINT queue_entries_status_check 
CHECK (status IN ('Waiting', 'Called', 'Served', 'Completed', 'Skipped'));

-- Create transfer history table
CREATE TABLE public.queue_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_entry_id UUID NOT NULL REFERENCES public.queue_entries(id) ON DELETE CASCADE,
  from_department TEXT NOT NULL,
  to_department TEXT NOT NULL,
  transferred_by UUID NOT NULL REFERENCES public.profiles(id),
  transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS on transfers
ALTER TABLE public.queue_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for queue transfers
CREATE POLICY "Staff can view transfers" 
ON public.queue_transfers 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can create transfers" 
ON public.queue_transfers 
FOR INSERT 
WITH CHECK (true);

-- Add realtime for new tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

ALTER TABLE public.queue_transfers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_transfers;

-- Create index for better performance
CREATE INDEX idx_queue_entries_served_by ON public.queue_entries(served_by);
CREATE INDEX idx_queue_transfers_entry_id ON public.queue_transfers(queue_entry_id);

-- Insert default staff users (these will be created when they sign up)
-- Note: The actual user creation will happen through the auth flow