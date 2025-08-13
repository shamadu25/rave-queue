-- Fix infinite recursion in RLS policies by creating security definer functions
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create security definer function to get user role from JWT
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT metadata
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'guest'
  ) INTO user_role;
  
  RETURN user_role;
END;
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_current_user_role() = 'admin';
$$;

-- Create new admin policy without recursion
CREATE POLICY "Admin and user access to profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  public.is_current_user_admin() OR auth.uid() = id
)
WITH CHECK (
  public.is_current_user_admin() OR auth.uid() = id
);

-- Update all other problematic policies
DROP POLICY IF EXISTS "Admin can manage all queue entries" ON public.queue_entries;
CREATE POLICY "Admin can manage all queue entries" 
ON public.queue_entries 
FOR ALL 
TO authenticated 
USING (
  public.is_current_user_admin()
);

DROP POLICY IF EXISTS "Admin can manage all queue calls" ON public.queue_calls;
CREATE POLICY "Admin can manage all queue calls" 
ON public.queue_calls 
FOR ALL 
TO authenticated 
USING (
  public.is_current_user_admin()
);

DROP POLICY IF EXISTS "Admin can manage all transfers" ON public.queue_transfers;
CREATE POLICY "Admin can manage all transfers" 
ON public.queue_transfers 
FOR ALL 
TO authenticated 
USING (
  public.is_current_user_admin()
);

DROP POLICY IF EXISTS "Admin can manage all user departments" ON public.user_departments;
CREATE POLICY "Admin can manage all user departments" 
ON public.user_departments 
FOR ALL 
TO authenticated 
USING (
  public.is_current_user_admin()
);

DROP POLICY IF EXISTS "Admin can manage all system settings" ON public.system_settings;
CREATE POLICY "Admin can manage all system settings" 
ON public.system_settings 
FOR ALL 
TO authenticated 
USING (
  public.is_current_user_admin()
);

-- Keep existing admin delete policy but fix it
DROP POLICY IF EXISTS "Admin can delete queue entries" ON public.queue_entries;
CREATE POLICY "Admin can delete queue entries" 
ON public.queue_entries 
FOR DELETE 
TO authenticated 
USING (
  public.is_current_user_admin()
);