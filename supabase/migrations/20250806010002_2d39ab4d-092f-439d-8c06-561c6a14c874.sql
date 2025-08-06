-- First, check and update the check constraint for departments
-- Drop the existing constraint and create a new one with all departments
ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_department_check;

-- Add new constraint that includes X-ray and Scan
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_department_check 
CHECK (department IN ('Consultation', 'Lab', 'Pharmacy', 'Billing', 'X-ray', 'Scan'));

-- Now add the sample queue entries for the new departments
INSERT INTO queue_entries (token, full_name, phone_number, department, priority, status)
VALUES 
  ('X001', 'Alice Johnson', '555-0101', 'X-ray', 'Normal', 'Waiting'),
  ('X002', 'Bob Wilson', '555-0102', 'X-ray', 'Emergency', 'Called'),
  ('S001', 'Carol Davis', '555-0201', 'Scan', 'Normal', 'Waiting'),
  ('S002', 'David Brown', '555-0202', 'Scan', 'Normal', 'Served'),
  ('C123', 'Emma Taylor', '555-0301', 'Consultation', 'Emergency', 'Waiting'),
  ('L456', 'Frank Miller', '555-0401', 'Lab', 'Normal', 'Called'),
  ('P789', 'Grace Anderson', '555-0501', 'Pharmacy', 'Normal', 'Completed')
ON CONFLICT (token) DO NOTHING;