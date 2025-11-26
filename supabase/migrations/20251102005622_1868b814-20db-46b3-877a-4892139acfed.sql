-- Adicionar política para clientes verem entregadores dos seus pedidos
CREATE POLICY "customers_can_view_their_order_drivers"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT DISTINCT o.assigned_driver_id
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE c.auth_user_id = auth.uid()
    AND o.assigned_driver_id IS NOT NULL
  )
);