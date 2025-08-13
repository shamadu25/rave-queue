-- Fix security warnings by setting search_path for functions
ALTER FUNCTION public.get_current_user_role() SET search_path = '';
ALTER FUNCTION public.is_current_user_admin() SET search_path = '';

-- Ensure existing trigger function also has proper search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Test the functions work correctly
SELECT public.get_current_user_role();
SELECT public.is_current_user_admin();