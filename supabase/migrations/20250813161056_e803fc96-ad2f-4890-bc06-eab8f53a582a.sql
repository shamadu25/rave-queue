-- Fix infinite recursion in RLS policies by creating security definer functions
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
  );
$$;

-- Alternative function using profiles table but with proper caching
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role'),
    'guest'
  );
$$;

-- Create new admin policy without recursion
CREATE POLICY "Admin full access to profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  public.get_user_role() = 'admin' OR auth.uid() = id
)
WITH CHECK (
  public.get_user_role() = 'admin' OR auth.uid() = id
);

-- Update all other problematic policies
DROP POLICY IF EXISTS "Admin can manage all queue entries" ON public.queue_entries;
CREATE POLICY "Admin can manage all queue entries" 
ON public.queue_entries 
FOR ALL 
TO authenticated 
USING (
  public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admin can manage all queue calls" ON public.queue_calls;
CREATE POLICY "Admin can manage all queue calls" 
ON public.queue_calls 
FOR ALL 
TO authenticated 
USING (
  public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admin can manage all transfers" ON public.queue_transfers;
CREATE POLICY "Admin can manage all transfers" 
ON public.queue_transfers 
FOR ALL 
TO authenticated 
USING (
  public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admin can manage all user departments" ON public.user_departments;
CREATE POLICY "Admin can manage all user departments" 
ON public.user_departments 
FOR ALL 
TO authenticated 
USING (
  public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admin can manage all system settings" ON public.system_settings;
CREATE POLICY "Admin can manage all system settings" 
ON public.system_settings 
FOR ALL 
TO authenticated 
USING (
  public.get_user_role() = 'admin'
);

-- Keep existing admin delete policy but fix it
DROP POLICY IF EXISTS "Admin can delete queue entries" ON public.queue_entries;
CREATE POLICY "Admin can delete queue entries" 
ON public.queue_entries 
FOR DELETE 
TO authenticated 
USING (
  public.get_user_role() = 'admin'
);