DROP POLICY IF EXISTS "Store admins can create customers" ON public.customers;
CREATE POLICY "Team can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'store_admin')
  OR public.has_role(auth.uid(), 'attendant')
  OR public.has_role(auth.uid(), 'master_admin')
  OR EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.owner_id = auth.uid()
  )
);