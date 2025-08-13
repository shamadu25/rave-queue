-- Fix function search path security issue
CREATE OR REPLACE FUNCTION auto_delete_old_queue_entries()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.queue_entries 
  WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$;