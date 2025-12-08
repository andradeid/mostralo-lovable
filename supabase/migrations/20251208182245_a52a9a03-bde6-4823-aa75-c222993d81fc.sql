-- Corrigir RLS policy da tabela store_modules
-- Remove a policy problemática que usa subquery causando recursão
DROP POLICY IF EXISTS "Store admins can view their store_modules" ON public.store_modules;

-- Criar nova policy usando função SECURITY DEFINER que evita recursão
CREATE POLICY "Store admins can view their store_modules v2"
ON public.store_modules
FOR SELECT
USING (
  is_store_owner_direct(store_id, auth.uid()) 
  OR has_role(auth.uid(), 'master_admin'::app_role)
);