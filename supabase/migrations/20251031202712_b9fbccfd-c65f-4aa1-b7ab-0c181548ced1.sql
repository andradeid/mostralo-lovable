-- Permitir que entregadores criem suas próprias atribuições
CREATE POLICY "Entregadores podem criar suas atribuições"
ON delivery_assignments
FOR INSERT
WITH CHECK (
  delivery_driver_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'delivery_driver'::app_role
      AND ur.store_id = delivery_assignments.store_id
  )
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = delivery_assignments.order_id
      AND o.store_id = delivery_assignments.store_id
      AND o.delivery_type = 'delivery'::delivery_type
      AND o.assigned_driver_id IS NULL
  )
);

-- Atualizar política para entregadores verem pedidos disponíveis (incluir em_preparo)
DROP POLICY IF EXISTS "Entregadores podem ver pedidos disponíveis e seus" ON orders;

CREATE POLICY "Entregadores podem ver pedidos disponíveis e seus"
ON orders
FOR SELECT
USING (
  (assigned_driver_id = auth.uid())
  OR (
    assigned_driver_id IS NULL
    AND status = ANY(ARRAY['aguarda_retirada'::order_status, 'em_transito'::order_status, 'em_preparo'::order_status])
    AND delivery_type = 'delivery'::delivery_type
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'delivery_driver'::app_role
        AND user_roles.store_id = orders.store_id
    )
  )
);

-- Permitir que entregadores se auto-atribuam a pedidos disponíveis
CREATE POLICY "Entregadores podem se atribuir a pedidos disponíveis"
ON orders
FOR UPDATE
USING (
  assigned_driver_id IS NULL
  AND delivery_type = 'delivery'::delivery_type
  AND status = ANY(ARRAY['aguarda_retirada'::order_status, 'em_preparo'::order_status, 'em_transito'::order_status])
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'delivery_driver'::app_role
      AND user_roles.store_id = orders.store_id
  )
)
WITH CHECK (assigned_driver_id = auth.uid());