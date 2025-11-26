-- Permitir entregadores verem itens dos pedidos atribuídos a eles
CREATE POLICY "Entregadores podem ver itens dos seus pedidos"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.assigned_driver_id = auth.uid()
  )
);

-- Permitir entregadores verem adicionais dos pedidos atribuídos a eles
CREATE POLICY "Entregadores podem ver adicionais dos seus pedidos"
ON order_addons FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    WHERE order_items.id = order_addons.order_item_id
    AND orders.assigned_driver_id = auth.uid()
  )
);