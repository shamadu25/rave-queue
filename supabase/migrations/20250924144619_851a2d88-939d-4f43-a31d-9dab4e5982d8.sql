-- Add is_internal field to departments table to support multi-stage workflows
ALTER TABLE public.departments 
ADD COLUMN is_internal boolean DEFAULT false;

-- Update existing departments - mark common internal departments
UPDATE public.departments 
SET is_internal = true 
WHERE name IN ('Lab', 'Pharmacy', 'Billing', 'X-ray', 'Scan');

-- Keep Reception and primary services as public (visible to patients)
UPDATE public.departments 
SET is_internal = false 
WHERE name IN ('Reception', 'Consultation', 'General Practice', 'Enquiry');

-- Add comment for clarity
COMMENT ON COLUMN public.departments.is_internal IS 'Whether this department is internal (staff-only) or public (patient-facing)';