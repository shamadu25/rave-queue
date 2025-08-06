-- Create queue_entries table for the Queue Management System
CREATE TABLE public.queue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  department TEXT NOT NULL CHECK (department IN ('Consultation', 'Lab', 'Pharmacy', 'Billing')),
  priority TEXT NOT NULL CHECK (priority IN ('Normal', 'High', 'Emergency')),
  status TEXT NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'In Progress', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public queue system)
CREATE POLICY "Queue entries are viewable by everyone" 
ON public.queue_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create queue entries" 
ON public.queue_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update queue entries" 
ON public.queue_entries 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_queue_entries_updated_at
BEFORE UPDATE ON public.queue_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

-- Create index for better performance
CREATE INDEX idx_queue_entries_status ON public.queue_entries(status);
CREATE INDEX idx_queue_entries_department ON public.queue_entries(department);
CREATE INDEX idx_queue_entries_created_at ON public.queue_entries(created_at DESC);