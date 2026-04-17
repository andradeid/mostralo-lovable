-- Consolidar 5 políticas SELECT de orders em uma única (reduz CPU do Postgres)
-- IMPORTANTE: mantém EXATAMENTE as mesmas regras de acesso, apenas combinadas via OR.

DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Donos das lojas podem ver seus pedidos" ON public.orders;
DROP POLICY IF EXISTS "Entregadores podem ver pedidos disponíveis e seus" ON public.orders;
DROP POLICY IF EXISTS "Master admins podem ver todos os pedidos" ON public.orders;
DROP POLICY IF EXISTS "attendant_view_orders_v2" ON public.orders;

CREATE POLICY "orders_select_consolidated"
ON public.orders
FOR SELECT
USING (
  -- 1) Master admin vê tudo
  is_master_admin()
  -- 2) Dono da loja
  OR is_store_owner(store_id)
  -- 3) Atendente vinculado à loja
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'attendant'::app_role
      AND ur.store_id = orders.store_id
  )
  -- 4) Cliente vê seus próprios pedidos
  OR (
    customer_id IS NOT NULL
    AND customer_id IN (
      SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
    )
  )
  -- 5) Entregador vê pedidos atribuídos a ele OU disponíveis na loja em que atua
  OR (
    assigned_driver_id = auth.uid()
  )
  OR (
    assigned_driver_id IS NULL
    AND status = ANY (ARRAY['aguarda_retirada'::order_status, 'em_transito'::order_status, 'em_preparo'::order_status])
    AND delivery_type = 'delivery'::delivery_type
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'delivery_driver'::app_role
        AND ur.store_id = orders.store_id
    )
  )
);