-- Criar uma policy mais direta para vendedores verem seus contratos
DROP POLICY IF EXISTS "Vendedores podem ver seus contratos" ON salesperson_contracts;

CREATE POLICY "Vendedores podem ver seus contratos"
ON salesperson_contracts
FOR SELECT
USING (
  salesperson_id IN (
    SELECT id FROM salespeople WHERE user_id = auth.uid()
  )
);