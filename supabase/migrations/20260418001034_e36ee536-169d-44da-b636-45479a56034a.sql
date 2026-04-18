-- Drop idempotente e recriação
DROP POLICY IF EXISTS "orders_select_consolidated" ON public.orders;

CREATE POLICY "orders_select_consolidated"
ON public.orders
FOR SELECT
USING (
  is_master_admin()
  OR is_store_owner(store_id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'attendant'::app_role
      AND ur.store_id = orders.store_id
  )
  OR (
    customer_id IS NOT NULL
    AND customer_id IN (
      SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
    )
  )
  OR (assigned_driver_id = auth.uid())
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

CREATE INDEX IF NOT EXISTS idx_orders_store_created_at_desc 
  ON public.orders (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver 
  ON public.orders (assigned_driver_id) 
  WHERE assigned_driver_id IS NOT NULL;

-- RPC consolidada: retorna pedido + itens + cliente + endereço + histórico em UMA query
CREATE OR REPLACE FUNCTION public.get_order_full(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
  _result jsonb;
BEGIN
  -- Busca o pedido (RLS é avaliada via SELECT dentro do bloco)
  SELECT * INTO _order FROM public.orders WHERE id = _order_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Verificação de permissão explícita (espelha a policy)
  IF NOT (
    is_master_admin()
    OR is_store_owner(_order.store_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('attendant'::app_role, 'delivery_driver'::app_role)
        AND ur.store_id = _order.store_id
    )
    OR (_order.customer_id IS NOT NULL AND _order.customer_id IN (
      SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
    ))
    OR _order.assigned_driver_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para visualizar este pedido';
  END IF;

  SELECT jsonb_build_object(
    'order', to_jsonb(_order),
    'customer', (
      SELECT to_jsonb(c) FROM public.customers c WHERE c.id = _order.customer_id LIMIT 1
    ),
    'history', COALESCE((
      SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at ASC)
      FROM public.order_status_history h
      WHERE h.order_id = _order.id
      LIMIT 50
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_full(uuid) TO authenticated, anon;