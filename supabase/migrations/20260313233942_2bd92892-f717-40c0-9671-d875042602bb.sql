-- Policies para permitir store_admin e attendant gerenciarem clientes no contexto da loja

-- 1) Customers: permitir INSERT para store_admin autenticado
DROP POLICY IF EXISTS "Store admins can create customers" ON public.customers;
CREATE POLICY "Store admins can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'store_admin'));

-- 2) Customers: permitir SELECT de clientes vinculados às lojas do store_admin
DROP POLICY IF EXISTS "Store admins can view their store customers" ON public.customers;
CREATE POLICY "Store admins can view their store customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customer_stores cs
    WHERE cs.customer_id = customers.id
      AND public.is_store_admin_of(cs.store_id)
  )
);

-- 3) Customers: permitir UPDATE de clientes vinculados às lojas do store_admin
DROP POLICY IF EXISTS "Store admins can update their store customers" ON public.customers;
CREATE POLICY "Store admins can update their store customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customer_stores cs
    WHERE cs.customer_id = customers.id
      AND public.is_store_admin_of(cs.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customer_stores cs
    WHERE cs.customer_id = customers.id
      AND public.is_store_admin_of(cs.store_id)
  )
);

-- 4) Customer stores: permitir store_admin gerenciar vínculos customer<->store
DROP POLICY IF EXISTS "Store admins can manage customer_stores" ON public.customer_stores;
CREATE POLICY "Store admins can manage customer_stores"
ON public.customer_stores
FOR ALL
TO authenticated
USING (public.is_store_admin_of(customer_stores.store_id))
WITH CHECK (public.is_store_admin_of(customer_stores.store_id));