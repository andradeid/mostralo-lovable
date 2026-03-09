
-- Allow attendants to read store_modules for their linked store
CREATE POLICY "Attendants can view their store_modules"
ON public.store_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.store_id = store_modules.store_id
      AND user_roles.role = 'attendant'
  )
);
