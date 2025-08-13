-- Update RLS policies to ensure admin bypass for all operations
-- First, update profiles policies to allow admin to manage all users
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin') OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  (auth.uid() = id)
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin') OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  (auth.uid() = id)
);

-- Update queue entries policies for admin access
DROP POLICY IF EXISTS "Admin can manage all queue entries" ON public.queue_entries;
CREATE POLICY "Admin can manage all queue entries" 
ON public.queue_entries 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update queue calls policies for admin access
DROP POLICY IF EXISTS "Admin can manage all queue calls" ON public.queue_calls;
CREATE POLICY "Admin can manage all queue calls" 
ON public.queue_calls 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update queue transfers policies for admin access
DROP POLICY IF EXISTS "Admin can manage all transfers" ON public.queue_transfers;
CREATE POLICY "Admin can manage all transfers" 
ON public.queue_transfers 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update user departments policies for admin access
DROP POLICY IF EXISTS "Admin can manage all user departments" ON public.user_departments;
CREATE POLICY "Admin can manage all user departments" 
ON public.user_departments 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update system settings policies for admin access
DROP POLICY IF EXISTS "Admin can manage all system settings" ON public.system_settings;
CREATE POLICY "Admin can manage all system settings" 
ON public.system_settings 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add delete policies for queue entries for admin
CREATE POLICY "Admin can delete queue entries" 
ON public.queue_entries 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);