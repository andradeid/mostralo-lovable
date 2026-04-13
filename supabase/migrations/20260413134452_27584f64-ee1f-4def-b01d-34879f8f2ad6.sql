-- Drop the old policy that joins stores (blocked by stores RLS for anon)
DROP POLICY IF EXISTS "Anyone can view product addons of active stores" ON public.product_addons;

-- Create new policy using is_active_store() security definer function
CREATE POLICY "Anyone can view product addons of active stores" 
ON public.product_addons 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_addons.product_id
    AND p.is_available = true
    AND is_active_store(p.store_id)
  )
);