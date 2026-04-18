CREATE OR REPLACE FUNCTION public.get_order_detail(_order_id uuid)
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
  SELECT * INTO _order FROM public.orders WHERE id = _order_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Verificação de permissão (mesma lógica da policy consolidada)
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
    'customer', (
      SELECT jsonb_build_object(
        'id', c.id,
        'latitude', c.latitude,
        'longitude', c.longitude,
        'address', c.address
      )
      FROM public.customers c WHERE c.id = _order.customer_id LIMIT 1
    ),
    'store_navigation', (
      SELECT s.preferred_navigation_app
      FROM public.stores s WHERE s.id = _order.store_id LIMIT 1
    ),
    'items', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(oi) || jsonb_build_object(
          'addons', COALESCE((
            SELECT jsonb_agg(to_jsonb(oa))
            FROM public.order_addons oa
            WHERE oa.order_item_id = oi.id
          ), '[]'::jsonb)
        )
        ORDER BY oi.created_at ASC NULLS LAST
      )
      FROM public.order_items oi
      WHERE oi.order_id = _order.id
      LIMIT 200
    ), '[]'::jsonb),
    'drivers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      ))
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.store_id = _order.store_id
        AND ur.role = 'delivery_driver'::app_role
        AND p.is_blocked = false
        AND p.is_deleted = false
      LIMIT 50
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_detail(uuid) TO authenticated;

-- Índice para acelerar a busca de itens por pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_item_id ON public.order_addons (order_item_id);