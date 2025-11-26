-- Remove política com recursão infinita
DROP POLICY IF EXISTS "customers_can_view_their_order_drivers" ON profiles;

-- Criar função auxiliar com SECURITY DEFINER para evitar recursão
CREATE OR REPLACE FUNCTION is_driver_of_customer_orders(driver_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE o.assigned_driver_id = driver_user_id
    AND c.auth_user_id = auth.uid()
  );
$$;

-- Criar política segura usando a função
CREATE POLICY "customers_view_assigned_drivers"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR is_driver_of_customer_orders(id)
);