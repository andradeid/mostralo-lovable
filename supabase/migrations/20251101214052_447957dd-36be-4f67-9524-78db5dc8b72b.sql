-- Garantir que clientes vejam itens dos seus pedidos
DROP POLICY IF EXISTS "Customers can view their own order items" ON order_items;

CREATE POLICY "Customers can view their own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = order_items.order_id
    AND c.auth_user_id = auth.uid()
  )
);

-- Garantir que clientes vejam addons dos seus itens
DROP POLICY IF EXISTS "Customers can view their own order addons" ON order_addons;

CREATE POLICY "Customers can view their own order addons"
ON order_addons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN customers c ON c.id = o.customer_id
    WHERE oi.id = order_addons.order_item_id
    AND c.auth_user_id = auth.uid()
  )
);