-- Política RLS para vendedores verem seus clientes indicados
CREATE POLICY "Salespeople can view referred approvals"
ON payment_approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM salespeople
    WHERE salespeople.id = payment_approvals.referred_by_salesperson_id
    AND salespeople.user_id = auth.uid()
  )
);