-- Permitir que donos de loja vejam perfis dos entregadores da sua loja
CREATE POLICY "Store owners can view their delivery drivers profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      INNER JOIN stores s ON s.id = ur.store_id
      WHERE ur.user_id = profiles.id
        AND ur.role = 'delivery_driver'
        AND s.owner_id = auth.uid()
    )
  );