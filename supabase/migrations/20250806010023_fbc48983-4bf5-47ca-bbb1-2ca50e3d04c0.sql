-- Create demo user accounts in auth.users is not possible via SQL
-- But we can prepare the profiles that will be linked when these users sign up

-- For now, let's create some additional queue entries to demonstrate the system
-- And we'll update the auth component to include all the new roles

-- Add a few more sample entries to show variety
INSERT INTO queue_entries (token, full_name, phone_number, department, priority, status)
VALUES 
  ('X003', 'Helen Parker', '555-0103', 'X-ray', 'Normal', 'Completed'),
  ('S003', 'Ivan Torres', '555-0203', 'Scan', 'Emergency', 'Waiting'),
  ('C124', 'Jack Robinson', '555-0302', 'Consultation', 'Normal', 'Served'),
  ('L457', 'Kate Chen', '555-0402', 'Lab', 'Normal', 'Waiting'),
  ('P790', 'Luis Martinez', '555-0502', 'Pharmacy', 'Normal', 'Waiting'),
  ('B001', 'Maya Singh', '555-0601', 'Billing', 'Normal', 'Called')
ON CONFLICT (token) DO NOTHING;