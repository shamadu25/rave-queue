-- Add new demo accounts with proper roles and departments
-- First, let's ensure we have the right profiles for existing users and add new demo users

-- Update existing profiles if they exist, otherwise this will just be ignored
UPDATE profiles 
SET role = 'doctor', department = 'Consultation' 
WHERE email = 'doctor@queue.com';

UPDATE profiles 
SET role = 'lab_technician', department = 'Lab' 
WHERE email = 'lab@queue.com';

UPDATE profiles 
SET role = 'pharmacist', department = 'Pharmacy' 
WHERE email = 'pharmacy@queue.com';

-- Add sample queue entries for the new departments
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