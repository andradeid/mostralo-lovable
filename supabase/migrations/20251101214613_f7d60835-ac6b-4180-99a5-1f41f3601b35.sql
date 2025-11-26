-- Adicionar políticas RLS para clientes verem seus próprios itens de pedido
CREATE POLICY "customers_select_own_order_items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
    WHERE o.id = order_items.order_id
      AND c.auth_user_id = auth.uid()
  )
);

-- Adicionar políticas RLS para clientes verem addons dos seus itens
CREATE POLICY "customers_select_own_order_addons"
ON public.order_addons FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.customers c ON c.id = o.customer_id
    WHERE oi.id = order_addons.order_item_id
      AND c.auth_user_id = auth.uid()
  )
);

-- Permitir clientes verem perfil do entregador atribuído aos seus pedidos
CREATE POLICY "customers_view_assigned_driver_profile"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
    WHERE o.assigned_driver_id = profiles.id
      AND c.auth_user_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_order_item_id ON public.order_addons(order_item_id);