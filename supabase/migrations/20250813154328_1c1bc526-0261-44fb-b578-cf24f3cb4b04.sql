-- Create sample users with proper authentication setup
-- Note: These are sample accounts for testing. In production, users should sign up through the app.

-- Create a function to generate secure sample accounts
CREATE OR REPLACE FUNCTION create_sample_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sample users will be created through the normal signup process
  -- This is just setting up the data structure for testing
  
  -- Update existing profiles if they exist, otherwise this will be handled by signups
  UPDATE public.profiles 
  SET username = COALESCE(username, split_part(email, '@', 1))
  WHERE username IS NULL;
  
  -- Ensure all profiles have unique usernames
  WITH numbered_profiles AS (
    SELECT id, email, username, 
           ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn
    FROM public.profiles
    WHERE username IS NOT NULL
  )
  UPDATE public.profiles 
  SET username = numbered_profiles.username || numbered_profiles.rn
  FROM numbered_profiles
  WHERE profiles.id = numbered_profiles.id 
    AND numbered_profiles.rn > 1;

END;
$$;

-- Execute the function
SELECT create_sample_users();

-- Drop the function as it's no longer needed
DROP FUNCTION create_sample_users();