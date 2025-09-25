-- Create service flows table
CREATE TABLE public.service_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  flow_departments JSONB NOT NULL, -- Array of department names in order
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_flows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage service flows" 
ON public.service_flows 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Staff can view service flows" 
ON public.service_flows 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_service_flows_updated_at
BEFORE UPDATE ON public.service_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some default service flows
INSERT INTO public.service_flows (name, description, flow_departments) VALUES
('Standard Consultation', 'Standard consultation flow with lab and pharmacy', '["Reception", "Consultation", "Lab", "Consultation", "Pharmacy"]'),
('Emergency Care', 'Emergency patient flow through triage and treatment', '["Reception", "Emergency", "Triage", "Emergency", "Billing"]'),
('Routine Checkup', 'Simple checkup with optional lab work', '["Reception", "Consultation", "Pharmacy"]');