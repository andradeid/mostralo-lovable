-- Add INSERT/UPDATE policies on customer_stores for store owners and attendants
CREATE POLICY "Store owners can manage customer_stores"
ON public.customer_stores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = customer_stores.store_id
      AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = customer_stores.store_id
      AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Attendants can manage customer_stores"
ON public.customer_stores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.store_id = customer_stores.store_id
      AND ur.role = 'attendant'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.store_id = customer_stores.store_id
      AND ur.role = 'attendant'
  )
);
